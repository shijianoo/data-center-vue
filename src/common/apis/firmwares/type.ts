import type { Entity } from "../type"

export interface DeviceFirmwareExtra {
  richText: string
}

export interface UploadOrUpdateDeviceFirmware {
  id?: string
  deviceModelId: string
  firmwareVersion: string
  supportedHardwareVersions?: string
  description?: string
  isActive: boolean
  sortOrder: number
}

export interface DeviceFirmware extends Entity<string> {
  deviceModelId: string
  firmwareVersion: string
  fileSize: number
  md5: string
  supportedHardwareVersions?: string[]
  description?: string
  isActive: boolean
  sortOrder: number
}
