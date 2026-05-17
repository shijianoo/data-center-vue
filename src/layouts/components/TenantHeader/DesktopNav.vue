<script lang="ts" setup>
import type { RouteRecordRaw } from "vue-router"
import { storeToRefs } from "pinia"
import { useRoute, useRouter } from "vue-router"
import { useTenantContextStore } from "@/pinia/stores/tenantContext"
import NavMenuItems from "./NavMenuItems.vue"

const tenantStore = useTenantContextStore()
const { activeNavRoutes, currentTenantKey } = storeToRefs(tenantStore)
const route = useRoute()
const router = useRouter()

const base = computed(() => `/console/${currentTenantKey.value}`)

/** 使用语境感知路由（activeNavRoutes 已按层级过滤并应用 navScope） */
const menuItems = computed(() => activeNavRoutes.value.filter(r => !r.meta?.hidden))

/**
 * 默认精确匹配菜单路径；路由配置 meta.activeMatch = "prefix" 时，
 * 当前路径落在该菜单路径下也会高亮，适合“历史数据”这类父级入口。
 */
const activeIndex = computed(() => {
  const currentPath = normalizePath(route.path)
  return findActiveIndex(menuItems.value, base.value, currentPath) ?? currentPath
})

function handleSelect(index: string) {
  router.push(index)
}

function findActiveIndex(items: RouteRecordRaw[], basePath: string, currentPath: string): string | null {
  let prefixMatched: string | null = null

  for (const item of items.filter(r => !r.meta?.hidden)) {
    const itemPath = resolvePath(item.path, basePath)
    if (currentPath === itemPath) return itemPath

    if (item.meta?.activeMatch === "prefix" && isPrefixPath(currentPath, itemPath)) {
      prefixMatched = itemPath
    }

    const childMatched = findActiveIndex(item.children ?? [], itemPath, currentPath)
    if (childMatched) return childMatched
  }

  return prefixMatched
}

function resolvePath(routePath: string, basePath: string) {
  return normalizePath(routePath ? `${basePath}/${routePath}` : basePath)
}

function normalizePath(path: string) {
  return path.replace(/\/+/g, "/").replace(/\/+$/, "") || "/"
}

function isPrefixPath(currentPath: string, menuPath: string) {
  return currentPath === menuPath || currentPath.startsWith(`${menuPath}/`)
}
</script>

<template>
  <el-menu
    class="desktop-menu"
    v-if="menuItems.length"
    mode="horizontal"
    :default-active="activeIndex"
    :ellipsis="false"
    @select="handleSelect"
  >
    <NavMenuItems :items="menuItems" :base-path="base" />
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
