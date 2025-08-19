import { DeviceEnum, SIDEBAR_CLOSED, SIDEBAR_OPENED } from "@@/constants/app-key"
import { CacheKey } from "@@/constants/cache-key"
import { getSidebarStatus, setSidebarStatus } from "@@/utils/cache/local-storage"
import { pinia } from "@/pinia"

interface Sidebar {
  opened: boolean
  withoutAnimation: boolean
}

/** 设置侧边栏状态本地缓存 */
function handleSidebarStatus(opened: boolean) {
  opened ? setSidebarStatus(SIDEBAR_OPENED) : setSidebarStatus(SIDEBAR_CLOSED)
}

export const useAppStore = defineStore("app", () => {
  // 侧边栏状态
  const sidebar: Sidebar = reactive({
    opened: getSidebarStatus() !== SIDEBAR_CLOSED,
    withoutAnimation: false
  })

  // 设备类型
  const device = ref<DeviceEnum>(DeviceEnum.Desktop)

  const isRememberAccount = ref<boolean>(localStorage.getItem(CacheKey.REMEMBER_ACCOUNT_KEY) === "true")
  const rememberAccount = ref<string>(localStorage.getItem(CacheKey.SAVED_USERNAME_KEY) || "")

  // 监听侧边栏 opened 状态
  watch(
    () => sidebar.opened,
    (opened) => {
      handleSidebarStatus(opened)
    }
  )

  // 保存记住账户信息
  const saveRememberedAccount = (username: string | null) => {
    if (username) {
      localStorage.setItem(CacheKey.REMEMBER_ACCOUNT_KEY, "true")
      localStorage.setItem(CacheKey.SAVED_USERNAME_KEY, username)
    } else {
      localStorage.removeItem(CacheKey.REMEMBER_ACCOUNT_KEY)
      localStorage.removeItem(CacheKey.SAVED_USERNAME_KEY)
    }
  }

  // 切换侧边栏
  const toggleSidebar = (withoutAnimation: boolean) => {
    sidebar.opened = !sidebar.opened
    sidebar.withoutAnimation = withoutAnimation
  }

  // 关闭侧边栏
  const closeSidebar = (withoutAnimation: boolean) => {
    sidebar.opened = false
    sidebar.withoutAnimation = withoutAnimation
  }

  // 切换设备类型
  const toggleDevice = (value: DeviceEnum) => {
    device.value = value
  }

  return {
    device,
    sidebar,
    isRememberAccount,
    rememberAccount,
    toggleSidebar,
    closeSidebar,
    toggleDevice,
    saveRememberedAccount
  }
})

/**
 * @description 在 SPA 应用中可用于在 pinia 实例被激活前使用 store
 * @description 在 SSR 应用中可用于在 setup 外使用 store
 */
export function useAppStoreOutside() {
  return useAppStore(pinia)
}
