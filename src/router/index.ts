import type { RouteRecordRaw } from "vue-router"
import { createRouter } from "vue-router"
import { routerConfig } from "@/router/config"
import { registerNavigationGuard } from "@/router/guard"
import { flatMultiLevelRoutes } from "./helper"

const Layouts = () => import("@/layouts/index.vue")

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
  // {
  //   path: "/",
  //   component: Layouts,
  //   redirect: "/data-center",
  //   children: [
  //     {
  //       path: "dashboard",
  //       component: () => import("@/pages/dashboard/index.vue"),
  //       name: "Dashboard",
  //       meta: {
  //         title: "首页",
  //         svgIcon: "dashboard",
  //         affix: true
  //       }
  //     }
  //   ]
  // },
  {
    path: "/data-center",
    component: Layouts,
    name: "DataCenter",
    meta: {
      title: "数据中心",
      svgIcon: "data-center",
      alwaysShow: true
    },
    children: [
      {
        path: "wave-buoy",
        name: "WaveBuoy",
        component: () => import("@/pages/data-center/wave-buoy/index.vue"),
        meta: {
          title: "波浪浮标"
        },
        props: true
      },
      {
        path: "weather-buoy",
        name: "WeatherBuoy",
        component: () => import("@/pages/data-center/weather-buoy/index.vue"),
        meta: {
          title: "气象浮标"
        },
        props: true
      }
    ]
  },
  {
    path: "/raw-data",
    component: Layouts,
    name: "RawData",
    meta: {
      title: "原始数据",
      svgIcon: "data-base"
    },
    children: [
      {
        path: "bei-dou",
        name: "BeiDou",
        component: () => import("@/pages/raw-data/bei-dou/index.vue"),
        meta: {
          title: "北斗数据"
        },
        props: true
      },
      {
        path: "iridium",
        name: "Iridium",
        component: () => import("@/pages/raw-data/iridium/index.vue"),
        meta: {
          title: "铱星数据"
        },
        props: true
      }
    ]
  },
  {
    path: "/device-center",
    component: Layouts,
    redirect: "/device-center/device-models",
    name: "DeviceCenter",
    meta: {
      title: "设备中心",
      alwaysShow: true,
      svgIcon: "device-center"
    },
    children: [
      {
        path: "device-models",
        component: () => import("@/pages/device-center/device-models/index.vue"),
        name: "DeviceModels",
        meta: {
          title: "设备型号"
        }
      },
      {
        path: "devices",
        component: () => import("@/pages/device-center/devices/index.vue"),
        name: "Devices",
        meta: {
          title: "设备实例"
        }
      },
      {
        path: "firmwares",
        component: () => import("@/pages/device-center/firmwares/index.vue"),
        name: "Firmwares",
        meta: {
          title: "固件管理"
        }
      }
    ]
  }
]

/**
 * @name 动态路由
 * @description 用来放置有权限 (Roles 属性) 的路由
 * @description 必须带有唯一的 Name 属性
 */
export const dynamicRoutes: RouteRecordRaw[] = [
  // {
  //   path: "/permission",
  //   component: Layouts,
  //   redirect: "/permission/page-level",
  //   name: "Permission",
  //   meta: {
  //     title: "权限演示",
  //     elIcon: "Lock",
  //     // 可以在根路由中设置角色
  //     roles: ["admin", "editor"],
  //     alwaysShow: true
  //   },
  //   children: [
  //     {
  //       path: "page-level",
  //       component: () => import("@/pages/demo/permission/page-level.vue"),
  //       name: "PermissionPageLevel",
  //       meta: {
  //         title: "页面级",
  //         // 或者在子路由中设置角色
  //         roles: ["admin"]
  //       }
  //     },
  //     {
  //       path: "button-level",
  //       component: () => import("@/pages/demo/permission/button-level.vue"),
  //       name: "PermissionButtonLevel",
  //       meta: {
  //         title: "按钮级",
  //         // 如果未设置角色，则表示：该页面不需要权限，但会继承根路由的角色
  //         roles: undefined
  //       }
  //     }
  //   ]
  // }
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
