import type { Router } from "vue-router"
import { setRouteChange } from "@@/composables/useRouteListener"
import { useTitle } from "@@/composables/useTitle"
import { getRefreshToken } from "@@/utils/cache/cookies"
import NProgress from "nprogress"
import { usePermissionStore } from "@/pinia/stores/permission"
import { useTenantContextStore } from "@/pinia/stores/tenantContext"
import { useUserStore } from "@/pinia/stores/user"
import { routerConfig } from "@/router/config"
import { isWhiteList } from "@/router/whitelist"

NProgress.configure({ showSpinner: false })

const { setTitle } = useTitle()

const LOGIN_PATH = "/login"

/** 匹配 /console/:tenantKey 及其子路径 */
const TENANT_RE = /^\/console\/([^/]+)/
/** 匹配 /console/:tenantKey/projects/:projectKey */
const PROJECT_RE = /^\/console\/[^/]+\/projects\/([^/]+)/
/** 匹配 /console/:tenantKey/projects/:projectKey/devices/:deviceCode */
const DEVICE_RE = /^\/console\/[^/]+\/projects\/[^/]+\/devices\/([^/]+)/
/** 匹配 history 路径（/history 结尾 或 /history/ 后还有子路径） */
const HISTORY_RE = /\/history(\/|$)/

/**
 * 按路径层级预注册自定义路由。
 * 各 ensure* 函数已幂等（已注册立即返回），可对每次导航调用。
 *
 * @returns 是否新增了路由（需要重新解析时为 true）
 */
async function preRegisterContextRoutes(path: string, router: Router): Promise<boolean> {
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

/** 静态兜底路由名称集合（有自定义路由时应被覆盖，不应加载） */
const FALLBACK_ROUTE_NAMES = new Set(["TenantIndex", "Project", "Device", "History"])

export function registerNavigationGuard(router: Router) {
  // 全局前置守卫
  router.beforeEach(async (to, _from) => {
    NProgress.start()
    const userStore = useUserStore()
    const permissionStore = usePermissionStore()

    console.log("进入路由守卫", to.path)
    // 如果没有登录
    if (!getRefreshToken()) {
      console.log("没有登录")
      // 如果在免登录的白名单中，则直接进入
      if (isWhiteList(to)) return true
      // 其他没有访问权限的页面将被重定向到登录页面
      return `${LOGIN_PATH}?redirect=${encodeURIComponent(to.fullPath)}`
    }

    // 如果没有初始化
    if (!userStore.isInit) {
      console.log("没有初始化")
      // 要重新获取租户、用户、权限角色、菜单
      try {
        await userStore.getTenantInfo()
        await userStore.getInfo()
        // 注意：角色必须是一个数组！ 例如: ["admin"] 或 ["developer", "editor"]
        const roles = userStore.roles!
        // 生成可访问的 Routes
        routerConfig.dynamic ? permissionStore.setRoutes(roles) : permissionStore.setAllRoutes()
        // 将 "有访问权限的动态路由" 添加到 Router 中
        permissionStore.addRoutes.forEach(route => router.addRoute(route))
        userStore.isInit = true

        // 预注册自定义路由（刷新场景：确保路由在 Vue Router 解析前存在）
        if (to.path.startsWith("/console/")) {
          console.log("[Guard] 刷新预注册路由")
          await preRegisterContextRoutes(to.path, router)
        }

        // path: to.fullPath 强制 Vue Router 按路径重新解析，
        // 使预注册的静态自定义路由（如 projects/tianjin）能优先于动态路由（projects/:projectKey）匹配。
        // 不能用 { ...to, replace: true }，spread 会带入 to.name，
        // Vue Router 会按 name 导航，绕过路径解析，自定义路由永远不生效。
        console.log("[Guard] 重新 Replace")
        return { path: to.fullPath, replace: true }
      } catch (error) {
        // 过程中发生任何错误，都直接重置 Token，并重定向到登录页面
        userStore.logout()
        console.error(error)
        ElMessage.error((error as Error).message || "路由守卫发生错误")
        return LOGIN_PATH
      }
    }

    // 如果已经登录，并准备进入 Login 页面，则重定向到主页
    if (to.path === LOGIN_PATH) return "/"

    // /admin 仅管理员用户可进
    if (to.path.startsWith("/admin")) {
      console.log("进入/admin")
      if (userStore.isPlatformAdmin || userStore.isPlatformOps) {
        console.log("是管理员用户，允许进入")
        return true
      } else {
        console.log("不是管理员用户，重定向到404")
        return "/404"
      }
    }

    // 根路径跳转
    if (to.path === "/") {
      const tenant = userStore.getDefaultTenant()
      if (!tenant) {
        console.log("没有租户，退出登录")
        userStore.logout()
        return LOGIN_PATH
      }
      const toPath = `/console/${tenant.tenantCode}`
      console.log("重定向到默认租户", toPath)
      return toPath
    }

    // ── 已初始化用户导航到 /console/ 路径时，同样预注册自定义路由 ──────
    // 这样自定义静态路由（projects/tianjin）能在解析前注册，优先于动态参数路由
    // （projects/:projectKey），Entry 组件不会被误加载。
    if (to.path.startsWith("/console/")) {
      // 当前 matched 是否命中了静态兜底路由（说明自定义路由尚未注册）
      const matchedName = to.matched.at(-1)?.name
      const isStaticFallback = FALLBACK_ROUTE_NAMES.has(matchedName as string)

      if (isStaticFallback) {
        console.log("[Guard] 命中兜底路由，尝试预注册自定义路由:", matchedName)
        const changed = await preRegisterContextRoutes(to.path, router)
        if (changed) {
          console.log("[Guard] 自定义路由已注册，重新 Replace")
          return { path: to.fullPath, replace: true }
        } else {
          console.log("[Guard] 路由未发生变化，直接通过")
        }
      }
    }

    return true
  })

  // 全局后置钩子
  router.afterEach((to) => {
    setRouteChange(to)
    setTitle(to.meta.title)
    NProgress.done()
  })
}
