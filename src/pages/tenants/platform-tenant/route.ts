import type { RouteRecordRaw } from "vue-router"
import type { Tenant } from "@/common/apis/tenant/type"

export function getPlatformRoute(tenant: Tenant): RouteRecordRaw[] {
  console.log("生成平台租户的自定义路由", tenant)
  // return [
  //   {
  //     path: "",
  //     name: "index",
  //     component: () => import("@/pages/tenants/platform-tenant/Overview.vue"),
  //     meta: { title: "概览" }
  //   },
  //   {
  //     path: "tenants",
  //     name: "tenants",
  //     component: () => import("@/pages/tenants/platform-tenant/Tenants.vue"),
  //     meta: { title: "客户管理" }
  //   },
  //   {
  //     path: "settings",
  //     name: "settings",
  //     component: () => import("@/pages/tenants/platform-tenant/Settings.vue"),
  //     meta: { title: "系统设置" }
  //   }
  // ]
  return []
}
