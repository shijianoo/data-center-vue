import type { Entity } from "@/common/apis/type"

export interface CreateOrUpdateDeviceDto {
  id?: string
  deviceModelId: string
  serialNumber: string
  deviceName?: string
  description?: string
  isActive: boolean
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
  deviceName?: string
  description?: string
  isActive: boolean
  modelNumber: string
  upgradeTasks?: DeviceUpgrade[]
}

export interface DeviceSummary {
  id: string
  deviceModelId: string
  serialNumber: string
  deviceCode: string
  deviceName?: string
  displayName?: string
}

export type DeviceListResponse = ApiResponseData<Device[]>
