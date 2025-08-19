import type { Entity, QueryResult } from "../type"

export interface Menu extends Entity<string> {
  createdByUserId: string
  parentId?: string
  name: string
  type: number // 0=页面，1=外链，2=按钮
  routeName?: string
  routePath?: string
  externalUrl?: string
  permissionId?: string
  svgIcon?: string
  target?: string
  component?: string
  description?: string
  order: number
  isHidden: boolean
  isSystem: boolean
  isActive: boolean
  keepAlive: boolean
  affix: boolean
  extra?: string
}

export interface MenuForm {
  id?: string
  parentId?: string
  name: string
  // 0=页面，1=外链，2=按钮
  type: number
  routeName?: string
  routePath?: string
  externalUrl?: string
  permissionId?: string
  svgIcon?: string
  target?: string
  component?: string
  description?: string
  order: number
  isHidden: boolean
  isSystem: boolean
  isActive: boolean
  keepAlive: boolean
  affix: boolean
  extra?: string
}

export interface MenuTree extends Menu {
  children?: MenuTree[]
}

export type MenuTreeListResponseData = ApiResponseData<QueryResult<MenuTree>>
