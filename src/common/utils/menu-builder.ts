import type { RouteMeta, RouteRecordRaw } from "vue-router"
import type { MenuTree } from "../apis/menus/type"

const viewsModules = import.meta.glob("/src/pages/**/*.vue")

function loadComponent(menu: MenuTree): any {
  if (!menu.component) return undefined

  const cleanPath = menu.component.startsWith("/")
    ? menu.component.substring(1)
    : menu.component

  // "@/pages/xxx" → "/src/pages/xxx"
  const componentPath = `@/pages/${cleanPath}`
  const realPath = componentPath.replace("@/", "/src/")

  const loader = viewsModules[realPath]

  if (!loader) {
    console.warn(`菜单 ${menu.title} 没有找到组件: ${realPath}`)
    return undefined
  }

  return loader
}

function buildMeta(menu: MenuTree) {
  return {
    title: menu.title,
    svgIcon: menu.extra?.svgIcon,
    hidden: menu.extra?.isHidden,
    roles: menu.extra?.roles,
    breadcrumb: menu.extra?.breadcrumb,
    affix: menu.extra?.affix,
    alwaysShow: menu.extra?.alwaysShow,
    activeMenu: menu.extra?.activeMenu,
    keepAlive: menu.extra?.keepAlive
  } as RouteMeta
}

function createDirectoryRoute(menu: MenuTree): RouteRecordRaw {
  return {
    path: menu.routePath || "",
    name: menu.routeName,
    redirect: menu.redirect,
    meta: buildMeta(menu),
    children: (menu.children ?? [])
      .filter(c => c.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(c => convertMenuItem(c))
      .filter(Boolean) as RouteRecordRaw[]
  }
}

function createPageRoute(menu: MenuTree): RouteRecordRaw {
  return {
    path: menu.routePath ?? "",
    name: menu.routeName,
    component: loadComponent(menu),
    meta: buildMeta(menu)
  }
}

function createLinkRoute(menu: MenuTree): RouteRecordRaw {
  return {
    path: menu.externalUrl ?? "",
    name: menu.routeName,
    component: () => {},
    meta: buildMeta(menu)
  }
}

function convertMenuItem(menu: MenuTree): RouteRecordRaw | null {
  switch (menu.type) {
    case 1:
      // console.log(`处理目录:${menu.title} 目录路径:${menu.routePath}`)
      return createDirectoryRoute(menu)
    case 2:
      // console.log(`处理页面:${menu.title} 页面路径:${menu.routePath} 页面组件:${menu.component}`)
      return createPageRoute(menu)
    case 3:
      // console.log(`处理外链:${menu.title} 外链地址:${menu.externalUrl} 打开方式:${menu.target}`)
      return createLinkRoute(menu)
    case 4:
      // console.log(`处理重定向:${menu.title} 重定向地址:${menu.redirect}  `)
      return createLinkRoute(menu)
    default:
      // console.log(`不支持的菜单类型 ${menu.type}: ${menu.title} 页面路径:${menu.routePath} 页面组件:${menu.component}`)
      return null
  }
}

export function convertMenuToRoutes(menus: MenuTree[]): RouteRecordRaw[] {
  const router = menus
    .filter(m => m.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(m => convertMenuItem(m))
    .filter(Boolean) as RouteRecordRaw[]
  return router
}
