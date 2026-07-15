import type { Router } from "vue-router"
import type { ConsoleAddress, ConsoleContext, PrepareResult } from "./types"
import { createMemoryHistory, createRouter } from "vue-router"
import { getProjectByKeyApi } from "@/common/apis/projects"
import { getTenantDeviceByCodeApi } from "@/common/apis/statistics/tenants"
import { getSessionRevision } from "@/framework/session/session-manager"
import { useTenantContextStore } from "@/pinia/stores/tenantContext"
import { useUserStore } from "@/pinia/stores/user"
import { tenantModules } from "@/tenant-modules/registry"
import { parseConsoleAddress } from "./address"
import { compileConsoleBundle } from "./compiler"
import { getMatchedContributions } from "./registry"
import { tenantRouteRuntime } from "./runtime"

/**
 * 每次 Console 导航递增。接口响应返回后必须再次比较，防止 A -> B -> C 快速切换时 A/B
 * 的慢响应把 C 的已提交 Snapshot 或路由 bundle 覆盖掉。
 */
let navigationId = 0

interface PendingRematch {
  path: string
  sessionRevision: number
  context: ConsoleContext
  bundle: ReturnType<typeof compileConsoleBundle>
}

/**
 * Runtime 注册新 bundle 后，真实 Router 必须对原 URL rematch 一次。把首次准备结果保留到
 * 紧随其后的 replace 导航，可避免同一深链重复查询 project/device。
 */
let pendingRematch: PendingRematch | null = null

/**
 * Shadow Router 中的标准 fallback。它们只用于比较“自定义路由是否比标准层级更具体”，
 * 从不注册到真实 Router，也不会创建或挂载 Vue 组件。
 */
const shadowFallbackRoutes = [
  { path: ":tenantKey", name: "shadow:fallback:tenant", component: {} },
  { path: ":tenantKey/projects/:projectKey", name: "shadow:fallback:project", component: {} },
  { path: ":tenantKey/projects/:projectKey/devices/:deviceCode", name: "shadow:fallback:device", component: {} },
  { path: ":tenantKey/projects/:projectKey/devices/:deviceCode/history", name: "shadow:fallback:history", component: {} }
]

/**
 * 在 guard 提交导航前准备 Console 运行时。
 *
 * 执行顺序刻意固定：
 *
 * 1. 解析 URL 并切换到 URL 指定的租户；
 * 2. 先编译 tenant scope，判断它是否已经 claim 了一个看似标准的下级地址；
 * 3. 只有未 claim 时才查询项目，再以相同方式处理设备；
 * 4. 用最终上下文选择 Manifest、整体替换运行时 bundle、一次性提交 Snapshot。
 *
 * 返回 `changed: true` 时，guard 必须 replace 同一个 URL。第一次解析可能落在 generic
 * fallback，但 replace 后 Vue Router 会选择刚注册的精确实例 route，因此 Entry 不会 mount。
 */
