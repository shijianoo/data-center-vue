<script setup lang="ts">
import { watch } from "vue"
import { useRoute } from "vue-router"
import { useTenantContext } from "@/common/hooks/useTenantContext"
import { useTenantContextStore } from "@/pinia/stores/tenantContext"
import TenantHeader from "./components/TenantHeader/index.vue"

const route = useRoute()
const { fetchData } = useTenantContext()
const tenantStore = useTenantContextStore()

watch(
  () => route.fullPath,
  () => {
    fetchData()
  },
  { immediate: true }
)
</script>

<template>
  <TenantHeader :links="tenantStore.customNavLinks" />
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
  padding: 20px;
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
