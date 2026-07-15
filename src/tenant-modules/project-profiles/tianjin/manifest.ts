import type { TenantModuleManifest } from "@/framework/tenant-console/types"
import { getTianjinRoute } from "./implementation/route"

const TIANJIN_PROJECT_CODE = "QHH0180-2025187"

const manifest: TenantModuleManifest = {
  id: "project-profile:tianjin",
  revision: "1",
  matches: context => context.project?.projectCode === TIANJIN_PROJECT_CODE,
  contributions: (context) => {
    if (!context.project) return []
    return [
      {
        id: "project-pages",
        scope: "project",
        matcher: {
          mode: "constrained",
          // 保留 tenantKey，供冻结业务组件沿用现有路由参数契约。
          exposeParams: ["tenantKey"]
        },
        routes: () => getTianjinRoute(context.project!)
      }
    ]
  }
}

export default manifest
