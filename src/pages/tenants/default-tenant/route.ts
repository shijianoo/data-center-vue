import type { RouteRecordRaw } from "vue-router"
import type { Tenant } from "@/common/apis/tenant/type"

export function getDefaultMenu(tenant: Tenant): RouteRecordRaw[] {
  console.log("生成默认租户的自定义路由", tenant)
  // return [
  //   {
  //     path: "",
  //     name: "Overview",
  //     component: () => import("@/pages/tenants/default-tenant/Overview.vue"),
  //     meta: { title: "总览", isMenu: true }
  //   },
  //   {
  //     path: "devices",
  //     name: "Devices",
  //     component: () => import("@/pages/tenants/default-tenant/Devices.vue"),
  //     meta: { title: "设备管理", isMenu: true }
  //   },
  //   {
  //     path: "devices/tracks",
  //     name: "Tracks",
  //     component: () => import("@/pages/tracks/TracksEntry.vue"),
  //     meta: { title: "设备轨迹", isMenu: true }
  //   }
  // ]
  return []
}
