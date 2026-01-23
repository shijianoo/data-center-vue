import type { DeviceStatistics } from "./type"
import { dataCenterRequest } from "@/http/axios"

/* 获取设备概览统计 */
export function getDeviceOverviewStatistics() {
  return dataCenterRequest<ApiResponseData<DeviceStatistics>>({
    url: "/statistics/devices/overview",
    method: "GET"
  })
}
