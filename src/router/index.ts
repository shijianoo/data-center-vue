import { createRouter } from "vue-router"
import { tenantRouteRuntime } from "@/framework/tenant-console/runtime"
import { registerUserRouteCleanup } from "@/pinia/stores/user"
import { routerConfig } from "@/router/config"
import { clearDynamicRoutes } from "@/router/dynamic-runtime"
import { registerNavigationGuard } from "@/router/guard"
import { flatMultiLevelRoutes } from "./helper"
import { constantRoutes } from "./routes"

export { clearDynamicRoutes, replaceDynamicRoutes } from "./dynamic-runtime"
export { constantRoutes, dynamicRoutes, tenantRoutes } from "./routes"

export const router = createRouter({
  history: routerConfig.history,
  routes: routerConfig.thirdLevelRouteCache ? flatMultiLevelRoutes(constantRoutes) : constantRoutes
})

export function resetRouter() {
  clearDynamicRoutes()
  tenantRouteRuntime.clear()
}

registerUserRouteCleanup(resetRouter)
registerNavigationGuard(router)
