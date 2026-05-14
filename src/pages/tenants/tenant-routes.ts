import type { RouteRecordRaw } from "vue-router"
import type { Tenant } from "@/common/apis/tenant/type"
import { getDefaultMenu } from "./default-tenant/route"
import { getNingboHKYRoute } from "./ningbo-hky/route"
import { getPlatformRoute } from "./platform-tenant/route"

export function getTenantRoutes(tenant: Tenant): RouteRecordRaw[] {
  if (tenant.type === 99) {
    return getPlatformRoute(tenant)
  } else if (tenant.tenantCode === "T000003") {
    return getNingboHKYRoute(tenant)
  }
  return getDefaultMenu(tenant)
}
