import type { AxiosInstance, InternalAxiosRequestConfig } from "axios"
import axios from "axios"

/** 租户外部 API 请求被框架拒绝时的原因，便于页面区分配置错误和越权调用。 */
export type TenantExternalApiAccessErrorReason = "missing-base-url" | "tenant-not-active"

/**
 * 外部 API 的本地访问错误。
 *
 * 它表示请求尚未发到网络：要么当前环境没有配置地址，要么当前页面不属于允许调用该
 * API 的租户。第三方服务器返回的 4xx/5xx 仍保持 AxiosError，业务可以按其协议处理。
 */
export class TenantExternalApiAccessError extends Error {
  constructor(
    message: string,
    public readonly reason: TenantExternalApiAccessErrorReason
  ) {
    super(message)
    this.name = "TenantExternalApiAccessError"
  }
}

export interface TenantExternalApiClientOptions {
  /** 由 Vite 环境变量传入；不要在业务文件中硬编码开发或生产地址。 */
  baseURL?: string
  /**
   * 每次请求前执行，而不是只在创建客户端时执行。
   * 推荐依据已加载实体的 tenantCode/id 判断，避免切换租户后旧客户端继续可用。
   */
  isTenantActive: () => boolean
  /** 第三方接口超时；默认 10 秒，不继承平台主请求客户端的配置。 */
  timeout?: number
  /** 第三方确实需要 Cookie 时才开启，默认 false。 */
  withCredentials?: boolean
  /**
   * 可选的动态请求头。只适合后端签发的短期访问令牌；VITE_* 会进入浏览器产物，
   * 不能在环境变量中保存第三方 secret、私钥或永久 API Key。
   */
  getHeaders?: () => Record<string, string> | Promise<Record<string, string>>
}

/**
 * 创建一个租户专属的第三方 Axios 客户端。
 *
 * 这里刻意不复用 `src/http/axios.ts`：平台客户端假设 `{ code, data, message }` 响应协议，
 * 并会携带平台 Token、处理 401 refresh；第三方接口通常没有这些约定。分离客户端可以
 * 防止平台凭据意外发送到其他域名，也允许业务按第三方的原始响应结构定义类型。
 *
 * 此处的 `isTenantActive` 是前端误调用保护，不是安全边界。真正的数据权限仍必须由第三方
 * 服务或平台 BFF 校验；浏览器代码和 VITE 环境变量对最终用户都是可见的。
 */
export function createTenantExternalApiClient(options: TenantExternalApiClientOptions): AxiosInstance {
  // 地址只做 trim，不限制 http/https/相对代理路径；具体协议由部署环境决定。
  const baseURL = options.baseURL?.trim()
  const client = axios.create({
    baseURL: baseURL || undefined,
    timeout: options.timeout ?? 10_000,
    withCredentials: options.withCredentials ?? false
  })

  client.interceptors.request.use(async (config) => {
    assertExternalApiAvailable(baseURL, options.isTenantActive)
    await appendDynamicHeaders(config, options.getHeaders)
    return config
  })

  return client
}

/** 在网络请求创建前同时检查环境配置和当前租户，失败时不会触发浏览器网络访问。 */
function assertExternalApiAvailable(baseURL: string | undefined, isTenantActive: () => boolean) {
  if (!baseURL) {
    throw new TenantExternalApiAccessError(
      "当前环境未配置租户第三方 API 地址",
      "missing-base-url"
    )
  }
  if (!isTenantActive()) {
    throw new TenantExternalApiAccessError(
      "当前租户无权使用该第三方 API",
      "tenant-not-active"
    )
  }
}

/** 把运行时令牌逐项写入 AxiosHeaders；没有配置 header factory 时不做任何处理。 */
async function appendDynamicHeaders(
  config: InternalAxiosRequestConfig,
  getHeaders?: TenantExternalApiClientOptions["getHeaders"]
) {
  if (!getHeaders) return
  const headers = await getHeaders()
  Object.entries(headers).forEach(([name, value]) => config.headers.set(name, value))
}
