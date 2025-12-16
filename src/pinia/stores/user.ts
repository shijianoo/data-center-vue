import type { MenuTree } from "@/common/apis/menus/type"
import type { User } from "@/common/apis/users/type"
import { getCurrentUserApi } from "@@/apis/users"
import { setRefreshToken as _setRefreshToken, setToken as _setToken, getRefreshToken, getToken, removeRefreshToken, removeToken } from "@@/utils/cache/cookies"
import { getCurrentMenusApi } from "@/common/apis/menus"
import { getCurrentPermissionsApi } from "@/common/apis/permissions"
import { pinia } from "@/pinia"
import { resetRouter } from "@/router"
import { routerConfig } from "@/router/config"
import { useSettingsStore } from "./settings"
import { useTagsViewStore } from "./tags-view"
import { useTenantStore } from "./tenant"

export const useUserStore = defineStore("user", () => {
  const token = ref<string>(getToken() || "")
  const refreshToken = ref<string>(getRefreshToken() || "")

  const roles = ref<string[] | undefined>(undefined)

  const user = ref<User | null>(null)

  const menus = ref<MenuTree[]>([])

  const permissions = ref<string[]>([])

  const tagsViewStore = useTagsViewStore()

  const settingsStore = useSettingsStore()

  const tenantStore = useTenantStore()

  // 设置 Token
  const setToken = (value: string) => {
    _setToken(value)
    token.value = value
  }
  const setRefreshToken = (value: string) => {
    _setRefreshToken(value)
    refreshToken.value = value
  }

  // 获取用户详情
  const getInfo = async () => {
    const { data } = await getCurrentUserApi()
    user.value = data
    // 验证返回的 roles 是否为一个非空数组，否则塞入一个没有任何作用的默认角色，防止路由守卫逻辑进入无限循环
    roles.value = data.roles !== undefined ? data.roles : routerConfig.defaultRoles
    console.log("用户角色:", roles.value)
    const menuData = await getCurrentMenusApi()
    menus.value = menuData.data || []
    console.log("用户菜单:", menus.value)

    const permissionData = await getCurrentPermissionsApi()
    permissions.value = (permissionData.data || []).map(item => item.code)
    console.log("用户权限:", permissions.value)
  }

  // 模拟角色变化
  const changeRoles = (role: string) => {
    const newToken = `token-${role}`
    token.value = newToken
    _setToken(newToken)
    // 用刷新页面代替重新登录
    location.reload()
  }

  // 登出
  const logout = () => {
    removeToken()
    removeRefreshToken()
    token.value = ""
    refreshToken.value = ""
    roles.value = undefined
    resetRouter()
    resetTagsView()
    user.value = null
    tenantStore.tenants = undefined
    tenantStore.activeTenant = null
  }

  // 重置 Token
  const resetToken = () => {
    removeToken()
    removeRefreshToken()
    token.value = ""
    refreshToken.value = ""
    roles.value = undefined
    user.value = null
  }

  // 重置 Visited Views 和 Cached Views
  const resetTagsView = () => {
    if (!settingsStore.cacheTagsView) {
      tagsViewStore.delAllVisitedViews()
      tagsViewStore.delAllCachedViews()
    }
  }

  return { token, roles, permissions, menus, user, setToken, setRefreshToken, getInfo, changeRoles, logout, resetToken }
})

/**
 * @description 在 SPA 应用中可用于在 pinia 实例被激活前使用 store
 * @description 在 SSR 应用中可用于在 setup 外使用 store
 */
export function useUserStoreOutside() {
  return useUserStore(pinia)
}
