import type { RouteRecordRaw } from "vue-router"
import type { SvgName } from "~virtual/svg-component"
import type { MenuTree } from "@/common/apis/menus/type"
import { pinia } from "@/pinia"
import { constantRoutes, dynamicRoutes } from "@/router"
import { routerConfig } from "@/router/config"
import { flatMultiLevelRoutes } from "@/router/helper"
import { useUserStore } from "./user"

const viewsModules = import.meta.glob("@/pages/**/*.vue")
const Layouts = () => import("@/layouts/index.vue")

function hasPermission(roles: string[], route: RouteRecordRaw) {
  const routeRoles = route.meta?.roles
  return routeRoles ? roles.some(role => routeRoles.includes(role)) : true
}

function filterDynamicRoutes(routes: RouteRecordRaw[], roles: string[]) {
  const res: RouteRecordRaw[] = []
  routes.forEach((route) => {
    const tempRoute = { ...route }
    if (hasPermission(roles, tempRoute)) {
      if (tempRoute.children) {
        tempRoute.children = filterDynamicRoutes(tempRoute.children, roles)
      }
      res.push(tempRoute)
    }
  })
  return res
}

function transformMenuToRoutes(menuTree: MenuTree[]): RouteRecordRaw[] {
  const routes: RouteRecordRaw[] = []
  menuTree.forEach((menu) => {
    if (menu.type === 2) return // 跳过按钮类型

    // 判断是否有子菜单（且子菜单不全为按钮类型）
    const validChildren = menu.children?.filter(child => child.type !== 2) || []
    const hasChildren = validChildren.length > 0

    // 构建路由
    const route: any = {
      path: menu.path || "",
      name: menu.name || "",
      meta: {
        title: menu.name,
        hidden: menu.isHidden,
        keepAlive: menu.keepAlive,
        affix: menu.affix,
        svgIcon: menu.svgIcon as SvgName | undefined // 添加图标支持
      }
    } as RouteRecordRaw

    // 设置组件
    if (menu.type === 0) { // 页面菜单
      if (hasChildren) {
        // 有子菜单的菜单使用Layouts组件作为布局容器
        route.component = Layouts

        // 如果菜单本身有组件路径，则在子菜单中添加一个与父菜单同名但不带子菜单的菜单项
        if (menu.component && menu.component.trim() !== "") {
          const componentPath = `@/pages/${menu.component}`
          const component = viewsModules[componentPath.replace("@/", "/src/")]

          if (component && typeof component === "function") {
            const indexRoute = {
              path: "index", // 使用index作为默认子路由
              component,
              name: `${menu.name}Index`,
              meta: {
                title: `${menu.name}概览`,
                svgIcon: menu.svgIcon as SvgName | undefined,
                hidden: false,
                keepAlive: menu.keepAlive,
                affix: false
              }
            }
            // 先添加子菜单数组
            if (!route.children) route.children = []
            route.children.unshift(indexRoute)
          }
        }
      } else {
        // 叶子节点加载实际组件
        const componentPath = `@/pages/${menu.component}`
        const component = viewsModules[componentPath.replace("@/", "/src/")]

        if (component && typeof component === "function") {
          route.component = component
        } else {
          console.warn(`菜单 "${menu.name}" 的组件路径 "${componentPath}" 不存在`)
          // 对于没有找到组件的叶子节点，可以设置一个默认组件或404页面
          const NotFound = () => import("@/pages/error/404.vue")
          route.component = NotFound
        }
      }
    } else if (menu.type === 1) { // 外链菜单
      // 外链处理逻辑
    }

    // 递归处理子菜单
    if (hasChildren) {
      route.children = transformMenuToRoutes(validChildren)

      // 为只有一个子菜单的菜单设置重定向
      if (route.children.length === 1 && !route.redirect) {
        route.redirect = route.path.endsWith("/")
          ? route.path + route.children[0].path
          : `${route.path}/${route.children[0].path}`
      }
    } else {
      // 确保叶子节点没有空的children数组
      delete route.children
    }

    // 设置路由的alwaysShow属性
    if (hasChildren && route.children && route.children.length > 0) {
      route.meta.alwaysShow = true // 总是显示父级菜单
    }

    // 添加到路由列表
    routes.push(route)
  })

  return routes
}

export const usePermissionStore = defineStore("permission", () => {
  // 可访问的路由
  const routes = ref<RouteRecordRaw[]>([])

  // 有访问权限的动态路由
  const addRoutes = ref<RouteRecordRaw[]>([])

  // 根据角色生成可访问的 Routes（可访问的路由 = 常驻路由 + 有访问权限的动态路由 + 后端返回的路由）
  const setRoutes = (roles: string[]) => {
    const accessedRoutes = filterDynamicRoutes(dynamicRoutes, roles)
    const userStore = useUserStore()
    const backendRoutes = transformMenuToRoutes(userStore.menus)
    set(backendRoutes.concat(accessedRoutes))
  }

  // 所有路由 = 所有常驻路由 + 所有动态路由
  const setAllRoutes = () => {
    set(dynamicRoutes)
  }

  // 统一设置
  const set = (accessedRoutes: RouteRecordRaw[]) => {
    routes.value = constantRoutes.concat(accessedRoutes)
    addRoutes.value = routerConfig.thirdLevelRouteCache ? flatMultiLevelRoutes(accessedRoutes) : accessedRoutes
  }

  return { routes, addRoutes, setRoutes, setAllRoutes }
})

/**
 * @description 在 SPA 应用中可用于在 pinia 实例被激活前使用 store
 * @description 在 SSR 应用中可用于在 setup 外使用 store
 */
export function usePermissionStoreOutside() {
  return usePermissionStore(pinia)
}
