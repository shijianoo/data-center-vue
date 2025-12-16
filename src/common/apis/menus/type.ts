export interface MenuExtra {
  svgIcon?: string
  isHidden: boolean
  roles?: string[]
  breadcrumb: boolean
  affix: boolean
  alwaysShow: boolean
  activeMenu?: string
  keepAlive: boolean
}

export interface Menu {
  id: string
  createdAt: string
  parentId?: string
  scope: number
  title: string
  type: number
  routeName?: string
  routePath?: string
  component?: string
  externalUrl?: string
  target?: string
  redirect?: string
  permissionId?: string
  description?: string
  isSystem: boolean
  isActive: boolean
  sortOrder: number
  createdByUserId: string
  extra?: MenuExtra
}

export interface MenuForm {
  id?: string
  parentId?: string
  scope: number
  title: string
  type: number
  routeName?: string
  routePath?: string
  component?: string
  externalUrl?: string
  target?: string
  redirect?: string
  permissionId?: string
  description?: string
  isActive: boolean
  sortOrder: number
}

export interface MenuTree extends Menu {
  children?: MenuTree[]
}

export type MenuTreeListResponseData = ApiResponseData<MenuTree[]>
