import type { Device } from "../apis/devices/type"
import type { ParsedDeviceDataQuery } from "@/common/apis/device-data/type"
import { queryParsedDeviceData } from "@/common/apis/device-data"

export function useAnchorPagination(modelId: string, selectedDevice: Ref<Device | undefined>) {
  const dataList = ref<any[]>([])
  const anchorTime = ref("")
  const limit = ref(50)
  const loading = ref(false)
  const pageIndex = ref(1)
  const isLastPage = ref(false)

  const fetchData = async () => {
    if (!selectedDevice.value) {
      console.warn("未选择设备，无法查询数据")
      return
    }
    console.log("开始查询设备数据，设备编号:", selectedDevice.value.serialNumber, "锚点时间:", anchorTime.value, "限制:", limit.value)
    loading.value = true
    try {
      const params: ParsedDeviceDataQuery = {
        deviceModelId: modelId,
        serialNumber: selectedDevice.value.serialNumber,
        anchorTime: anchorTime.value || new Date().toISOString(),
        reverse: true,
        limit: limit.value
      }
      const res = await queryParsedDeviceData(params)
      console.log("查询设备数据结果:", res)
      const list = res.data.items ?? []
      dataList.value = list
      isLastPage.value = list.length < limit.value
      ElMessage.success(`查询完成`)
    } catch {
      ElMessage.success(`查询失败`)
      dataList.value = []
      isLastPage.value = true
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

  watch(selectedDevice, (sd) => {
    if (sd) resetToFirstPage()
  }, { immediate: true })

  return {
    dataList,
    isLastPage,
    loading,
    pageIndex,
    fetchData,
    goNextPage,
    resetToFirstPage
  }
}
