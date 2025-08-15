import type { Device } from "../devices/type"
import type { AssignDeviceAccess } from "./type"
import { dataCenterRequest } from "@/http/axios"

/** 分配设备 */
export function assignDevicesApi(userId: string, data: AssignDeviceAccess) {
  return dataCenterRequest({
    url: `device-access/assign/${userId}`,
    method: "post",
    data
  })
}

/** 获取自定用户分配的设备 */
export function getAccessibleDevices(userId: string, deviceModelId: string) {
  return dataCenterRequest<ApiResponseData<Device[]>>({
    url: `device-access/assign/${userId}?deviceModelId=${deviceModelId}`,
    method: "get"
  })
}

/** 获取我的设备 */
export function getMyDevicesApi(deviceModelId: string) {
  return dataCenterRequest<ApiResponseData<Device[]>>({
    url: `device-access/my-devices/${deviceModelId}`,
    method: "get"
  })
}
