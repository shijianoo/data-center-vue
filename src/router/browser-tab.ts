import type { RouteLocationNormalizedLoaded, Router } from "vue-router"
import { useTitle } from "@@/composables/useTitle"
import { useTenantContextStore } from "@/pinia/stores/tenantContext"

const { setDocumentTitle } = useTitle()

const APP_TITLE = import.meta.env.VITE_APP_TITLE ?? "V3 Admin Vite"
const ADMIN_TITLE_PREFIX = "平台管理"
const DEFAULT_FAVICON = "/logo.jpg"

/** 前台 Logo 标题结构：和 route.meta.logoTitle / useLogoTitle 保持一致 */
type LogoTitle = NonNullable<RouteLocationNormalizedLoaded["meta"]["logoTitle"]>
/** 浏览器标题配置：来自 route.meta.browserTitle */
type BrowserTitleMeta = RouteLocationNormalizedLoaded["meta"]["browserTitle"]

/**
 * 统一清洗标题片段。
 * - 非字符串直接忽略，避免把 undefined/null/Object 渲染进浏览器标题
 * - 字符串 trim，避免出现空白标题片段
 */
function normalizeTitlePart(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

/**
 * 拼接浏览器标题。
 * 空片段会被过滤；如果最终没有可用标题，则回退到应用名。
 */
function joinTitle(parts: Array<string | undefined>) {
  return parts.map(normalizeTitlePart).filter(Boolean).join(" | ") || APP_TITLE
}

/**
 * 获取当前租户在浏览器标题中的默认展示名。
 * 优先级和 TenantLogo 接近：运行期覆盖 > displayName > shortName > name。
 */
function getTenantDisplayName() {
  const tenantContextStore = useTenantContextStore()
  const tenant = tenantContextStore.currentTenant
  return normalizeTitlePart(tenantContextStore.logoTitle?.primary)
    || normalizeTitlePart(tenant?.displayName)
    || normalizeTitlePart(tenant?.shortName)
    || normalizeTitlePart(tenant?.name)
}

/**
 * 从当前匹配到的路由链里取最后一个 logoTitle。
 * 使用 matched 而不是 to.meta，是为了兼容父子路由都定义 meta 时，
 * 明确以最深层页面的配置为准。
 */
function getRouteLogoTitle(to: RouteLocationNormalizedLoaded): LogoTitle | undefined {
  return to.matched
    .map(route => route.meta.logoTitle)
    .filter(Boolean)
    .at(-1)
}

/**
 * 从当前匹配到的路由链里取最后一个页面标题。
 * 后台标题、非租户页面标题都以最深层 meta.title 为准。
 */
function getRouteTitle(to: RouteLocationNormalizedLoaded) {
  return to.matched
    .map(route => route.meta.title)
    .filter(Boolean)
    .at(-1)
}

/**
 * 获取最深层路由显式声明的浏览器标题配置。
 * browserTitle 允许为：
 * - string：直接指定标题
 * - false：前台页面强制只使用租户名
 * - function：根据租户/项目/设备上下文动态生成标题
 */
function resolveBrowserTitleMeta(to: RouteLocationNormalizedLoaded): BrowserTitleMeta | undefined {
  return to.matched
    .map(route => route.meta.browserTitle)
    .filter(value => value !== undefined)
    .at(-1)
}

/**
 * 解析前台租户页面的浏览器标题。
 *
 * 默认优先级：
 * browserTitle 函数/字符串 > 运行期 logoTitle.primary > route.meta.logoTitle.primary
 * > 租户展示名 > route.meta.title
 */
function resolveTenantBrowserTitle(to: RouteLocationNormalizedLoaded) {
  const tenantContextStore = useTenantContextStore()
  const browserTitle = resolveBrowserTitleMeta(to)

  if (typeof browserTitle === "function") {
    return browserTitle({
      route: to,
      tenant: tenantContextStore.currentTenant,
      project: tenantContextStore.currentProject,
      device: tenantContextStore.currentDevice,
      logoTitle: tenantContextStore.logoTitle ?? getRouteLogoTitle(to)
    })
  }

  if (browserTitle === false) return getTenantDisplayName()
  if (typeof browserTitle === "string") return browserTitle

  return normalizeTitlePart(tenantContextStore.logoTitle?.primary)
    || normalizeTitlePart(getRouteLogoTitle(to)?.primary)
    || getTenantDisplayName()
    || normalizeTitlePart(getRouteTitle(to))
}

/**
 * 根据当前路由所属区域解析最终浏览器标题。
 *
 * - 后台 /admin：保留后台系统语义，使用“应用名 | 平台管理 | 页面名”
 * - 前台 /console/:tenantKey：使用租户品牌语义，不强行带后台应用名前缀
 * - 其他页面：使用通用“应用名 | 页面名”
 */
function resolveBrowserTitle(to: RouteLocationNormalizedLoaded) {
  if (to.path.startsWith("/admin")) {
    return joinTitle([APP_TITLE, ADMIN_TITLE_PREFIX, getRouteTitle(to)])
  }

  if (to.path.startsWith("/console/")) {
    return joinTitle([resolveTenantBrowserTitle(to)])
  }

  return joinTitle([APP_TITLE, getRouteTitle(to)])
}

/** 将解析后的完整标题写入 document.title */
function updateBrowserTitle(to: RouteLocationNormalizedLoaded) {
  setDocumentTitle(resolveBrowserTitle(to))
}

/**
 * 根据图片地址推断 favicon 的 MIME 类型。
 * favicon 不只支持 ico，现代浏览器也普遍支持 png/svg/jpeg 等格式。
 */
function inferFaviconType(url: string) {
  const dataType = url.match(/^data:(image\/[^;,]+)/)?.[1]
  if (dataType) return dataType

  const pathname = url.split(/[?#]/)[0].toLowerCase()
  if (pathname.endsWith(".svg")) return "image/svg+xml"
  if (pathname.endsWith(".png")) return "image/png"
  if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) return "image/jpeg"
  if (pathname.endsWith(".ico")) return "image/x-icon"
  if (pathname.endsWith(".webp")) return "image/webp"
  if (pathname.endsWith(".gif")) return "image/gif"
  return ""
}

/** 获取或创建页面 favicon 对应的 link 标签 */
function getFaviconLink() {
  let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']")
  if (!link) {
    link = document.createElement("link")
    link.rel = "icon"
    document.head.appendChild(link)
  }
  return link
}

/**
 * 写入浏览器页签图标。
 * 对同一个 href 不重复设置，减少浏览器不必要的图标重新加载。
 */
function setFavicon(href: string) {
  if (!document) return

  const link = getFaviconLink()
  if (link.href === new URL(href, window.location.origin).href) return

  link.href = href
  const type = inferFaviconType(href)
  if (type) {
    link.type = type
  } else {
    link.removeAttribute("type")
  }
}

/**
 * 根据当前路由更新浏览器图标。
 * 只有前台租户页面使用租户自定义 logoURL，其余页面恢复项目默认图标。
 */
function updateBrowserIcon(to: RouteLocationNormalizedLoaded) {
  if (!to.path.startsWith("/console/")) {
    setFavicon(DEFAULT_FAVICON)
    return
  }

  const tenantContextStore = useTenantContextStore()
  setFavicon(tenantContextStore.currentTenant?.extra?.logoURL || DEFAULT_FAVICON)
}

/** 更新浏览器页签标题和图标 */
export function updateBrowserTab(to: RouteLocationNormalizedLoaded) {
  updateBrowserTitle(to)
  updateBrowserIcon(to)
}

/**
 * 标记前台页签监听是否已经创建。
 * 这里不能在模块初始化时创建 store 监听，否则会早于 app.use(pinia)，
 * 导致 getActivePinia() 报错。
 */
let isTenantHeadWatcherReady = false

/**
 * 惰性创建前台页签信息监听器。
 *
 * useLogoTitle() 可以在组件挂载后动态覆盖 TenantLogo 展示文本，
 * 浏览器标题也需要同步变化；因此除了 afterEach 路由切换时更新标题，
 * 还要监听 tenantContextStore.logoTitle 的运行期变化。
 *
 * 租户也可能在运行期切换，或更新 extra.logoURL，因此浏览器图标也在这里同步。
 */
export function ensureTenantHeadWatcher(router: Router) {
  if (isTenantHeadWatcherReady) return
  isTenantHeadWatcherReady = true

  const tenantContextStore = useTenantContextStore()
  watch(
    () => [
      tenantContextStore.logoTitle,
      tenantContextStore.currentTenant?.extra?.logoURL
    ],
    () => updateBrowserTab(router.currentRoute.value),
    { deep: true }
  )
}
