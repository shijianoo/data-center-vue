import type { Device } from "../apis/devices/type"
import type { PagedQueryRequest } from "@/common/apis/data-query/type"
import { pagedDataQuery } from "@/common/apis/data-query"

export function useHistoryDataQuery(selectedDevice: Ref<Device | undefined>, version: number, dataType: number) {
  const loading = ref(false)
  const uploadChannel = ref(0)
  const pageIndex = ref(1)
  const pageSize = ref(20)
  const dataList = ref<any[]>([])
  const total = ref(0)

  async function fetchDeviceDataPage() {
    if (!selectedDevice.value) {
      ElMessage.warning("选择需要查询的设备")
      console.warn("未选择设备，无法查询数据")
      return
    }

    try {
      const params: PagedQueryRequest = {
        model: selectedDevice.value.modelNumber!,
        version,
        dataType,
        serialNumber: selectedDevice.value.serialNumber,
        uploadChannel: uploadChannel.value,
        page: pageIndex.value,
        size: pageSize.value
      }
      loading.value = true
      const { data } = await pagedDataQuery(params)
      total.value = data.totalCount
      dataList.value = data.records
      ElMessage.success("查询完成")
    } catch (error) {
      dataList.value = []
      total.value = 0
      console.log(error)
      ElMessage.error("查询失败")
    } finally {
      loading.value = false
    }
  }

  function fetchFirstPageData() {
    pageIndex.value = 1
    fetchDeviceDataPage()
  }

  watch([selectedDevice, uploadChannel], ([sd, uc]) => {
    if (sd || uc) {
      fetchFirstPageData()
    }
  }, { immediate: true })

  watch(pageIndex, (newIndex, oldIndex) => {
    if (newIndex !== oldIndex) {
      console.log("页码变化，查询当前页")
      fetchDeviceDataPage()
    }
  })

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
