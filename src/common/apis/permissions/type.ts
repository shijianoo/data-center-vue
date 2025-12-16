export interface CreateOrUpdatePermission {
  parentId?: string
  /* 权限作用域 */
  scope: number
  /* 权限类型 */
  type: number
  name: string
  code: string
  description?: string
  isActive: boolean
  sortOrder: number
}

export interface PermissionExtra {}

export interface Permission {
  id: string
  createdAt: string
  parentId?: string
  scope: number
  type: number
  name: string
  code: string
  description?: string
  isSystem: boolean
  isActive: boolean
  sortOrder: number
  createdByUserId: string
  extra?: PermissionExtra
}

export interface PermissionTree extends Permission {
  children: PermissionTree[]
}

export type PermissionListResponseData = ApiResponseData<Permission[]>
export type PermissionTreeListResponseData = ApiResponseData<PermissionTree[]>

export function findPermissionById(
  list: PermissionTree[],
  id: string
): PermissionTree | null {
  for (const item of list) {
    if (item.id === id) return item
    if (item.children?.length) {
      const found = findPermissionById(item.children, id)
      if (found) return found
    }
  }
  return null
}
