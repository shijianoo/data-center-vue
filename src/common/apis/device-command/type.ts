import type { Entity } from "../type"

export interface CreateDeviceCommandDto {
  deviceId: string
  command: string
  parameter?: string
}

export interface DeviceCommand extends Entity<string> {
  deviceModelId: string
  deviceId: string
  command: string
  parameter?: string
  isSentToDevice: boolean
  sentTime?: string
}

export type DeviceCommandListResponse = ApiResponseData<DeviceCommand[]>
