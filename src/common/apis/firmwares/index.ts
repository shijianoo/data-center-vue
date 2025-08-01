import type { QueryResult } from "../type"
import type { DeviceFirmware } from "./type"
import { dataCenterRequest } from "@/http/axios"

/** 根据设备型号获取固件 */
export function getFirmwaresByModelApi(deviceModelId?: string) {
  return dataCenterRequest<ApiResponseData<QueryResult<DeviceFirmware>>>({
    url: `firmwares/by-model?deviceModelId=${deviceModelId}`,
    method: "get"
  })
}

/** 根据设备获取固件 */
export function getFirmwaresByDeviceApi(deviceId?: string) {
  return dataCenterRequest<ApiResponseData<QueryResult<DeviceFirmware>>>({
    url: `firmwares/by-device?deviceId=${deviceId}`,
    method: "get"
  })
}

/** 删除固件 */
export function deleteFirmwaresApi(id?: string) {
  return dataCenterRequest({
    url: `firmwares/${id}`,
    method: "delete"
  })
}

/** 上传固件 */
export function uploadFirmwareApi(formData: FormData) {
  return dataCenterRequest<ApiResponseData<DeviceFirmware>>({
    url: "firmwares/upload",
    method: "post",
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data"
    }
  })
}
