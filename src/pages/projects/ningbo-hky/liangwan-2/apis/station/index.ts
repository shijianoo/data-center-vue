import type { PageResult } from "../common/type"
import type {
  BatchStationParameterBindings,
  IngestionMessageModel,
  MaintenancePeriod,
  SaveStation,
  Station,
  StationMapItem,
  StationParameterBinding,
  StationParameterGroup
} from "./type"
import { ecoClient } from "../client"

/** 分页查询站点。 */
export function getStations(params: { keyword?: string, groupName?: string, status?: string, pageNumber?: number, pageSize?: number } = {}) {
  return ecoClient.get<PageResult<Station>>("/stations", { params: { pageNumber: 1, pageSize: 200, ...params } })
}

/** 获取一个站点。 */
export function getStation(mn: string) {
  return ecoClient.get<Station>(`/stations/${encodeURIComponent(mn)}`)
}

/** 创建站点。 */
export function createStation(data: SaveStation) {
  return ecoClient.post<Station>("/stations", data)
}

/** 更新站点。 */
export function updateStation(mn: string, data: SaveStation) {
  return ecoClient.put<Station>(`/stations/${encodeURIComponent(mn)}`, data)
}

/** 删除站点。 */
export function deleteStation(mn: string) {
  return ecoClient.delete(`/stations/${encodeURIComponent(mn)}`)
}

/** 查询站点参数组。 */
export function getStationParameterGroups(mn: string) {
  return ecoClient.get<StationParameterGroup[]>(`/stations/${encodeURIComponent(mn)}/parameter-groups`)
}

/** 创建站点参数组。 */
export function createStationParameterGroup(mn: string, data: Omit<StationParameterGroup, "id">) {
  return ecoClient.post<StationParameterGroup>(`/stations/${encodeURIComponent(mn)}/parameter-groups`, data)
}

/** 更新站点参数组。 */
export function updateStationParameterGroup(mn: string, id: number, data: Omit<StationParameterGroup, "id">) {
  return ecoClient.put<StationParameterGroup>(`/stations/${encodeURIComponent(mn)}/parameter-groups/${id}`, data)
}

/** 删除站点参数组。 */
export function deleteStationParameterGroup(mn: string, id: number) {
  return ecoClient.delete(`/stations/${encodeURIComponent(mn)}/parameter-groups/${id}`)
}

/** 查询站点参数绑定。 */
export function getStationParameterBindings(mn: string) {
  return ecoClient.get<StationParameterBinding[]>(`/stations/${encodeURIComponent(mn)}/parameter-bindings`)
}

/** 创建站点参数绑定。 */
export function createStationParameterBinding(mn: string, data: Omit<StationParameterBinding, "id" | "parameterDefinition">) {
  return ecoClient.post<StationParameterBinding>(`/stations/${encodeURIComponent(mn)}/parameter-bindings`, data)
}

/** 批量创建站点参数绑定。 */
export function batchCreateStationParameterBindings(mn: string, data: BatchStationParameterBindings) {
  return ecoClient.post<StationParameterBinding>(`/stations/${encodeURIComponent(mn)}/parameter-bindings/batch`, data)
}

/** 更新站点参数绑定。 */
export function updateStationParameterBinding(mn: string, id: number, data: Omit<StationParameterBinding, "id" | "parameterDefinition">) {
  return ecoClient.put<StationParameterBinding>(`/stations/${encodeURIComponent(mn)}/parameter-bindings/${id}`, data)
}

/** 设置站点参数自动审核 */
export function setAutoReviewEnabled(mn: string, id: number, isAutoReviewEnabled: boolean) {
  return ecoClient.post<StationParameterBinding>(`/stations/${encodeURIComponent(mn)}/parameter-bindings/${id}/auto-review-enabled`, { isAutoReviewEnabled })
}

/** 删除站点参数绑定。 */
export function deleteStationParameterBinding(mn: string, id: number) {
  return ecoClient.delete(`/stations/${encodeURIComponent(mn)}/parameter-bindings/${id}`)
}

/** 查询站点维护期。 */
export function getMaintenancePeriods(mn: string) {
  return ecoClient.get<MaintenancePeriod[]>(`/stations/${encodeURIComponent(mn)}/maintenance-periods`)
}

/** 创建站点维护期。 */
export function createMaintenancePeriod(mn: string, data: Omit<MaintenancePeriod, "id">) {
  return ecoClient.post<MaintenancePeriod>(`/stations/${encodeURIComponent(mn)}/maintenance-periods`, data)
}

/** 更新站点维护期。 */
export function updateMaintenancePeriod(mn: string, id: number, data: Omit<MaintenancePeriod, "id">) {
  return ecoClient.put<MaintenancePeriod>(`/stations/${encodeURIComponent(mn)}/maintenance-periods/${id}`, data)
}

/** 删除站点维护期。 */
export function deleteMaintenancePeriod(mn: string, id: number) {
  return ecoClient.delete(`/stations/${encodeURIComponent(mn)}/maintenance-periods/${id}`)
}

/** 全部站点档案 */
export function getStationMap() {
  return ecoClient.get<StationMapItem[]>("/stations/map")
}

/** 按接收时间倒序分页查询指定站点的完整原始报文 */
export function getIngestionMessages(id: number, pageNumber: number, pageSize: number) {
  return ecoClient.get<PageResult<IngestionMessageModel>>(`/stations/${encodeURIComponent(id)}/ingestion-messages?pageNumber=${pageNumber}&pageSize=${pageSize}`)
}
