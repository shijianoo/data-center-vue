<script setup lang="ts">
import { storeToRefs } from "pinia"
import { computed, ref } from "vue"
import { useTenantContextStore } from "@/pinia/stores/tenantContext"
import { useUserStore } from "@/pinia/stores/user"
import DesktopNav from "./DesktopNav.vue"
import MobileMenu from "./MobileMenu.vue"
import TenantLogo from "./TenantLogo.vue"
import UserMenu from "./UserMenu.vue"

const userStore = useUserStore()
const tenantStore = useTenantContextStore()
const { tenantRoutes } = storeToRefs(tenantStore)
const showMobileMenu = ref(false)

/** 是否有可见菜单项（决定是否显示汉堡按钮） */
const hasMenu = computed(() => tenantRoutes.value.some(r => !r.meta?.hidden))

const tenantCode = computed(() => {
  const tenant = userStore.tenants.find(t => t.type === 99)
  return tenant?.customDomain || tenant?.slug || tenant?.tenantCode
})
</script>

<template>
  <nav class="navbar" :class="{ 'has-nav': hasMenu }">
    <div class="nav-left">
      <router-link
        v-if="userStore.isPlatformUser"
        :to="`/console/${tenantCode}`"
        custom
        v-slot="{ isExactActive, navigate, href }"
      >
        <a
          v-if="!isExactActive"
          :href="href"
          @click="navigate"
          class="back-link"
          title="返回平台总览页面"
        >
          <i class="fa-solid fa-arrow-left" />
          <span class="back-text">返回</span>
        </a>
      </router-link>

      <button
        v-if="hasMenu"
        class="mobile-menu-btn"
        @click="showMobileMenu = true"
        aria-label="打开菜单"
      >
        <i class="fa-solid fa-bars" />
      </button>

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
  background: #1e293b;
  color: white;
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
}

.back-link {
  font-size: 14px;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 4px;
  transition:
    background 0.2s,
    color 0.2s;
  text-decoration: none;
}
.back-link:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  font-size: 20px;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 6px;
  transition: background 0.2s;
  line-height: 1;
}
.mobile-menu-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

@media (max-width: 900px) {
  .back-text {
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
}
</style>
