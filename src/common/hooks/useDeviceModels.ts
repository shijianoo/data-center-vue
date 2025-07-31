import type { DeviceModel } from "@/common/apis/device-models/type"
import { getDeviceModelsApi } from "@/common/apis/device-models"

export function useDeviceModels() {
  const deviceModels = ref<DeviceModel[]>([])

  async function fetchDeviceModels() {
    try {
      const { data } = await getDeviceModelsApi()
      deviceModels.value = data
      return data
    } catch {
      deviceModels.value = []
      ElMessage.error("获取设备型号失败")
      return []
    }
  }

  return {
    deviceModels,
    fetchDeviceModels
  }
}
