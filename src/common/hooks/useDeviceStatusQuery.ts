import type { InfluxAnchorQueryParams } from "@/common/apis/data-query/type"
import type { Device } from "@/common/apis/devices/type"
import { influxAnchorDataQueryApi } from "../apis/data-query"

export function useDeviceStatusQuery(bucket: string, measurement: string, device: Ref<Device | undefined>) {
  const dataList = ref<any[]>([])
  const anchorTime = ref<string | undefined>(undefined)
  const limit = ref(50)
  const loading = ref(false)
  const pageIndex = ref(1)
  const isLastPage = computed(() => dataList.value.length < limit.value)
  let requestRevision = 0

  const fetchData = async () => {
    const selected = device.value
    const requestId = ++requestRevision
    if (!selected) {
      dataList.value = []
      loading.value = false
      return false
    }
    loading.value = true

    try {
      const params: InfluxAnchorQueryParams = {
        bucket,
        measurement,
        serialNumber: selected.serialNumber,
        anchorTime: anchorTime.value || new Date().toISOString(),
        limit: limit.value
      }
      const { data } = await influxAnchorDataQueryApi(params, { silent: true })
      if (requestId !== requestRevision) return false
      dataList.value = data ?? []
      return true
    } catch (error) {
      if (requestId !== requestRevision) return false
      console.error("设备状态查询失败", error)
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

  watch([device, limit], () => void resetToFirstPage(), { immediate: true })

  return {
    dataList,
    loading,
    pageIndex,
    limit,
    isLastPage,
    fetchData,
    goNextPage,
    resetToFirstPage
  }
}
