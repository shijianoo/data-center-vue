import type { RouteRecordRaw } from "vue-router"
import type { Project } from "@/common/apis/projects/type"
import { getNingboHKYRoute } from "./ningbo-hky/liangwan-1/route"
import { getLiangWanRoute } from "./ningbo-hky/liangwan-2/route"
import { getTianjinRoute } from "./tianjin/route"

export function getProjectRoutes(project: Project): RouteRecordRaw[] {
  if (project.projectCode === "QHH0180-2025187") {
    return getTianjinRoute(project)
  } else if (project.projectCode === "QHH0148-2026184-1") {
    return getNingboHKYRoute(project)
  } else if (project.projectCode === "QHH0148-2026184-2") {
    return getLiangWanRoute(project)
  }
  return []
}
