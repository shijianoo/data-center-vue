import type { Entity } from "@/common/apis/type"

export interface DeviceExtra {
  id?: string
  richText?: string
  tags?: string[]
}

export interface CreateOrUpdateDeviceDto {
  id?: string
  deviceModelId: string
  serialNumber: string
  deviceName?: string
  firmwareVersion?: string
  hardwareVersion?: string
  samplingInterval?: number
  uploadInterval?: number
  description?: string
  isActive: boolean
}

export interface UpdateDeviceProfileDto {
  displayName?: string
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
  deviceCode: string
  serialNumber: string
  deviceName?: string
  displayName: string
  firmwareVersion: string
  hardwareVersion: string
  samplingInterval: number
  uploadInterval: number
  status: number
  isOnline: boolean
  lastUploadTime: string
  description?: string
  isActive: boolean
  modelNumber?: string
  modelName?: string
  upgradeTasks?: DeviceUpgrade[]
}

export interface DeviceSummary {
  id: string
  serialNumber: string
  deviceCode: string
  deviceName?: string
  displayName: string
  status: number
  firmwareVersion: string
  hardwareVersion: string
  lastUploadTime: string
  isOnline: boolean
}

export type DeviceListResponse = ApiResponseData<Device[]>
