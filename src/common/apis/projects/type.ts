export interface ProjectExtra {
  id?: string
  uiProfile?: string
  ownerUser?: string
  tags?: string[]
}

export interface Project {
  id: string
  createdAt: string
  tenantId: string
  projectNo: string
  projectCode: string
  name: string
  shortName?: string
  displayName?: string
  address?: string
  type: number
  status: number
  startDate?: string
  endDate?: string
  description?: string
  isActive: boolean
  sortOrder: number
  extra?: ProjectExtra
}

export interface ProjectForm {
  id?: string
  tenantId: string
  name: string
  shortName?: string
  displayName?: string
  projectCode: string
  address?: string
  type: number
  status: number
  startDate?: string
  endDate?: string
  description?: string
  isActive: boolean
  sortOrder: number
}

export interface ProjectSummary {
  id: string
  projectNo: string
  name: string
  shortName?: string
  displayName?: string
  projectCode: string
}

export type ProjectListResponseData = ApiResponseData<Project[]>
