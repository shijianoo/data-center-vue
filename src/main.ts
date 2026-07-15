/* eslint-disable perfectionist/sort-imports */

// core
import { pinia } from "@/pinia"
import { router } from "@/router"
import { setSessionExpirationHandler } from "@/framework/session/session-manager"
import { useUserStore } from "@/pinia/stores/user"
import { installPlugins } from "@/plugins"
import App from "@/App.vue"
// css
import "normalize.css"
import "nprogress/nprogress.css"
import "element-plus/theme-chalk/dark/css-vars.css"
import "@@/assets/styles/index.scss"
import "virtual:uno.css"

// 创建应用实例
const app = createApp(App)

// 安装插件（全局组件、自定义指令等）
installPlugins(app)

// Pinia 必须先安装；Router guard 和统一会话过期处理都会读取 User Store。
app.use(pinia)
setSessionExpirationHandler(() => {
  useUserStore(pinia).logout()
  void router.replace("/login")
})
app.use(router)

// router 准备就绪后挂载应用
router.isReady().then(() => {
  app.mount("#app")
})
