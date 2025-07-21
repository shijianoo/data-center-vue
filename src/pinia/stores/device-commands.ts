import type { DeviceCommand } from "@/common/apis/device-command/type"
import { defineStore } from "pinia"
import { ref } from "vue"
import { createDeviceCommandApi, deleteDeviceCommandApi, getDeviceCommandsApi } from "@/common/apis/device-command"

export const useDeviceCommandStore = defineStore("deviceCommand", () => {
  const commands = ref<DeviceCommand[]>([])
  const loading = ref(false)

  const fetchCommands = async (deviceId: string) => {
    loading.value = true
    const { data } = await getDeviceCommandsApi(deviceId)
    commands.value = data
    loading.value = false
  }

  const createCommand = async (deviceId: string, command: string, parameter?: string) => {
    await createDeviceCommandApi(deviceId, command, parameter)
    await fetchCommands(deviceId)
  }

  const deleteCommand = async (deviceId: string, id: string) => {
    await deleteDeviceCommandApi(id)
    await fetchCommands(deviceId)
  }

  return {
    commands,
    loading,
    fetchCommands,
    createCommand,
    deleteCommand
  }
})
