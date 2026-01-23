import type { Project } from "../../projects/type"

export interface TenantStatistics {
  tenantId: string
  projectCount: number
  deviceCount: number
  deviceModelCount: number
  onlineDeviceCount: number
}

export interface ProjectWithStats extends Project {
  totalModelCount: number
  totalDeviceCount: number
  onlineDeviceCount: number
  latestUploadTime?: string
}
