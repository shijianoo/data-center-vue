import type { BeidouData, BeidouQueryParams, DeviceDataQueryOptions, IridiumData, IridiumQueryParams, ParsedDeviceDataQuery, ParsedDeviceStatusQuery } from "./type"
import type { QueryResult } from "@/common/apis/type"
import { dataCenterRequest } from "@/http/axios"

/** 查询设备解析后的数据（按锚点） */
export function queryParsedDeviceData<T>(params: ParsedDeviceDataQuery) {
  return dataCenterRequest<ApiResponseData<QueryResult<T>>>({
    url: "data/parsed",
    method: "get",
    params
  })
}

/** 查询设备数据（支持锚点或范围模式） */
export function queryParsedDeviceDataByOptions<T>(options: DeviceDataQueryOptions) {
  return dataCenterRequest<ApiResponseData<T[]>>({
    url: "data/parsed/query",
    method: "get",
    data: options
  })
}

/** 查询设备状态  */
export function queryParsedDeviceStatus<T>(params: ParsedDeviceStatusQuery) {
  return dataCenterRequest<ApiResponseData<QueryResult<T>>>({
    url: "data/parsed/status",
    method: "get",
    params
  })
}

/** 查询北斗数据 */
export function queryBeidouData(params: BeidouQueryParams) {
  return dataCenterRequest<ApiResponseData<QueryResult<BeidouData>>>({
    url: "data/beidou/raw",
    method: "get",
    params
  })
}

/** 查询铱星数据 */
export function queryIridiumData(params: IridiumQueryParams) {
  return dataCenterRequest<ApiResponseData<QueryResult<IridiumData>>>({
    url: "data/iridium/raw",
    method: "get",
    params
  })
}
