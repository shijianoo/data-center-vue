import type {
  DataRate,
  MeasurementResult,
  PageResult,
  ParameterCatalogGroup,
  ParameterDefinition,
  ParameterGroup,
  ReviewRule,
  ReviewRuleBinding,
  Station,
  StationLatest,
  StationParameterBinding
} from "./type"
import axios from "axios"

// 梁湾服务独立部署时只在此处维护地址；不使用全局 request 或任何拦截器。
const developmentBaseURL = " http://127.0.0.1:7000/api/v1"
const productionBaseURL = import.meta.env.VITE_LIANGWAN_PROD_BASE_URL || "/api/v1"
const baseURL = import.meta.env.DEV ? developmentBaseURL : productionBaseURL

const client = axios.create({
  baseURL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" }
})

export async function getStations(params: Record<string, unknown> = {}) {
  return (await client.get<PageResult<Station>>("/stations", { params })).data
}

export async function createStation(data: Omit<Station, "id">) {
  return (await client.post<Station>("/stations", data)).data
}

export async function updateStation(mn: string, data: Partial<Station>) {
  return (await client.put<Station>(`/stations/${encodeURIComponent(mn)}`, data)).data
}

export async function deleteStation(mn: string) {
  return client.delete(`/stations/${encodeURIComponent(mn)}`)
}

export async function getStationLatest(mn: string) {
  return (await client.get<StationLatest>(`/stations/${encodeURIComponent(mn)}/measurements/latest`)).data
}

export async function getCatalogGroups() {
  return (await client.get<ParameterCatalogGroup[]>("/parameter-catalog-groups")).data
}

export async function createCatalogGroup(data: Partial<ParameterCatalogGroup>) {
  return (await client.post<ParameterCatalogGroup>("/parameter-catalog-groups", data)).data
}

export async function updateCatalogGroup(id: string, data: Partial<ParameterCatalogGroup>) {
  return (await client.put<ParameterCatalogGroup>(`/parameter-catalog-groups/${id}`, data)).data
}

export async function deleteCatalogGroup(id: string) {
  return client.delete(`/parameter-catalog-groups/${id}`)
}

export async function getParameterDefinitions(params: Record<string, unknown> = {}) {
  return (await client.get<PageResult<ParameterDefinition>>("/parameter-definitions", { params })).data
}

export async function createParameterDefinition(data: Partial<ParameterDefinition>) {
  return (await client.post<ParameterDefinition>("/parameter-definitions", data)).data
}

export async function updateParameterDefinition(id: string, data: Partial<ParameterDefinition>) {
  return (await client.put<ParameterDefinition>(`/parameter-definitions/${id}`, data)).data
}

export async function deleteParameterDefinition(id: string) {
  return client.delete(`/parameter-definitions/${id}`)
}

export async function getStationGroups(mn: string) {
  return (await client.get<ParameterGroup[]>(`/stations/${encodeURIComponent(mn)}/parameter-groups`)).data
}

export async function createStationGroup(mn: string, data: Partial<ParameterGroup>) {
  return (await client.post<ParameterGroup>(`/stations/${encodeURIComponent(mn)}/parameter-groups`, data)).data
}

export async function updateStationGroup(mn: string, id: string, data: Partial<ParameterGroup>) {
  return (await client.put<ParameterGroup>(`/stations/${encodeURIComponent(mn)}/parameter-groups/${id}`, data)).data
}

export async function deleteStationGroup(mn: string, id: string) {
  return client.delete(`/stations/${encodeURIComponent(mn)}/parameter-groups/${id}`)
}

export async function getStationBindings(mn: string) {
  return (await client.get<StationParameterBinding[]>(`/stations/${encodeURIComponent(mn)}/parameter-bindings`)).data
}

export async function createStationBinding(mn: string, data: Partial<StationParameterBinding>) {
  return (await client.post<StationParameterBinding>(`/stations/${encodeURIComponent(mn)}/parameter-bindings`, data)).data
}

export async function updateStationBinding(mn: string, id: string, data: Partial<StationParameterBinding>) {
  return (await client.put<StationParameterBinding>(`/stations/${encodeURIComponent(mn)}/parameter-bindings/${id}`, data)).data
}

export async function deleteStationBinding(mn: string, id: string) {
  return client.delete(`/stations/${encodeURIComponent(mn)}/parameter-bindings/${id}`)
}

export async function getReviewRules() {
  return (await client.get<ReviewRule[]>("/review-rules")).data
}

export async function createReviewRule(data: Partial<ReviewRule>) {
  return (await client.post<ReviewRule>("/review-rules", data)).data
}

export async function updateReviewRule(id: string, data: Partial<ReviewRule>) {
  return (await client.put<ReviewRule>(`/review-rules/${id}`, data)).data
}

export async function getReviewRuleBindings(stationId?: string) {
  return (await client.get<ReviewRuleBinding[]>("/review-rule-bindings", { params: { stationId } })).data
}

export async function createReviewRuleBinding(data: Partial<ReviewRuleBinding>) {
  return (await client.post<ReviewRuleBinding>("/review-rule-bindings", data)).data
}

export async function updateReviewRuleBinding(id: string, data: Partial<ReviewRuleBinding>) {
  return (await client.put<ReviewRuleBinding>(`/review-rule-bindings/${id}`, data)).data
}

export async function deleteReviewRuleBinding(id: string) {
  return client.delete(`/review-rule-bindings/${id}`)
}

export async function queryMeasurements(data: Record<string, unknown>) {
  return (await client.post<MeasurementResult>("/measurements/query", data)).data
}

export async function querySeries(data: Record<string, unknown>) {
  return (await client.post("/measurements/series", data)).data
}

export async function getDataRates(params: Record<string, unknown>) {
  return (await client.get<DataRate[]>("/data-rates", { params })).data
}

export async function reviewPoint(pointId: string, level: number, data: Record<string, string>) {
  return client.put(`/measurement-points/${pointId}/reviews/${level}`, data)
}

export async function reviseEffectiveValue(pointId: string, effectiveValueText: string) {
  return client.put(`/measurement-points/${pointId}/effective-value`, { effectiveValueText })
}

export async function exportMeasurements(data: Record<string, unknown>) {
  return client.post("/exports", data, { responseType: "blob" })
}
