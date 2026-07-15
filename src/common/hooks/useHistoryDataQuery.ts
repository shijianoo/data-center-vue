import type { Device } from "../apis/devices/type"
import type { PagedQueryRequest } from "@/common/apis/data-query/type"
import { pagedDataQuery } from "@/common/apis/data-query"

/**
 * 历史数据分页查询。
 *
 * 分页、设备、通道和页大小的变化统一由 watcher 驱动；每个请求均有递增版本号，
 * 因此用户快速切换筛选条件时，较慢的旧响应不会覆盖最新查询结果。
 */
export function useHistoryDataQuery(selectedDevice: Ref<Device | undefined>, version: number, dataType: number) {
  const loading = ref(false)
  const uploadChannel = ref(0)
  const pageIndex = ref(1)
  const pageSize = ref(20)
  const dataList = ref<any[]>([])
  const total = ref(0)
  let requestRevision = 0

  async function fetchDeviceDataPage() {
    const device = selectedDevice.value
    const requestId = ++requestRevision
    if (!device) {
      dataList.value = []
      total.value = 0
      loading.value = false
      return
    }

    loading.value = true
    try {
      const params: PagedQueryRequest = {
        model: device.modelNumber!,
        version,
        dataType,
        serialNumber: device.serialNumber,
        uploadChannel: uploadChannel.value,
        page: pageIndex.value,
        size: pageSize.value
      }
      const { data } = await pagedDataQuery(params, { silent: true })
      if (requestId !== requestRevision) return
      total.value = data.totalCount
      dataList.value = data.records
    } catch (error) {
      if (requestId !== requestRevision) return
      dataList.value = []
      total.value = 0
      console.error("历史数据查询失败", error)
      ElMessage.error("查询失败")
    } finally {
      if (requestId === requestRevision) loading.value = false
    }
  }

  /** 回到第一页；若本来已在第一页则立即刷新，避免两次请求。 */
  function fetchFirstPageData() {
    if (pageIndex.value === 1) {
      void fetchDeviceDataPage()
      return
    }
    pageIndex.value = 1
  }

  watch([selectedDevice, uploadChannel, pageSize], fetchFirstPageData, { immediate: true })
  watch(pageIndex, () => void fetchDeviceDataPage())

  return {
    dataList,
    loading,
    uploadChannel,
    pageIndex,
    pageSize,
    total,
    fetchFirstPageData
  }
}
