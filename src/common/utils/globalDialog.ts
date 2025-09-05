import type { App, Component } from "vue"
import ElementPlus from "element-plus"
import { createApp } from "vue"

/**
 * 全局弹窗管理器
 * 用于动态创建和管理全局弹窗组件
 */
export class GlobalDialogManager {
  private app: App | null = null
  private container: HTMLDivElement | null = null

  /**
   * 创建全局弹窗
   * @param component Vue组件
   * @param props 组件属性
   * @returns Promise，在弹窗关闭时resolve
   */
  create<T = any>(component: Component, props: Record<string, any> = {}): Promise<T> {
    return new Promise((resolve, reject) => {
      try {
        // 创建容器
        this.container = document.createElement("div")
        this.container.id = `global-dialog-${Date.now()}`
        document.body.appendChild(this.container)

        // 创建Vue应用实例
        this.app = createApp(component, {
          ...props,
          onResolve: (result: T) => {
            this.destroy()
            resolve(result)
          },
          onReject: (error?: any) => {
            this.destroy()
            reject(error)
          }
        })

        // 使用ElementPlus
        this.app.use(ElementPlus)

        // 挂载到容器
        this.app.mount(this.container)
      } catch (error) {
        this.destroy()
        reject(error)
      }
    })
  }

  /**
   * 销毁弹窗
   */
  private destroy() {
    if (this.app) {
      this.app.unmount()
      this.app = null
    }
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container)
      this.container = null
    }
  }
}

// 导出单例实例
export const globalDialogManager = new GlobalDialogManager()
