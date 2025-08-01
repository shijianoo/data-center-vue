import type { Entity } from "../type"

export interface DeviceFirmware extends Entity<string> {
  deviceModelId: string
  firmwareVersion: string
  description?: string
  md5: string
  supportedHardwareVersions?: string[]
}
