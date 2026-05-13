import type { RouteRecordRaw } from "vue-router"
import type { Project } from "@/common/apis/projects/type"
import { getTianjinRoute } from "./tianjin/route"

export function getProjectRoutes(project: Project): RouteRecordRaw[] {
  if (project.projectCode === "QHH0180-2025187") {
    return getTianjinRoute(project)
  }
  return []
}
