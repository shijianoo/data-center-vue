import type { PageListQueryParams } from "@/common/apis/data-query/type"
import type { Device } from "@/common/apis/devices/type"
import { querDeviceDataPageList } from "@/common/apis/data-query"

/**
 * 设备实时数据分页查询。
 *
 * 请求版本号保证筛选条件快速变更时，后返回的旧请求不会污染当前表格。
 */
export function useDeviceDataPagination(selectedDevice: Ref<Device | undefined>) {
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
      const params: PageListQueryParams = {
        model: device.modelNumber!,
        sn: device.serialNumber,
        ch: uploadChannel.value,
        page: pageIndex.value,
        size: pageSize.value
      }
      const { data } = await querDeviceDataPageList(params, { silent: true })
      if (requestId !== requestRevision) return
      total.value = data.total
      dataList.value = data.items
    } catch (error) {
      if (requestId !== requestRevision) return
      dataList.value = []
      total.value = 0
      console.error("设备数据查询失败", error)
      ElMessage.error("查询失败")
    } finally {
      if (requestId === requestRevision) loading.value = false
    }
  }

  /** 回到第一页；若页码未变则直接执行一次刷新。 */
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
