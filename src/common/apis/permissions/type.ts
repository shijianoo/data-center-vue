import type { Entity, QueryResult } from "../type"

export interface CreateOrUpdatePermission {
  parentId?: string
  name: string
  code: string
  description?: string
  isActive: boolean
  order: number
  extra?: string
}

export interface PermissionTree extends Entity<string> {
  createdByUserId: string
  parentId?: string
  name: string
  code: string
  description?: string
  isSystem: boolean
  isActive: boolean
  order: number
  extra?: string
  children: PermissionTree[]
}

export type PermissionTreeListResponseData = ApiResponseData<QueryResult<PermissionTree>>
