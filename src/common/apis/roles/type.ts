export interface RoleExtra {
  level: number
  dataScope: number
}

export interface Role {
  id: string
  createdAt: string
  tenantId: string
  scope: number
  name: string
  code: string
  description?: string
  isSystem: boolean
  isActive: boolean
  sortOrder: number
  createdByUserId: string
  extra?: RoleExtra
  tenantName: string
}

export interface RoleForm {
  id?: string
  tenantId?: string
  scope: number
  name: string
  code?: string
  description?: string
  isActive: boolean
  sortOrder: number
}

export type RoleListResponseData = ApiResponseData<Role[]>
