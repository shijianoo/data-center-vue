import { computed } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useDeviceModelStore } from "@/pinia/stores/device-models"

export function useSerialNumberSelection(modelId: string) {
  const route = useRoute()
  const router = useRouter()
  const modelStore = useDeviceModelStore()

  const serialNumberOptions = modelStore.getSerialNumberOptions(modelId)

  const selectedDeviceId = computed({
    get: () => {
      const sn = route.query.sn?.toString() ?? ""
      const model = modelStore.deviceModels.find(m => m.id === modelId)
      const device = model?.devices.find(d => d.serialNumber === sn)
      if (device === undefined) {
        return ""
      }
      return device?.id ?? ""
    },
    set: (val: string) => {
      const model = modelStore.deviceModels.find(m => m.id === modelId)
      const device = model?.devices.find(d => d.id === val)
      if (device) {
        router.replace({ query: { ...route.query, sn: device.serialNumber } })
      }
    }
  })

  const selectedDevice = computed(() => {
    const model = modelStore.deviceModels.find(m => m.id === modelId)
    return model?.devices.find(d => d.id === selectedDeviceId.value)
  })

  return {
    serialNumberOptions,
    selectedDeviceId,
    selectedDevice
  }
}
