import type { RouteRecordRaw } from "vue-router"
import type { DeviceModel } from "@/common/apis/device-models/type"
import type { Device } from "@/common/apis/devices/type"
import type { Project } from "@/common/apis/projects/type"
import { defineStore } from "pinia"
import { getProjectByKeyApi } from "@/common/apis/projects"
import { getTenantDeviceByCodeApi } from "@/common/apis/statistics/tenants"
import { useTenantRoute } from "@/common/hooks/useTenantRoute"
import { getDeviceRoutes } from "@/pages/devices/device-routes"
import { getHistoryRoutes } from "@/pages/devices/history-routes"
import { getProjectRoutes } from "@/pages/projects/project-routes"
import { getTenantRoutes } from "@/pages/tenants/tenant-routes"
import { router } from "@/router"
import { useUserStore } from "./user"

// ─── 路由注册状态类型 ────────────────────────────────────────────────────
interface RouteSlot {
  /** 当前已注册的 key，用于幂等判断 */
  registeredKey: Ref<string | null>
  /** 卸载回调列表 */
  removeCallbacks: (() => void)[]
  /** 已注册的路由原始数据（供菜单等 UI 使用） */
  routes: Ref<RouteRecordRaw[]>
}

export const useTenantContextStore = defineStore("tenantContext", () => {
  const route = useTenantRoute()
  const userStore = useUserStore()
  const currentTenant = computed(() => userStore.activeTenant)

  // ─── 上下文实体 ──────────────────────────────────────────────────────
  const currentProject = ref<Project | null | undefined>(undefined)
  const currentModel = ref<DeviceModel | null | undefined>(undefined)
  const currentDevice = ref<Device | null | undefined>(undefined)

  // ─── 四个层级的路由注册槽 ──────────────────────────────────────────
  const tenantSlot: RouteSlot = {
    registeredKey: ref(null),
    removeCallbacks: [],
    routes: ref([])
  }
  const projectSlot: RouteSlot = {
    registeredKey: ref(null),
    removeCallbacks: [],
    routes: ref([])
  }
  const deviceSlot: RouteSlot = {
    registeredKey: ref(null),
    removeCallbacks: [],
    routes: ref([])
  }
  const historySlot: RouteSlot = {
    registeredKey: ref(null),
    removeCallbacks: [],
    routes: ref([])
  }

  // ─── 路径计算 ───────────────────────────────────────────────────────
  const currentTenantKey = computed(() => route.params.tenantKey as string)
  const currentProjectKey = computed(() => route.params.projectKey as string)
  const currentModelKey = computed(() => route.params.modelKey as string)
  const currentDeviceCode = computed(() => route.params.deviceCode as string)
  const isHistory = computed(() => route.path.includes("/history/") || route.path.endsWith("/history"))

  const currentHomePath = computed(() => `/console/${currentTenantKey.value}`)
  const currentProjectPath = computed(() => `${currentHomePath.value}/projects/${currentProjectKey.value}`)
  const currentModelPath = computed(() => `${currentProjectPath.value}/device-list/${currentModelKey.value}`)
  const currentDevicePath = computed(() => {
    if (currentModelKey.value) {
      return `${currentModelPath.value}/devices/${currentDeviceCode.value}`
    } else {
      return `${currentProjectPath.value}/devices/${currentDeviceCode.value}`
    }
  })

  // ─── Logo 标题覆盖（页面可临时覆盖，路由切走自动恢复）────────────────
  const _titleOverride = ref<{ primary?: string, sub?: string } | null>(null)
  /** 当前持有标题覆盖权的 token（每次 useLogoTitle 调用生成唯一 Symbol） */
  const _titleToken = ref<symbol | null>(null)

  /**
   * 覆盖 TenantLogo 显示的标题。
   * @param title 标题对象，传 null 恢复默认
   * @param token 持有者唯一标识（由 useLogoTitle composable 传入）
   */
  function setTitleOverride(title: { primary?: string, sub?: string } | null, token: symbol) {
    _titleToken.value = token
    _titleOverride.value = title
  }

  /**
   * 判断调用方是否仍是当前标题的持有者。
   * 供 useLogoTitle 的 onUnmounted 回调使用：
   * 若新页面已设置了新标题（token 不同），则不清除，避免闪烁。
   */
  function isTitleOwner(token: symbol): boolean {
    return _titleToken.value === token
  }

  /** TenantLogo 实际显示的标题（覆盖值优先，否则用租户信息）。 */
  const logoTitle = computed(() => _titleOverride.value)

  // ─── 通用路由槽操作 ─────────────────────────────────────────────────

  /** 清空某个槽的已注册路由 */
  function clearSlot(slot: RouteSlot) {
    if (slot.removeCallbacks.length > 0) {
      slot.removeCallbacks.forEach(fn => fn())
      slot.removeCallbacks.length = 0
    }
    slot.registeredKey.value = null
    slot.routes.value = []
  }

  /**
   * 所有自定义路由的注册原则：
   * ─────────────────────────────────────────────────
   * 全部公局路由均挂载到 TenantRoot，使用全路径（相对于 /console/:tenantKey）:
   *   租户层  path: "..."、"devices" 等
   *   项目层  path: "projects/${projectKey}/..."
   *   设备层  path: "projects/${projectKey}/devices/${deviceCode}/..."
   *   历史层  path: "projects/${projectKey}/devices/${deviceCode}/history/..."
   *
   * Vue Router 优先匹配静态路径，不会与帮路由（Project/Device/History）的动态参数路由冲突。
   * 如需子路由嵌套，直接在路由文件内用 children 属性定义，无需在入口组件放置 <router-view>。
   */

  /** 向指定节点注册路由，并记录卸载回调 */
  function registerRoutes(slot: RouteSlot, parentName: string, routes: RouteRecordRaw[], key: string) {
    routes.forEach((r) => {
      const removeFn = router.addRoute(parentName, r)
      slot.removeCallbacks.push(removeFn)
    })
    slot.routes.value = routes
    slot.registeredKey.value = key
    console.log("全部路由", router.getRoutes())
  }

  /**
   * 将自定义路由的相对路径补全为完整路径（相对于父级 path 的前缀）。
   * 只处理顶层路由的 path，children 由 Vue Router 自身递归处理。
   *
   * @param routes   路由定义列表（path 为相对路径，如 "" 或 "page"）
   * @param prefix   相对路径前缀，如 "projects/tianjin"
   *
   * ⚠️  prefix 必须是相对路径（不能以 / 开头），不可使用 currentProjectPath / currentDevicePath
   *     等包含实际 tenantKey 属性的绝对路径，否则 Vue Router 会警告:
   *     "Absolute path must have the exact same param as its parent"
   */
  function prefixRoutes(routes: RouteRecordRaw[], prefix: string): RouteRecordRaw[] {
    if (prefix.startsWith("/")) {
      console.error(`[Route] prefixRoutes: prefix 必须是相对路径, 不能以 / 开头。当前传入: "${prefix}"`)
    }
    return routes.map(r => ({
      ...r,
      path: r.path === "" ? prefix : `${prefix}/${r.path}`.replace(/\/+/g, "/")
    }))
  }

  // ─── 级联清理 ───────────────────────────────────────────────────────

  /** 清理历史路由（最底层） */
  function clearHistoryRoutes() {
    clearSlot(historySlot)
  }

  /** 清理设备路由及其下级（历史） */
  function clearDeviceRoutes() {
    clearHistoryRoutes()
    clearSlot(deviceSlot)
  }

  /** 清理项目路由及其下级（设备、历史） */
  function clearProjectRoutes() {
    clearDeviceRoutes()
    clearSlot(projectSlot)
  }

  /** 清理租户路由及其所有下级 */
  function clearTenantRoutes() {
    clearProjectRoutes()
    clearSlot(tenantSlot)
  }

  // ─── 四层级 ensure 函数（幂等，外部可调用） ───────────────────────

  /**
   * 确保租户自定义路由已注册到 TenantRoot 节点。
   * 切换租户时会级联清除项目/设备/历史路由。
   */
  async function ensureTenantRoutes(tenantKey: string) {
    if (tenantSlot.registeredKey.value === tenantKey) {
      console.log("[Route] 已注册当前租户自定义路由, 直接返回")
      return
    }

    clearTenantRoutes()

    try {
      await userStore.switchTenantByKey(tenantKey)
    } catch (err) {
      console.error(`获取租户信息失败: ${tenantKey}`, err)
      userStore.activeTenant = null
      return
    }

    const tenant = userStore.activeTenant
    if (!tenant) return

    const dynamicRoutes = getTenantRoutes(tenant)
    if (dynamicRoutes.length > 0) {
      console.log(`[Route] 注册租户路由 (${tenant.tenantCode})`, dynamicRoutes)
      registerRoutes(tenantSlot, "TenantRoot", dynamicRoutes, tenantKey)
    } else {
      // 无需注册路由，但标记为已处理
      tenantSlot.registeredKey.value = tenantKey
    }
  }

  /**
   * 确保项目自定义路由已注册到 TenantRoot。
   * 路径自动补全为 projects/${projectKey}/... 并挂载到 TenantRoot，
   * 使自定义页面直接渲染于 TenantLayout 的 <router-view>，无需 ProjectEntry 包含 <router-view>。
   * Vue Router 优先匹配静态路径（projects/tianjin）而非动态参数（projects/:projectKey），因此不会冲突。
   */
  async function ensureProjectRoutes(projectKey: string) {
    if (projectSlot.registeredKey.value === projectKey) {
      console.log("[Route] 已注册当前项目自定义路由, 直接返回")
      return
    }

    clearProjectRoutes()

    const project = currentProject.value
    if (!project) return

    const rawRoutes = getProjectRoutes(project)
    if (rawRoutes.length > 0) {
      const prefixed = prefixRoutes(rawRoutes, `projects/${projectKey}`)
      console.log(`[Route] 注册项目路由 (${projectKey})`, prefixed)
      registerRoutes(projectSlot, "TenantRoot", prefixed, projectKey)
    } else {
      projectSlot.registeredKey.value = projectKey
    }
  }

  /**
   * 确保设备自定义路由已注册到 TenantRoot。
   * 路径自动补全为 projects/${projectKey}/devices/${deviceCode}/...
   * @param deviceCode 设备编号
   * @param projectKey 项目 key（必须由调用方传入，不能依赖 route.params）
   */
  async function ensureDeviceRoutes(deviceCode: string, projectKey: string) {
    if (deviceSlot.registeredKey.value === deviceCode) {
      console.log("[Route] 已注册当前设备自定义路由, 直接返回")
      return
    }

    clearDeviceRoutes()

    const device = currentDevice.value
    if (!device) return

    const rawRoutes = getDeviceRoutes(device)
    if (rawRoutes.length > 0) {
      const prefix = `projects/${projectKey}/devices/${deviceCode}`
      const prefixed = prefixRoutes(rawRoutes, prefix)
      console.log(`[Route] 注册设备路由 (${deviceCode})`, prefixed)
      registerRoutes(deviceSlot, "TenantRoot", prefixed, deviceCode)
    } else {
      deviceSlot.registeredKey.value = deviceCode
    }
  }

  /**
   * 确保历史自定义路由已注册到 TenantRoot。
   * 路径自动补全为 projects/${projectKey}/devices/${deviceCode}/history/...
   * @param deviceCode 设备编号
   * @param projectKey 项目 key（必须由调用方传入，不能依赖 route.params）
   */
  async function ensureHistoryRoutes(deviceCode: string, projectKey: string) {
    if (historySlot.registeredKey.value === deviceCode) {
      console.log("[Route] 已注册当前设备历史自定义路由, 直接返回")
      return
    }

    clearHistoryRoutes()

    const device = currentDevice.value
    if (!device) return

    const rawRoutes = getHistoryRoutes(device)
    if (rawRoutes.length > 0) {
      const prefix = `projects/${projectKey}/devices/${deviceCode}/history`
      const prefixed = prefixRoutes(rawRoutes, prefix)
      console.log(`[Route] 注册历史路由 (${deviceCode})`, prefixed)
      registerRoutes(historySlot, "TenantRoot", prefixed, deviceCode)
    } else {
      historySlot.registeredKey.value = deviceCode
    }
  }

  // ─── watch：租户变空时全部清理 ─────────────────────────────────────
  watch(currentTenant, (tenant) => {
    if (!tenant) clearTenantRoutes()
  }, { immediate: true })

  // ─── 实体数据加载 ───────────────────────────────────────────────────
  async function fetchProject(projectKey?: string) {
    const key = projectKey ?? (route.params.projectKey as string)
    if (!userStore.activeTenant || !key) {
      currentProject.value = null
      return
    }
    try {
      if (
        currentProject.value != null
        && (currentProject.value.id === key
          || currentProject.value.projectCode === key
          || currentProject.value.projectNo === key)
      ) {
        // 项目未变化，无需重新加载
      } else {
        const { data } = await getProjectByKeyApi(key)
        currentProject.value = data
        console.log(`[Context] 加载项目成功:${key}`, currentProject.value)
      }
    } catch (error) {
      console.error(`[Context] 加载项目失败: ${key}`, error)
      currentProject.value = null
    }
  }

  async function fetchDevice(deviceCode?: string) {
    const code = deviceCode ?? (route.params.deviceCode as string)
    if (!userStore.activeTenant || currentProject.value == null || !code) {
      currentDevice.value = null
      return
    }
    try {
      if (
        currentDevice.value != null
        && (currentDevice.value.id === code || currentDevice.value.deviceCode === code)
      ) {
        // 设备未变化，无需重新加载
      } else {
        const { data } = await getTenantDeviceByCodeApi(code)
        currentDevice.value = data
        console.log(`[Context] 加载设备成功:${code}`, currentDevice.value)
      }
    } catch (error) {
      console.error("[Context] 加载设备失败:", error)
      currentDevice.value = null
    }
  }

  /**
   * 根据当前路由路径，按层级依次完成：
   * 1. 租户路由注册 + 租户切换
   * 2. 项目数据加载 + 项目路由注册
   * 3. 设备数据加载 + 设备路由注册
   * 4. 历史路由注册（仅在 history 路径下）
   *
   * ⚠️ 使用 route.path 正则提取参数，而非 route.params。
   * 原因：自定义静态路由（如 projects/tianjin/aaaaaa）没有 :projectKey param，
   * 依赖 route.params 会导致 projectKey 为空，错误触发 clearProjectRoutes()。
   *
   * 由 TenantLayout 监听 route.fullPath 变化后调用。
   */
  async function fetchData() {
    const path = route.path

    // 从路径提取各层级 key（兼容静态路由和动态参数路由）
    const tenantKey = (route.params.tenantKey as string) || path.match(/\/console\/([^/]+)/)?.[1]
    const projectKey = (route.params.projectKey as string) || path.match(/\/projects\/([^/]+)/)?.[1]
    const deviceCode = (route.params.deviceCode as string) || path.match(/\/devices\/([^/]+)/)?.[1]
    const inHistory = path.includes("/history/") || path.endsWith("/history")

    // 1 租户层
    if (tenantKey) {
      await ensureTenantRoutes(tenantKey)
    }

    // 2 项目层
    if (projectKey) {
      await fetchProject(projectKey)
      await ensureProjectRoutes(projectKey)
    } else {
      // 真正离开项目路径（路径中没有 /projects/ 段），才清理
      clearProjectRoutes()
      currentProject.value = null
    }

    // 3 设备层
    if (deviceCode) {
      await fetchDevice(deviceCode)
      await ensureDeviceRoutes(deviceCode, projectKey ?? "")
    } else {
      clearDeviceRoutes()
      currentDevice.value = null
    }

    // 4 历史层
    if (deviceCode && inHistory) {
      await ensureHistoryRoutes(deviceCode, projectKey ?? "")
    } else if (!inHistory) {
      clearHistoryRoutes()
    }
  }

  // ─── 全量清理（登出时调用） ─────────────────────────────────────────
  const clear = () => {
    currentProject.value = null
    currentModel.value = null
    currentDevice.value = null
    clearTenantRoutes() // 级联清空所有层级
  }

  // ─── 对外暴露（供菜单等 UI 使用）─────────────────────────────────
  /** 当前租户已注册的自定义路由（供路由管理使用） */
  const tenantRoutes = tenantSlot.routes

  /**
   * 根据当前路径层级返回对应层级的导航路由。
   * 规则：在哪个层级就显示哪个层级注册的路由，用 hidden 控制显隐
   */
  const activeNavRoutes = computed<RouteRecordRaw[]>(() => {
    const path = route.path
    const tenantBase = currentHomePath.value

    const pk = projectSlot.registeredKey.value
    const dc = deviceSlot.registeredKey.value

    const projectBase = pk ? `${tenantBase}/projects/${pk}` : null
    const deviceBase = dc && projectBase ? `${projectBase}/devices/${dc}` : null

    const visible = (r: RouteRecordRaw) => !r.meta?.hidden

    if (deviceBase && path.startsWith(`${deviceBase}/history`)) {
      return historySlot.routes.value.filter(visible)
    }
    if (deviceBase && path.startsWith(deviceBase)) {
      return deviceSlot.routes.value.filter(visible)
    }
    if (projectBase && path.startsWith(projectBase)) {
      return projectSlot.routes.value.filter(visible)
    }
    return tenantSlot.routes.value.filter(visible)
  })

  return {
    clear,
    // 四层级 ensure（路由守卫刷新时调用）
    ensureTenantRoutes,
    ensureProjectRoutes,
    ensureDeviceRoutes,
    ensureHistoryRoutes,
    // 数据加载
    fetchProject,
    fetchDevice,
    fetchData,
    // 上下文实体
    currentTenant,
    currentProject,
    currentModel,
    currentDevice,
    // 路径参数
    currentTenantKey,
    currentProjectKey,
    currentModelKey,
    currentDeviceCode,
    isHistory,
    // 计算路径
    currentHomePath,
    currentProjectPath,
    currentModelPath,
    currentDevicePath,
    // 导航菜单数据
    tenantRoutes,
    activeNavRoutes,
    // Logo 标题覆盖
    setTitleOverride,
    isTitleOwner,
    logoTitle
  }
})
