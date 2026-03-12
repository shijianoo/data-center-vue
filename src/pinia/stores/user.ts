import type { MenuTree } from "@/common/apis/menus/type"
import type { MemberProfileDto, Tenant, UserTenantSelection } from "@/common/apis/tenant/type"
import type { User } from "@/common/apis/users/type"
import { getCurrentUserApi } from "@@/apis/users"
import { setRefreshToken as _setRefreshToken, setToken as _setToken, getRefreshToken, getToken, removeRefreshToken, removeToken } from "@@/utils/cache/cookies"
import { switchTenantApi } from "@/common/apis/auth"
import { getCurrentMenusApi } from "@/common/apis/menus"
import { getCurrentPermissionsApi } from "@/common/apis/permissions"
import { getCurrentMemberProfileApi, getCurrentUserTenantsApi, getTenantApi } from "@/common/apis/tenant"
import { pinia } from "@/pinia"
import { resetRouter } from "@/router"
import { routerConfig } from "@/router/config"
import { useSettingsStore } from "./settings"
import { useTagsViewStore } from "./tags-view"
import { useTenantContextStore } from "./tenantContext"

export const useUserStore = defineStore("user", () => {
  const token = ref<string>(getToken() || "")
  const refreshToken = ref<string>(getRefreshToken() || "")
  const isInit = ref<boolean>(false)

  const roles = ref<string[]>([])

  const user = ref<User | null>(null)

  const menus = ref<MenuTree[]>([])

  const permissions = ref<string[]>([])

  const tenants = ref<UserTenantSelection[]>([])

  /// undefined:未初始化，null:没有权限
  const activeTenant = ref<Tenant | null | undefined>(undefined)

  const memberProfile = ref<MemberProfileDto | null>(null)

  const isPlatformAdmin = computed(() => {
    return roles.value.includes("platform_admin")
  })
  const isPlatformOps = computed(() => {
    return roles.value.includes("platform_ops")
  })
  const isPlatformUser = computed(() => {
    return roles.value.find(role => role === "platform_admin" || role === "platform_ops")
  })

  const tagsViewStore = useTagsViewStore()

  const settingsStore = useSettingsStore()

  const tenantContextStore = useTenantContextStore()

  // 设置 Token
  const setToken = (value: string) => {
    _setToken(value)
    token.value = value
  }
  const setRefreshToken = (value: string) => {
    _setRefreshToken(value)
    refreshToken.value = value
  }

  // 获取用户租户信息
  const getTenantInfo = async () => {
    const { data } = await getCurrentUserTenantsApi()
    tenants.value = data || []
    console.log("初始化-租户列表:", tenants.value)
  }

  // 获取用户详情
  const getInfo = async () => {
    const { data: userInfo } = await getCurrentUserApi()
    user.value = userInfo
    // 验证返回的 roles 是否为一个非空数组，否则塞入一个没有任何作用的默认角色，防止路由守卫逻辑进入无限循环
    roles.value = userInfo.roles !== undefined ? userInfo.roles : routerConfig.defaultRoles
    console.log("初始化-用户角色:", roles.value)

    const menuData = await getCurrentMenusApi()
    menus.value = menuData.data || []
    console.log("初始化-用户菜单:", menus.value)

    const permissionData = await getCurrentPermissionsApi()
    permissions.value = (permissionData.data || []).map(item => item.code)
    console.log("初始化-用户权限:", permissions.value)
  }

  // 切换当前租户
  const switchTenant = async (tenantId: string) => {
    const { data } = await switchTenantApi(tenantId)
    setToken(data.accessToken)
    setRefreshToken(data.refreshToken)

    const { data: tenant } = await getTenantApi(tenantId)
    activeTenant.value = tenant
    console.log("切换租户成功:", activeTenant.value)
    const { data: profile } = await getCurrentMemberProfileApi()
    memberProfile.value = profile
    console.log("切换租户成功-成员信息:", profile)

    localStorage.setItem("LAST_TENANT_ID", tenant.id)
  }

  const getDefaultTenant = () => {
    const tenantId = localStorage.getItem("LAST_TENANT_ID")
    const tenant = tenants.value.find(t => t.id === tenantId)
    if (tenantId !== null && tenant) {
      console.log("获取默认租户:", tenantId)
      return tenant
    }
    if (tenants.value.length === 0) {
      return null
    }
    return tenants.value[0]
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
    resetRouter()
    resetTagsView()
    user.value = null
    activeTenant.value = undefined
    tenantContextStore.clear()
    isInit.value = false
  }

  // 重置 Token
  const resetToken = () => {
    removeToken()
    removeRefreshToken()
    token.value = ""
    refreshToken.value = ""
    user.value = null
    tenantContextStore.clear()
  }

  // 重置 Visited Views 和 Cached Views
  const resetTagsView = () => {
    if (!settingsStore.cacheTagsView) {
      tagsViewStore.delAllVisitedViews()
      tagsViewStore.delAllCachedViews()
    }
  }

  return { isInit, token, tenants, activeTenant, memberProfile, roles, permissions, menus, user, isPlatformAdmin, isPlatformOps, isPlatformUser, getTenantInfo, switchTenant, getDefaultTenant, setToken, setRefreshToken, getInfo, changeRoles, logout, resetToken }
})

/**
 * @description 在 SPA 应用中可用于在 pinia 实例被激活前使用 store
 * @description 在 SSR 应用中可用于在 setup 外使用 store
 */
export function useUserStoreOutside() {
  return useUserStore(pinia)
}
