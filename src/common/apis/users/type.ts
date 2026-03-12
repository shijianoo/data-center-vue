export interface UserExtra {
  id?: string
  avatarUrl?: string
  culture?: string
  timeZone?: string
  themeMode?: string
  gender: number
  birthday?: string
}

export interface User {
  id: string
  createdAt: string
  userName: string
  nickName?: string
  realName?: string
  email?: string
  emailVerifiedAt?: string
  phone?: string
  phoneVerifiedAt?: string
  isSuperAdmin: boolean
  description?: string
  isSystem: boolean
  isActive: boolean
  sortOrder: number
  createdByUserId: string
  extra?: UserExtra
  roles?: string[]
}

export interface UserForm {
  id?: string
  userName: string
  password?: string
  nickName?: string
  realName?: string
  email?: string
  phone?: string
  description?: string
  isActive: boolean
  sortOrder: number
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

export type UserResponseData = ApiResponseData<User>
export type UserListResponseData = ApiResponseData<User[]>
