import type { RouteRecordRaw } from "vue-router"
import type { Project } from "@/common/apis/projects/type"

/**
 * 两湾二期仅配置五个顶部业务菜单。
 * 每个业务页面内部的二级菜单由 el-menu + 异步 component 承载，不再创建子路由。
 */
export function getLiangWanRoute(project: Project): RouteRecordRaw[] {
  const logoTitle = { primary: project.name || "两湾一港数据平台", sub: "海洋生态环境监测" }
  return [
    {
      path: "",
      name: "NingboHKY2SiteMap",
      component: () => import("./site-map/SiteMap.vue"),
      meta: { title: "站点地图", logoTitle }
    },
    {
      path: "data-query",
      name: "NingboHKY2DataQuery",
      component: () => import("./data-query/DataQuery.vue"),
      meta: { title: "数据查询", logoTitle }
    },
    {
      path: "data-review",
      name: "NingboHKY2DataReview",
      component: () => import("./data-review/DataReview.vue"),
      meta: { title: "数据审核", logoTitle }
    },
    {
      path: "statistics",
      name: "NingboHKY2Statistics",
      component: () => import("./statistics/StatisticsAnalysis.vue"),
      meta: { title: "统计分析", logoTitle }
    },
    {
      path: "operations",
      name: "NingboHKY2Operations",
      component: () => import("./operations/OperationsManagement.vue"),
      meta: { title: "运维管理", logoTitle }
    }
  ]
}
