import type { CreateOrUpdateDeviceModelDto, DeviceModel } from "@/common/apis/device-models/type"
import { createDeviceModelApi, deleteDeviceModelsApi, getDeviceModelsApi, updateDeviceModelApi } from "@/common/apis/device-models"

export const useDeviceModelStore = defineStore("deviceModel", () => {
  const deviceModels = ref<DeviceModel[]>([])
  const loaded = ref(false)

  const fetchDeviceModels = async (force = false) => {
    if (loaded.value && !force) {
      console.log("设备型号数据已加载，无需重复请求")
      return
    }
    console.log("加载设备型号数据")
    const { data } = await getDeviceModelsApi()
    deviceModels.value = data
    loaded.value = true
  }

  const createDeviceModel = async (payload: CreateOrUpdateDeviceModelDto) => {
    await createDeviceModelApi(payload)
    await fetchDeviceModels(true)
  }

  const updateDeviceModel = async (payload: CreateOrUpdateDeviceModelDto) => {
    if (!payload.id) throw new Error("缺少 id")
    await updateDeviceModelApi(payload)
    await fetchDeviceModels(true)
  }

  const deleteDeviceModel = async (id: string) => {
    await deleteDeviceModelsApi(id)
    await fetchDeviceModels(true)
  }

  const findById = (id: string) => deviceModels.value.find(d => d.id === id)

  const getSerialNumberOptions = (modelId: string) => {
    return computed(() => {
      const model = deviceModels.value.find(m => m.id === modelId)
      return model?.devices.map((d) => {
        let label = d.serialNumber
        if (d.deviceName && d.description) {
          label += ` | ${d.deviceName}（${d.description}）`
        } else if (d.deviceName) {
          label += ` | ${d.deviceName}`
        } else if (d.description) {
          label += ` | ${d.description}`
        }
        return {
          label,
          id: d.id
        }
      }) ?? []
    })
  }
  return {
    deviceModels,
    loaded,
    fetchDeviceModels,
    createDeviceModel,
    updateDeviceModel,
    deleteDeviceModel,
    findById,
    getSerialNumberOptions
  }
})
