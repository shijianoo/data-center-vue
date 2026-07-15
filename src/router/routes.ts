import type { RouteRecordRaw } from "vue-router"
import { dataCenterRoutes } from "./data-center-route"
import { deviceCenterRoutes } from "./device-center-route"

const Layouts = () => import("@/layouts/index.vue")

/**
 * `/console` 的稳定骨架。
 *
 * 四个 children 只负责通用兜底。租户模块编译出的精确实例路由会由 Runtime 注册为
 * TenantRoot 的同级 child，并凭 Vue Router 的静态/约束参数排序优先命中。
 */
export const tenantRoutes: RouteRecordRaw = {
  path: "/console",
  name: "TenantRoot",
  component: () => import("@/layouts/TenantLayout.vue"),
  meta: { hidden: true },
  children: [
    {
      path: ":tenantKey",
      name: "TenantIndex",
      component: () => import("@/pages/tenants/TenantEntry.vue")
    },
    {
      path: ":tenantKey/projects/:projectKey",
      name: "Project",
      component: () => import("@/pages/projects/ProjectEntry.vue")
    },
    {
      path: ":tenantKey/projects/:projectKey/devices/:deviceCode",
      name: "Device",
      component: () => import("@/pages/devices/DeviceEntry.vue")
    },
    {
      path: ":tenantKey/projects/:projectKey/devices/:deviceCode/history",
      name: "History",
      component: () => import("@/pages/devices/HistoryEntry.vue")
    }
  ]
}

export const constantRoutes: RouteRecordRaw[] = [
  // 登录前也必须存在的基础页面；这些路由不依赖用户角色或后端菜单。
  {
    path: "/redirect",
    component: Layouts,
    meta: { hidden: true },
    children: [{ path: ":path(.*)", component: () => import("@/pages/redirect/index.vue") }]
  },
  { path: "/403", component: () => import("@/pages/error/403.vue"), meta: { hidden: true } },
  {
    path: "/404",
    component: () => import("@/pages/error/404.vue"),
    meta: { hidden: true },
    alias: "/:pathMatch(.*)*"
  },
  { path: "/login", component: () => import("@/pages/login/index.vue"), meta: { hidden: true } },
  {
    path: "/",
    component: () => import("@/layouts/TenantLayout.vue"),
    meta: { title: "返回平台前端", breadcrumb: false, svgIcon: "return-frontend" }
  },
  tenantRoutes
]

export const dynamicRoutes: RouteRecordRaw[] = [
  // 数据中心历史页面仍按原有角色逻辑生成，不属于租户 Console Runtime。
  ...dataCenterRoutes,
  // 平台后台统一挂在 /admin；Permission Store 会按 meta.roles 过滤后整批注册。
  {
    path: "/admin",
    name: "admin",
    component: Layouts,
    meta: {
      title: "平台管理",
      roles: ["platform_admin", "platform_ops"],
      svgIcon: "sys-setting"
    },
    children: [
      {
        path: "tenants",
        component: () => import("@/pages/system/tenant/index.vue"),
        name: "Tenants",
        meta: { title: "租户管理", svgIcon: "tenant-mgr", roles: ["platform_admin"] }
      },
      {
        path: "projects",
        component: () => import("@/pages/system/projects/index.vue"),
        name: "Projects",
        meta: { title: "项目管理", svgIcon: "project-mgr", roles: ["platform_admin"] }
      },
      {
        path: "users",
        component: () => import("@/pages/system/users/index.vue"),
        name: "Users",
        meta: { title: "用户管理", svgIcon: "users-mgr", roles: ["platform_admin"] }
      },
      {
        path: "roles",
        component: () => import("@/pages/system/roles/index.vue"),
        name: "Roles",
        meta: { title: "角色管理", svgIcon: "roles-mgr", roles: ["platform_admin"] }
      },
      {
        path: "menus",
        component: () => import("@/pages/system/menus/index.vue"),
        name: "Menus",
        meta: { title: "菜单管理", svgIcon: "menus-mgr", roles: ["platform_admin"] }
      },
      {
        path: "permissions",
        component: () => import("@/pages/system/permissions/index.vue"),
        name: "Permissions",
        meta: { title: "权限管理", svgIcon: "permissions-mgr", roles: ["platform_admin"] }
      },
      ...deviceCenterRoutes,
      {
        path: "data-check",
        name: "DataCheck",
        meta: { title: "数据检查", roles: ["platform_admin"] },
        children: [
          {
            path: "data-source",
            name: "DataSource",
            component: () => import("@/pages/system/data-check/data-source/index.vue"),
            meta: { title: "数据源" }
          },
          {
            path: "data-point",
            name: "DataPoint",
            component: () => import("@/pages/system/data-check/data-point/index.vue"),
            meta: { title: "数据点" }
          },
          {
            path: "rule-definition",
            name: "RuleDefinition",
            component: () => import("@/pages/system/data-check/rule-definition/index.vue"),
            meta: { title: "规则定义" }
          },
          {
            path: "rule-binding",
            name: "RuleBinding",
            component: () => import("@/pages/system/data-check/rule-binding/index.vue"),
            meta: { title: "规则绑定" }
          }
        ]
      }
    ]
  }
]
