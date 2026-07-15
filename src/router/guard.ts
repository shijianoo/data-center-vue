import type { RouteLocationNormalized, Router } from "vue-router"
import { setRouteChange } from "@@/composables/useRouteListener"
import { getRefreshToken } from "@@/utils/cache/cookies"
import NProgress from "nprogress"
import { getSessionRevision, isSessionRevisionCurrent } from "@/framework/session/session-manager"
import { prepareConsoleNavigation } from "@/framework/tenant-console/orchestrator"
import { ApiError, isApiError } from "@/http/axios"
import { usePermissionStore } from "@/pinia/stores/permission"
import { useUserStore } from "@/pinia/stores/user"
import { ensureTenantHeadWatcher, updateBrowserTab } from "@/router/browser-tab"
import { routerConfig } from "@/router/config"
import { replaceDynamicRoutes } from "@/router/dynamic-runtime"
import { isWhiteList } from "@/router/whitelist"

NProgress.configure({ showSpinner: false })

const LOGIN_PATH = "/login"
let initializationPromise: Promise<void> | null = null

/**
 * 合并首屏期间的并发导航初始化。Vue Router 可能因重定向或动态 route rematch 连续进入
 * guard，但用户、菜单和权限在同一会话中只应加载一次。
 */
async function ensureUserInitialized(router: Router) {
  const userStore = useUserStore()
  if (userStore.isInit) return
  if (initializationPromise) return initializationPromise

  const expectedRevision = getSessionRevision()
  initializationPromise = (async () => {
    await Promise.all([userStore.getTenantInfo(), userStore.getInfo()])
    if (!isSessionRevisionCurrent(expectedRevision)) {
      throw new ApiError("会话已变化，已取消用户初始化", "canceled")
    }

    const permissionStore = usePermissionStore()
    routerConfig.dynamic
      ? permissionStore.setRoutes(userStore.roles)
      : permissionStore.setAllRoutes()
    replaceDynamicRoutes(router, permissionStore.addRoutes)
    userStore.isInit = true
  })().finally(() => {
    initializationPromise = null
  })

  return initializationPromise
}

/**
 * Console 的实体解析失败不等于登录失效：404/403 进入对应页面，网络或模块错误取消本次
 * 导航并保留当前页，避免把暂时故障伪装成“页面不存在”。
 */
async function prepareConsoleRoute(router: Router, to: RouteLocationNormalized) {
  try {
    const prepared = await prepareConsoleNavigation(to.path, router)
    if (prepared.changed) {
      return { path: to.path, query: to.query, hash: to.hash, replace: true }
    }
    return true
  } catch (error) {
    // 统一协议的业务 code 比 HTTP 200 更能表达实体不存在/无权访问。
    const status = isApiError(error) ? error.code ?? error.status : undefined
    if (status === 403) return "/403"
    if (status === 404) return "/404"

    console.error("[router] Console navigation preparation failed", error)
    ElMessage.error((error as Error).message || "暂时无法打开 Console 页面，请稍后重试")
    return false
  }
}

export function registerNavigationGuard(router: Router) {
  /**
   * 全局前置守卫。
   * 负责登录校验、用户初始化、动态路由注入、租户上下文路由预注册、
   * 后台权限拦截，以及根路径跳转。
   */
  router.beforeEach(async (to, _from) => {
    NProgress.start()
    const userStore = useUserStore()

    // 未登录用户只能访问白名单页面，其余页面带 redirect 回到登录页
    if (!getRefreshToken()) {
      if (isWhiteList(to)) return true
      return `${LOGIN_PATH}?redirect=${encodeURIComponent(to.fullPath)}`
    }

    // 登录后第一次导航需要初始化用户、租户、角色，并注入动态路由
    if (!userStore.isInit) {
      try {
        await ensureUserInitialized(router)

        if (to.path === "/" || to.path === "/console" || to.path === "/console/") {
          const tenant = userStore.getDefaultTenant()
          if (!tenant) {
            userStore.logout()
            return LOGIN_PATH
          }
          return `/console/${tenant.tenantCode}`
        }

        if (to.path.startsWith("/console/")) {
          return prepareConsoleRoute(router, to)
        }

        return { path: to.path, query: to.query, hash: to.hash, replace: true }
      } catch (error) {
        // 只有认证失效才清空会话；临时网络错误保留凭据和当前状态，允许用户直接重试。
        if (isApiError(error) && error.kind === "auth") {
          userStore.logout()
          return LOGIN_PATH
        }
        if (isApiError(error) && error.kind === "canceled") return false
        console.error("[router] User initialization failed", error)
        ElMessage.error((error as Error).message || "路由守卫发生错误")
        return false
      }
    }

    // 已登录用户访问登录页时回到主页，由主页逻辑再落到默认租户
    if (to.path === LOGIN_PATH) return "/"

    // 后台管理区只允许平台管理员或平台运维进入
    if (to.path.startsWith("/admin")) {
      if (userStore.isPlatformAdmin || userStore.isPlatformOps) {
        return true
      } else {
        return "/404"
      }
    }

    // 根路径不是具体页面：按当前用户默认租户进入前台租户首页
    if (to.path === "/" || to.path === "/console" || to.path === "/console/") {
      const tenant = userStore.getDefaultTenant()
      if (!tenant) {
        userStore.logout()
        return LOGIN_PATH
      }
      const toPath = `/console/${tenant.tenantCode}`
      return toPath
    }

    if (to.path.startsWith("/console/")) {
      return prepareConsoleRoute(router, to)
    }

    return true
  })

  /**
   * 全局后置钩子。
   * 负责通知路由变化、更新浏览器标题/图标，并结束页面进度条。
   */
  router.afterEach((to, _from, failure) => {
    if (failure) {
      NProgress.done()
      return
    }
    setRouteChange(to)
    // 首次导航完成后再创建页签监听，避免 Pinia 尚未安装时使用 store
    ensureTenantHeadWatcher(router)
    updateBrowserTab(to)
    NProgress.done()
  })
}
