export interface TenantType {
  value: number
  label: string
}

export interface TenantStatus {
  value: number
  label: string
}

export interface TenantPlan {
  value: number
  label: string
}

export const TENANT_TYPE_OPTIONS: TenantType[] = [
  { value: 0, label: "未知" },
  { value: 1, label: "企业租户" },
  { value: 2, label: "个人租户" },
  { value: 3, label: "试用租户" },
  { value: 98, label: "内部租户" },
  { value: 99, label: "平台租户" }
]

export const TENANT_STATUS_OPTIONS: TenantStatus[] = [
  { value: 0, label: "未知" },
  { value: 1, label: "正常" },
  { value: 2, label: "待激活" },
  { value: 3, label: "欠费" },
  { value: 4, label: "锁定" },
  { value: 99, label: "禁用" }
]

export const TENANT_PLAN_OPTIONS: TenantPlan[] = [
  { value: 0, label: "未知" },
  { value: 1, label: "试用套餐" },
  { value: 2, label: "基础套餐" },
  { value: 3, label: "专业套餐" },
  { value: 4, label: "企业套餐" }
]

export function getTenantTypeLabel(type: number | undefined) {
  return TENANT_TYPE_OPTIONS.find(item => item.value === type)?.label || "未知"
}

export function getTenantStatusLabel(status: number | undefined) {
  return TENANT_STATUS_OPTIONS.find(item => item.value === status)?.label || "未知"
}
export function getTenantPlanLabel(plan: number | undefined) {
  return TENANT_PLAN_OPTIONS.find(item => item.value === plan)?.label || "未知"
}
