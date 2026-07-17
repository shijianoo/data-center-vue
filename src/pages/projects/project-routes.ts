import type { RouteRecordRaw } from "vue-router"
import type { Project } from "@/common/apis/projects/type"
import { getNingboHKYRoute } from "./ningbo-hky/liangwan-1/route"
import { getLiangWanRoute } from "./ningbo-hky/liangwan-2/route"
import { getTianjinRoute } from "./tianjin/route"

export function getProjectRoutes(project: Project): RouteRecordRaw[] {
  if (project.projectCode === "QHH0180-2025187") {
    return getTianjinRoute(project)
  } else if (project.projectCode === "4324234234") {
    return getNingboHKYRoute(project)
  } else if (project.projectCode === "P-123456") {
    return getLiangWanRoute(project)
  }
  return []
}
