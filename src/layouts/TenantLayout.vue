<script setup lang="ts">
import type { Links } from "./components/TenantHeader/type"
import { useTenantStore } from "@/pinia/stores/tenant"
import TenantHeader from "./components/TenantHeader/index.vue"

const tenantStore = useTenantStore()
const navLinks: Links[] = [
  { name: "首页", path: `/console/${tenantStore.activeTenant!.tenantCode}`, exact: true },
  { name: "设备管理", path: `/console/${tenantStore.activeTenant!.tenantCode}/devices` },
  { name: "设置", path: `/console/${tenantStore.activeTenant!.tenantCode}/settings` }
]
</script>

<template>
  <TenantHeader :links="navLinks" :show-back-button="tenantStore.isInternal" />
  <div class="console-layout">
    <main class="container-main">
      <router-view v-slot="{ Component }">
        <transition name="fade-page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<style scoped>
.console-layout {
  min-height: 100vh;
  background-color: var(--bg-body);
  font-family:
    "Inter",
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    sans-serif;
  padding-top: var(--header-h);
  color: var(--text-main);
}

.container-main {
  max-width: 1400px;
  padding: 30px;
  margin: 0 auto;
  width: 100%;
}

.fade-page-enter-active,
.fade-page-leave-active {
  transition: opacity 0.2s ease;
}
.fade-page-enter-from,
.fade-page-leave-to {
  opacity: 0;
}

@media (max-width: 900px) {
  .container-main {
    padding: 10px;
  }
}
</style>
