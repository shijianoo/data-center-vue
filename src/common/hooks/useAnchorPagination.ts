import type { DeviceModel } from "../apis/device-models/type"
import type { DeviceDataQueryParams } from "@/common/apis/data-query/type"
import type { Device } from "@/common/apis/devices/type"
import { querDeviceData } from "../apis/data-query"

export function useAnchorPagination(deviceModel: Ref<DeviceModel | undefined>, selectedDevice: Ref<Device | undefined>) {
  const dataList = ref<any[]>([])
  const anchorTime = ref<string | undefined>(undefined)
  const limit = ref(50)
  const loading = ref(false)
  const pageIndex = ref(1)
  const isLastPage = ref(false)

  const fetchData = async () => {
    if (!deviceModel.value) {
      console.warn("无法确定设备型号，无法查询数据")
      return
    }
    if (!selectedDevice.value) {
      console.warn("未选择设备，无法查询数据")
      return
    }
    console.log("开始查询设备数据，设备编号:", selectedDevice.value.serialNumber, "锚点时间:", anchorTime.value, "限制:", limit.value)
    loading.value = true
    try {
      const params: DeviceDataQueryParams = {
        anchorTime: anchorTime.value,
        modelNumber: deviceModel.value.modelNumber,
        serialNumber: selectedDevice.value.serialNumber,
        limit: limit.value
      }
      const res = await querDeviceData(params)
      console.log("查询设备数据结果:", res)
      const list = res.data.items ?? []
      dataList.value = list
      isLastPage.value = list.length < limit.value
      ElMessage.success("查询完成")
    } catch (error) {
      console.log(error)
      ElMessage.error("查询失败")
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
    anchorTime.value = undefined
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
