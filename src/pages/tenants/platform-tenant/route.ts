import type { RouteRecordRaw } from "vue-router"
import type { Tenant } from "@/common/apis/tenant/type"

// eslint-disable-next-line unused-imports/no-unused-vars
export function getPlatformRoute(tenant: Tenant): RouteRecordRaw[] {
  return [
    // {
    //   path: "",
    //   name: "index",
    //   component: () => import("@/pages/tenants/platform-tenant/Overview.vue"),
    //   meta: { title: "概览" }
    // },
    // {
    //   path: "tenants",
    //   name: "tenants",
    //   component: () => import("@/pages/tenants/platform-tenant/Tenants.vue"),
    //   meta: { title: "客户管理" }
    // },
    // {
    //   path: "settings",
    //   name: "settings",
    //   component: () => import("@/pages/tenants/platform-tenant/Settings.vue"),
    //   meta: { title: "系统设置" }
    // }
  ]
}
