import type { Tenant } from "@/common/apis/tenant/type"
import { getDefaultMenu } from "./default-tenant/menu"
import { getPlatformMenu } from "./platform-tenant/menu"

export function getTenantMenu(tenant: Tenant) {
  if (tenant.type === 99) {
    return getPlatformMenu(tenant)
  }
  return getDefaultMenu(tenant)
}
