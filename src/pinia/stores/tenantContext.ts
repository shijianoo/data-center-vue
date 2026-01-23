import type { DeviceModel } from "@/common/apis/device-models/type"
import type { Device } from "@/common/apis/devices/type"
import type { Project } from "@/common/apis/projects/type"
import { defineStore } from "pinia"
import { useTenantRoute } from "@/common/hooks/useTenantRoute"
import { getTenantMenu } from "@/pages/tenants/menu-registry"
import { useUserStore } from "./user"

export const useTenantContextStore = defineStore("tenantContext", () => {
  const route = useTenantRoute()
  const userStore = useUserStore()
  const currentTenant = computed(() => userStore.activeTenant)
  const currentProject = ref<Project | null>(null)
  const currentModel = ref<DeviceModel | null>(null)
  const currentDevice = ref<Device | null>(null)

  const customNavLinks = ref<any[]>([])
  const setNavLinks = (links: any[]) => {
    customNavLinks.value = links
  }

  watch(currentTenant, (tenant) => {
    if (tenant) {
      setNavLinks(getTenantMenu(tenant))
    } else {
      setNavLinks([])
    }
  }, { immediate: true })

  const currentTenantKey = computed(() => route.params.tenantKey as string)
  const currentProjectKey = computed(() => route.params.projectKey as string)
  const currentModelKey = computed(() => route.params.modelKey as string)
  const currentDeviceCode = computed(() => route.params.deviceCode as string)
  const isHistory = computed(() => route.path.endsWith("/history"))

  const currentHomePath = computed(() => `/console/${currentTenantKey.value}`)
  const currentProjectPath = computed(() => `${currentHomePath.value}/projects/${currentProjectKey.value}`)
  const currentModelPath = computed(() => `${currentProjectPath.value}/device-list/${currentModelKey.value}`)
  const currentDevicePath = computed(() => {
    if (currentModelKey.value) {
      return `${currentModelPath.value}/devices/${currentDeviceCode.value}`
    } else {
      return `${currentProjectPath.value}/devices/${currentDeviceCode.value}`
    }
  })

  const clear = () => {
    currentProject.value = null
    currentModel.value = null
    currentDevice.value = null
    customNavLinks.value = []
  }

  return {
    clear,
    currentTenant,
    currentProject,
    currentModel,
    currentDevice,
    currentTenantKey,
    currentProjectKey,
    currentModelKey,
    currentDeviceCode,
    isHistory,
    currentHomePath,
    currentProjectPath,
    currentModelPath,
    currentDevicePath,
    customNavLinks,
    setNavLinks
  }
})
