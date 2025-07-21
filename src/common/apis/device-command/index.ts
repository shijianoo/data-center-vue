import type { CreateDeviceCommandDto, DeviceCommandListResponse } from "./type"
import { dataCenterRequest } from "@/http/axios"

/** 创建命令 */
export function createDeviceCommandApiByDto(data: CreateDeviceCommandDto) {
  return dataCenterRequest<StringResponse>({
    url: "device-commands",
    method: "post",
    data
  })
}

/** 创建命令 */
export function createDeviceCommandApi(deviceId: string, command: string, parameter?: string) {
  const data: CreateDeviceCommandDto = {
    deviceId,
    command,
    parameter
  }
  return createDeviceCommandApiByDto(data)
}

/** 获取命令 */
export function getDeviceCommandsApi(deviceId: string) {
  return dataCenterRequest<DeviceCommandListResponse>({
    url: "device-commands",
    method: "get",
    params: { deviceId }
  })
}

/** 删除命令 */
export function deleteDeviceCommandApi(id: string) {
  return dataCenterRequest<StringResponse>({
    url: `device-commands/${id}`,
    method: "delete"
  })
}
