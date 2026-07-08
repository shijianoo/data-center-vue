import type { RouteRecordRaw } from "vue-router"

const Layouts = () => import("@/layouts/index.vue")
export const dataCenterRoutes: RouteRecordRaw[] = [
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
          title: "数据趋势"
        }
      },
      {
        path: "detail-data",
        component: () => import("@/pages/data-center/wave-buoy/DetailData.vue"),
        name: "WaveBuoyDetailData",
        meta: {
          title: "详细数据"
        }
      }
    ]
  }
]
