import type { Entity, QueryResult } from "../type"

export interface CurrentUser {
  userName: string
  roles: string[]
}

export interface User extends Entity<string> {
  createdByUserId: string
  userName: string
  nickName?: string
  email?: string
  phoneNumber?: string
  description?: string
  isSystem: boolean
  isActive: boolean
  isAdmin: boolean
  extra?: string
  roles?: string[]
}

export interface UserForm {
  id?: string
  userName: string
  password?: string
  nickName?: string
  email?: string
  phoneNumber?: string
  description?: string
  isActive: boolean
  isAdmin: boolean
  extra?: string
}

export interface ChangePassword {
  oldPassword: string
  newPassword: string
}

export interface ResetPassword {
  userId: string
  newPassword: string
}

export interface AssignRole {
  userId: string
  roleIds: string[]
}

export type CurrentUserResponseData = ApiResponseData<CurrentUser>
export type UserResponseData = ApiResponseData<User>
export type UserListResponseData = ApiResponseData<QueryResult<User>>
