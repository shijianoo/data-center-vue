import type { RouteMeta, RouteRecordRaw } from "vue-router"
import type { Device } from "@/common/apis/devices/type"
import type { Project } from "@/common/apis/projects/type"
import type { Tenant } from "@/common/apis/tenant/type"

/**
 * Console 路由框架的唯一公共契约。
 *
 * 业务模块只描述“何时命中、在哪个层级、有哪些相对路由”；它们不应直接操作 Vue Router。
 * 框架据此统一完成路由注册、菜单生成和上下文提交，避免每个租户拥有一套不同的注册逻辑。
 */
export type ConsoleScope = "tenant" | "project" | "device" | "history"

/** 从 `/console/...` URL 提取的纯语法信息，不包含接口查询结果。 */
export interface ConsoleAddress {
  /** 已规范化的 pathname，不包含 query/hash。 */
  path: string
  /** URL 中实际出现的 key，不一定等于实体数据库 ID。 */
  tenantKey?: string
  projectKey?: string
  deviceCode?: string
  /** 最深的标准 Console 层级；非 Console 地址或 `/console` 时为 null。 */
  scope: ConsoleScope | null
  /** 标准层级后剩余的 path segment，供自定义子路由使用。 */
  tail: string[]
}

/** 实体解析完成后的导航上下文，也是 Manifest 的唯一输入。 */
export interface ConsoleContext {
  address: ConsoleAddress
  tenant: Tenant
  project?: Project
  device?: Device
}

export interface RouteMatcherOptions {
  /**
   * literal 使用静态 path；constrained 使用只匹配当前 key 的参数正则。
   * 后者用于旧业务仍需读取 `route.params` 的场景。
   */
  mode: "literal" | "constrained"
  /** 哪些标准 key 要继续暴露为 Vue Router params。 */
  exposeParams?: Array<"tenantKey" | "projectKey" | "deviceCode">
}

/**
 * 一个模块在一个 scope 中提供的一组路由。
 *
 * `routes()` 返回的顶层 path 相对于 `scope`。例如 tenant scope 的 `settings` 会编译为
 * `/console/<tenantKey>/settings`。顶层记录直接注册为 TenantRoot 的 sibling；仅当业务
 * 显式给出 `children` 时才创建嵌套路由。
 */
export interface TenantRouteContribution {
  /** 同一 Manifest 内稳定且唯一的贡献标识。 */
  id: string
  scope: ConsoleScope
  matcher?: RouteMatcherOptions
  /** 可依据已解析实体安全生成组件 props、redirect 和相对路由。 */
  routes: (context: ConsoleContext) => RouteRecordRaw[]
}

/** Registry 为 Contribution 补齐模块来源与版本后得到的内部类型。 */
export interface RegisteredRouteContribution extends TenantRouteContribution {
  moduleId: string
  moduleRevision: string
}

/** 一个业务扩展模块的入口定义。 */
export interface TenantModuleManifest {
  /** 全局唯一、稳定的模块 ID，例如 `tenant:acme`。 */
  id: string
  /** 路由定义变更时递增，用于让运行时识别新 bundle。 */
  revision: string
  /** 必须无副作用；只依据当前上下文判断模块是否适用。 */
  matches: (context: ConsoleContext) => boolean
  /** 可按上下文层级返回 tenant/project/device/history 的任意组合。 */
  contributions: (context: ConsoleContext) => TenantRouteContribution[]
}

/** Header 消费的菜单模型；href 是真实 URL，永不泄露 matcher 正则。 */
export interface NavigationItem {
  id: string
  label: string
  href: string
  activeMatch: "exact" | "prefix"
  hidden: boolean
  order: number
  icon?: RouteMeta["svgIcon"]
  children?: NavigationItem[]
}

/** 一次导航由 Compiler 输出、由 Runtime 以整体替换方式管理的路由集合。 */
export interface CompiledRouteBundle {
  /** 实体、模块版本和编译结果的稳定指纹；相同指纹不重复注册。 */
  signature: string
  context: ConsoleContext
  routes: RouteRecordRaw[]
  navigation: NavigationItem[]
  routeNames: string[]
}

/** Shell/Header/菜单共同读取的已提交状态，避免 UI 读到半完成的上下文。 */
export interface TenantFrameworkSnapshot {
  /** 单调递增的导航序号，用来丢弃慢请求的过期结果。 */
  navigationId: number
  bundleSignature: string
  context: ConsoleContext
  navigation: NavigationItem[]
}

/** `prepareConsoleNavigation` 交给 router guard 的结果。 */
export interface PrepareResult {
  /** true 时路由结构已改变，guard 必须 replace 原 URL 重新匹配。 */
  changed: boolean
  snapshot?: TenantFrameworkSnapshot
}
