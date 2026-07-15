import type { RouteRecordRaw } from "vue-router"
import type { Project } from "@/common/apis/projects/type"

export function getTianjinRoute(tenant: Project): RouteRecordRaw[] {
  console.log("生成平台租户的自定义路由", tenant)
  return [
    {
      path: "",
      name: "index",
      component: () => import("@/tenant-modules/project-profiles/tianjin/implementation/DeviceLocation.vue"),
      meta: { title: "设备位置", logoTitle: { primary: "天津项目", sub: "天津港保税区规划国土和建设交通局" } }
    },
    {
      path: "history-data",
      name: "HistoryData",
      meta: { title: "历史数据" },
      redirect: { name: "tianjin-shore" },
      children: [
        {
          path: "shore",
          name: "tianjin-shore",
          component: () => import("@/tenant-modules/project-profiles/tianjin/implementation/ShoreData.vue"),
          meta: { title: "岸基站", logoTitle: { primary: "天津项目 - 岸基站历史数据", sub: "天津港保税区规划国土和建设交通局" } }
        },
        {
          path: "buoy",
          name: "tianjin-buoy",
          component: () => import("@/tenant-modules/project-profiles/tianjin/implementation/BuoyData.vue"),
          meta: { title: "浮标数据", logoTitle: { primary: "天津项目 - 浮标历史数据", sub: "天津港保税区规划国土和建设交通局" } }
        }
      ]
    }
  ]
}
