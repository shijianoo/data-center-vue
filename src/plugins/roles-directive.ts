import type { App, Directive } from "vue"
import { isArray } from "@@/utils/validate"
import { useUserStore } from "@/pinia/stores/user"

/**
 * @name 权限指令
 * @description 角色判断函数
 */
const role: Directive = {
  mounted(el, binding) {
    const { value: inputRoles } = binding
    const { roles } = useUserStore()
    if (isArray(inputRoles) && inputRoles.length > 0) {
      const hasPermission = roles.some(role => inputRoles.includes(role))
      hasPermission || el.parentNode?.removeChild(el)
    } else {
      throw new Error(`参数必须是一个数组且长度大于 0，参考：v-permission="['admin', 'editor']"`)
    }
  }
}

export function installRoleDirective(app: App) {
  app.directive("role", role)
}
