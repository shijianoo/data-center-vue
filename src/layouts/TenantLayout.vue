<script setup lang="ts">
import { applyTenantThemeToDocument, resolveTenantThemeStyle } from "@/framework/tenant-console/theme"
import { useTenantContextStore } from "@/pinia/stores/tenantContext"
import TenantHeader from "./components/TenantHeader/index.vue"

const tenantStore = useTenantContextStore()
// Shell 与 Header 都只读取 Orchestrator 成功提交后的 Snapshot facade，不自行解析 URL。
const tenantThemeStyle = computed(() => resolveTenantThemeStyle(tenantStore.currentTenant?.extra?.themeColor))

let restoreDocumentTheme = () => {}
watch(tenantThemeStyle, (style) => {
  // 切换租户时先恢复上一套 root token，避免 Teleport 弹层残留旧租户颜色。
  restoreDocumentTheme()
  restoreDocumentTheme = applyTenantThemeToDocument(style)
}, { immediate: true })

onBeforeUnmount(() => restoreDocumentTheme())
</script>

<template>
  <div class="tenant-shell" :style="tenantThemeStyle">
    <TenantHeader />
    <div class="console-layout">
      <main class="container-main">
        <router-view v-slot="{ Component }">
          <component :is="Component" />
        </router-view>
      </main>
    </div>
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
</style>
