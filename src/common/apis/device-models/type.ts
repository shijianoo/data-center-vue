import type { Device } from "../devices/type"
import type { Entity } from "@/common/apis/type"

export interface CreateOrUpdateDeviceModelDto {
  id?: string
  modelNumber: string
  modelName: string
  description: string
  bucketName?: string
}

export interface DeviceModel extends Entity<string> {
  modelNumber: string
  modelName: string
  description?: string
  devices: Device[]
  bucketMaps: InfluxBucketMap
}

export interface InfluxBucketMap extends Entity<string> {
  deviceModelId: string
  bucketName: string
}

export type DeviceModelListResponse = ApiResponseData<DeviceModel[]>
