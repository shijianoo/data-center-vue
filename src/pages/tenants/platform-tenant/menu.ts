import type { Tenant } from "@/common/apis/tenant/type"

export function getPlatformMenu(tenant: Tenant) {
  return [
    { name: "概览", path: `/console/${tenant.tenantCode}`, exact: true },
    { name: "客户管理", path: `/console/${tenant.tenantCode}/platform/tenants` },
    { name: "系统设置", path: `/console/${tenant.tenantCode}/platform/settings` }
  ]
}
