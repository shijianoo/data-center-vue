import type { EntityId } from "../common/type"
import type { CreateDataRateExportRequest, DataRateRequest, DataRateResult, DeleteMeasurementPointsRequest, DeleteMeasurementPointsResult, LatestMeasurementResult, MeasurementCorrectionRequest, MeasurementSeriesResult, MeasurementTableQuery, MeasurementTableResult, QualityControlDataQuery, QualityControlDataRecord, StationTrajectoryResult } from "./type"
import { ecoClient } from "../client"

/** 查询时间对齐的表格数据。 */
export function queryMeasurements(data: MeasurementTableQuery) {
  return ecoClient.post<MeasurementTableResult>("/measurements/query", data)
}

/** 查询单个测量数据点的自动审核结果。 */
export function queryMeasurementAutoReviewResult(dataId: EntityId) {
  return ecoClient.get<any[]>(`/measurement-points/${dataId}/auto-review/result`)
}

/** 修正测量点的有效值。 */
export function updateEffectiveValue(pointId: EntityId, data: MeasurementCorrectionRequest) {
  return ecoClient.put(`/measurement-points/${pointId}/effective-value`, data)
}

/** 查询历史曲线紧凑序列。 */
export function queryMeasurementSeries(data: MeasurementTableQuery) {
  return ecoClient.post<MeasurementSeriesResult>("/measurements/series", data)
}

/** 导出查询结果为 Excel 文件。 */
export function exportMeasurements(data: MeasurementTableQuery & { fileName?: string }) {
  return ecoClient.post<Blob>("/exports/measurements", data, { responseType: "blob" })
}

/** 获取站点当前所有参数的最新数据。 */
export function getStationLatestMeasurements(stationId: number) {
  return ecoClient.get<LatestMeasurementResult>(`/stations/${encodeURIComponent(stationId)}/measurements/latest`)
}

/** 查询参数获取率与有效率。 */
export function getDataRates(data: DataRateRequest) {
  return ecoClient.post<DataRateResult[]>("/data-rates", data)
}

/** 导出数据获取率和有效率统计 Excel 文件。 */
export function exportDataRates(data: CreateDataRateExportRequest) {
  return ecoClient.post<Blob>("/exports/data-rates", data, { responseType: "blob" })
}

/** 查询站点轨迹 */
export function getStationTrajectory(stationId: number, data: { from: string, to: string }) {
  return ecoClient.post<StationTrajectoryResult>(`/stations/${encodeURIComponent(stationId)}/trajectory`, data)
}

/** 批量删除数据点 */
export function deleteMeasurementPoints(data: DeleteMeasurementPointsRequest, options?: { headers?: Record<string, string> }) {
  return ecoClient.post<DeleteMeasurementPointsResult>("/measurement-points/delete", data, options)
}

/** 按站点和业务时间范围返回全部质控数据 */
export function queryQualityControlData(data: QualityControlDataQuery) {
  return ecoClient.post<QualityControlDataRecord[]>("/quality-control-data/query", data)
}
