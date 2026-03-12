import type { CreateOrUpdateDeviceModelDto, DeviceModel, DeviceModelExtra, DeviceModelListResponse, DeviceModelSummary } from "@/common/apis/device-models/type"
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

/** 更新设备型号扩展信息 */
export function updateDeviceModelExtraApi(data: DeviceModelExtra) {
  return dataCenterRequest<EmptyResponse>({
    url: `device-models/${data.id}/extra`,
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

/** 获取设备型号 */
export function getDeviceModelByIdApi(id: string) {
  return dataCenterRequest<ApiResponseData<DeviceModel>>({
    url: `device-models/${id}`,
    method: "get"
  })
}

/** 获取设备型号汇总 */
export function getDeviceModelSummariesApi() {
  return dataCenterRequest<ApiResponseData<DeviceModelSummary[]>>({
    url: "device-models/summary",
    method: "get"
  })
}

/** 获取通过key设备型号 */
export function getDeviceModelByKeyApi(value: string) {
  return dataCenterRequest<ApiResponseData<DeviceModel>>({
    url: `device-models/resolve/${value}`,
    method: "get"
  })
}
