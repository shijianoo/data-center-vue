import { getProjectByKeyApi } from "@/common/apis/projects"
import { getTenantDeviceByCodeApi } from "@/common/apis/statistics/tenants"
import { getTenantByKeyApi } from "@/common/apis/tenant"
import { useTenantContextStore } from "@/pinia/stores/tenantContext"
import { useUserStore } from "@/pinia/stores/user"
import { useTenantRoute } from "./useTenantRoute"

export function useTenantContext() {
  const route = useTenantRoute()
  const store = useTenantContextStore()
  const userStore = useUserStore()

  async function fetchTenant() {
    const tenantKey = route.params.tenantKey
    console.log("当前租户Key", tenantKey)

    try {
      if (userStore.activeTenant !== null
        && (userStore.activeTenant.id === tenantKey
          || userStore.activeTenant.tenantCode === tenantKey
          || userStore.activeTenant.slug === tenantKey
          || userStore.activeTenant.customDomain === tenantKey)) {
        console.log(`当前租户未发生变化`)
      } else {
        const tenant = userStore.tenants.find(t => t.id === tenantKey
          || t.tenantCode === tenantKey
          || t.slug === tenantKey
          || t.customDomain === tenantKey)

        if (tenant) {
          console.log(`切换到以加入的租户 ${tenant.name}`)
          await userStore.switchTenant(tenant.id)
        } else {
          if (userStore.roles.includes("platform_admin") || userStore.roles.includes("platform_ops")) {
            console.log(`切换到未加入的租户，且用户是平台用户 ${tenantKey}`)
            const { data } = await getTenantByKeyApi(tenantKey)
            console.log("切换到未加入的租户，且用户是平台用户", data)
            await userStore.switchTenant(data.id)
          } else {
            console.log(`切换到未加入的租户，且用户不是平台用户 ${tenantKey}`)
            userStore.activeTenant = null
          }
        }
      }
    } catch (error) {
      console.error(`加载租户信息失败: 租户Key ${tenantKey}`, error)
      userStore.activeTenant = null
    }
  }

  async function fetchProject() {
    const projectKey = route.params.projectKey
    if (userStore.activeTenant === null || !projectKey) {
      store.currentProject = null
      return
    }

    try {
      console.log("当前项目Key", projectKey)
      if (store.currentProject !== null
        && (store.currentProject.id === projectKey
          || store.currentProject.projectCode === projectKey
          || store.currentProject.projectNo === projectKey)) {
        console.log("当前项目未发生变化")
      } else {
        const { data } = await getProjectByKeyApi(projectKey)
        store.currentProject = data
        console.log("加载项目信息成功: 项目Key", projectKey)
      }
    } catch (error) {
      console.error(`加载项目信息失败: Key ${projectKey}`, error)
      store.currentProject = null
    }
  }

  // async function fetchModel() {
  //   if (store.currentModelKey) {
  //     try {
  //       const { data } = await getDeviceModelByKeyApi(store.currentModelKey)
  //       store.currentModel = data
  //       console.log("加载型号信息成功: 型号Key", store.currentModelKey)
  //     } catch (error) {
  //       console.error(`加载型号信息失败: 型号Key ${store.currentModelKey}`, error)
  //       store.currentModel = null
  //     }
  //   } else {
  //     store.currentModel = null
  //   }
  // }

  async function fetchDevice() {
    const deviceCode = route.params.deviceCode
    if (userStore.activeTenant === null
      || store.currentProject === null
      || !deviceCode) {
      store.currentDevice = null
      return
    }

    try {
      console.log("当前设备Key", deviceCode)
      if (store.currentDevice !== null
        && (store.currentDevice.id === deviceCode
          || store.currentDevice.deviceCode === deviceCode)) {
        console.log("当前设备未发生变化")
      } else {
        const { data } = await getTenantDeviceByCodeApi(deviceCode)
        store.currentDevice = data
        console.log("加载设备信息成功: 设备Key", deviceCode)
      }
    } catch (error) {
      console.error("加载设备信息失败:", error)
      store.currentDevice = null
    }
  }

  async function fetchData() {
    await fetchTenant()
    await fetchProject()
    await fetchDevice()
  }

  return {
    fetchData,
    fetchTenant,
    fetchProject,
    fetchDevice
  }
}