export async function prepareConsoleNavigation(path: string, router: Router): Promise<PrepareResult> {
  const parsedAddress = parseConsoleAddress(path)
  if (!parsedAddress.tenantKey) return { changed: false }

  const currentNavigationId = ++navigationId
  const userStore = useUserStore()
  const tenantStore = useTenantContextStore()

  if (
    pendingRematch?.path === path
    && pendingRematch.sessionRevision === getSessionRevision()
    && tenantRouteRuntime.signature === pendingRematch.bundle.signature
  ) {
    const prepared = pendingRematch
    pendingRematch = null
    tenantStore.commitFrameworkSnapshot(
      prepared.context,
      prepared.bundle.navigation,
      prepared.bundle.signature,
      currentNavigationId
    )
    return { changed: false, snapshot: tenantStore.snapshot ?? undefined }
  }
  // 只有紧随其后的同 URL rematch 可以复用；任何其他导航都会使租约失效。
  pendingRematch = null

  // Tenant 是全部层级上下文的前提，并且 switchTenantByKey 负责现有权限/可访问性校验。
  await userStore.switchTenantByKey(parsedAddress.tenantKey)
  if (currentNavigationId !== navigationId) return { changed: false }

  const tenant = userStore.activeTenant
  if (!tenant) {
    // 租户不存在或不可访问时不要遗留上一个租户的动态 route 和 Header 状态。
    tenantStore.clear()
    tenantRouteRuntime.clear()
    return { changed: false }
  }

  // 第一次只用 tenant context 编译。这样可优先识别 `/projects/settings` 等租户自定义页。
  let address = asScopeAddress(parsedAddress, "tenant")
  let context: ConsoleContext = { address, tenant }
  let contributions = getMatchedContributions(context, tenantModules)
  let bundle = compileConsoleBundle(context, contributions)

  if (parsedAddress.projectKey && !isClaimedByExtension(path, bundle.routes)) {
    const { data: project } = await getProjectByKeyApi(parsedAddress.projectKey)
    if (currentNavigationId !== navigationId) return { changed: false }

    address = asScopeAddress(parsedAddress, "project")
    context = { address, tenant, project }
    contributions = getMatchedContributions(context, tenantModules)
    bundle = compileConsoleBundle(context, contributions)
  }

  if (parsedAddress.deviceCode && context.project && !isClaimedByExtension(path, bundle.routes)) {
    const { data: device } = await getTenantDeviceByCodeApi(parsedAddress.deviceCode)
    if (currentNavigationId !== navigationId) return { changed: false }

    address = asScopeAddress(parsedAddress, parsedAddress.scope === "history" ? "history" : "device")
    context = { address, tenant, project: context.project, device }
    contributions = getMatchedContributions(context, tenantModules)
    bundle = compileConsoleBundle(context, contributions)
  }

  // Runtime replace 带回滚：若新 bundle 有冲突，旧 bundle 仍保持可用。
  const changed = tenantRouteRuntime.replace(router, bundle)
  // 只有路由注册成功后才让 Layout/Header 看到新的上下文。
  if (changed) {
    pendingRematch = {
      path,
      sessionRevision: getSessionRevision(),
      context,
      bundle
    }
    return { changed }
  }

  // Commit only after the guard's rematch reaches the latest bundle. This keeps a new
  // Header/Shell snapshot from being rendered beside the old fallback page.
  tenantStore.commitFrameworkSnapshot(context, bundle.navigation, bundle.signature, currentNavigationId)
  return { changed, snapshot: tenantStore.snapshot ?? undefined }
}

/**
 * 在内存 Router 中解析同一 URL，确认最终命中的记录是否是已编译的扩展 route。
 *
 * 这避免把一个定制 tenant 页面如 `projects/settings` 误当成 `projectKey = settings`。
 * Vue Router 自身的 ranking 会决定精确静态路径与参数 fallback 的优先级，因此 Shadow
 * Router 和真实 Router 的匹配规则一致。
 */
function isClaimedByExtension(path: string, routes: ReturnType<typeof compileConsoleBundle>["routes"]) {
  if (routes.length === 0) return false
  const shadowRouter = createRouter({
    history: createMemoryHistory(),
    routes: [{
      path: "/console",
      name: "shadow:root",
      component: {},
      children: [...shadowFallbackRoutes, ...routes]
    }]
  })
  const resolved = shadowRouter.resolve(path)
  return resolved.matched.some(record => Boolean((record.meta as Record<string, unknown>).tenantFramework))
}

/**
 * 把完整解析地址裁剪为当前要编译的 scope 地址。
 *
 * 例如处理项目时 `tail` 从项目后的 segment 开始；处理 history 时才去掉 `/history`。
 * 保留真实 URL key 而不是实体 ID，确保 matcher、菜单和浏览器地址保持一致。
 */
function asScopeAddress(address: ConsoleAddress, scope: NonNullable<ConsoleAddress["scope"]>): ConsoleAddress {
  const segments = address.path.replace(/^\/console\/?/, "").split("/").filter(Boolean)
  const tenantKey = segments[0]
  const result: ConsoleAddress = { path: address.path, tenantKey, scope, tail: [] }

  if (scope === "tenant") {
    result.tail = segments.slice(1)
    return result
  }

  result.projectKey = segments[2]
  if (scope === "project") {
    result.tail = segments.slice(3)
    return result
  }

  result.deviceCode = segments[4]
  if (scope === "device") {
    result.tail = segments.slice(5)
    return result
  }

  result.tail = segments.slice(6)
  return result
}
