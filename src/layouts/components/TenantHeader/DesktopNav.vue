<script lang="ts" setup>
import { storeToRefs } from "pinia"
import { useRoute, useRouter } from "vue-router"
import { useTenantContextStore } from "@/pinia/stores/tenantContext"
import NavMenuItems from "./NavMenuItems.vue"

const tenantStore = useTenantContextStore()
const { tenantRoutes, currentTenantKey } = storeToRefs(tenantStore)
const route = useRoute()
const router = useRouter()

const base = computed(() => `/console/${currentTenantKey.value}`)

const menuItems = computed(() => tenantRoutes.value.filter(r => !r.meta?.hidden))

/**
 * el-menu 的 default-active 需要精确匹配 index。
 * 当处于某路由的子路由（如详情页）时，尝试向上找最近的匹配菜单 index。
 */
const activeIndex = computed(() => {
  const matched = route.matched.map(m => m.path).reverse()
  for (const p of matched) {
    if (p !== "/console/:tenantKey") return p.replace(":tenantKey", currentTenantKey.value)
  }
  return route.path
})

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
