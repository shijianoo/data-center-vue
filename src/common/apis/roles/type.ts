import type { Entity, QueryResult } from "../type"

export interface Role extends Entity<string> {
  createdByUserId: string
  name: string
  code: string
  level: number
  dataScope?: string
  description?: string
  isSystem: boolean
  isActive: boolean
  order: number
  extra?: string
}

export interface RoleForm {
  id?: string
  name: string
  code?: string
  level: number
  dataScope?: string
  description?: string
  isSystem: boolean
  isActive: boolean
  order: number
  extra?: string
}

export type RoleListResponseData = ApiResponseData<QueryResult<Role>>
