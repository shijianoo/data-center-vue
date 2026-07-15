import type { ConsoleAddress, ConsoleContext, ConsoleScope, RouteMatcherOptions } from "./types"

/** Console 的稳定父路径；所有模块 path 都相对这个父级编译。 */
const CONSOLE_PREFIX = "/console"

/**
 * 仅按 Console 的标准 URL 语法解析地址，不查询租户、项目或设备接口。
 *
 * 例如 `/console/8888/projects/P100/devices/D001/history/detail` 会得到 history scope
 * 和 `tail: ["detail"]`。`projects/settings` 在这一层会被暂时视为项目结构；真正导航时
 * Orchestrator 会先让租户 scope 的自定义路由 claim，因此不会错误请求 key 为 settings 的项目。
 */
export function parseConsoleAddress(path: string): ConsoleAddress {
  const normalized = normalizePath(path)
  if (normalized !== CONSOLE_PREFIX && !normalized.startsWith(`${CONSOLE_PREFIX}/`)) {
    return { path: normalized, scope: null, tail: [] }
  }

  const segments = normalized.slice(CONSOLE_PREFIX.length).split("/").filter(Boolean)
  const tenantKey = segments[0]
  if (!tenantKey) return { path: normalized, scope: null, tail: [] }

  let scope: ConsoleScope = "tenant"
  let projectKey: string | undefined
  let deviceCode: string | undefined
  let tail = segments.slice(1)

  if (segments[1] === "projects" && segments[2]) {
    scope = "project"
    projectKey = segments[2]
    tail = segments.slice(3)
  }

  if (projectKey && segments[3] === "devices" && segments[4]) {
    scope = "device"
    deviceCode = segments[4]
    tail = segments.slice(5)
  }

  if (deviceCode && segments[5] === "history") {
    scope = "history"
    tail = segments.slice(6)
  }

  return { path: normalized, tenantKey, projectKey, deviceCode, scope, tail }
}

/** 合并重复斜杠并移除末尾斜杠，使签名、matcher 和菜单 URL 使用同一种地址。 */
export function normalizePath(path: string) {
  const normalized = path.replace(/\/+/g, "/").replace(/\/+$/, "")
  return normalized || "/"
}

/**
 * 构造给用户使用的真实 scope 根 URL。
 *
 * 此函数绝不返回 `:param(regex)`，因此它适合 Header 菜单、返回按钮和文档示例。
 */
export function getConcreteScopeBase(context: ConsoleContext, scope: ConsoleScope) {
  const { tenantKey, projectKey, deviceCode } = context.address
  if (!tenantKey) throw new Error("Console context missing tenantKey")

  const parts = [CONSOLE_PREFIX, encodePathSegment(tenantKey)]
  if (scope === "tenant") return parts.join("/")

  if (!projectKey) throw new Error("Project scope missing projectKey")
  parts.push("projects", encodePathSegment(projectKey))
  if (scope === "project") return parts.join("/")

  if (!deviceCode) throw new Error("Device scope missing deviceCode")
  parts.push("devices", encodePathSegment(deviceCode))
  if (scope === "device") return parts.join("/")

  parts.push("history")
  return parts.join("/")
}

/**
 * 构造注册给 Vue Router 的相对 matcher 根路径。
 *
 * 默认 literal 只匹配当前实例且不会提供 params。`constrained + exposeParams` 生成类似
 * `:tenantKey(8888)` 的精确参数 matcher：它仍只匹配 8888，但兼容遗留页面读取
 * `route.params.tenantKey` 的行为。
 */
export function getMatcherScopeBase(context: ConsoleContext, scope: ConsoleScope, options?: RouteMatcherOptions) {
  const { tenantKey, projectKey, deviceCode } = context.address
  if (!tenantKey) throw new Error("Console context missing tenantKey")

  const exposed = new Set(options?.exposeParams ?? [])
  const segment = (value: string, param: "tenantKey" | "projectKey" | "deviceCode") => {
    if (options?.mode === "constrained" && exposed.has(param)) {
      return `:${param}(${escapeRouteRegex(value)})`
    }
    return encodePathSegment(value)
  }

  const parts = [segment(tenantKey, "tenantKey")]
  if (scope === "tenant") return parts.join("/")

  if (!projectKey) throw new Error("Project scope missing projectKey")
  parts.push("projects", segment(projectKey, "projectKey"))
  if (scope === "project") return parts.join("/")

  if (!deviceCode) throw new Error("Device scope missing deviceCode")
  parts.push("devices", segment(deviceCode, "deviceCode"))
  if (scope === "device") return parts.join("/")

  parts.push("history")
  return parts.join("/")
}

/** 将业务模块的相对顶层 path 接在已编译的 scope matcher 后。 */
export function joinRoutePath(base: string, childPath: string) {
  return childPath ? `${base}/${childPath}`.replace(/\/+/g, "/") : base
}

/** 转义实例 key 中可能被 Vue Router 当作正则语法的字符。 */
export function escapeRouteRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/** 每个 key 只能占一个 URL segment，避免 `/` 改变路由层级。 */
function encodePathSegment(value: string) {
  return encodeURIComponent(value)
}
