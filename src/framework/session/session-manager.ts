import {
  getRefreshToken,
  getToken,
  removeRefreshToken,
  removeToken,
  setRefreshToken,
  setToken
} from "@@/utils/cache/cookies"

export interface SessionCredentials {
  accessToken: string
  refreshToken: string
}

type CredentialsListener = (credentials: SessionCredentials | null) => void
type ExpirationHandler = () => void

let revision = 0
let expirationHandledRevision = -1
let expirationHandler: ExpirationHandler | null = null
const listeners = new Set<CredentialsListener>()

/** 当前浏览器会话所保存的凭据快照。 */
export function getSessionCredentials(): SessionCredentials | null {
  const accessToken = getToken()
  const refreshToken = getRefreshToken()
  return accessToken && refreshToken ? { accessToken, refreshToken } : null
}

/** 开始登录、刷新或租户切换事务；更早事务随后都不能再提交。 */
export function beginSessionTransition() {
  expirationHandledRevision = -1
  return ++revision
}

export function getSessionRevision() {
  return revision
}

export function isSessionRevisionCurrent(candidate: number) {
  return candidate === revision
}

/**
 * 仅当前 revision 可以提交凭据。Cookie 与响应式 Store 监听器在同一调用栈更新，
 * 避免 refresh 和租户切换互相覆盖。
 */
export function commitSessionCredentials(candidate: number, credentials: SessionCredentials) {
  if (!isSessionRevisionCurrent(candidate)) return false
  // 两枚 Cookie 必须在同一个同步提交段写入，调用方不能观察到只更新一枚的半状态。
  setToken(credentials.accessToken)
  setRefreshToken(credentials.refreshToken)
  // Cookie 提交完成后再通知 Store，使响应式状态与持久化凭据指向同一版本。
  listeners.forEach(listener => listener(credentials))
  return true
}

/** 普通登录使用：创建新事务并一次提交两枚 token。 */
export function replaceSessionCredentials(credentials: SessionCredentials) {
  const candidate = beginSessionTransition()
  commitSessionCredentials(candidate, credentials)
  return candidate
}

/** 清除当前会话，并使所有未完成请求的 revision 失效。 */
export function clearSessionCredentials() {
  // 先推进版本，使仍在等待网络响应的 refresh/租户切换立即失去提交资格。
  revision++
  removeToken()
  removeRefreshToken()
  listeners.forEach(listener => listener(null))
}

/** Pinia Store 订阅凭据变化；返回值可用于释放监听。 */
export function subscribeSessionCredentials(listener: CredentialsListener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** 由应用组合根注入登出、路由清理和跳转逻辑，HTTP 层不直接依赖 Store/Router。 */
export function setSessionExpirationHandler(handler: ExpirationHandler) {
  expirationHandler = handler
}

/** 只有触发错误时仍为同一会话，才执行一次统一过期处理。 */
export function expireSession(candidate: number) {
  // 旧请求不能让新登录失效；同一批并发 401 也只允许触发一次应用层退出流程。
  if (!isSessionRevisionCurrent(candidate) || expirationHandledRevision === candidate) return
  expirationHandledRevision = candidate
  if (expirationHandler) expirationHandler()
  else clearSessionCredentials()
}
