import type { TenantModuleManifest } from "@/framework/tenant-console/types"
import { getNingboHKYRoute } from "./implementation/route"

const manifest: TenantModuleManifest = {
  id: "tenant:ningbo-hky",
  revision: "1",
  matches: context => context.tenant.tenantCode === "T000003",
  contributions: context => [
    {
      id: "tenant-pages",
      scope: "tenant",
      matcher: {
        mode: "constrained",
        // 宁波历史布局仍读取 route.params.tenantKey，故不能改为纯 literal path。
        exposeParams: ["tenantKey"]
      },
      routes: () => getNingboHKYRoute(context.tenant)
    }
  ]
}

export default manifest
