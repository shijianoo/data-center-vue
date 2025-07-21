import type { Entity } from "../type"

export interface CreateOrUpdateDevicePropertyDto {
  name: string
  value: string
  type: string
  unit: string
  description: string
  isReadOnly: boolean
  order: number
}

export interface DeviceProperty extends Entity<string> {
  deviceId: string
  key: string
  name: string
  value: string
  type: string
  unit: string
  isSystem: boolean
  description: string
  isReadOnly: boolean
  order: number
}

export type DevicePropertyListResponse = ApiResponseData<DeviceProperty[]>
