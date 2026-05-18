import type { Router } from "vue-router"
import { setRouteChange } from "@@/composables/useRouteListener"
import { getRefreshToken } from "@@/utils/cache/cookies"
import NProgress from "nprogress"
import { usePermissionStore } from "@/pinia/stores/permission"
import { useUserStore } from "@/pinia/stores/user"
import { ensureTenantHeadWatcher, updateBrowserTab } from "@/router/browser-tab"
import { routerConfig } from "@/router/config"
import { isTenantFallbackRoute, preRegisterContextRoutes } from "@/router/tenant-context-routes"
import { isWhiteList } from "@/router/whitelist"

NProgress.configure({ showSpinner: false })

const LOGIN_PATH = "/login"

export function registerNavigationGuard(router: Router) {
  /**
   * 全局前置守卫。
   * 负责登录校验、用户初始化、动态路由注入、租户上下文路由预注册、
   * 后台权限拦截，以及根路径跳转。
   */
  router.beforeEach(async (to, _from) => {
    NProgress.start()
    const userStore = useUserStore()
    const permissionStore = usePermissionStore()

    console.log("进入路由守卫", to.fullPath)

    // 未登录用户只能访问白名单页面，其余页面带 redirect 回到登录页
    if (!getRefreshToken()) {
      console.log("没有登录")
      if (isWhiteList(to)) return true
      return `${LOGIN_PATH}?redirect=${encodeURIComponent(to.fullPath)}`
    }

    // 登录后第一次导航需要初始化用户、租户、角色，并注入动态路由
    if (!userStore.isInit) {
      console.log("没有初始化")
      try {
        // 先获取租户信息，再获取用户信息，后续权限和默认租户都依赖这些数据
        await userStore.getTenantInfo()
        await userStore.getInfo()

        // 注意：角色必须是一个数组！ 例如: ["admin"] 或 ["developer", "editor"]
        const roles = userStore.roles!

        // 生成可访问的 Routes，并添加到 Router 中
        routerConfig.dynamic ? permissionStore.setRoutes(roles) : permissionStore.setAllRoutes()
        permissionStore.addRoutes.forEach(route => router.addRoute(route))
        userStore.isInit = true

        // 刷新进入前台深层地址时，要先把租户/项目/设备自定义路由注册好
        if (to.path.startsWith("/console/")) {
          console.log("[Guard] 刷新预注册路由")
          await preRegisterContextRoutes(to.path, router)
        }

        // 强制执行基于 Path 的重定向解析：
        // 1. 显式 path：确保静态路由优先级高于动态路由匹配。
        // 2. 禁用 {...to}：防止混入 to.name 触发 name 导航，导致绕过路径解析。
        // 3. 显式透传：对象模式下必须手动继承 query/hash，避免参数丢失。
        console.log("[Guard] 重新 Replace")
        return { path: to.path, query: to.query, hash: to.hash, replace: true }
      } catch (error) {
        // 过程中发生任何错误，都直接重置 Token，并重定向到登录页面
        userStore.logout()
        console.error(error)
        ElMessage.error((error as Error).message || "路由守卫发生错误")
        return LOGIN_PATH
      }
    }

    // 已登录用户访问登录页时回到主页，由主页逻辑再落到默认租户
    if (to.path === LOGIN_PATH) return "/"

    // 后台管理区只允许平台管理员或平台运维进入
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

    // 根路径不是具体页面：按当前用户默认租户进入前台租户首页
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

    // 已初始化用户导航到 /console/ 路径时，同样预注册自定义路由。
    // 这样自定义静态路由能在解析前注册，优先于动态参数路由。
    if (to.path.startsWith("/console/")) {
      const matchedName = to.matched.at(-1)?.name

      if (isTenantFallbackRoute(matchedName)) {
        console.log("[Guard] 命中兜底路由，尝试预注册自定义路由:", matchedName)
        const changed = await preRegisterContextRoutes(to.path, router)
        if (changed) {
          console.log("[Guard] 自定义路由已注册，重新 Replace")
          return { path: to.path, query: to.query, hash: to.hash, replace: true }
        } else {
          console.log("[Guard] 路由未发生变化，直接通过")
        }
      }
    }

    return true
  })

  /**
   * 全局后置钩子。
   * 负责通知路由变化、更新浏览器标题/图标，并结束页面进度条。
   */
  router.afterEach((to) => {
    setRouteChange(to)
    // 首次导航完成后再创建页签监听，避免 Pinia 尚未安装时使用 store
    ensureTenantHeadWatcher(router)
    updateBrowserTab(to)
    NProgress.done()
  })
}
