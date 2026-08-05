import axios from "axios"

/** 开发环境服务地址。 */
const DEV_BASE_URL = "http://121.40.241.229:9000/api/v1"

/** 生产环境服务地址。默认使用同源 `/api/v1`，便于网关反向代理。 */
const PROD_BASE_URL = "http://121.40.241.229:9000/api/v1"

const BASE_URL = import.meta.env.DEV ? DEV_BASE_URL : PROD_BASE_URL

export const ecoClient = axios.create({ baseURL: BASE_URL })

/**
 * 根据 API baseURL 生成 TCP Gateway 调试页面地址。
 * 例如 `http://host/api/v1` 会转换为 `http://host/tcp-gateway`。
 */
export function getTcpGatewayUrl() {
  const apiUrl = new URL(BASE_URL, window.location.origin)
  const rootPath = apiUrl.pathname.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "")
  apiUrl.pathname = `${rootPath}/tcp-gateway`
  apiUrl.search = ""
  apiUrl.hash = ""
  return apiUrl.toString()
}

/** 将后端 ProblemDetails 转换为可直接展示的错误消息。 */
export function getApiErrorMessage(error: unknown, fallback = "操作失败，请稍后重试") {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { detail?: string, title?: string } | undefined
    return data?.detail || data?.title || error.message || fallback
  }
  return error instanceof Error ? error.message : fallback
}
