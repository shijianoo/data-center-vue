import type { RouteRecordRaw } from "vue-router"
import type { Tenant } from "@/common/apis/tenant/type"

// eslint-disable-next-line unused-imports/no-unused-vars
export function getNingboHKYRoute(tenant: Tenant): RouteRecordRaw[] {
  return [
    {
      path: "",
      name: "DeviceLocation",
      component: () => import("@/pages/tenants/ningbo-hky/DeviceLocation.vue"),
      meta: { title: "浮标位置" }
    },
    {
      path: "buoyData",
      name: "BuoyData",
      component: () => import("@/pages/tenants/ningbo-hky/BuoyData.vue"),
      meta: { title: "浮标历史数据" }
    },
    {
      path: "shoreData",
      name: "ShoreData",
      component: () => import("@/pages/tenants/ningbo-hky/ShoreData.vue"),
      meta: { title: "岸基站历史数据" }
    }
  ]
}
