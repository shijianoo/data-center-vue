import type { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios"
import { getRefreshToken, getToken } from "@@/utils/cache/cookies"
import axios from "axios"
import {
  commitSessionCredentials,
  expireSession,
  getSessionRevision,
  isSessionRevisionCurrent
} from "@/framework/session/session-manager"

export type ApiErrorKind = "business" | "http" | "network" | "auth" | "canceled" | "protocol"

export interface AppRequestConfig<D = unknown> extends AxiosRequestConfig<D> {
  /** 仅本次请求使用的访问令牌，不会提前写入全局会话。 */
  authToken?: string
  /** 新登录/租户切换等事务请求不应触发旧会话 refresh。 */
  skipAuthRefresh?: boolean
  /** 不在拦截器显示错误，由调用页面自行决定交互。 */
  silent?: boolean
  /** 请求创建时的会话版本，防止旧请求刷新并覆盖新会话。 */
  __sessionRevision?: number
  /** 一个请求最多只允许在 refresh 后重试一次。 */
  __authRetried?: boolean
}

/**
 * 平台统一请求错误。
 *
 * kind 用于决定交互策略，status 表示 HTTP 状态，code 表示统一响应体中的业务状态；
 * HTTP 200 + 业务 404 时两者可以同时存在，调用方应优先判断 code。
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly kind: ApiErrorKind,
    public readonly status?: number,
    public readonly code?: number,
    public override readonly cause?: unknown
  ) {
    super(message, { cause })
    this.name = "ApiError"
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

interface RefreshFlight {
  revision: number
  promise: Promise<{ accessToken: string, refreshToken: string }>
}

let refreshFlight: RefreshFlight | null = null

function getStatusMessage(status?: number, fallback?: string) {
  // 服务端提供可读消息时优先保留；否则使用稳定的中文网络层提示。
  if (fallback) return fallback
  switch (status) {
    case 400: return "请求错误"
    case 401: return "登录状态已失效"
    case 403: return "拒绝访问"
    case 404: return "请求地址不存在"
    case 408: return "请求超时"
    case 500: return "服务器内部错误"
    case 501: return "服务未实现"
    case 502: return "网关错误"
    case 503: return "服务不可用"
    case 504: return "网关超时"
    default: return "请求失败，请稍后重试"
  }
}

function showError(config: AppRequestConfig | undefined, message: string) {
  // silent 只关闭传输层 Toast，不改变 Promise reject，页面仍能完整处理错误。
  if (!config?.silent) ElMessage.error(message)
}

function createSessionChangedError() {
  return new ApiError("会话已发生变化，请求结果已丢弃", "canceled")
}

/** 同一会话版本的并发 401 只发起一次 refresh，并且 refresh 自身有超时。 */
async function refreshAccessToken(expectedRevision: number) {
  // revision 不一致说明用户已登录、退出或切换租户，本次旧 refresh 必须直接作废。
  if (!isSessionRevisionCurrent(expectedRevision)) throw createSessionChangedError()
  // 同一 revision 的并发 401 共享 Promise，避免 refresh token 被并发消费。
  if (refreshFlight?.revision === expectedRevision) return refreshFlight.promise

  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    const error = new ApiError("登录状态已失效", "auth", 401)
    expireSession(expectedRevision)
    throw error
  }

  const promise = axios.post(
    `${import.meta.env.VITE_AUTH_CENTER_BASE_URL}/auth/refresh`,
    { refreshToken },
    {
      timeout: 10_000,
      headers: {
        "Authorization": `Bearer ${refreshToken}`,
        "Content-Type": "application/json"
      }
    }
  ).then(({ data }) => {
    // refresh 使用裸 Axios，因此在这里显式读取并校验认证中心的统一响应结构。
    const credentials = data?.data as { accessToken?: string, refreshToken?: string } | undefined
    if (!credentials?.accessToken || !credentials.refreshToken) {
      throw new ApiError(data?.message || "刷新登录状态失败", "auth", 401, data?.code)
    }
    if (!commitSessionCredentials(expectedRevision, credentials as { accessToken: string, refreshToken: string })) {
      throw createSessionChangedError()
    }
    return credentials as { accessToken: string, refreshToken: string }
  }).catch((error: unknown) => {
    if (isApiError(error)) throw error
    const axiosError = error as AxiosError<{ message?: string }>
    const status = axiosError.response?.status
    const kind: ApiErrorKind = status === 400 || status === 401 ? "auth" : status ? "http" : "network"
    throw new ApiError(
      getStatusMessage(status, axiosError.response?.data?.message),
      kind,
      status,
      undefined,
      error
    )
  }).finally(() => {
    // 只清理由自己创建的 flight，不能误删更晚会话已经建立的新 refresh。
    if (refreshFlight?.revision === expectedRevision) refreshFlight = null
  })

  refreshFlight = { revision: expectedRevision, promise }
  return promise
}

