import type { TelemetryData, TelemetryDataQuery } from "./type"
import { dataCenterRequest } from "@/http/axios"

/* 批量获取设备最新数据 */
export function getLatestTelemetryDataBatch(data: TelemetryDataQuery, serialNumbers: string[]) {
  return dataCenterRequest<ApiResponseData<TelemetryData[]>>({
    url: "/telemetry/latest/batch",
    method: "POST",
    params: {
      ...data
    },
    data: serialNumbers
  })
}

/** 获取设备最新数据 */
export function getLatestTelemetryData(data: TelemetryDataQuery, serialNumber: string) {
  return dataCenterRequest<ApiResponseData<TelemetryData>>({
    url: "/telemetry/latest",
    method: "GET",
    params: {
      ...data,
      serialNumber
    }
  })
}

// /** 获取设备历史数据 */
// export function getHistoryTelemetryData(modelNumber: string, serialNumber: string, field: string, hours: number) {
//   return dataCenterRequest<ApiResponseData<HistoryPoint[]>>({
//     url: `/telemetry/history/${modelNumber}/${serialNumber}`,
//     method: "GET",
//     params: {
//       field,
//       hours
//     }
//   })
// }

// /** 获取设备指定时间范围内的历史数据 */
// export function getHistoryTelemetryDataByTimeRange(modelNumber: string, serialNumber: string, field: string, start: string, end: string) {
//   return dataCenterRequest<ApiResponseData<HistoryPoint[]>>({
//     url: `/telemetry/history/${modelNumber}/${serialNumber}`,
//     method: "GET",
//     params: {
//       field,
//       start,
//       end
//     }
//   })
// }
