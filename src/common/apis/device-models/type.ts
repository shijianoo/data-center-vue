import type { Device } from "../devices/type"
import type { Entity } from "@/common/apis/type"

export interface CreateOrUpdateDeviceModelDto {
  id?: string
  productCode: string
  modelNumber: string
  modelName?: string
  description?: string
  isActive: boolean
}

export interface DeviceModel extends Entity<string> {
  productCode: string
  modelNumber: string
  modelName?: string
  description?: string
  isActive: boolean
  deviceCount: number
  devices: Device[]
}

export type DeviceModelListResponse = ApiResponseData<DeviceModel[]>
