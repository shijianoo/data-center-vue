import type { Router } from "vue-router"
import { useTenantContextStore } from "@/pinia/stores/tenantContext"

/** 匹配 /console/:tenantKey 及其子路径 */
const TENANT_RE = /^\/console\/([^/]+)/
/** 匹配 /console/:tenantKey/projects/:projectKey */
const PROJECT_RE = /^\/console\/[^/]+\/projects\/([^/]+)/
/** 匹配 /console/:tenantKey/projects/:projectKey/devices/:deviceCode */
const DEVICE_RE = /^\/console\/[^/]+\/projects\/[^/]+\/devices\/([^/]+)/
/** 匹配 history 路径（/history 结尾 或 /history/ 后还有子路径） */
const HISTORY_RE = /\/history(\/|$)/

/** 静态兜底路由名称集合（有自定义路由时应被覆盖，不应加载） */
const FALLBACK_ROUTE_NAMES = new Set(["TenantIndex", "Project", "Device", "History"])

/**
 * 按路径层级预注册自定义路由。
 * 各 ensure* 函数已幂等（已注册立即返回），可对每次导航调用。
 *
 * @returns 是否新增了路由（需要重新解析时为 true）
 */
export async function preRegisterContextRoutes(path: string, router: Router): Promise<boolean> {
  const tenantContextStore = useTenantContextStore()
  const beforeCount = router.getRoutes().length

  // 层级1：租户路由
  const tenantMatch = path.match(TENANT_RE)
  if (tenantMatch) {
    await tenantContextStore.ensureTenantRoutes(tenantMatch[1])
  }

  // 层级2：项目路由（需要先加载项目数据）
  const projectMatch = path.match(PROJECT_RE)
  if (projectMatch) {
    const projectKey = projectMatch[1]
    await tenantContextStore.fetchProject(projectKey)
    await tenantContextStore.ensureProjectRoutes(projectKey)
  }

  // 层级3：设备路由（需要先加载设备数据）
  const deviceMatch = path.match(DEVICE_RE)
  if (deviceMatch) {
    const deviceCode = deviceMatch[1]
    const pKey = projectMatch?.[1] ?? ""
    await tenantContextStore.fetchDevice(deviceCode)
    await tenantContextStore.ensureDeviceRoutes(deviceCode, pKey)
  }

  // 层级4：历史路由
  if (deviceMatch && HISTORY_RE.test(path)) {
    const deviceCode = deviceMatch[1]
    const pKey = projectMatch?.[1] ?? ""
    await tenantContextStore.ensureHistoryRoutes(deviceCode, pKey)
  }

  // 路由数量变化 → 有新路由注册
  return router.getRoutes().length > beforeCount
}

/** 判断当前导航是否命中了前台静态兜底路由 */
export function isTenantFallbackRoute(routeName: unknown) {
  return typeof routeName === "string" && FALLBACK_ROUTE_NAMES.has(routeName)
}
