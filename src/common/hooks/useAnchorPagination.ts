import type { DeviceDataQueryParams } from "@/common/apis/data-query/type"
import type { Device } from "@/common/apis/devices/type"
import { querDeviceData } from "../apis/data-query"

export function useAnchorPagination(selectedDevice: Ref<Device | undefined>) {
  const dataList = ref<any[]>([])
  const anchorTime = ref<string | undefined>(undefined)
  const uploadChannel = ref(0)
  const limit = ref(50)
  const loading = ref(false)
  const pageIndex = ref(1)
  const isLastPage = ref(false)
  let requestRevision = 0

  const fetchData = async () => {
    const device = selectedDevice.value
    const requestId = ++requestRevision
    if (!device) {
      dataList.value = []
      isLastPage.value = false
      loading.value = false
      return false
    }
    loading.value = true
    try {
      const params: DeviceDataQueryParams = {
        anchorTime: anchorTime.value,
        modelNumber: device.modelNumber!,
        serialNumber: device.serialNumber,
        uploadChannel: uploadChannel.value === 0 ? "" : uploadChannel.value.toString(),
        limit: limit.value
      }
      const res = await querDeviceData(params, { silent: true })
      if (requestId !== requestRevision) return false
      const list = res.data.items ?? []
      dataList.value = list
      isLastPage.value = list.length < limit.value
      return true
    } catch (error) {
      if (requestId !== requestRevision) return false
      console.error("设备锚点数据查询失败", error)
      ElMessage.error("查询失败")
      return false
    } finally {
      if (requestId === requestRevision) loading.value = false
    }
  }

  const goNextPage = async () => {
    if (dataList.value.length === 0) return
    const previousAnchor = anchorTime.value
    anchorTime.value = dataList.value[dataList.value.length - 1].time
    const succeeded = await fetchData()
    if (succeeded) pageIndex.value++
    else anchorTime.value = previousAnchor
  }

  const resetToFirstPage = async () => {
    pageIndex.value = 1
    anchorTime.value = undefined
    await fetchData()
  }

  watch([selectedDevice, uploadChannel, limit], () => void resetToFirstPage(), { immediate: true })

  return {
    dataList,
    isLastPage,
    loading,
    pageIndex,
    limit,
    uploadChannel,
    fetchData,
    goNextPage,
    resetToFirstPage
  }
}
