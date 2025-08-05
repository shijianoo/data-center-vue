import type { DeviceModel } from "../device-models/type"
import type { Entity } from "@/common/apis/type"

export interface CreateOrUpdateDeviceDto {
  id?: string
  deviceModelId: string
  serialNumber: string
  deviceName: string
  description: string
}

export interface DeviceUpgrade extends Entity<string> {
  deviceId: string
  commandId: string
  firmwareId: string
  targetFirmwareVersion: string
  startTime?: string
  endTime?: string
  status: number
  downloadCount: number
}

export interface Device extends Entity<string> {
  deviceModelId: string
  serialNumber: string
  deviceName: string
  description: string
  isActive: boolean
  deviceModel: DeviceModel
  upgradeTasks?: DeviceUpgrade[]
}

export type DeviceListResponse = ApiResponseData<Device[]>
