import type * as Users from "./type"
import { authCenterRequest } from "@/http/axios"

/** 获取当前登录用户详情 */
export function getCurrentUserApi() {
  return authCenterRequest<Users.CurrentUserResponseData>({
    url: "users/me",
    method: "get"
  })
}

/** 获取所有用户（仅ADMIN） */
export function getAllUsersApi() {
  return authCenterRequest<Users.UserListResponseData>({
    url: "users",
    method: "get"
  })
}

/** 获取指定用户详情（仅ADMIN） */
export function getUserApi(id: string) {
  return authCenterRequest<Users.UserResponseData>({
    url: `users/${id}`,
    method: "get"
  })
}

/** 创建用户（仅ADMIN） */
export function createUserApi(dto: Users.UserForm) {
  return authCenterRequest({
    url: "users",
    method: "post",
    data: dto
  })
}

/** 更新用户（仅ADMIN） */
export function updateUserApi(dto: Users.UserForm) {
  return authCenterRequest({
    url: `users/${dto.id}`,
    method: "put",
    data: dto
  })
}

/** 删除用户（仅ADMIN） */
export function deleteUserApi(id: string) {
  return authCenterRequest({
    url: `users/${id}`,
    method: "delete"
  })
}

/** 分配角色（仅ADMIN） */
export function assignRolesApi(id: string, roleIds: string[]) {
  return authCenterRequest({
    url: `users/${id}/roles`,
    method: "post",
    data: roleIds
  })
}

/** 获取用户角色（仅ADMIN） */
export function getUserRoleIdsApi(id: string) {
  return authCenterRequest<ApiResponseData<string[]>>({
    url: `users/${id}/role-ids`,
    method: "get"
  })
}

/** 修改密码（需登录） */
export function changePasswordApi(oldPassword: string, newPassword: string) {
  const data: Users.ChangePassword = { oldPassword, newPassword }
  return authCenterRequest({
    url: "users/change-password",
    method: "post",
    data
  })
}

/** 重置密码（仅ADMIN） */
export function resetPasswordApi(userId: string, newPassword: string) {
  const data: Users.ResetPassword = { userId, newPassword }
  return authCenterRequest({
    url: "users/reset-password",
    method: "post",
    data
  })
}
