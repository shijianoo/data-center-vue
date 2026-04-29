import type { RouteRecordRaw } from "vue-router"
import type { DeviceModel } from "@/common/apis/device-models/type"
import type { Device } from "@/common/apis/devices/type"
import type { Project } from "@/common/apis/projects/type"
import { defineStore } from "pinia"
import { getProjectByKeyApi } from "@/common/apis/projects"
import { getTenantDeviceByCodeApi } from "@/common/apis/statistics/tenants"
import { useTenantRoute } from "@/common/hooks/useTenantRoute"
import { getTenantRoutes } from "@/pages/tenants/tenant-routes"
import { router } from "@/router"
import { useUserStore } from "./user"

export const useTenantContextStore = defineStore("tenantContext", () => {
  const route = useTenantRoute()
  const userStore = useUserStore()
  const currentTenant = computed(() => userStore.activeTenant)

  /// undefined:未初始化，null:没有权限
  const currentProject = ref<Project | null | undefined>(undefined)
  const currentModel = ref<DeviceModel | null | undefined>(undefined)
  const currentDevice = ref<Device | null | undefined>(undefined)

  /** 当前已注册路由所属的租户 Key，避免重复注册 */
  const registeredTenantKey = ref<string | null>(null)
  let removeRouteCallbacks: (() => void)[] = []

  /** 当前租户已注册的自定义路由原始数据，供 UI 层生成菜单使用 */
  const tenantRoutes = ref<RouteRecordRaw[]>([])

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

  /** 清除已注册的租户自定义路由 */
  function clearTenantRoutes() {
    if (removeRouteCallbacks.length > 0) {
      console.log("清空租户自定义路由")
      removeRouteCallbacks.forEach(removeFn => removeFn())
      removeRouteCallbacks = []
    }
    registeredTenantKey.value = null
    tenantRoutes.value = []
  }

  /**
   * 确保指定租户的自定义路由已注册。
   * 此方法是幂等的：若目标租户的路由已注册，则直接返回，不重复操作。
   * 路由守卫在放行前会调用此方法，确保刷新时动态路由先于路由匹配存在。
   */
  async function ensureTenantRoutes(tenantKey: string) {
    // 前置幂等检查
    if (registeredTenantKey.value === tenantKey) {
      return
    }

    clearTenantRoutes()

    try {
      await userStore.switchTenantByKey(tenantKey)
    } catch (err) {
      console.error(`获取租户信息失败: ${tenantKey}`, err)
      userStore.activeTenant = null
      return
    }

    const tenant = userStore.activeTenant
    if (!tenant) return

    const dynamicRoutes = getTenantRoutes(tenant)
    console.log(`注册租户 ${tenant.tenantCode} 的自定义路由`, dynamicRoutes)
    dynamicRoutes.forEach((r) => {
      const removeFn = router.addRoute("TenantRoot", r)
      removeRouteCallbacks.push(removeFn)
    })
    tenantRoutes.value = dynamicRoutes
    registeredTenantKey.value = tenantKey
  }

  /**
   * 仅监听租户变为空（undefined / null）的场景，负责清理已注册的路由。
   * 路由注册统一由 ensureTenantRoutes 主动调用（来自路由守卫或 fetchData），
   * 不在此处触发，避免与 ensureTenantRoutes 的执行流产生并发竞态。
   */
  watch(currentTenant, (tenant) => {
    if (!tenant) {
      clearTenantRoutes()
    }
  }, { immediate: true })

  /** 加载目标租户下的项目信息，接受可选的 key 参数以应对不同来源的调用 */
  async function fetchProject(projectKey?: string) {
    const key = projectKey ?? (route.params.projectKey as string)
    if (userStore.activeTenant === null || !key) {
      currentProject.value = null
      return
    }
    try {
      console.log("当前项目 Key", key)
      if ((currentProject.value !== undefined && currentProject.value !== null)
        && (currentProject.value.id === key
          || currentProject.value.projectCode === key
          || currentProject.value.projectNo === key)) {
        console.log("当前项目未发生变化")
      } else {
        const { data } = await getProjectByKeyApi(key)
        currentProject.value = data
        console.log("加载项目信息成功: 项目 Key", key)
      }
    } catch (error) {
      console.error(`加载项目信息失败: Key ${key}`, error)
      currentProject.value = null
    }
  }

  /** 加载目标租户下的设备信息 */
  async function fetchDevice(deviceCode?: string) {
    const code = deviceCode ?? (route.params.deviceCode as string)
    if (userStore.activeTenant === null || currentProject.value === null || !code) {
      currentDevice.value = null
      return
    }
    try {
      console.log("当前设备 Code", code)
      if ((currentDevice.value !== undefined && currentDevice.value !== null)
        && (currentDevice.value.id === code || currentDevice.value.deviceCode === code)) {
        console.log("当前设备未发生变化")
      } else {
        const { data } = await getTenantDeviceByCodeApi(code)
        currentDevice.value = data
        console.log("加载设备信息成功: 设备 Code", code)
      }
    } catch (error) {
      console.error("加载设备信息失败:", error)
      currentDevice.value = null
    }
  }

  /**
   * 根据当前路由参数，依次完成租户路由注册 / 项目 / 设备信息加载。
   * 由 TenantLayout 监听 route.fullPath 变化后调用。
   * fetchData 调用 ensureTenantRoutes 而非 switchTenantByKey，
   * 确保切换租户与注册路由在同一个调用链内原子完成，避免 watch 并发触发。
   */
  async function fetchData() {
    console.log("当前路由参数", route.params)
    const tenantKey = route.params.tenantKey as string
    if (tenantKey) {
      await ensureTenantRoutes(tenantKey)
    }
    await fetchProject()
    await fetchDevice()
  }

  const clear = () => {
    currentProject.value = null
    currentModel.value = null
    currentDevice.value = null
    tenantRoutes.value = []
  }

  return {
    clear,
    ensureTenantRoutes,
    fetchProject,
    fetchDevice,
    fetchData,
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
    tenantRoutes
  }
})
