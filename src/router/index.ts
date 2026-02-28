import type { RouteRecordRaw } from "vue-router"
import { createRouter } from "vue-router"
import { routerConfig } from "@/router/config"
import { registerNavigationGuard } from "@/router/guard"
import { deviceCenterRoutes } from "./device-center-route"
import { flatMultiLevelRoutes } from "./helper"

const Layouts = () => import("@/layouts/index.vue")

/**
 * @name 租户路由
 * @description 用来放置租户级别的路由
 */
export const tenantRoutes: RouteRecordRaw = {
  path: "/console/:tenantKey",
  component: () => import("@/layouts/TenantLayout.vue"),
  meta: {
    hidden: true
  },
  children:
  [
    {
      path: "",
      component: () => import("@/pages/tenants/TenantEntry.vue")
    },
    {
      path: "platform/tenants",
      component: () => import("@/pages/tenants/platform-tenant/Tenants.vue")
    },
    {
      path: "platform/settings",
      component: () => import("@/pages/tenants/platform-tenant/Settings.vue")
    },
    {
      path: "devices",
      component: () => import("@/pages/tenants/default-tenant/Devices.vue")
    },
    {
      path: "devices/tracks",
      component: () => import("@/pages/tracks/TracksEntry.vue")
    },
    {
      path: "projects/:projectKey",
      component: () => import("@/pages/projects/ProjectEntry.vue")
    },
    {
      path: "projects/:projectKey/devices/:deviceCode",
      component: () => import("@/pages/devices/DeviceEntry.vue")
    },
    {
      path: "projects/:projectKey/devices/:deviceCode/history",
      component: () => import("@/pages/devices/HistoryEntry.vue")
    }
  ]
}

/**
 * @name 常驻路由
 * @description 除了 redirect/403/404/login 等隐藏页面，其他页面建议设置唯一的 Name 属性
 */
export const constantRoutes: RouteRecordRaw[] = [
  {
    path: "/redirect",
    component: Layouts,
    meta: {
      hidden: true
    },
    children: [
      {
        path: ":path(.*)",
        component: () => import("@/pages/redirect/index.vue")
      }
    ]
  },
  {
    path: "/403",
    component: () => import("@/pages/error/403.vue"),
    meta: {
      hidden: true
    }
  },
  {
    path: "/404",
    component: () => import("@/pages/error/404.vue"),
    meta: {
      hidden: true
    },
    alias: "/:pathMatch(.*)*"
  },
  {
    path: "/login",
    component: () => import("@/pages/login/index.vue"),
    meta: {
      hidden: true
    }
  },
  {
    path: "/",
    component: () => import("@/layouts/TenantLayout.vue"),
    meta: {
      title: "进入平台前台",
      breadcrumb: false
    }
  },
  tenantRoutes
]

/**
 * @name 动态路由
 * @description 用来放置有权限 (Roles 属性) 的路由
 * @description 必须带有唯一的 Name 属性
 */
export const dynamicRoutes: RouteRecordRaw[] = [
  {
    path: "/admin",
    component: Layouts,
    meta: {
      title: "平台后台管理",
      roles: ["platform_admin"],
      svgIcon: "sys-setting"
    },
    children: [
      {
        path: "tenants",
        component: () => import("@/pages/system/tenant/index.vue"),
        name: "Tenants",
        meta: {
          title: "租户管理",
          svgIcon: "tenant-mgr"
        }
      },
      {
        path: "projects",
        component: () => import("@/pages/system/projects/index.vue"),
        name: "Projects",
        meta: {
          title: "项目管理",
          svgIcon: "project-mgr"
        }
      },
      {
        path: "users",
        component: () => import("@/pages/system/users/index.vue"),
        name: "Users",
        meta: {
          title: "用户管理",
          svgIcon: "users-mgr"
        }
      },
      {
        path: "roles",
        component: () => import("@/pages/system/roles/index.vue"),
        name: "Roles",
        meta: {
          title: "角色管理",
          svgIcon: "roles-mgr"
        }
      },
      {
        path: "menus",
        component: () => import("@/pages/system/menus/index.vue"),
        name: "Menus",
        meta: {
          title: "菜单管理",
          svgIcon: "menus-mgr"
        }
      },
      {
        path: "permissions",
        component: () => import("@/pages/system/permissions/index.vue"),
        name: "Permissions",
        meta: {
          title: "权限管理",
          svgIcon: "permissions-mgr"
        }
      },
      ...deviceCenterRoutes,
      {
        path: "data-check",
        name: "DataCheck",
        meta: {
          title: "数据检查"
        },
        children: [
          {
            path: "data-source",
            name: "DataSource",
            component: () => import("@/pages/system/data-check/data-source/index.vue"),
            meta: {
              title: "数据源"
            }
          },
          {
            path: "data-point",
            name: "DataPoint",
            component: () => import("@/pages/system/data-check/data-point/index.vue"),
            meta: {
              title: "数据点"
            }
          },
          {
            path: "rule-definition",
            name: "RuleDefinition",
            component: () => import("@/pages/system/data-check/rule-definition/index.vue"),
            meta: {
              title: "规则定义"
            }
          },
          {
            path: "rule-binding",
            name: "RuleBinding",
            component: () => import("@/pages/system/data-check/rule-binding/index.vue"),
            meta: {
              title: "规则绑定"
            }
          }
        ]
      }
    ]
  }
]

/** 路由实例 */
export const router = createRouter({
  history: routerConfig.history,
  routes: routerConfig.thirdLevelRouteCache ? flatMultiLevelRoutes(constantRoutes) : constantRoutes
})

/** 重置路由 */
export function resetRouter() {
  try {
    // 注意：所有动态路由路由必须带有 Name 属性，否则可能会不能完全重置干净
    router.getRoutes().forEach((route) => {
      const { name, meta } = route
      if (name && meta.roles?.length) {
        router.hasRoute(name) && router.removeRoute(name)
      }
    })
  } catch {
    // 强制刷新浏览器也行，只是交互体验不是很好
    location.reload()
  }
}

// 注册路由导航守卫
registerNavigationGuard(router)
