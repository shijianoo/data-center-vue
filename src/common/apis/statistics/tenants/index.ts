import type { Device } from "../../devices/type"
import type { ProjectWithStats, TenantStatistics } from "./type"
import { dataCenterRequest } from "@/http/axios"

/* 获取租户统计 */
export function getTenantStatistics(tenantIds: string[]) {
  return dataCenterRequest<ApiResponseData<TenantStatistics[]>>({
    url: "/statistics/tenants",
    method: "POST",
    data: tenantIds
  })
}

/** 获取指定租户的项目统计信息 */
export function getTenantProjectStatsApi() {
  return dataCenterRequest<ApiResponseData<ProjectWithStats[]>>({
    url: `/statistics/tenants/projects`,
    method: "get"
  })
}

/** 获取当前租户下指定设备编码的设备信息 */
export function getTenantDeviceByCodeApi(deviceCode: string) {
  return dataCenterRequest<ApiResponseData<Device>>({
    url: `/statistics/tenants/devices/${deviceCode}`,
    method: "get"
  })
}
