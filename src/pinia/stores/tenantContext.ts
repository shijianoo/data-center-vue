import type { Device } from "@/common/apis/devices/type"
import type { Project } from "@/common/apis/projects/type"
import type { Tenant } from "@/common/apis/tenant/type"
import type { ConsoleContext, NavigationItem, TenantFrameworkSnapshot } from "@/framework/tenant-console/types"
import { defineStore } from "pinia"
import { computed, ref } from "vue"

interface LogoTitle {
  primary?: string
  sub?: string
}

/**
 * 前台页面的只读上下文 facade。
 *
 * 路由注册和 URL 解析已移动到 framework/tenant-console；此 Store 保留现有
 * 业务页面使用的字段，避免业务组件在框架迁移中改动。
 */
export const useTenantContextStore = defineStore("tenantContext", () => {
  const snapshot = ref<TenantFrameworkSnapshot | null>(null)
  const currentTenant = ref<Tenant | null | undefined>(undefined)
  const currentProject = ref<Project | null | undefined>(undefined)
  const currentDevice = ref<Device | null | undefined>(undefined)
  const activeNavigation = ref<NavigationItem[]>([])

  const titleOverride = ref<LogoTitle | null>(null)
  const titleToken = ref<symbol | null>(null)

  const currentTenantKey = computed(() => snapshot.value?.context.address.tenantKey ?? "")
  const currentProjectKey = computed(() => snapshot.value?.context.address.projectKey ?? "")
  const currentDeviceCode = computed(() => snapshot.value?.context.address.deviceCode ?? "")
  const isHistory = computed(() => snapshot.value?.context.address.scope === "history")

  const currentHomePath = computed(() => {
    return currentTenantKey.value ? `/console/${currentTenantKey.value}` : ""
  })
  const currentProjectPath = computed(() => {
    return currentProjectKey.value ? `${currentHomePath.value}/projects/${currentProjectKey.value}` : ""
  })
  const currentDevicePath = computed(() => {
    return currentDeviceCode.value ? `${currentProjectPath.value}/devices/${currentDeviceCode.value}` : ""
  })

  const logoTitle = computed(() => titleOverride.value)

  function commitFrameworkSnapshot(
    context: ConsoleContext,
    navigation: NavigationItem[],
    bundleSignature: string,
    navigationId: number
  ) {
    currentTenant.value = context.tenant
    currentProject.value = context.project
    currentDevice.value = context.device
    activeNavigation.value = navigation
    snapshot.value = {
      navigationId,
      bundleSignature,
      context,
      navigation
    }
  }

  function setTitleOverride(title: LogoTitle | null, token: symbol) {
    titleToken.value = token
    titleOverride.value = title
  }

  function isTitleOwner(token: symbol) {
    return titleToken.value === token
  }

  function clear() {
    snapshot.value = null
    currentTenant.value = undefined
    currentProject.value = undefined
    currentDevice.value = undefined
    activeNavigation.value = []
    titleOverride.value = null
    titleToken.value = null
  }

  return {
    snapshot,
    clear,
    commitFrameworkSnapshot,
    currentTenant,
    currentProject,
    currentDevice,
    currentTenantKey,
    currentProjectKey,
    currentDeviceCode,
    isHistory,
    currentHomePath,
    currentProjectPath,
    currentDevicePath,
    activeNavigation,
    setTitleOverride,
    isTitleOwner,
    logoTitle
  }
})
