import type { CreateOrUpdateDeviceCommand, DeviceCommand } from "./type"
import { dataCenterRequest } from "@/http/axios"

/** 创建设备命令 */
export function createDeviceCommandApi(data: CreateOrUpdateDeviceCommand) {
  return dataCenterRequest<EmptyResponse>({
    url: "device-commands",
    method: "post",
    data
  })
}

/** 删除设备命令 */
export function deleteDeviceCommandApi(id: string) {
  return dataCenterRequest<EmptyResponse>({
    url: `device-commands/${id}`,
    method: "delete"
  })
}

/** 更新设备命令 */
export function updateDeviceCommandApi(data: CreateOrUpdateDeviceCommand) {
  return dataCenterRequest<EmptyResponse>({
    url: `device-commands/${data.id}`,
    method: "put",
    data
  })
}

/** 获取所有设备命令 */
export function getDeviceCommandsApi(deviceId: string) {
  return dataCenterRequest<ApiResponseData<DeviceCommand[]>>({
    url: "device-commands",
    method: "get",
    params: { deviceId }
  })
}
