import { computed, onMounted, ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useDeviceModels } from "@/common/hooks/useDeviceModels"

export function useSerialNumberSelection(modelId: string) {
  const route = useRoute()
  const router = useRouter()
  const { deviceModels, fetchDeviceModels } = useDeviceModels()
  const isInitialized = ref(false)

  const serialNumberOptions = computed(() => {
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

  const selectedDeviceId = computed({
    get: () => {
      const sn = route.query.sn?.toString() ?? ""
      const model = deviceModels.value.find(m => m.id === modelId)
      const device = model?.devices.find(d => d.serialNumber === sn)
      if (device === undefined) {
        return ""
      }
      return device?.id ?? ""
    },
    set: (val: string) => {
      const model = deviceModels.value.find(m => m.id === modelId)
      const device = model?.devices.find(d => d.id === val)
      if (device) {
        router.replace({ query: { ...route.query, sn: device.serialNumber } })
      }
    }
  })

  const selectedDevice = computed(() => {
    const model = deviceModels.value.find(m => m.id === modelId)
    return model?.devices.find(d => d.id === selectedDeviceId.value)
  })

  onMounted(async () => {
    if (!isInitialized.value) {
      await fetchDeviceModels()
      isInitialized.value = true
    }
  })

  return {
    serialNumberOptions,
    selectedDeviceId,
    selectedDevice
  }
}
