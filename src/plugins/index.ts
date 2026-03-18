import type { App } from "vue"
import { installElementPlusIcons } from "./element-plus-icons"
import { installPermissionDirective } from "./permission-directive"
import { installRoleDirective } from "./roles-directive"
import { installRoleEnableDirective } from "./roles-enable-directive"
import { installSvgIcon } from "./svg-icon"
import { installVxeTable } from "./vxe-table"

export function installPlugins(app: App) {
  installElementPlusIcons(app)
  installPermissionDirective(app)
  installRoleDirective(app)
  installRoleEnableDirective(app)
  installSvgIcon(app)
  installVxeTable(app)
}
