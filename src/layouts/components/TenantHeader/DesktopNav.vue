<script lang="ts" setup>
import { storeToRefs } from "pinia"
import { useRoute, useRouter } from "vue-router"
import { findActiveNavigationHref, normalizeNavigationPath } from "@/framework/tenant-console/navigation"
import { useTenantContextStore } from "@/pinia/stores/tenantContext"
import NavMenuItems from "./NavMenuItems.vue"

const tenantStore = useTenantContextStore()
const { activeNavigation } = storeToRefs(tenantStore)
const route = useRoute()
const router = useRouter()

const menuItems = computed(() => activeNavigation.value.filter(item => !item.hidden))
const activeIndex = computed(() => {
  return findActiveNavigationHref(menuItems.value, route.path) ?? normalizeNavigationPath(route.path)
})

function handleSelect(index: string) {
  router.push(index)
}
</script>

<template>
  <el-menu
    v-if="menuItems.length"
    class="desktop-menu"
    mode="horizontal"
    :default-active="activeIndex"
    :ellipsis="false"
    @select="handleSelect"
  >
    <NavMenuItems :items="menuItems" />
  </el-menu>
</template>

<style scoped>
.desktop-menu {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  height: var(--header-h);
  border-bottom: none !important;
  overflow: visible;

  --el-menu-bg-color: var(--tenant-header-bg);
  --el-menu-text-color: var(--tenant-header-text-muted);
  --el-menu-active-color: var(--tenant-header-text);
  --el-menu-hover-bg-color: var(--tenant-header-hover-bg);
  --el-menu-border-color: transparent;
  background-color: var(--tenant-header-bg);
}

:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  color: var(--tenant-header-text-muted) !important;
}

:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
  color: var(--tenant-header-text) !important;
  background-color: var(--tenant-header-hover-bg) !important;
}

:deep(.el-menu-item.is-active),
:deep(.el-sub-menu.is-active > .el-sub-menu__title) {
  color: var(--tenant-header-text) !important;
  background-color: var(--tenant-header-active-bg) !important;
}

@media (max-width: 768px) {
  .el-menu {
    display: none;
  }
}
</style>
