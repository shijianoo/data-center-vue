export interface TenantExtra {
  uiProfile?: string

  // --- 品牌与展示 ---
  shortName?: string
  logoURL?: string
  themeColor?: string
  richText?: string

  // --- 详情信息 ---
  timeZone?: string
  culture?: string
  address?: string
  website?: string
  taxNumber?: string

  maxProjects: number
  maxUserCount: number
  remark?: string
  isVip: boolean
}

/* 租户 */
export interface Tenant {
  id: string
  createdAt: string
  name: string
  tenantCode: string
  type: number
  status: number
  plan: number
  expireTime?: string
  slug: string
  customDomain: string
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  description?: string
  isSystem: boolean
  isActive: boolean
  sortOrder: number
  createdByUserId: string
  extra?: TenantExtra
}

/* 创建租户 */
export interface TenantForm {
  id?: string
  adminUsername?: string
  name?: string
  tenantCode?: string
  type: number
  status: number
  plan: number
  expireTime?: string
  slug?: string
  customDomain?: string
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  description?: string
  isActive: boolean
  sortOrder: number
}

export interface TenantSummary {
  id: string
  name: string
  tenantCode: string
  type: number
  slug?: string
  customDomain?: string
  memberName?: string
  isOwner: boolean
}

export interface UserTenantSelection {
  id: string
  name: string
  tenantCode: string
  type: number
  slug?: string
  customDomain?: string
  memberName?: string
  isOwner: boolean
}

export interface UserTenantExtra {
}

export interface MemberProfileDto {
  memberName: string
  isOwner: boolean
  assignedAt: string
  memberTypeIcon: UserTenantExtra
}

export type TenantListResponseData = ApiResponseData<Tenant[]>
