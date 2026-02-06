export interface DeviceDataQueryParams {
  anchorTime?: string
  modelNumber: string
  serialNumber?: string
  uploadChannel?: string
  limit?: number
}

export interface DeviceStatusQueryParams {
  anchorTime?: string
  modelNumber: string
  serialNumber?: string
  limit?: number
}

export interface BeidouRawQueryParams {
  anchorTime?: string
  fromCard?: string
  toCard?: string
  limit?: number
}

export interface BeidouData {
  fromCard: string
  toCard?: string
  content: string
  time: string
}

export interface IridiumRawQueryParams {
  anchorTime?: string
  imei?: string
  limit?: number
}

export interface IridiumData {
  time: string
  imei: string
  content: string
}

export interface PageListQueryParams {
  model: string
  sn: string
  ch: number
  page: number
  size: number
}

export interface DeviceFieldDataQueryParams {
  /** 设备型号 */
  modelNumber: string
  /** 设备序列号 */
  serialNumber: string
  /** 查询字段 */
  field: string
  /** 开始时间 */
  start: string
  /** 结束时间 */
  end: string
  /** 时间窗口 */
  window?: string
  /** 聚合方式 */
  agg?: string
}

export interface PagedResult {
  total: number
  items: any[]
}

export interface HistoryField {
  time: string
  value: number
}

export interface PagedQueryRequest {
  model: string
  version: number
  dataType: number
  serialNumber: string
  uploadChannel: number
  page: number
  size: number
}

export interface PagedQueryResult {
  schema: {
    key: string
    displayName: string
    unit: string
  }[]
  records: any[]
  totalCount: number
}

export type BeidouDataListResponse = ApiResponseData<BeidouData[]>

export type IridiumDataListResponse = ApiResponseData<IridiumData[]>

export type PagedResultResponse = ApiResponseData<PagedResult>
