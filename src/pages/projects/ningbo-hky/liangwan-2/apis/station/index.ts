import type { PageResult } from "../common/type"
import type {
  BatchStationParameterBindings,
  IngestionMessageModel,
  MaintenancePeriod,
  SaveStationCommand,
  Station,
  StationMapItem,
  StationParameterBinding,
  StationParameterGroup,
  StationParameterGroupAutoReviewResult
} from "./type"
import { ecoClient } from "../client"

/** 分页查询站点。 */
export function getStations(params: { keyword?: string, groupName?: string, status?: string, pageNumber?: number, pageSize?: number } = {}) {
  return ecoClient.get<PageResult<Station>>("/stations", { params: { pageNumber: 1, pageSize: 200, ...params } })
}

/** 获取一个站点。 */
export function getStation(stationId: number) {
  return ecoClient.get<Station>(`/stations/${encodeURIComponent(stationId)}`)
}

/** 创建站点。 */
export function createStation(data: SaveStationCommand) {
  return ecoClient.post<Station>("/stations", data)
}

/** 更新站点。 */
export function updateStation(stationId: number, data: SaveStationCommand) {
  return ecoClient.put<Station>(`/stations/${encodeURIComponent(stationId)}`, data)
}

/** 删除站点。 */
export function deleteStation(stationId: number) {
  return ecoClient.delete(`/stations/${encodeURIComponent(stationId)}`)
}

/** 查询站点参数组。 */
export function getStationParameterGroups(stationId: number) {
  return ecoClient.get<StationParameterGroup[]>(`/stations/${encodeURIComponent(stationId)}/parameter-groups`)
}

/** 创建站点参数组。 */
export function createStationParameterGroup(stationId: number, data: Omit<StationParameterGroup, "id">) {
  return ecoClient.post<StationParameterGroup>(`/stations/${encodeURIComponent(stationId)}/parameter-groups`, data)
}

/** 更新站点参数组。 */
export function updateStationParameterGroup(stationId: number, id: number, data: Omit<StationParameterGroup, "id">) {
  return ecoClient.put<StationParameterGroup>(`/stations/${encodeURIComponent(stationId)}/parameter-groups/${id}`, data)
}

/** 删除站点参数组。 */
export function deleteStationParameterGroup(stationId: number, id: number) {
  return ecoClient.delete(`/stations/${encodeURIComponent(stationId)}/parameter-groups/${id}`)
}

/** 统一切换参数组下全部参数的自动审核开关 */
export function setParameterGroupAutoReviewEnabled(stationId: number, id: number, isAutoReviewEnabled: boolean) {
  return ecoClient.post<StationParameterGroupAutoReviewResult>(`/stations/${encodeURIComponent(stationId)}/parameter-groups/${id}/auto-review-enabled`, { isAutoReviewEnabled })
}

/** 查询站点参数绑定。 */
export function getStationParameterBindings(stationId: number) {
  return ecoClient.get<StationParameterBinding[]>(`/stations/${encodeURIComponent(stationId)}/parameter-bindings`)
}

/** 创建站点参数绑定。 */
export function createStationParameterBinding(stationId: number, data: Omit<StationParameterBinding, "id" | "parameterDefinition">) {
  return ecoClient.post<StationParameterBinding>(`/stations/${encodeURIComponent(stationId)}/parameter-bindings`, data)
}

/** 更新站点参数绑定。 */
export function updateStationParameterBinding(stationId: number, id: number, data: Omit<StationParameterBinding, "id" | "parameterDefinition">) {
  return ecoClient.put<StationParameterBinding>(`/stations/${encodeURIComponent(stationId)}/parameter-bindings/${id}`, data)
}

/** 设置站点参数自动审核 */
export function setAutoReviewEnabled(stationId: number, id: number, isAutoReviewEnabled: boolean) {
  return ecoClient.post<StationParameterBinding>(`/stations/${encodeURIComponent(stationId)}/parameter-bindings/${id}/auto-review-enabled`, { isAutoReviewEnabled })
}

/** 批量创建站点参数绑定。 */
export function batchCreateStationParameterBindings(stationId: number, data: BatchStationParameterBindings) {
  return ecoClient.post<StationParameterBinding>(`/stations/${encodeURIComponent(stationId)}/parameter-bindings/batch`, data)
}

/** 删除站点参数绑定。 */
export function deleteStationParameterBinding(stationId: number, id: number) {
  return ecoClient.delete(`/stations/${encodeURIComponent(stationId)}/parameter-bindings/${id}`)
}

/** 查询站点维护期。 */
export function getMaintenancePeriods(stationId: number) {
  return ecoClient.get<MaintenancePeriod[]>(`/stations/${encodeURIComponent(stationId)}/maintenance-periods`)
}

/** 创建站点维护期。 */
export function createMaintenancePeriod(stationId: number, data: Omit<MaintenancePeriod, "id">) {
  return ecoClient.post<MaintenancePeriod>(`/stations/${encodeURIComponent(stationId)}/maintenance-periods`, data)
}

/** 更新站点维护期。 */
export function updateMaintenancePeriod(stationId: number, id: number, data: Omit<MaintenancePeriod, "id">) {
  return ecoClient.put<MaintenancePeriod>(`/stations/${encodeURIComponent(stationId)}/maintenance-periods/${id}`, data)
}

/** 删除站点维护期。 */
export function deleteMaintenancePeriod(stationId: number, id: number) {
  return ecoClient.delete(`/stations/${encodeURIComponent(stationId)}/maintenance-periods/${id}`)
}

/** 全部站点档案 */
export function getStationMap() {
  return ecoClient.get<StationMapItem[]>("/stations/map")
}

/** 按接收时间倒序分页查询指定站点的完整原始报文 */
export function getIngestionMessages(stationId: number, pageNumber: number, pageSize: number) {
  return ecoClient.get<PageResult<IngestionMessageModel>>(`/stations/${encodeURIComponent(stationId)}/ingestion-messages?pageNumber=${pageNumber}&pageSize=${pageSize}`)
}
