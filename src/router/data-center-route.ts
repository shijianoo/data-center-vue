import type { RouteRecordRaw } from "vue-router"

const Layouts = () => import("@/layouts/index.vue")

/**
 * 平台数据展示区的预配置动态路由。
 *
 * 这里是普通后台路由定义，不应放入某个租户的专属页面；租户级定制统一进入
 * 对应租户模块目录内的 `manifest.ts`，否则会绕过 Console 的上下文和卸载机制。
 */
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
          title: "气象浮标"
        }
      },
      {
        path: "drift-buoy-v1-t1",
        component: () => import("@/pages/data-center/sob10v1t1/index.vue"),
        name: "DriftBuoyV1T1",
        meta: {
          title: "小型漂流浮标"
        }
      }
    ]
  },
  {
    path: "/qhh0284",
    component: Layouts,
    meta: {
      title: "热带所",
      svgIcon: "data-center"
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
      svgIcon: "wave-buoy"
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
      svgIcon: "data-base"
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
        component: () => import("@/pages/raw-data/iridium/index.vue"),
        name: "DetailData",
        meta: {
          title: "铱星数据"
        }
      }
    ]
  }
]
