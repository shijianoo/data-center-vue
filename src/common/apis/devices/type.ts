import type { DeviceModel } from "../device-models/type"
import type { Entity } from "@/common/apis/type"

export interface CreateOrUpdateDeviceDto {
  id?: string
  deviceModelId: string
  serialNumber: string
  deviceName: string
  description: string
}

export interface Device extends Entity<string> {
  deviceModelId: string
  serialNumber: string
  deviceName: string
  description: string
  isActive: boolean
  deviceModel: DeviceModel
}

export type DeviceListResponse = ApiResponseData<Device[]>
