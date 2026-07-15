import type { Router, RouteRecordRaw } from "vue-router"

let dynamicRouteRemovers: Array<() => void> = []
let activeDynamicRoutes: RouteRecordRaw[] = []

/**
 * 原子式替换当前登录用户的后台动态路由。
 *
 * Router 返回的 remover 能同时移除命名父路由及其 children，因此退出登录、
 * 切换账号或重新初始化权限时不会残留上一次会话的后台页面。
 */
export function replaceDynamicRoutes(router: Router, routes: RouteRecordRaw[]) {
  // 保存旧定义本身，因为 remover 执行后若新路由注册失败，还需要重新 addRoute 恢复。
  const previousRoutes = activeDynamicRoutes
  clearDynamicRoutes()
  const nextRemovers: Array<() => void> = []
  try {
    // 每成功注册一项就立刻保存 remover，确保中途抛错时也能精确清理部分结果。
    routes.forEach(route => nextRemovers.push(router.addRoute(route)))
    dynamicRouteRemovers = nextRemovers
    activeDynamicRoutes = routes
  } catch (error) {
    // 先逆序撤销不完整的新集合，再恢复上一次完整集合；对调用方表现为原子替换。
    nextRemovers.slice().reverse().forEach(remove => remove())
    dynamicRouteRemovers = previousRoutes.map(route => router.addRoute(route))
    activeDynamicRoutes = previousRoutes
    throw error
  }
}

/** 移除当前会话注册的全部后台动态路由。 */
export function clearDynamicRoutes() {
  // children 可能依赖 parent，逆序移除可以与注册顺序保持对称。
  dynamicRouteRemovers.slice().reverse().forEach(remove => remove())
  dynamicRouteRemovers = []
  activeDynamicRoutes = []
}
