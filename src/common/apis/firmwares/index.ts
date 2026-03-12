import type { DeviceFirmware, UploadOrUpdateDeviceFirmware } from "./type"
import { dataCenterRequest } from "@/http/axios"

/** 根据设备型号获取固件 */
export function getFirmwaresByModelApi(deviceModelId?: string) {
  return dataCenterRequest<ApiResponseData<DeviceFirmware[]>>({
    url: `firmwares/by-model?deviceModelId=${deviceModelId}`,
    method: "get"
  })
}

/** 根据设备获取固件 */
export function getFirmwaresByDeviceApi(deviceId?: string) {
  return dataCenterRequest<ApiResponseData<DeviceFirmware[]>>({
    url: `firmwares/by-device?deviceId=${deviceId}`,
    method: "get"
  })
}

/** 删除固件 */
export function deleteFirmwaresApi(id: string) {
  return dataCenterRequest({
    url: `firmwares/${id}`,
    method: "delete"
  })
}

/** 修改固件信息 */
export function updateFirmwareApi(data: UploadOrUpdateDeviceFirmware) {
  return dataCenterRequest({
    url: `firmwares/${data.id}`,
    method: "put",
    data
  })
}
