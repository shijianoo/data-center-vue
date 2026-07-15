import type { App } from "vue"
import { installPermissionDirective } from "./permission-directive"
import { installRoleDirective } from "./roles-directive"
import { installRoleEnableDirective } from "./roles-enable-directive"
import { installSvgIcon } from "./svg-icon"

export function installPlugins(app: App) {
  installPermissionDirective(app)
  installRoleDirective(app)
  installRoleEnableDirective(app)
  installSvgIcon(app)
}
