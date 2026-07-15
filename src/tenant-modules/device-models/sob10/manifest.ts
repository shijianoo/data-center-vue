import type { TenantModuleManifest } from "@/framework/tenant-console/types"

const manifest: TenantModuleManifest = {
  id: "device-model:sob10",
  revision: "1",
  matches: context => context.device?.modelNumber === "SOB10",
  contributions: (context) => {
    if (!context.device) return []
    return [
      {
        id: "device-page",
        scope: "device",
        matcher: {
          mode: "constrained",
          exposeParams: ["tenantKey"]
        },
        routes: () => [
          {
            path: "",
            name: "SOB10Device",
            component: () => import("@/tenant-modules/device-models/implementation/SOB10v1t1/Device.vue"),
            // 冻结的设备页面以 prop 获取已解析实体，不能只依赖 route params。
            props: () => ({ device: context.device }),
            meta: { title: "设备详情" }
          }
        ]
      },
      {
        id: "history-page",
        scope: "history",
        matcher: {
          mode: "constrained",
          exposeParams: ["tenantKey"]
        },
        routes: () => [
          {
            path: "",
            name: "SOB10History",
            component: () => import("@/tenant-modules/device-models/implementation/SOB10v1t1/History.vue"),
            // 历史页与详情页共享同一个设备实体，避免业务代码再次查询。
            props: () => ({ device: context.device }),
            meta: { title: "历史记录" }
          }
        ]
      }
    ]
  }
}

export default manifest
