import type { RouteRecordRaw } from "vue-router"

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
