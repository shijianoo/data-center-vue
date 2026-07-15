import type { RouteMeta, RouteRecordRaw } from "vue-router"
import type { MenuTree } from "../apis/menus/type"
import { isExternal } from "@@/utils/validate"

const movedModulePrefixes: Array<[string, string]> = [
  ["/src/pages/tenants/ningbo-hky/", "/src/tenant-modules/tenants/ningbo-hky/implementation/"],
  ["/src/pages/projects/tianjin/", "/src/tenant-modules/project-profiles/tianjin/implementation/"],
  ["/src/pages/devices/SOB10v1t1/", "/src/tenant-modules/device-models/implementation/SOB10v1t1/"],
  ["/src/pages/devices/SOB23BSv1t1/", "/src/tenant-modules/device-models/implementation/SOB23BSv1t1/"],
  ["/src/pages/devices/components/", "/src/tenant-modules/device-models/implementation/components/"]
]

const viewsModules = {
  ...import.meta.glob("/src/pages/**/*.vue"),
  ...import.meta.glob("/src/tenant-modules/**/*.vue")
}

interface BuildState {
  ids: Set<string>
}

function resolveMovedComponentPath(path: string) {
  return movedModulePrefixes.reduce((resolved, [legacyPrefix, modulePrefix]) => {
    return resolved.startsWith(legacyPrefix)
      ? modulePrefix + resolved.slice(legacyPrefix.length)
      : resolved
  }, path)
}

function resolveMenuComponentPath(component: string) {
  const normalized = component.trim().replaceAll("\\", "/")
  if (!normalized) return ""
  if (normalized.startsWith("@/")) return `/src/${normalized.slice(2)}`
  if (normalized.startsWith("/src/")) return normalized
  if (normalized.startsWith("src/")) return `/${normalized}`
  if (normalized.startsWith("/pages/")) return `/src${normalized}`
  if (normalized.startsWith("pages/")) return `/src/${normalized}`
  const extension = normalized.endsWith(".vue") ? "" : ".vue"
  return `/src/pages/${normalized.replace(/^\/+/, "")}${extension}`
}

function loadComponent(menu: MenuTree) {
  if (!menu.component) return null
  const configuredPath = resolveMenuComponentPath(menu.component)
  const loader = viewsModules[resolveMovedComponentPath(configuredPath)]
  if (!loader) console.warn(`[menu] 未找到菜单“${menu.title}”的组件：${configuredPath}`)
  return loader ?? null
}

function getRouteName(menu: MenuTree) {
  return `backend-menu:${menu.id}`
}

/** 后端菜单只能贡献当前父路由下的相对地址，不能逃逸到 /login、/console 等区域。 */
function getSafeRelativePath(menu: MenuTree, allowEmpty = true) {
  const path = menu.routePath?.trim().replaceAll("\\", "/") ?? ""
  if (!path && allowEmpty) return ""
  if (
    !path
    || path.startsWith("/")
    || path.includes("://")
    || path.split("/").some(segment => segment === ".." || segment === ".")
  ) {
    console.warn(`[menu] 菜单“${menu.title}”包含不安全的相对路径：${menu.routePath ?? ""}`)
    return null
  }
  return path.replace(/\/+$/, "")
}

function buildMeta(menu: MenuTree, externalUrl?: string): RouteMeta {
  return {
    title: menu.title,
    svgIcon: menu.extra?.svgIcon as RouteMeta["svgIcon"],
    hidden: menu.extra?.isHidden,
    roles: menu.extra?.roles,
    breadcrumb: menu.extra?.breadcrumb,
    affix: menu.extra?.affix,
    alwaysShow: menu.extra?.alwaysShow,
    activeMenu: menu.extra?.activeMenu,
    keepAlive: menu.extra?.keepAlive,
    externalUrl,
    externalTarget: menu.target === "_self" ? "_self" : "_blank"
  }
}

function createDirectoryRoute(menu: MenuTree, state: BuildState): RouteRecordRaw | null {
  const path = getSafeRelativePath(menu)
  if (path === null) return null
  return {
    path,
    name: getRouteName(menu),
    redirect: getSafeRedirect(menu),
    meta: buildMeta(menu),
    children: convertMenuList(menu.children ?? [], state)
  }
}

function createPageRoute(menu: MenuTree): RouteRecordRaw | null {
  const path = getSafeRelativePath(menu)
  const component = loadComponent(menu)
  if (path === null || !component) return null
  return {
    path,
    name: getRouteName(menu),
    component,
    meta: buildMeta(menu)
  }
}

function createExternalRoute(menu: MenuTree): RouteRecordRaw | null {
  const externalUrl = menu.externalUrl?.trim()
  if (!externalUrl || !isExternal(externalUrl)) {
    console.warn(`[menu] 外链菜单“${menu.title}”的 externalUrl 协议不受支持，已跳过注册`)
    return null
  }
  return {
    path: `external/${encodeURIComponent(menu.id)}`,
    name: getRouteName(menu),
    component: { render: () => null },
    meta: buildMeta(menu, externalUrl)
  }
}

function getSafeRedirect(menu: MenuTree) {
  const redirect = menu.redirect?.trim()
  if (!redirect) return undefined
  if (isExternal(redirect) || /^javascript:/i.test(redirect) || redirect.includes("\\")) {
    console.warn(`[menu] 菜单“${menu.title}”包含不安全的 redirect：${redirect}`)
    return undefined
  }
  return redirect
}

function createRedirectRoute(menu: MenuTree): RouteRecordRaw | null {
  const path = getSafeRelativePath(menu, false)
  const redirect = getSafeRedirect(menu)
  if (path === null || !redirect) {
    console.warn(`[menu] 重定向菜单“${menu.title}”缺少安全的 routePath 或 redirect，已跳过注册`)
    return null
  }
  return {
    path,
    name: getRouteName(menu),
    redirect,
    meta: buildMeta(menu)
  }
}

function convertMenuItem(menu: MenuTree, state: BuildState): RouteRecordRaw | null {
  if (!menu.id?.trim() || state.ids.has(menu.id)) {
    console.warn(`[menu] 菜单 ID 为空或重复：${menu.id ?? ""}`)
    return null
  }
  state.ids.add(menu.id)

  switch (menu.type) {
    case 1: return createDirectoryRoute(menu, state)
    case 2: return createPageRoute(menu)
    case 3: return createExternalRoute(menu)
    case 4: return createRedirectRoute(menu)
    default:
      console.warn(`[menu] 不支持的菜单类型 ${menu.type}：${menu.title}`)
      return null
  }
}

function convertMenuList(menus: MenuTree[], state: BuildState): RouteRecordRaw[] {
  const siblingPaths = new Set<string>()
  return menus
    .filter(menu => menu.isActive)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map(menu => convertMenuItem(menu, state))
    .filter((route): route is RouteRecordRaw => {
      if (!route) return false
      if (siblingPaths.has(route.path)) {
        console.warn(`[menu] 同级菜单路径重复，已跳过：${route.path}`)
        return false
      }
      siblingPaths.add(route.path)
      return true
    })
}

export function convertMenuToRoutes(menus: MenuTree[]): RouteRecordRaw[] {
  return convertMenuList(menus, { ids: new Set() })
}
