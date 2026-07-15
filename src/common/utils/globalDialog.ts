import type { App, Component } from "vue"
import { createApp } from "vue"

interface DialogInstance {
  app: App
  container: HTMLDivElement
}

/**
 * 全局弹窗管理器
 * 用于动态创建和管理全局弹窗组件
 */
export class GlobalDialogManager {
  private instances = new Map<symbol, DialogInstance>()
  private nextId = 0

  /**
   * 创建全局弹窗
   * @param component Vue组件
   * @param props 组件属性
   * @returns Promise，在弹窗关闭时resolve
   */
  create<T = unknown>(component: Component, props: Record<string, unknown> = {}): Promise<T> {
    return new Promise((resolve, reject) => {
      const instanceId = Symbol("global-dialog")
      try {
        const container = document.createElement("div")
        container.id = `global-dialog-${++this.nextId}`
        document.body.appendChild(container)

        const app = createApp(component, {
          ...props,
          onResolve: (result: T) => {
            this.destroy(instanceId)
            resolve(result)
          },
          onReject: (error?: unknown) => {
            this.destroy(instanceId)
            reject(error)
          }
        })
        this.instances.set(instanceId, { app, container })
        app.mount(container)
      } catch (error) {
        this.destroy(instanceId)
        reject(error)
      }
    })
  }

  /**
   * 销毁弹窗
   */
  private destroy(instanceId: symbol) {
    const instance = this.instances.get(instanceId)
    if (!instance) return
    instance.app.unmount()
    instance.container.remove()
    this.instances.delete(instanceId)
  }
}

// 导出单例实例
export const globalDialogManager = new GlobalDialogManager()
