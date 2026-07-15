import type { MenuTree } from "@/common/apis/menus/type"
import type { MemberProfileDto, Tenant, UserTenantSelection } from "@/common/apis/tenant/type"
import type { User } from "@/common/apis/users/type"
import { getCurrentUserApi } from "@@/apis/users"
import { getRefreshToken, getToken } from "@@/utils/cache/cookies"
import { switchTenantApi } from "@/common/apis/auth"
import { getCurrentMenusApi } from "@/common/apis/menus"
import { getCurrentPermissionsApi } from "@/common/apis/permissions"
import { getCurrentMemberProfileApi, getCurrentUserTenantsApi, getTenantApi, getTenantByKeyApi } from "@/common/apis/tenant"
import {
  beginSessionTransition,
  clearSessionCredentials,
  commitSessionCredentials,
  getSessionCredentials,
  isSessionRevisionCurrent,
  replaceSessionCredentials,
  subscribeSessionCredentials
} from "@/framework/session/session-manager"
import { pinia } from "@/pinia"
import { routerConfig } from "@/router/config"
import { useSettingsStore } from "./settings"
import { useTagsViewStore } from "./tags-view"
import { useTenantContextStore } from "./tenantContext"

let routeCleanup = () => {}

/** 由 Router 组合根注入清理函数，User Store 不再反向依赖 Router。 */
export function registerUserRouteCleanup(cleanup: () => void) {
  routeCleanup = cleanup
}

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
    return roles.value.some(role => role === "platform_admin" || role === "platform_ops")
  })

  const tagsViewStore = useTagsViewStore()

  const settingsStore = useSettingsStore()

  const tenantContextStore = useTenantContextStore()

  subscribeSessionCredentials((credentials) => {
    token.value = credentials?.accessToken ?? ""
    refreshToken.value = credentials?.refreshToken ?? ""
  })

  /** 登录和刷新必须一次提交完整凭据，禁止分别写两枚 token。 */
  const setCredentials = (accessToken: string, newRefreshToken: string) => {
    replaceSessionCredentials({ accessToken, refreshToken: newRefreshToken })
  }

  // 获取用户租户信息
  const getTenantInfo = async () => {
    const { data } = await getCurrentUserTenantsApi()
    tenants.value = data || []
  }

  // 获取用户详情
  const getInfo = async () => {
    const { data: userInfo } = await getCurrentUserApi()
    user.value = userInfo
    // 验证返回的 roles 是否为一个非空数组，否则塞入一个没有任何作用的默认角色，防止路由守卫逻辑进入无限循环
    roles.value = userInfo.roles !== undefined ? userInfo.roles : routerConfig.defaultRoles

    const menuData = await getCurrentMenusApi()
    menus.value = menuData.data || []

    const permissionData = await getCurrentPermissionsApi()
    permissions.value = (permissionData.data || []).map(item => item.code)
  }

  /**
   * 每次租户切换都生成一个 revision。网络请求本身无法真正取消，但只有最新 revision
   * 可以提交 Token、成员信息和 activeTenant，避免快速 A -> B -> C 切换时旧响应回写。
   */
  interface TenantSessionSnapshot {
    credentials: ReturnType<typeof getSessionCredentials>
    tenant: Tenant | null | undefined
    profile: MemberProfileDto | null
  }

  function captureTenantSession(): TenantSessionSnapshot {
    return {
      credentials: getSessionCredentials(),
      tenant: activeTenant.value,
      profile: memberProfile.value
    }
  }

  function restoreTenantSession(snapshot: TenantSessionSnapshot, revision: number) {
    if (snapshot.credentials) commitSessionCredentials(revision, snapshot.credentials)
    else clearSessionCredentials()
    activeTenant.value = snapshot.tenant
    memberProfile.value = snapshot.profile
  }

  /**
   * 先拿到切换后的凭据，再用这套凭据读取 tenant/profile，最后一次性提交 Store。
   * 如果这次切换在等待接口期间已被更晚的导航取代，任何结果都不会污染当前会话。
   */
  async function switchTenant(tenantId: string, revision: number, previous: TenantSessionSnapshot) {
    const isCurrent = () => isSessionRevisionCurrent(revision)

    try {
      const { data: credentials } = await switchTenantApi(tenantId)
      if (!isCurrent()) return false

      const [{ data: tenant }, { data: profile }] = await Promise.all([
        getTenantApi(tenantId, credentials.accessToken),
        getCurrentMemberProfileApi(credentials.accessToken)
      ])
      if (!isCurrent()) return false

      activeTenant.value = tenant
      memberProfile.value = profile
      if (!commitSessionCredentials(revision, credentials)) return false
      localStorage.setItem("LAST_TENANT_ID", tenant.id)
      return true
    } catch (error) {
      // 只有最新切换失败时才回滚；旧请求不得把更新后的会话恢复成旧值。
      if (isCurrent()) restoreTenantSession(previous, revision)
      throw error
    }
  }

  /**
   * 根据租户的任意 key（id / tenantCode / slug / customDomain）查找并切换到目标租户。
   * 若目标租户已是当前激活租户，则直接返回，不重复切换。
   * 若用户无权访问该租户，则将 activeTenant 置为 null。
   */
  const switchTenantByKey = async (tenantKey: string) => {
    const matchKey = (t: { id: string, tenantCode: string, slug?: string, customDomain?: string }) =>
      t.id === tenantKey
      || t.tenantCode === tenantKey
      || t.slug === tenantKey
      || t.customDomain === tenantKey

    // 已是当前激活租户，无需切换
    if (activeTenant.value && matchKey(activeTenant.value)) {
      return activeTenant.value
    }

    const previous = captureTenantSession()
    const revision = beginSessionTransition()
    const isCurrent = () => isSessionRevisionCurrent(revision)

    // 从已加入的租户列表中查找
    const matched = tenants.value.find(matchKey)
    if (matched) {
      const committed = await switchTenant(matched.id, revision, previous)
      return committed && isCurrent() ? activeTenant.value : undefined
    }

    // 平台管理员可访问任意租户
    if (roles.value.includes("platform_admin") || roles.value.includes("platform_ops")) {
      const { data } = await getTenantByKeyApi(tenantKey)
      if (!isCurrent()) return undefined
      const committed = await switchTenant(data.id, revision, previous)
      return committed && isCurrent() ? activeTenant.value : undefined
    }

    if (isCurrent()) {
      activeTenant.value = null
      memberProfile.value = null
    }
    return null
  }

  const getDefaultTenant = () => {
    const tenantId = localStorage.getItem("LAST_TENANT_ID")
    const tenant = tenants.value.find(t => t.id === tenantId)
    if (tenantId !== null && tenant) {
      return tenant
    }
    if (tenants.value.length === 0) {
      return null
    }
    return tenants.value[0]
  }

  // 登出
  const logout = () => {
    clearSessionCredentials()
    routeCleanup()
    resetTagsView()
    roles.value = []
    menus.value = []
    permissions.value = []
    tenants.value = []
    user.value = null
    activeTenant.value = undefined
    memberProfile.value = null
    tenantContextStore.clear()
    isInit.value = false
  }

  // 重置 Visited Views 和 Cached Views
  const resetTagsView = () => {
    if (!settingsStore.cacheTagsView) {
      tagsViewStore.delAllVisitedViews()
      tagsViewStore.delAllCachedViews()
    }
  }

  return { isInit, token, refreshToken, tenants, activeTenant, memberProfile, roles, permissions, menus, user, isPlatformAdmin, isPlatformOps, isPlatformUser, getTenantInfo, switchTenantByKey, getDefaultTenant, setCredentials, getInfo, logout }
})

/**
 * @description 在 SPA 应用中可用于在 pinia 实例被激活前使用 store
 * @description 在 SSR 应用中可用于在 setup 外使用 store
 */
export function useUserStoreOutside() {
  return useUserStore(pinia)
}
