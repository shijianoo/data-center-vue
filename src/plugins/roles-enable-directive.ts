import type { App, Directive } from "vue"
import { isArray } from "@@/utils/validate"
import { useUserStore } from "@/pinia/stores/user"

/**
 * @name 权限指令
 * @description 角色判断函数
 */
const role: Directive = {
  mounted(el, binding) {
    const { roles } = useUserStore()
    let inputRoles: string[] = []
    let tipText = "无权限"

    // 解析参数
    if (isArray(binding.value)) {
      inputRoles = binding.value
    } else if (typeof binding.value === "object" && binding.value.roles) {
      inputRoles = binding.value.roles
      if (binding.value.text) tipText = binding.value.text
    } else {
      throw new Error(
        `v-roles-enable 参数错误，必须是角色数组或 { roles: [...], text?: '提示文本' }`
      )
    }

    if (!inputRoles.length) {
      throw new Error(`v-roles-enable 角色数组不能为空`)
    }

    // 检查是否有权限
    const hasRole = roles.some(p => inputRoles.includes(p))
    if (!hasRole) {
      const tagName = el.tagName.toLowerCase()

      // 表单元素直接禁用
      if (["button", "input", "select", "textarea"].includes(tagName)) {
        (el as HTMLButtonElement | HTMLInputElement).disabled = true
        el.title = tipText
      } else {
        // 非表单元素，禁止点击并半透明
        el.style.pointerEvents = "none"
        el.style.opacity = "0.6"
        el.style.cursor = "not-allowed"
      }
    }
  }
}

export function installRoleEnableDirective(app: App) {
  app.directive("role-enable", role)
}
