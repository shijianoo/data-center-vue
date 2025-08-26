import type { DeviceModel } from "../apis/device-models/type"
import type { Device } from "@/common/apis/devices/type"
import { computed, onMounted, ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import { getMyDevicesApi } from "../apis/device-access"

export function useSerialNumberSelection(modelId: string) {
  const route = useRoute()
  const router = useRouter()
  const deviceModel = ref<DeviceModel>()
  const devices = ref<Device[]>([])

  const serialNumberOptions = computed(() => {
    return devices.value.map((d) => {
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
      const device = devices.value.find(d => d.serialNumber === sn)
      return device?.id ?? ""
    },
    set: (val: string) => {
      const device = devices.value.find(d => d.id === val)
      if (device) {
        router.replace({ query: { ...route.query, sn: device.serialNumber } })
      }
    }
  })

  const selectedDevice = computed(() => {
    return devices.value.find(d => d.id === selectedDeviceId.value)
  })

  onMounted(async () => {
    console.log("获取设备列表...", modelId)
    const { data } = await getMyDevicesApi(modelId)
    devices.value = data
  })

  watch(
    () => selectedDeviceId.value,
    (val) => {
      const sn = route.query.sn?.toString() ?? ""
      if (sn && val === "") {
        ElMessage.warning(`你没有对设备 [${sn}] 的访问权限`)
      }
    },
    { immediate: true }
  )

  return {
    serialNumberOptions,
    selectedDeviceId,
    selectedDevice,
    deviceModel
  }
}
