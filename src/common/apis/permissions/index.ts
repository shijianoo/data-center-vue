import type { CreateOrUpdatePermission, PermissionTreeListResponseData } from "./type"
import { authCenterRequest } from "@/http/axios"

/** 创建权限 */
export function createPermissionApi(data: CreateOrUpdatePermission) {
  return authCenterRequest({
    url: "/permissions",
    method: "post",
    data
  })
}

/** 更新权限 */
export function updatePermissionApi(id: string, data: CreateOrUpdatePermission) {
  return authCenterRequest({
    url: `/permissions/${id}`,
    method: "put",
    data
  })
}

/** 删除权限 */
export function deletePermissionApi(id: string) {
  return authCenterRequest({
    url: `/permissions/${id}`,
    method: "delete"
  })
}

/** 获取权限树 */
export function getPermissionTreeApi() {
  return authCenterRequest<PermissionTreeListResponseData>({
    url: "/permissions/tree",
    method: "get"
  })
}
