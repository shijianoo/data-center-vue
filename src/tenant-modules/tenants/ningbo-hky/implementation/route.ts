import type { RouteRecordRaw } from "vue-router"
import type { Tenant } from "@/common/apis/tenant/type"

// eslint-disable-next-line unused-imports/no-unused-vars
export function getNingboHKYRoute(tenant: Tenant): RouteRecordRaw[] {
  return [
    {
      path: "",
      name: "NingboHKYGpsData",
      component: () => import("@/tenant-modules/tenants/ningbo-hky/implementation/DeviceLocation/DeviceLocation.vue"),
      meta: { title: "GPS数据" }
    },
    {
      path: "history-data",
      name: "NingboHKYHistoryData",
      component: () => import("@/tenant-modules/tenants/ningbo-hky/implementation/history/HistoryLayout.vue"),
      redirect: { name: "NingboHKYHistoryBuoyNB00" },
      meta: { title: "历史数据", activeMatch: "prefix" },
      children: [
        {
          path: "buoy",
          name: "NingboHKYHistoryBuoy",
          redirect: { name: "NingboHKYHistoryBuoyNB00" },
          meta: { title: "浮标数据", hidden: true },
          children: [
            {
              path: "NB00",
              name: "NingboHKYHistoryBuoyNB00",
              component: () => import("@/tenant-modules/tenants/ningbo-hky/implementation/history/buoy/pages/NB00.vue"),
              meta: { title: "NB00", hidden: true }
            },
            {
              path: "NB01",
              name: "NingboHKYHistoryBuoyNB01",
              component: () => import("@/tenant-modules/tenants/ningbo-hky/implementation/history/buoy/pages/NB01.vue"),
              meta: { title: "NB01", hidden: true }
            },
            {
              path: "NB02",
              name: "NingboHKYHistoryBuoyNB02",
              component: () => import("@/tenant-modules/tenants/ningbo-hky/implementation/history/buoy/pages/NB02.vue"),
              meta: { title: "NB02", hidden: true }
            },
            {
              path: "NB03",
              name: "NingboHKYHistoryBuoyNB03",
              component: () => import("@/tenant-modules/tenants/ningbo-hky/implementation/history/buoy/pages/NB03.vue"),
              meta: { title: "NB03", hidden: true }
            },
            {
              path: "NB04",
              name: "NingboHKYHistoryBuoyNB04",
              component: () => import("@/tenant-modules/tenants/ningbo-hky/implementation/history/buoy/pages/NB04.vue"),
              meta: { title: "NB04", hidden: true }
            },
            {
              path: "NB05",
              name: "NingboHKYHistoryBuoyNB05",
              component: () => import("@/tenant-modules/tenants/ningbo-hky/implementation/history/buoy/pages/NB05.vue"),
              meta: { title: "NB05", hidden: true }
            },
            {
              path: "NB06",
              name: "NingboHKYHistoryBuoyNB06",
              component: () => import("@/tenant-modules/tenants/ningbo-hky/implementation/history/buoy/pages/NB06.vue"),
              meta: { title: "NB06", hidden: true }
            },
            {
              path: "NB07",
              name: "NingboHKYHistoryBuoyNB07",
              component: () => import("@/tenant-modules/tenants/ningbo-hky/implementation/history/buoy/pages/NB07.vue"),
              meta: { title: "NB07", hidden: true }
            },
            {
              path: "NB08",
              name: "NingboHKYHistoryBuoyNB08",
              component: () => import("@/tenant-modules/tenants/ningbo-hky/implementation/history/buoy/pages/NB08.vue"),
              meta: { title: "NB08", hidden: true }
            }
          ]
        },
        {
          path: "shore",
          name: "NingboHKYHistoryShore",
          redirect: { name: "NingboHKYHistoryShoreNB09" },
          meta: { title: "岸基站数据", hidden: true },
          children: [
            {
              path: "NB09",
              name: "NingboHKYHistoryShoreNB09",
              component: () => import("@/tenant-modules/tenants/ningbo-hky/implementation/history/shore/pages/NB09.vue"),
              meta: { title: "NB09", hidden: true }
            },
            {
              path: "NB10",
              name: "NingboHKYHistoryShoreNB10",
              component: () => import("@/tenant-modules/tenants/ningbo-hky/implementation/history/shore/pages/NB10.vue"),
              meta: { title: "NB10", hidden: true }
            },
            {
              path: "NB11",
              name: "NingboHKYHistoryShoreNB11",
              component: () => import("@/tenant-modules/tenants/ningbo-hky/implementation/history/shore/pages/NB11.vue"),
              meta: { title: "NB11", hidden: true }
            }
          ]
        }
      ]
    }
  ]
}
