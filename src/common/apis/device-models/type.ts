import type { Device } from "../devices/type"
import type { Entity } from "@/common/apis/type"

export interface DeviceModelExtra {
  id?: string
  richText?: string
  tags?: string[]
}

export interface CreateOrUpdateDeviceModelDto {
  id?: string
  productCode: string
  modelNumber: string
  modelName?: string
  displayName?: string
  manufacturer?: string
  status: number
  category: number
  description?: string
  isActive: boolean
  sortOrder: number
}

export interface DeviceModel extends Entity<string> {
  productCode: string
  modelNumber: string
  modelName?: string
  displayName?: string
  manufacturer?: string
  status: number
  category: number
  description?: string
  isActive: boolean
  sortOrder: number
  deviceCount: number
  devices: Device[]
}

export interface DeviceModelSummary {
  id: string
  productCode: string
  modelNumber: string
  modelName?: string
}

export type DeviceModelListResponse = ApiResponseData<DeviceModel[]>
