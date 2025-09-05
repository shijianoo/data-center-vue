import type { QueryResult } from "../type"
import type { BeidouData, BeidouRawQueryParams, DeviceDataQueryParams, DeviceStatusQueryParams, IridiumData, IridiumRawQueryParams, PagedResultResponse, PageListQueryParams } from "./type"
import { dataCenterRequest } from "@/http/axios"

/** 查询设备数据 */
export function querDeviceData<T>(params: DeviceDataQueryParams) {
  return dataCenterRequest<ApiResponseData<QueryResult<T>>>({
    url: "query/device-data",
    method: "get",
    params
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
export function querDeviceDataPageList(params: PageListQueryParams) {
  return dataCenterRequest<PagedResultResponse>({
    url: "query/device-page-data",
    method: "get",
    params
  })
}
