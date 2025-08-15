import type { CreateOrUpdateDeviceDto, Device, DeviceListResponse } from "@/common/apis/devices/type"
import { dataCenterRequest } from "@/http/axios"

/** 创建设备 */
export function createDeviceApi(data: CreateOrUpdateDeviceDto) {
  return dataCenterRequest<StringResponse>({
    url: "devices",
    method: "post",
    data
  })
}

/** 删除设备 */
export function deleteDeviceApi(id: string) {
  return dataCenterRequest<StringResponse>({
    url: `devices/${id}`,
    method: "delete"
  })
}

/** 更新设备型号 */
export function updateDeviceApi(data: CreateOrUpdateDeviceDto) {
  return dataCenterRequest<EmptyResponse>({
    url: `devices/${data.id}`,
    method: "put",
    data
  })
}

/** 获取设备 */
export function getDevicesApi(modelNumberId?: string) {
  return dataCenterRequest<DeviceListResponse>({
    url: "devices",
    method: "get",
    params: { modelNumberId }
  })
}

/** 获取指定设备 */
export function getDeviceByIdApi(id?: string) {
  return dataCenterRequest<ApiResponseData<Device>>({
    url: `devices/${id}`,
    method: "get"
  })
}
