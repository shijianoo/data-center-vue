<script setup lang="ts">
import { storeToRefs } from "pinia"
import { computed, ref } from "vue"
import { useRouter } from "vue-router"
import { useTenantContextStore } from "@/pinia/stores/tenantContext"
import { useUserStore } from "@/pinia/stores/user"
import DesktopNav from "./DesktopNav.vue"
import MobileMenu from "./MobileMenu.vue"
import TenantLogo from "./TenantLogo.vue"
import UserMenu from "./UserMenu.vue"

const userStore = useUserStore()
const tenantStore = useTenantContextStore()
const { activeNavigation } = storeToRefs(tenantStore)
const router = useRouter()
const showMobileMenu = ref(false)

/**
 * 是否有可见菜单项（决定是否显示汉堡按钮）— 用 activeNavRoutes 而非 tenantRoutes，
 *  这样项目/设备层有自定义菜单时也能正确显示，无菜单时正确隐藏
 */
const hasMenu = computed(() => activeNavigation.value.some(item => !item.hidden))

/** 平台租户的 key（供平台用户最终返回使用） */
const platformTenantCode = computed(() => {
  const tenant = userStore.tenants.find(t => t.type === 99)
  return tenant?.customDomain || tenant?.slug || tenant?.tenantCode
})

const pathContext = computed(() => {
  return {
    tenantKey: tenantStore.currentTenantKey,
    projectKey: tenantStore.currentProjectKey,
    deviceCode: tenantStore.currentDeviceCode,
    inHistory: tenantStore.isHistory
  }
})

/**
 * 返回按钮目标路径。
 * 规则：在项目路径（或其任意子路径）→ 返回租户首页
 *        在设备路径（或其任意子路径）→ 返回项目首页
 *        在历史路径（或其任意子路径）→ 返回设备首页
 *        普通租户首页                → 隐藏
 *        平台用户的业务租户页        → 返回平台
 *        平台用户的平台首页          → 隐藏
 */
const backPath = computed<string | null>(() => {
  const { tenantKey, projectKey, deviceCode, inHistory } = pathContext.value

  if (!tenantKey) return null

  const homePath = `/console/${tenantKey}`

  // 历史层（/history 及其子路径）→ 返回设备层
  if (inHistory && deviceCode && projectKey) {
    const projectPath = `${homePath}/projects/${projectKey}`
    return `${projectPath}/devices/${deviceCode}`
  }

  // 设备层（有 /devices/ 段）→ 返回项目层
  if (deviceCode && projectKey) {
    return `${homePath}/projects/${projectKey}`
  }

  // 项目层（有 /projects/ 段）→ 返回租户首页
  if (projectKey) {
    return homePath
  }

  // 租户层 & 平台用户 → 返回平台租户
  if (userStore.isPlatformUser && platformTenantCode.value) {
    if (tenantKey === platformTenantCode.value) return null
    return `/console/${platformTenantCode.value}`
  }

  // 普通租户首页：不显示
  return null
})

const backTitle = computed(() => {
  const { projectKey, deviceCode, inHistory } = pathContext.value
  if (inHistory) return "返回设备页"
  if (deviceCode) return "返回项目页"
  if (projectKey) return "返回首页"
  return "返回平台"
})

function handleBack() {
  if (backPath.value) router.push(backPath.value)
}
</script>

<template>
  <nav class="navbar" :class="{ 'has-nav': hasMenu }">
    <div class="nav-left">
      <!-- 返回按钮：多层级兜底，到顶隐藏 -->
      <button
        v-if="backPath"
        class="back-link"
        :title="backTitle"
        @click="handleBack"
      >
        <i class="fa-solid fa-arrow-left" />
        <span class="back-text">返回</span>
      </button>

      <!-- 移动端汉堡菜单 -->
      <button
        v-if="hasMenu"
        class="mobile-menu-btn"
        @click="showMobileMenu = true"
        aria-label="打开菜单"
      >
        <i class="fa-solid fa-bars" />
      </button>

      <!-- Logo -->
      <TenantLogo class="desktop-logo" />
    </div>

    <!-- 组件内部从 store 自取数据 -->
    <MobileMenu v-model:visible="showMobileMenu" />
    <DesktopNav />

    <div class="nav-right">
      <UserMenu />
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--header-h);
  background: var(--tenant-header-bg);
  color: var(--tenant-header-text);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  font-family:
    "Inter",
    -apple-system,
    sans-serif;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  overflow: hidden;
}

/* 返回按钮 */
.back-link {
  flex-shrink: 0;
  font-size: 14px;
  color: var(--tenant-header-text-muted);
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 4px;
  border: none;
  background: none;
  cursor: pointer;
  transition:
    background 0.2s,
    color 0.2s;
  text-decoration: none;
  white-space: nowrap;
}
.back-link:hover {
  background: var(--tenant-header-hover-bg);
  color: var(--tenant-header-text);
}

/* 面包屑嵌入 header 时的样式调整 */
.header-breadcrumb {
  /* TenantBreadcrumb 原有 margin-bottom，在 header 内不需要 */
  margin-bottom: 0 !important;
  font-size: 12px;
  opacity: 0.75;
  max-width: 320px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-shrink: 0;
}

.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  color: var(--tenant-header-text-muted);
  font-size: 20px;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 6px;
  transition: background 0.2s;
  line-height: 1;
}
.mobile-menu-btn:hover {
  background: var(--tenant-header-hover-bg);
  color: var(--tenant-header-text);
}

@media (max-width: 900px) {
  .back-text {
    display: none;
  }
  .desktop-only {
    display: none;
  }
}

@media (max-width: 768px) {
  .navbar.has-nav .desktop-logo {
    display: none;
  }

  .mobile-menu-btn {
    display: flex;
    align-items: center;
  }

  .nav-right {
    flex-shrink: 0;
  }

  .desktop-only {
    display: none;
  }
}
</style>
