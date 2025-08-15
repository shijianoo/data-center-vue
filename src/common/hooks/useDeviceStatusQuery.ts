import type { ParsedDeviceStatusQuery } from "@/common/apis/device-data/type"
import type { Device } from "@/common/apis/devices/type"
import { queryParsedDeviceStatus } from "@/common/apis/device-data"

export function useDeviceStatusQuery(device: Ref<Device | undefined>) {
  const dataList = ref<any[]>([])
  const anchorTime = ref("")
  const limit = ref(50)
  const loading = ref(false)
  const pageIndex = ref(1)
  const isLastPage = computed(() => dataList.value.length < limit.value)

  const fetchData = async () => {
    if (!device.value) {
      console.warn("未选择设备，无法查询数据")
      return
    }
    loading.value = true
    console.log("开始查询设备数据，设备编号:", device.value.serialNumber, "锚点时间:", anchorTime.value, "限制:", limit.value)

    try {
      const params: ParsedDeviceStatusQuery = {
        deviceModelId: device.value.deviceModelId,
        anchorTime: anchorTime.value || new Date().toISOString(),
        limit: limit.value
      }
      const res = await queryParsedDeviceStatus(params)
      console.log("查询设备数据结果:", res)
      dataList.value = res.data.items ?? []
      ElMessage.success(`查询完成`)
    } catch {
      ElMessage.error(`查询失败`)
      dataList.value = []
    } finally {
      loading.value = false
    }
  }

  const goNextPage = async () => {
    if (dataList.value.length === 0) return
    anchorTime.value = dataList.value[dataList.value.length - 1].time
    await fetchData()
    pageIndex.value++
  }

  const resetToFirstPage = async () => {
    console.log("重置到第一页")
    pageIndex.value = 1
    anchorTime.value = new Date().toISOString()
    await fetchData()
  }

  return {
    dataList,
    loading,
    pageIndex,
    isLastPage,
    fetchData,
    goNextPage,
    resetToFirstPage
  }
}
