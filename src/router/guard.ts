import type { Router } from "vue-router"
import { setRouteChange } from "@@/composables/useRouteListener"
import { useTitle } from "@@/composables/useTitle"
import { getRefreshToken } from "@@/utils/cache/cookies"
import NProgress from "nprogress"
import { usePermissionStore } from "@/pinia/stores/permission"
import { useTenantStore } from "@/pinia/stores/tenant"
import { useUserStore } from "@/pinia/stores/user"
import { routerConfig } from "@/router/config"
import { isWhiteList } from "@/router/whitelist"

NProgress.configure({ showSpinner: false })

const { setTitle } = useTitle()

const LOGIN_PATH = "/login"

export function registerNavigationGuard(router: Router) {
  // 全局前置守卫
  router.beforeEach(async (to, _from) => {
    NProgress.start()
    const userStore = useUserStore()
    const permissionStore = usePermissionStore()
    const tenantStore = useTenantStore()

    console.log("进入路由守卫")
    // 如果没有登录
    if (!getRefreshToken()) {
      console.log("没有登录")
      // 如果在免登录的白名单中，则直接进入
      if (isWhiteList(to)) return true
      // 其他没有访问权限的页面将被重定向到登录页面
      return `${LOGIN_PATH}?redirect=${encodeURIComponent(to.fullPath)}`
    }
    console.log("已登录")

    // 如果没有初始化
    if (!userStore.roles) {
      console.log("没有初始化", userStore.roles)
      // 否则要重新获取权限角色
      try {
        await userStore.getInfo()
        // 注意：角色必须是一个数组！ 例如: ["admin"] 或 ["developer", "editor"]
        const roles = userStore.roles!
        // 生成可访问的 Routes
        routerConfig.dynamic ? permissionStore.setRoutes(roles) : permissionStore.setAllRoutes()
        // 将 "有访问权限的动态路由" 添加到 Router 中
        permissionStore.addRoutes.forEach(route => router.addRoute(route))
        // 获取当前用户的租户列表
        await tenantStore.getTenantList()
        // 设置 replace: true, 因此导航将不会留下历史记录
        return { ...to, replace: true }
      } catch (error) {
      // 过程中发生任何错误，都直接重置 Token，并重定向到登录页面
        userStore.resetToken()
        console.error(error)
        ElMessage.error((error as Error).message || "路由守卫发生错误")
        return LOGIN_PATH
      }
    }
    console.log("已初始化")

    // 如果已经登录，并准备进入 Login 页面，则重定向到主页
    if (to.path === LOGIN_PATH) return "/"

    // /platform /admin 仅内部用户可进
    if (to.path.startsWith("/platform") || to.path.startsWith("/admin")) {
      console.log("进入/platform或者/admin")
      if (tenantStore.isInternal) {
        console.log("是内部用户，允许进入")
        return true
      } else {
        console.log("不是内部用户，重定向到404")
        return "404"
      }
    }

    // 根路径分流
    if (to.path === "/") {
      console.log("进入/")
      if (tenantStore.isInternal) {
        console.log("是内部用户，重定向到/platform")
        return "/platform"
      } else {
        console.log("不是内部用户，重定向到/console")
        return "/console"
      }
    }

    // 租户标识校验
    if (to.params.tenantIdentifier) {
      const identifier = to.params.tenantIdentifier as string
      console.log("进入租户", identifier)
      const targetTenant = tenantStore.tenants!.find(t =>
        t.slug === identifier || t.tenantNo === identifier
      )

      // 如果找不到租户，重定向到403
      if (!targetTenant) {
        console.log("找不到租户，重定向到403")
        return "/403"
      } else {
        // 如果找到租户，设置当前租户
        tenantStore.setAtiveTenant(targetTenant)
        return true
      }
    }

    // /console 自动补租户
    if (to.path === "/console" || to.path === "/console/") {
      if (tenantStore.activeTenant) {
        return `/console/${tenantStore.activeTenant!.tenantNo}`
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
