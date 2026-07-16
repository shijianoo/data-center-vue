import type { RouteRecordRaw } from "vue-router"
import type { Project } from "@/common/apis/projects/type"
import { getLiangwanRoute } from "./liangwan/route"
import { getTianjinRoute } from "./tianjin/route"

export function getProjectRoutes(project: Project): RouteRecordRaw[] {
  if (project.projectCode === "QHH0180-2025187") {
    return getTianjinRoute(project)
  }
  if (project.projectCode === "p-11223344") {
    return getLiangwanRoute(project)
  }
  return []
}
