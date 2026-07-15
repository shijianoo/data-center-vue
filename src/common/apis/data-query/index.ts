import type { QueryResult } from "../type"
import type { BeidouData, BeidouRawQueryParams, DeviceDataQueryParams, DeviceFieldDataQueryParams, DeviceStatusQueryParams, HistoryField, InfluxAnchorQueryParams, InfluxBatchLatestQueryParams, InfluxFieldQueryParams, InfluxLatestQueryParams, IridiumData, IridiumRawQueryParams, PagedQueryRequest, PagedQueryResult, PagedResultResponse, PageListQueryParams } from "./type"
import type { AppRequestConfig } from "@/http/axios"
import { dataCenterRequest } from "@/http/axios"

/** 查询设备数据 */
export function querDeviceData<T>(params: DeviceDataQueryParams, options: Pick<AppRequestConfig, "silent"> = {}) {
  return dataCenterRequest<ApiResponseData<QueryResult<T>>>({
    url: "query/device-data",
    method: "get",
    params,
    silent: options.silent
  })
}

/** 查询设备状态 */
export function querDeviceStatus<T>(params: DeviceStatusQueryParams) {
  return dataCenterRequest<ApiResponseData<QueryResult<T>>>({
    url: "query/device-status",
    method: "get",
    params
  })
}

/** 查询北斗数据 */
export function queryBeidouData(params: BeidouRawQueryParams) {
  return dataCenterRequest<ApiResponseData<QueryResult<BeidouData>>>({
    url: "query/beidou-raw",
    method: "get",
    params
  })
}

/** 查询铱星数据 */
export function queryIridiumData(params: IridiumRawQueryParams) {
  return dataCenterRequest<ApiResponseData<QueryResult<IridiumData>>>({
    url: "query/iridium-raw",
    method: "get",
    params
  })
}

/** 查询设分页数据 */
export function querDeviceDataPageList(params: PageListQueryParams, options: Pick<AppRequestConfig, "silent"> = {}) {
  return dataCenterRequest<PagedResultResponse>({
    url: "query/device-page-data",
    method: "get",
    params,
    silent: options.silent
  })
}

/** 查询设备字段数据 */
export function queryDeviceFieldData(params: DeviceFieldDataQueryParams) {
  return dataCenterRequest<ApiResponseData<HistoryField[]>>({
    url: "query/device-field-data",
    method: "get",
    params
  })
}

/** 查询设备最新数据 */
export function queryDeviceLatestData(modelNumber: string, serialNumber: string) {
  return dataCenterRequest<ApiResponseData<any>>({
    url: "query/device-latest-data",
    method: "get",
    params: {
      modelNumber,
      serialNumber
    }
  })
}

/** 分页数据查询 */
export function pagedDataQuery(params: PagedQueryRequest, options: Pick<AppRequestConfig, "silent"> = {}) {
  return dataCenterRequest<ApiResponseData<PagedQueryResult>>({
    url: "query/device/page",
    method: "get",
    params,
    silent: options.silent
  })
}

export function influxAnchorDataQueryApi(params: InfluxAnchorQueryParams, options: Pick<AppRequestConfig, "silent"> = {}) {
  return dataCenterRequest<ApiResponseData<any>>({
    url: "query/influx-anchor-data",
    method: "get",
    params,
    silent: options.silent
  })
}

export function influxFieldDataQueryApi(params: InfluxFieldQueryParams) {
  return dataCenterRequest<ApiResponseData<HistoryField[]>>({
    url: "query/influx-field-data",
    method: "get",
    params
  })
}

export function influxLatestDataQueryApi(params: InfluxLatestQueryParams) {
  return dataCenterRequest<ApiResponseData<any>>({
    url: "query/influx-latest-data",
    method: "get",
    params
  })
}

export function influxBatchLatestDataQueryApi(params: InfluxBatchLatestQueryParams, serialNumbers: string[]) {
  return dataCenterRequest<ApiResponseData<any>>({
    url: "query/influx-batch-latest-data",
    method: "post",
    params,
    data: serialNumbers
  })
}
