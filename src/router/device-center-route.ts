import type { RouteRecordRaw } from "vue-router"

const Layouts = () => import("@/layouts/index.vue")
export const deviceCenterRoutes: RouteRecordRaw[] = [
  {
    path: "/device-center",
    component: Layouts,
    name: "DeviceCenter",
    meta: {
      title: "设备中⼼",
      svgIcon: "device-center",
      roles: ["platform_admin"]
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
          title: "设备管理"
        }
      }
    ]
  }
]
