import type { ParameterDefinition, Station, StationParameterGroup } from "../types"
import { ElMessage } from "element-plus"
import { computed, ref } from "vue"
import { getApiErrorMessage, getParameterDefinitions, getStationLatestMeasurements, getStationParameterGroups, getStations } from "../apis"
import { getWholeDayRange } from "../utils"

/**
 * 获取站点参数组最新数据所在的完整一天。
 * 参数组没有任何数据时回退到今天，确保首次进入页面仍能自动发起查询。
 */
export async function getLatestGroupDayRange(mn: string, groupId: string) {
  const { data } = await getStationLatestMeasurements(mn)
  const timestamps = data.parameters
    .filter(item => item.parameter.groupId === groupId && item.point?.observedAt)
    .map(item => new Date(item.point!.observedAt).getTime())
    .filter(Number.isFinite)
  const latestTimestamp = timestamps.length ? Math.max(...timestamps) : Date.now()
  return getWholeDayRange(new Date(latestTimestamp))
}

/**
 * 复用站点、参数定义和站点参数组选择数据。
 * 页面只需调用 loadStations，并在站点变化时调用 loadStationGroups。
 */
export function useProjectOptions() {
  const stations = ref<Station[]>([])
  const parameterDefinitions = ref<ParameterDefinition[]>([])
  const stationGroups = ref<StationParameterGroup[]>([])
  const optionsLoading = ref(false)

  const stationById = computed(() => new Map(stations.value.map(item => [item.id, item])))
  const parameterById = computed(() => new Map(parameterDefinitions.value.map(item => [item.id, item])))
  const groupById = computed(() => new Map(stationGroups.value.map(item => [item.id, item])))

  /** 加载全量站点，接口上限为 200 条。 */
  async function loadStations() {
    optionsLoading.value = true
    try {
      const { data } = await getStations()
      stations.value = data.items ?? []
      return stations.value
    } catch (error) {
      ElMessage.error(getApiErrorMessage(error, "站点加载失败"))
      return []
    } finally {
      optionsLoading.value = false
    }
  }

  /** 加载全量参数定义，供规则、绑定和查询页面复用。 */
  async function loadParameterDefinitions() {
    try {
      const { data } = await getParameterDefinitions()
      parameterDefinitions.value = data.items ?? []
      return parameterDefinitions.value
    } catch (error) {
      ElMessage.error(getApiErrorMessage(error, "参数定义加载失败"))
      return []
    }
  }

  /** 根据站点 MN 加载其参数组。 */
  async function loadStationGroups(mn?: string) {
    if (!mn) {
      stationGroups.value = []
      return []
    }
    try {
      const { data } = await getStationParameterGroups(mn)
      stationGroups.value = data ?? []
      return stationGroups.value
    } catch (error) {
      stationGroups.value = []
      ElMessage.error(getApiErrorMessage(error, "参数组加载失败"))
      return []
    }
  }

  return {
    stations,
    parameterDefinitions,
    stationGroups,
    stationById,
    parameterById,
    groupById,
    optionsLoading,
    loadStations,
    loadParameterDefinitions,
    loadStationGroups
  }
}
