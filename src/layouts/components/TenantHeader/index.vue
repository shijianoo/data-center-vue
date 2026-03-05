<script setup lang="ts">
import type { Links } from "./type"
import { ref } from "vue"
import { useUserStore } from "@/pinia/stores/user"
import DesktopNav from "./DesktopNav.vue"
import MobileMenu from "./MobileMenu.vue"
import TenantLogo from "./TenantLogo.vue"
import UserMenu from "./UserMenu.vue"

defineProps<{
  links?: Links[]
}>()
const userStore = useUserStore()
const showMobileMenu = ref(false)

const tenantCode = computed(() => {
  const tenant = userStore.tenants.find(tenant => tenant.type === 99)
  return tenant?.tenantCode
})
</script>

<template>
  <nav class="navbar" :class="{ 'has-links': links && links.length > 0 }">
    <div class="nav-left">
      <router-link v-if="userStore.isPlatformUser" :to="`/console/${tenantCode}`" custom v-slot="{ isExactActive, navigate, href }">
        <a title="返回平台总览页面" v-if="!isExactActive" :href="href" @click="navigate" class="back-link">
          <i class="fa-solid fa-arrow-left" />
          <span class="back-text">返回</span>
        </a>
      </router-link>
      <TenantLogo />
    </div>

    <!-- 移动端菜单按钮 -->
    <div v-if="links && links.length > 0" class="mobile-menu-btn" @click="showMobileMenu = true">
      <i class="fa-solid fa-arrows-down-to-line " />
    </div>

    <!-- 移动端侧边菜单 -->
    <MobileMenu v-model:visible="showMobileMenu" :links="links" />

    <DesktopNav :links="links" />

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
  gap: 15px;
}

.back-link {
  font-size: 14px; /* 字体大小 */
  color: #94a3b8; /* 文字颜色 */
  display: flex; /* flex 布局 */
  align-items: center; /* 垂直居中 */
  gap: 8px; /* 间距 */
  padding: 6px 10px; /* 内边距 */
  border-radius: 4px; /* 圆角 */
  transition: background 0.2s; /* 过渡 */
  text-decoration: none; /* 无下划线 */
}
.back-link:hover {
  background: rgba(255, 255, 255, 0.1); /* 背景 */
  color: white;
}

/* ================= 3. 右侧用户区域 ================= */
.nav-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.icon-btn {
  font-size: 18px;
  color: #cbd5e1;
  cursor: pointer;
  transition: color 0.2s;
}
.icon-btn:hover {
  color: white;
}

@media (max-width: 900px) {
  .back-text {
    display: none;
  }
}

.mobile-menu-btn {
  display: none;
  cursor: pointer;
  font-size: 20px;
  padding: 8px;
}

@media (max-width: 768px) {
  .navbar.has-links .nav-left {
    display: none;
  }
  .mobile-menu-btn {
    display: flex;
    align-items: center;
  }
  .nav-right {
    display: flex !important;
    flex-shrink: 0;
  }
}
</style>
