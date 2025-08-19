// 静态 SVG 图标名称列表 - 用于解决生产环境虚拟模块加载问题
export const staticSvgNames = [
  "dashboard",
  "data-base",
  "data-center",
  "device-center",
  "fullscreen-exit",
  "fullscreen",
  "keyboard-down",
  "keyboard-enter",
  "keyboard-esc",
  "keyboard-up",
  "menus-mgr",
  "permissions-mgr",
  "roles-mgr",
  "search",
  "sys-setting",
  "users-mgr"
] as const

export type StaticSvgName = typeof staticSvgNames[number]
