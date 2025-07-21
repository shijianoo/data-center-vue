import type { CreateOrUpdateDeviceDto } from "@/common/apis/devices/type"
import { createDeviceApi, deleteDeviceApi, updateDeviceApi } from "@/common/apis/devices"
import { useDeviceModelStore } from "./device-models"

export const useDeviceStore = defineStore("deviceStore", () => {
  const deviceModelStore = useDeviceModelStore()

  const createDevice = async (payload: CreateOrUpdateDeviceDto) => {
    await createDeviceApi(payload)
    await deviceModelStore.fetchDeviceModels(true)
  }

  const updateDevice = async (payload: CreateOrUpdateDeviceDto) => {
    if (!payload.id) throw new Error("缺少 id")
    await updateDeviceApi(payload)
    await deviceModelStore.fetchDeviceModels(true)
  }

  const deleteDevice = async (id: string) => {
    await deleteDeviceApi(id)
    await deviceModelStore.fetchDeviceModels(true)
  }

  return {
    createDevice,
    updateDevice,
    deleteDevice
  }
})
