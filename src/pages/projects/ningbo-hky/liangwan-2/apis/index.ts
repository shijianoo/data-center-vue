import type {
  DataRateItem,
  EntityId,
  MaintenancePeriod,
  ManualReviewStatus,
  MeasurementQueryRequest,
  MeasurementQueryResult,
  MeasurementSeriesResult,
  PageResult,
  ParameterCatalogGroup,
  ParameterDefinition,
  ReviewProgress,
  ReviewRuleBinding,
  ReviewRuleDefinition,
  SaveStation,
  Station,
  StationLatestMeasurements,
  StationParameterBinding,
  StationParameterGroup
} from "../types"
import axios from "axios"

/**
 * EcoCenter 可通过环境变量覆盖地址；生产环境默认使用同源 `/api/v1`，便于网关反向代理。
 * 开发环境保留接口文档给出的本地服务地址。
 */
const BASE_URL = import.meta.env.VITE_LIANGWAN_2_API_BASE_URL
  || (import.meta.env.DEV ? "http://127.0.0.1:5114/api/v1" : "/api/v1")

export const ecoClient = axios.create({ baseURL: BASE_URL, timeout: 30000 })

/**
 * 根据 API baseURL 生成 TCP Gateway 调试页面地址。
 * 例如 `http://host/api/v1` 会转换为 `http://host/tcp-gateway`。
 */
export function getTcpGatewayUrl() {
  const apiUrl = new URL(BASE_URL, window.location.origin)
  const rootPath = apiUrl.pathname.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "")
  apiUrl.pathname = `${rootPath}/tcp-gateway`
  apiUrl.search = ""
  apiUrl.hash = ""
  return apiUrl.toString()
}

/** 将后端 ProblemDetails 转换为可直接展示的错误消息。 */
export function getApiErrorMessage(error: unknown, fallback = "操作失败，请稍后重试") {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { detail?: string, title?: string } | undefined
    return data?.detail || data?.title || error.message || fallback
  }
  return error instanceof Error ? error.message : fallback
}

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

/** 获取站点当前所有参数的最新数据。 */
export function getStationLatestMeasurements(mn: string) {
  return ecoClient.get<StationLatestMeasurements>(`/stations/${encodeURIComponent(mn)}/measurements/latest`)
}

/** 查询时间对齐的表格数据。 */
export function queryMeasurements(data: MeasurementQueryRequest) {
  return ecoClient.post<MeasurementQueryResult>("/measurements/query", data)
}

/** 查询历史曲线紧凑序列。 */
export function queryMeasurementSeries(data: MeasurementQueryRequest) {
  return ecoClient.post<MeasurementSeriesResult>("/measurements/series", data)
}

/** 导出查询结果为 Excel 文件。 */
export function exportMeasurements(data: MeasurementQueryRequest & { fileName?: string }) {
  return ecoClient.post<Blob>("/exports", data, { responseType: "blob" })
}

/** 查询参数获取率与有效率。 */
export function getDataRates(params: {
  mn: string
  from: string
  to: string
  parameterCode?: string
  parameterKind?: string
  parameterGroupId?: EntityId
  validAutoReviewStatuses?: string[]
  /** 前端选项；后端支持该参数时跳过维护期，不支持时会忽略。 */
  excludeMaintenancePeriods?: boolean
}) {
  return ecoClient.get<DataRateItem[]>("/data-rates", { params, paramsSerializer: { indexes: null } })
}

/** 提交单点指定级别人工审核。 */
export function saveManualReview(pointId: EntityId, level: number, data: { status: ManualReviewStatus, reviewer: string, comment?: string }) {
  return ecoClient.put(`/measurement-points/${pointId}/reviews/${level}`, data)
}

/** 撤销指定级别及其更高级别审核。 */
export function deleteManualReview(pointId: EntityId, level: number, operatorName: string) {
  return ecoClient.delete(`/measurement-points/${pointId}/reviews/${level}`, { params: { operatorName } })
}

/** 修正测量点的有效值。 */
export function updateEffectiveValue(pointId: EntityId, effectiveValueText: string) {
  return ecoClient.put(`/measurement-points/${pointId}/effective-value`, { effectiveValueText })
}

/** 查询人工审核完成率。 */
export function getManualReviewProgress(params: {
  from: string
  to: string
  stationId?: EntityId
  parameterCode?: string
  parameterGroupId?: EntityId
  granularity?: "Day" | "Month"
  manualStatuses?: ManualReviewStatus[]
}) {
  return ecoClient.get<ReviewProgress>("/manual-reviews/progress", { params, paramsSerializer: { indexes: null } })
}

