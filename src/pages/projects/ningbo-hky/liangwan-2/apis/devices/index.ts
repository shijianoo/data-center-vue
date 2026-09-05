import type { SaveStationDeviceCommand, StationDeviceModel } from "./type"
import { ecoClient } from "../client"

/** 查询指定站点下的设备 */
export function getDevices(stationId: number) {
  return ecoClient.get<StationDeviceModel[]>(`/stations/${encodeURIComponent(stationId)}/devices`)
}

/** 为指定站点新增设备 */
export function createDevice(stationId: number, data: SaveStationDeviceCommand) {
  return ecoClient.post<StationDeviceModel>(`/stations/${encodeURIComponent(stationId)}/devices`, data)
}

/** 更新指定站点下的设备 */
export function updateDevice(stationId: number, id: number | string, data: SaveStationDeviceCommand) {
  return ecoClient.put<StationDeviceModel>(`/stations/${encodeURIComponent(stationId)}/devices/${id}`, data)
}

/** 删除指定站点下的设备 */
export function deleteDevice(stationId: number, id: number | string) {
  return ecoClient.delete(`/stations/${encodeURIComponent(stationId)}/devices/${id}`)
}
