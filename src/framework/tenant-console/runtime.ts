import type { Router } from "vue-router"
import type { CompiledRouteBundle } from "./types"

/** Router 中稳定 Console 父路由的 name；所有实例 route 都挂在它下面。 */
const TENANT_ROOT_NAME = "TenantRoot"

/**
 * Console 动态路由的唯一写入者。
 *
 * 一个浏览器会话同一时刻只持有一套活跃 bundle。切换租户、项目、设备或模块版本时，先
 * 卸载旧 bundle，再注册新 bundle；任一注册失败会恢复旧 bundle。这比旧设计按层级手工
 * 删除 route 更容易保证没有遗漏的子路由或重复 name。
 */
export class TenantRouteRuntime {
  private activeSignature: string | null = null
  private activeBundle: CompiledRouteBundle | null = null
  /** router.addRoute 返回的 remover；必须按相反顺序执行。 */
  private removers: Array<() => void> = []

  /**
   * 以 bundle signature 去重并进行可逆替换。
   *
   * 返回 true 表示 Router 的匹配表改变，调用方需要对原 URL 做一次 replace/rematch；
   * 返回 false 表示当前 Router 已经拥有完全相同的 bundle。
   */
  replace(router: Router, bundle: CompiledRouteBundle) {
    if (this.activeSignature === bundle.signature) return false

    const previous = this.activeBundle
    this.removeActive()
    const nextRemovers: Array<() => void> = []

    try {
      bundle.routes.forEach((route) => {
        // Vue Router 同名 addRoute 会移除旧记录；框架必须在发生前显式拒绝。
        if (route.name && router.hasRoute(route.name)) {
          throw new Error(`Runtime route name already exists: ${String(route.name)}`)
        }
        nextRemovers.push(router.addRoute(TENANT_ROOT_NAME, route))
      })

      this.removers = nextRemovers
      this.activeSignature = bundle.signature
      this.activeBundle = bundle
      return true
    } catch (error) {
      // 保持用户当前可用页面；不要因一个新模块定义错误把 Console 变成空白页。
      nextRemovers.slice().reverse().forEach(remove => remove())
      this.restore(router, previous)
      throw error
    }
  }

  /** 在登出或 resetRouter 时移除所有由 Console Runtime 注册的 route。 */
  clear() {
    this.removeActive()
    this.activeSignature = null
    this.activeBundle = null
  }

  /** 用于诊断或测试：可确认当前注册的是哪个上下文 bundle。 */
  get signature() {
    return this.activeSignature
  }

  private removeActive() {
    this.removers.slice().reverse().forEach(remove => remove())
    this.removers = []
  }

  private restore(router: Router, bundle: CompiledRouteBundle | null) {
    if (!bundle) return
    this.removers = bundle.routes.map(route => router.addRoute(TENANT_ROOT_NAME, route))
    this.activeBundle = bundle
    this.activeSignature = bundle.signature
  }
}

/** 全应用共享的单一 Runtime 实例。 */
export const tenantRouteRuntime = new TenantRouteRuntime()