/** 查询参数目录分组。 */
export function getParameterCatalogGroups() {
  return ecoClient.get<ParameterCatalogGroup[]>("/parameter-catalog-groups")
}

/** 创建参数目录分组。 */
export function createParameterCatalogGroup(data: Omit<ParameterCatalogGroup, "id">) {
  return ecoClient.post<ParameterCatalogGroup>("/parameter-catalog-groups", data)
}

/** 更新参数目录分组。 */
export function updateParameterCatalogGroup(id: EntityId, data: Omit<ParameterCatalogGroup, "id">) {
  return ecoClient.put<ParameterCatalogGroup>(`/parameter-catalog-groups/${id}`, data)
}

/** 删除参数目录分组。 */
export function deleteParameterCatalogGroup(id: EntityId) {
  return ecoClient.delete(`/parameter-catalog-groups/${id}`)
}

/** 分页查询参数定义。 */
export function getParameterDefinitions(params: { keyword?: string, pageNumber?: number, pageSize?: number } = {}) {
  return ecoClient.get<PageResult<ParameterDefinition>>("/parameter-definitions", { params: { pageNumber: 1, pageSize: 200, ...params } })
}

/** 创建参数定义。 */
export function createParameterDefinition(data: Omit<ParameterDefinition, "id">) {
  return ecoClient.post<ParameterDefinition>("/parameter-definitions", data)
}

/** 更新参数定义。 */
export function updateParameterDefinition(id: EntityId, data: Omit<ParameterDefinition, "id">) {
  return ecoClient.put<ParameterDefinition>(`/parameter-definitions/${id}`, data)
}

/** 删除参数定义。 */
export function deleteParameterDefinition(id: EntityId) {
  return ecoClient.delete(`/parameter-definitions/${id}`)
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
export function updateStationParameterGroup(mn: string, id: EntityId, data: Omit<StationParameterGroup, "id">) {
  return ecoClient.put<StationParameterGroup>(`/stations/${encodeURIComponent(mn)}/parameter-groups/${id}`, data)
}

/** 删除站点参数组。 */
export function deleteStationParameterGroup(mn: string, id: EntityId) {
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

/** 更新站点参数绑定。 */
export function updateStationParameterBinding(mn: string, id: EntityId, data: Omit<StationParameterBinding, "id" | "parameterDefinition">) {
  return ecoClient.put<StationParameterBinding>(`/stations/${encodeURIComponent(mn)}/parameter-bindings/${id}`, data)
}

/** 删除站点参数绑定。 */
export function deleteStationParameterBinding(mn: string, id: EntityId) {
  return ecoClient.delete(`/stations/${encodeURIComponent(mn)}/parameter-bindings/${id}`)
}

/** 查询自动审核规则定义。 */
export function getReviewRules() {
  return ecoClient.get<ReviewRuleDefinition[]>("/review-rules")
}

/** 创建自动审核规则定义。 */
export function createReviewRule(data: Omit<ReviewRuleDefinition, "id">) {
  return ecoClient.post<ReviewRuleDefinition>("/review-rules", data)
}

/** 更新自动审核规则定义。 */
export function updateReviewRule(id: EntityId, data: Omit<ReviewRuleDefinition, "id">) {
  return ecoClient.put<ReviewRuleDefinition>(`/review-rules/${id}`, data)
}

/** 查询规则绑定。 */
export function getReviewRuleBindings(stationId?: EntityId) {
  return ecoClient.get<ReviewRuleBinding[]>("/review-rule-bindings", { params: { stationId } })
}

/** 创建规则绑定。 */
export function createReviewRuleBinding(data: Omit<ReviewRuleBinding, "id">) {
  return ecoClient.post<ReviewRuleBinding>("/review-rule-bindings", data)
}

/** 更新规则绑定。 */
export function updateReviewRuleBinding(id: EntityId, data: Omit<ReviewRuleBinding, "id">) {
  return ecoClient.put<ReviewRuleBinding>(`/review-rule-bindings/${id}`, data)
}

/** 删除规则绑定。 */
export function deleteReviewRuleBinding(id: EntityId) {
  return ecoClient.delete(`/review-rule-bindings/${id}`)
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
export function updateMaintenancePeriod(mn: string, id: EntityId, data: Omit<MaintenancePeriod, "id">) {
  return ecoClient.put<MaintenancePeriod>(`/stations/${encodeURIComponent(mn)}/maintenance-periods/${id}`, data)
}

/** 删除站点维护期。 */
export function deleteMaintenancePeriod(mn: string, id: EntityId) {
  return ecoClient.delete(`/stations/${encodeURIComponent(mn)}/maintenance-periods/${id}`)
}
