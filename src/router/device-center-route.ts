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
      alwaysShow: true
    },
    children: [
      {
        path: "device-models",
        component: () => import("@/pages/device-center/device-models/index.vue"),
        name: "DeviceModels",
        meta: {
          title: "设备型号",
          roles: ["device-mgr:models"]
        }
      },
      {
        path: "devices",
        component: () => import("@/pages/device-center/devices/index.vue"),
        name: "Devices",
        meta: {
          title: "设备管理",
          roles: ["device-mgr:devices"]
        }
      },
      {
        path: "firmwares",
        component: () => import("@/pages/device-center/firmwares/index.vue"),
        name: "Firmwares",
        meta: {
          title: "固件管理",
          roles: ["device-mgr:firmwares"]
        }
      }
    ]
  }
]
