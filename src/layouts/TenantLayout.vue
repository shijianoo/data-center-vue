<script setup lang="ts">
import { useRoute } from "vue-router"
import { useTenantContextStore } from "@/pinia/stores/tenantContext"
import TenantHeader from "./components/TenantHeader/index.vue"

const route = useRoute()
const tenantStore = useTenantContextStore()

watch(
  () => route.fullPath,
  () => {
    tenantStore.fetchData()
  },
  { immediate: true }
)
</script>

<template>
  <TenantHeader />
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
</style>
