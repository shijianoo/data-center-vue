import type { CreateOrUpdateDevicePropertyDto, DevicePropertyListResponse } from "./type"
import { dataCenterRequest } from "@/http/axios"

export function createDevicePropertyApi(deviceId: string, key: string, data: CreateOrUpdateDevicePropertyDto) {
  return dataCenterRequest<EmptyResponse>({
    url: `device-properties/${deviceId}/${key}`,
    method: "post",
    data
  })
}

export function deleteDevicePropertyApi(deviceId: string, key: string) {
  return dataCenterRequest<EmptyResponse>({
    url: `device-properties/${deviceId}/${key}`,
    method: "delete"
  })
}

export function updateDevicePropertyApi(deviceId: string, key: string, data: CreateOrUpdateDevicePropertyDto) {
  return dataCenterRequest<EmptyResponse>({
    url: `device-properties/${deviceId}/${key}`,
    method: "put",
    data
  })
}
export function getDevicePropertiesApi(deviceId: string) {
  return dataCenterRequest<DevicePropertyListResponse>({
    url: `device-properties/${deviceId}`,
    method: "get"
  })
}
