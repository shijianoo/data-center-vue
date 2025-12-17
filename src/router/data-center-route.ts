import type { RouteRecordRaw } from "vue-router"

const Layouts = () => import("@/layouts/index.vue")
export const dataCenterRoutes: RouteRecordRaw[] = [
  {
    path: "/data-center",
    component: Layouts,
    meta: {
      title: "数据中⼼",
      svgIcon: "data-center",
      alwaysShow: true
    },
    children: [
      {
        path: "weather-buoy",
        component: () => import("@/pages/data-center/weather-buoy/index.vue"),
        name: "WeatherBuoy",
        meta: {
          title: "气象浮标",
          roles: ["data-center:weather-buoy"]
        }
      }
    ]
  },
  {
    path: "/qhh0284",
    component: Layouts,
    meta: {
      title: "热带所",
      svgIcon: "data-center",
      roles: ["data-center:redaisuo"]
    },
    children: [
      {
        path: "ct-chain",
        component: () => import("@/pages/redaisuo/CTChain.vue"),
        name: "CTChain",
        meta: {
          title: "温盐链"
        }
      },
      {
        path: "tidal",
        component: () => import("@/pages/redaisuo/Tidal.vue"),
        name: "Tidal",
        meta: {
          title: "验潮井"
        }
      }
    ]
  },
  {
    path: "/wave-buoy",
    component: Layouts,
    meta: {
      title: "波浪浮标",
      svgIcon: "wave-buoy",
      roles: ["data-center:wave-buoy"]
    },
    children: [
      {
        path: "dashboard",
        component: () => import("@/pages/data-center/wave-buoy/Dashboard.vue"),
        name: "WaveBuoyIndex",
        meta: {
          title: "设备总览"
        }
      },
      {
        path: "detail-data",
        component: () => import("@/pages/data-center/wave-buoy/DetailData.vue"),
        name: "WaveBuoyDetailData",
        meta: {
          title: "详细数据"
        }
      },
      {
        path: "status-data",
        component: () => import("@/pages/data-center/wave-buoy/StatusData.vue"),
        name: "WaveBuoyStatusData",
        meta: {
          title: "状态数据"
        }
      }
    ]
  },
  {
    path: "/raw-data",
    component: Layouts,
    meta: {
      title: "原始数据",
      svgIcon: "data-base",
      roles: ["data-center:raw-data"]
    },
    children: [
      {
        path: "dashboard",
        component: () => import("@/pages/raw-data/bei-dou/index.vue"),
        name: "BeiDou",
        meta: {
          title: "北斗数据"
        }
      },
      {
        path: "detail-data",
        component: () => import("@/pages/raw-data/bei-dou/index.vue"),
        name: "DetailData",
        meta: {
          title: "铱星数据"
        }
      }
    ]
  }
]
