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

export type BeidouDataListResponse = ApiResponseData<BeidouData[]>

export type IridiumDataListResponse = ApiResponseData<IridiumData[]>
