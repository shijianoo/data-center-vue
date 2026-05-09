import type { RouteRecordRaw } from "vue-router"
import type { Tenant } from "@/common/apis/tenant/type"

// eslint-disable-next-line unused-imports/no-unused-vars
export function getDefaultMenu(tenant: Tenant): RouteRecordRaw[] {
  return [
    // {
    //   path: "",
    //   name: "Overview",
    //   component: () => import("@/pages/tenants/default-tenant/Overview.vue"),
    //   meta: { title: "总览" }
    // },
    // {
    //   path: "devices",
    //   name: "Devices",
    //   component: () => import("@/pages/tenants/default-tenant/Devices.vue"),
    //   meta: { title: "设备管理" }
    // },
    // {
    //   path: "devices/tracks",
    //   name: "Tracks",
    //   component: () => import("@/pages/tracks/TracksEntry.vue"),
    //   meta: { title: "设备轨迹" }
    // }
  ]
}
