import type { CreateOrUpdateDeviceModelDto, DeviceModelListResponse } from "@/common/apis/device-models/type"
import { dataCenterRequest } from "@/http/axios"

/** 创建设备型号 */
export function createDeviceModelApi(data: CreateOrUpdateDeviceModelDto) {
  return dataCenterRequest<EmptyResponse>({
    url: "device-models",
    method: "post",
    data
  })
}

/** 删除设备型号 */
export function deleteDeviceModelsApi(id: string) {
  return dataCenterRequest<EmptyResponse>({
    url: `device-models/${id}`,
    method: "delete"
  })
}

/** 更新设备型号 */
export function updateDeviceModelApi(data: CreateOrUpdateDeviceModelDto) {
  return dataCenterRequest<EmptyResponse>({
    url: `device-models/${data.id}`,
    method: "put",
    data
  })
}

/** 获取所有设备型号 */
export function getDeviceModelsApi() {
  return dataCenterRequest<DeviceModelListResponse>({
    url: "device-models",
    method: "get"
  })
}
