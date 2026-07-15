import type { RouteRecordRaw } from "vue-router"

/**
 * 平台设备管理区的子路由。
 *
 * 本数组被展开到 `/admin` children 中，因此 path 必须保持相对语义；页面级权限继续写在
 * meta.roles，由 Permission Store 与全局 Guard 共同处理。
 */
export const deviceCenterRoutes: RouteRecordRaw[] = [
  {
    path: "/device-center",
    name: "DeviceCenter",
    meta: {
      title: "设备中⼼",
      svgIcon: "device-center"
    },
    children: [
      {
        path: "device-models",
        component: () => import("@/pages/device-center/device-models/index.vue"),
        name: "DeviceModels",
        meta: {
          title: "设备型号",
          roles: ["platform_admin"]
        }
      },
      {
        path: "devices",
        component: () => import("@/pages/device-center/devices/index.vue"),
        name: "Devices",
        meta: {
          title: "设备管理",
          roles: ["platform_admin"]
        }
      },
      {
        path: "device-control",
        component: () => import("@/pages/device-center/device-control/index.vue"),
        name: "DeviceControl",
        meta: {
          title: "设备控制",
          roles: ["platform_admin"]
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
