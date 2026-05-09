<script lang="ts" setup>
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
 * el-menu default-active 直接使用 route.path（当前实际路径）。
 * NavMenuItems 生成的 index = basePath + route.path 段，与 route.path 完全一致。
 *
 * 若当前页面（如详情页）没有对应菜单项，el-menu 不高亮任何项，符合预期。
 * 若需要高亮父菜单，可在对应路由 meta 中添加 activeMenu 字段（后续扩展）。
 */
const activeIndex = computed(() => route.path.replace(/\/+$/, "") || "/")

function handleSelect(index: string) {
  router.push(index)
}
</script>

<template>
  <el-menu
    text-color="rgba(255, 255, 255, 0.6)"
    active-text-color="#fff"
    background-color="#1e293b"
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
}

@media (max-width: 768px) {
  .el-menu {
    display: none;
  }
}
</style>
