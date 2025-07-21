export interface ParsedDeviceDataQuery {
  modelNumber?: string
  deviceModelId?: string
  serialNumber?: string
  uploadChannel?: string
  anchorTime?: string
  reverse?: boolean
  limit?: number
}

export interface DeviceDataQueryOptions {
  bucket: string
  psn?: string
  uploadChannel?: number
  anchorTime?: string
  reverse?: boolean
  limit?: number
  start?: string
  end?: string
  sortAscending?: boolean
}

export interface BeidouQueryParams {
  anchorTime?: string
  reverse?: boolean
  limit?: number
  fromCard?: string
  toCard?: string
}

export interface BeidouData {
  fromCard: string
  toCard?: string
  content: string
  time: string
}

export interface IridiumQueryParams {
  anchorTime?: string
  reverse?: boolean
  limit?: number
  imei?: string
}

export interface IridiumData {
  time: string
  imei: string
  content: string
}

export type BeidouDataListResponse = ApiResponseData<BeidouData[]>

export type IridiumDataListResponse = ApiResponseData<IridiumData[]>
