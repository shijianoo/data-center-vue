import type { Device } from "../devices/type"
import { dataCenterRequest } from "@/http/axios"

/** 获取指定项目设备 */
export function getDeviceIdsFromProject(projectId: string) {
  return dataCenterRequest<ApiResponseData<string[]>>({
    url: `/projects/${projectId}/devices/ids`,
    method: "get"
  })
}

/** 给指定项目添加设备 */
export function addDevicesToProject(projectId: string, deviceIds: string[]) {
  return dataCenterRequest({
    url: `/projects/${projectId}/devices`,
    method: "post",
    data: deviceIds
  })
}

/** 给指定项目移除设备 */
export function removeDevicesFromProject(projectId: string, deviceIds: string[]) {
  return dataCenterRequest({
    url: `/projects/${projectId}/devices`,
    method: "delete",
    data: deviceIds
  })
}

/** 获取指定租户设备 */
export function getDevicesFromTenant(tenantId: string) {
  return dataCenterRequest<ApiResponseData<Device[]>>({
    url: `/tenants/${tenantId}/devices`,
    method: "get"
  })
}

/** 获取指定租户设备Id */
export function getDeviceIdsFromTenant(tenantId: string) {
  return dataCenterRequest<ApiResponseData<string[]>>({
    url: `/tenants/${tenantId}/devices/ids`,
    method: "get"
  })
}

/** 给指定租户添加设备 */
export function addDevicesToTenant(tenantId: string, deviceIds: string[]) {
  return dataCenterRequest({
    url: `/tenants/${tenantId}/devices`,
    method: "post",
    data: deviceIds
  })
}

/** 给指定租户移除设备 */
export function removeDevicesFromTenant(tenantId: string, deviceIds: string[]) {
  return dataCenterRequest({
    url: `/tenants/${tenantId}/devices`,
    method: "delete",
    data: deviceIds
  })
}
