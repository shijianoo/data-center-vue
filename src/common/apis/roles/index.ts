import type * as Roles from "./type"
import { authCenterRequest } from "@/http/axios"

// 获取所有角色
export function getAllRolesApi() {
  return authCenterRequest<Roles.RoleListResponseData>({
    url: "/roles",
    method: "get"
  })
}

// 创建角色
export function createRoleApi(data: Roles.RoleForm) {
  return authCenterRequest({
    url: "/roles",
    method: "post",
    data
  })
}

// 更新角色
export function updateRoleApi(data: Roles.RoleForm) {
  return authCenterRequest({
    url: `/roles/${data.id}`,
    method: "put",
    data
  })
}

// 删除角色
export function deleteRoleApi(id: string) {
  return authCenterRequest({
    url: `/roles/${id}`,
    method: "DELETE"
  })
}

// 配分角色菜单
export function assignMenusApi(id: string, menuIds: string[]) {
  return authCenterRequest({
    url: `/roles/${id}/menus`,
    method: "post",
    data: menuIds
  })
}

// 获取角色菜单权限Id列表
export function getRoleMenuIdsApi(id: string) {
  return authCenterRequest<ApiResponseData<string[]>>({
    url: `/roles/${id}/menu-ids`,
    method: "get"
  })
}

// 分配角色权限
export function assignPermissionsApi(id: string, permissionIds: string[]) {
  return authCenterRequest({
    url: `/roles/${id}/permissions`,
    method: "post",
    data: permissionIds
  })
}

// 获取角色权限Id列表
export function getRolePermissionIdsApi(id: string) {
  return authCenterRequest<ApiResponseData<string[]>>({
    url: `/roles/${id}/permission-ids`,
    method: "get"
  })
}
