import type { Tenant } from "@/common/apis/tenant/type"

export function getDefaultMenu(tenant: Tenant) {
  return [
    { name: "首页", path: `/console/${tenant.tenantCode}`, exact: true },
    { name: "设备管理", path: `/console/${tenant.tenantCode}/devices` },
    { name: "设备轨迹", path: `/console/${tenant.tenantCode}/devices/tracks` }
  ]
}
