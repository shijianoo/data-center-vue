import type { HistoryPoint, LatestTelemetryDataQuery, TelemetryData } from "./type"
import { dataCenterRequest } from "@/http/axios"

/* 批量获取设备最新数据 */
export function getLatestTelemetryDataBatch<T>(data: LatestTelemetryDataQuery) {
  return dataCenterRequest<ApiResponseData<TelemetryData<T>[]>>({
    url: "/telemetry/latest/batch",
    method: "POST",
    data
  })
}

/** 获取设备最新数据 */
export function getLatestTelemetryData<T>(modelNumber: string, serialNumber: string) {
  return dataCenterRequest<ApiResponseData<TelemetryData<T>>>({
    url: `/telemetry/latest/${modelNumber}/${serialNumber}`,
    method: "GET"
  })
}

/** 获取设备历史数据 */
export function getHistoryTelemetryData(modelNumber: string, serialNumber: string, field: string, hours: number) {
  return dataCenterRequest<ApiResponseData<HistoryPoint[]>>({
    url: `/telemetry/history/${modelNumber}/${serialNumber}`,
    method: "GET",
    params: {
      field,
      hours
    }
  })
}

/** 获取设备指定时间范围内的历史数据 */
export function getHistoryTelemetryDataByTimeRange(modelNumber: string, serialNumber: string, field: string, start: string, end: string) {
  return dataCenterRequest<ApiResponseData<HistoryPoint[]>>({
    url: `/telemetry/history/${modelNumber}/${serialNumber}`,
    method: "GET",
    params: {
      field,
      start,
      end
    }
  })
}
