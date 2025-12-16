import type { BreadcrumbItem } from "@/layouts/components/TenantHeader/type"
import { ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useTenantStore } from "@/pinia/stores/tenant"

export const useTenantBreadcrumbsStore = defineStore("tenant-breadcrumbs", () => {
  const tenantStore = useTenantStore()
  const router = useRouter()
  const route = useRoute()

  const items = ref<BreadcrumbItem[]>([])

  const setBreadcrumbs = (newItems: BreadcrumbItem[]) => {
    items.value = newItems
    console.log("设置面包屑路径:", newItems)
  }

  const clearBreadcrumbs = () => {
    items.value = []
  }

  const home: BreadcrumbItem = {
    name: "首页",
    onClick: () => {
      if (tenantStore.activeTenant) {
        router.push(`/console/${tenantStore.activeTenant.tenantNo}`)
      } else {
        router.push("/console/")
      }
      setBreadcrumbs([home])
    }
  }

  const project = (): BreadcrumbItem => {
    const id = route.params.id as string
    const finalName = id ? `项目 ${id}` : "项目" // 这里可以使用 fetchProjectName
    return {
      name: finalName,
      onClick: () => {
        setBreadcrumbs([home, project()])
        router.push(`/console/${tenantStore.activeTenant!.tenantNo}/project/${id || ""}`)
      }
    }
  }

  const deviceList = (): BreadcrumbItem => {
    const sn = route.params.sn as string
    const finalName = sn ? `设备列表 ${sn}` : "设备列表" // 这里可以使用 fetchDeviceListName
    return {
      name: finalName,
      onClick: () => router.push(`/console/${tenantStore.activeTenant!.tenantNo}/device-list/${sn || ""}`)
    }
  }

  // // 模拟 API 调用
  // async function fetchProjectName(id: string) {
  //   console.log(`Fetching project name for id: ${id}`)
  //   return `项目 ${id}`
  // }

  // async function fetchDeviceListName(id: string) {
  //   console.log(`Fetching device list name for id: ${id}`)
  //   return `设备列表 ${id}`
  // }

  return {
    items,
    setBreadcrumbs,
    clearBreadcrumbs,
    home,
    project,
    deviceList
  }
})
