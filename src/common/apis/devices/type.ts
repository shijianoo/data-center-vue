import type { Entity } from "@/common/apis/type"

export interface CreateOrUpdateDeviceDto {
  id?: string
  deviceModelId: string
  serialNumber: string
  deviceName?: string
  description?: string
  isActive: boolean
}

export interface UpdateDeviceProfileDto {
  deviceName?: string
  displayName?: string
  description?: string
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
  status: number
  firmwareVersion: string
  hardwareVersion: string
  uploadInterval: number
  lastUploadTime: string
  lastOnlineTime: string
  lastOfflineTime: string
  isOnline: boolean
  description?: string
  isActive: boolean
  modelNumber?: string
  modelName?: string
  upgradeTasks?: DeviceUpgrade[]
}

export type DeviceListResponse = ApiResponseData<Device[]>
