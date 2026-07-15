// 保留历史前缀以避免升级后强制用户重新登录或丢失布局偏好；新版本不再新增该模板命名。
const SYSTEM_NAME = "v3-admin-vite"

/** 缓存数据时用到的 Key */
export class CacheKey {
  static readonly TOKEN = `${SYSTEM_NAME}-token-key`
  static readonly REFRESH_TOKEN = `${SYSTEM_NAME}-refresh-token-key`
  static readonly CONFIG_LAYOUT = `${SYSTEM_NAME}-config-layout-key`
  static readonly SIDEBAR_STATUS = `${SYSTEM_NAME}-sidebar-status-key`
  static readonly ACTIVE_THEME_NAME = `${SYSTEM_NAME}-active-theme-name-key`
  static readonly VISITED_VIEWS = `${SYSTEM_NAME}-visited-views-key`
  static readonly CACHED_VIEWS = `${SYSTEM_NAME}-cached-views-key`
  static readonly REMEMBER_ACCOUNT_KEY = `${SYSTEM_NAME}-remember-account-key`
  static readonly SAVED_USERNAME_KEY = `${SYSTEM_NAME}-saved-username-key`
}
