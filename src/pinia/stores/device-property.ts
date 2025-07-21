import type { CreateOrUpdateDevicePropertyDto, DeviceProperty } from "@/common/apis/device-properties/type"
import { defineStore } from "pinia"
import { ref } from "vue"
import { createDevicePropertyApi, deleteDevicePropertyApi, getDevicePropertiesApi, updateDevicePropertyApi } from "@/common/apis/device-properties"

export const useDevicePropertyStore = defineStore("deviceProperty", () => {
  const properties = ref<DeviceProperty[]>([])
  const loading = ref(false)

  const fetchProperties = async (deviceId: string) => {
    loading.value = true
    const { data } = await getDevicePropertiesApi(deviceId)
    properties.value = data
    loading.value = false
  }

  const createProperty = async (deviceId: string, key: string, dto: CreateOrUpdateDevicePropertyDto) => {
    await createDevicePropertyApi(deviceId, key, dto)
    await fetchProperties(deviceId)
  }

  const upsertProperty = async (deviceId: string, key: string, dto: CreateOrUpdateDevicePropertyDto) => {
    await updateDevicePropertyApi(deviceId, key, dto)
    await fetchProperties(deviceId)
  }

  const deleteProperty = async (deviceId: string, key: string) => {
    await deleteDevicePropertyApi(deviceId, key)
    await fetchProperties(deviceId)
  }

  const findProperty = (key: string) => properties.value.find(p => p.key === key)

  return {
    properties,
    loading,
    fetchProperties,
    createProperty,
    upsertProperty,
    deleteProperty,
    findProperty
  }
})
