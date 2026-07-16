import type { RouteRecordRaw } from "vue-router"
import type { Project } from "@/common/apis/projects/type"

/** 梁湾项目只保留业务大类路由；大类内的功能由页面左侧菜单切换。 */
export function getLiangwanRoute(_project: Project): RouteRecordRaw[] {
  return [
    {
      path: "",
      name: "liangwan-map",
      component: () => import("./StationMap.vue"),
      meta: { title: "站点地图", logoTitle: { primary: "两湾一港" } }
    },
    {
      path: "data",
      name: "liangwan-data",
      component: () => import("./DataManagement.vue"),
      meta: { title: "数据管理", logoTitle: { primary: "两湾一港" } }
    },
    {
      path: "statistics",
      name: "liangwan-statistics",
      component: () => import("./StatisticsAnalysis.vue"),
      meta: { title: "统计分析", logoTitle: { primary: "两湾一港" } }
    },
    {
      path: "operations",
      name: "liangwan-operations",
      component: () => import("./OperationsManagement.vue"),
      meta: { title: "运维管理", logoTitle: { primary: "两湾一港" } }
    }
  ]
}