async function retryWithFreshToken(instance: AxiosInstance, config: AppRequestConfig) {
  const expectedRevision = config.__sessionRevision ?? getSessionRevision()
  if (config.skipAuthRefresh) throw new ApiError("访问令牌无效", "auth", 401)

  if (config.__authRetried) {
    // refresh 后仍为 401 说明新凭据也无效，终止重试环并统一过期。
    expireSession(expectedRevision)
    throw new ApiError("登录状态已失效", "auth", 401)
  }

  try {
    const credentials = await refreshAccessToken(expectedRevision)
    if (!isSessionRevisionCurrent(expectedRevision)) throw createSessionChangedError()
    const retryConfig: AppRequestConfig = {
      ...config,
      __authRetried: true,
      headers: {
        ...config.headers,
        Authorization: `Bearer ${credentials.accessToken}`
      }
    }
    return instance.request(retryConfig)
  } catch (error) {
    if (isApiError(error) && error.kind === "auth") expireSession(expectedRevision)
    throw error
  }
}

function createInstance() {
  // 所有平台后端共享拦截器，但每次 createRequest 仍可提供不同的默认 baseURL。
  const instance = axios.create()

  instance.interceptors.response.use(
    async (response) => {
      const config = response.config as AppRequestConfig
      const apiData = response.data
      // 文件和 204 响应没有 `{ code, data }`，必须在统一协议检查前直接返回。
      if (response.config.responseType === "blob" || response.config.responseType === "arraybuffer") return apiData
      if (response.status === 204) return apiData

      if (apiData?.code === undefined) {
        const error = new ApiError("接口响应不符合统一协议", "protocol", response.status)
        showError(config, error.message)
        throw error
      }

      if (apiData.code === 200) return apiData
      if (apiData.code === 401) return retryWithFreshToken(instance, config)

      const error = new ApiError(
        apiData.message || "请求失败",
        "business",
        response.status,
        apiData.code
      )
      showError(config, error.message)
      throw error
    },
    async (error: AxiosError<{ message?: string }>) => {
      const config = error.config as AppRequestConfig | undefined
      const status = error.response?.status
      if (status === 401 && config) return retryWithFreshToken(instance, config)

      const apiError = new ApiError(
        getStatusMessage(status, error.response?.data?.message),
        status ? "http" : "network",
        status,
        undefined,
        error
      )
      showError(config, apiError.message)
      throw apiError
    }
  )

  return instance
}

const requestInstance = createInstance()

function createRequest(baseURL: string | undefined) {
  return <T>(config: AppRequestConfig): Promise<T> => {
    // 显式 authToken 用于租户切换事务；它仅作用于本请求，不提前覆盖 Cookie。
    const accessToken = config.authToken ?? getToken()
    const requestConfig: AppRequestConfig = {
      ...config,
      baseURL: config.baseURL ?? baseURL,
      timeout: config.timeout ?? 10_000,
      withCredentials: config.withCredentials ?? false,
      __sessionRevision: config.__sessionRevision ?? getSessionRevision(),
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...config.headers
      }
    }
    return requestInstance(requestConfig) as Promise<T>
  }
}

export const request = createRequest(import.meta.env.VITE_BASE_URL)
export const dataCenterRequest = createRequest(import.meta.env.VITE_DATA_CENTER_BASE_URL)
export const authCenterRequest = createRequest(import.meta.env.VITE_AUTH_CENTER_BASE_URL)
export const dataMonitorRequest = createRequest(import.meta.env.VITE_DATA_MONITOR_BASE_URL)
