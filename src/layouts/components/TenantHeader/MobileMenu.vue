<script lang="ts" setup>
import { storeToRefs } from "pinia"
import { useRoute, useRouter } from "vue-router"
import { useTenantContextStore } from "@/pinia/stores/tenantContext"
import NavMenuItems from "./NavMenuItems.vue"
import TenantLogo from "./TenantLogo.vue"

const tenantStore = useTenantContextStore()
const { tenantRoutes, currentTenantKey } = storeToRefs(tenantStore)
const route = useRoute()
const router = useRouter()

const visible = defineModel<boolean>("visible")

const base = computed(() => `/console/${currentTenantKey.value}`)

const menuItems = computed(() => tenantRoutes.value.filter(r => !r.meta?.hidden))

/** 当前激活菜单 index，向上查找 matched 中最近的可用路径 */
const activeIndex = computed(() => {
  const matched = route.matched.map(m => m.path).reverse()
  for (const p of matched) {
    if (p !== "/console/:tenantKey") return p.replace(":tenantKey", currentTenantKey.value)
  }
  return route.path
})

function handleSelect(index: string) {
  router.push(index)
  visible.value = false
}
</script>

<template>
  <div>
    <!-- 遮罩 -->
    <transition name="fade">
      <div v-if="visible" class="mobile-overlay" @click="visible = false" />
    </transition>

    <!-- 抽屉面板 -->
    <transition name="slide-right">
      <div v-if="visible" class="mobile-panel" role="dialog" aria-modal="true">
        <!-- 头部 -->
        <div class="panel-header">
          <TenantLogo always-show-brand />
          <button class="close-btn" @click="visible = false" aria-label="关闭菜单">
            <i class="fa-solid fa-xmark" />
          </button>
        </div>

        <!-- el-menu 垂直模式 -->
        <el-menu
          v-if="menuItems.length"
          :default-active="activeIndex"
          class="mobile-menu"
          @select="handleSelect"
        >
          <NavMenuItems :items="menuItems" :base-path="base" />
        </el-menu>

        <div v-else class="empty-menu">
          暂无菜单
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
/* ---- 遮罩 ---- */
.mobile-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(2px);
  z-index: 1000;
}

/* ---- 抽屉面板 ---- */
.mobile-panel {
  position: fixed;
  top: 0;
  left: 0;
  width: 260px;
  height: 100dvh;
  background: #1e293b;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.4);
  overflow: hidden;
}

.panel-header {
  height: var(--header-h);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px 0 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
  gap: 8px;
}

/* Logo 可弹性收缩，长名称时自动截断而不撑破布局 */
.panel-header :deep(.tenant-logo) {
  flex: 1;
  min-width: 0;
}

.close-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 18px;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition:
    color 0.2s,
    background 0.2s;
  line-height: 1;
  flex-shrink: 0; /* 始终固定在右侧，不被 Logo 挤压 */
}
.close-btn:hover {
  color: white;
  background: rgba(255, 255, 255, 0.08);
}

/* ---- el-menu 垂直模式颜色覆盖 ---- */
.mobile-menu {
  flex: 1;
  overflow-y: auto;
  border-right: none !important;

  --el-menu-bg-color: #1e293b;
  --el-menu-text-color: rgba(255, 255, 255, 0.7);
  --el-menu-active-color: #ffffff;
  --el-menu-hover-bg-color: rgba(255, 255, 255, 0.06);
  --el-menu-border-color: transparent;
  background-color: #1e293b;
}

:deep(.el-menu-item) {
  height: 48px;
  line-height: 48px;
  font-size: 15px;
  border-left: 3px solid transparent;
  transition:
    background 0.15s,
    color 0.15s,
    border-color 0.15s;
}

:deep(.el-menu-item.is-active) {
  color: white !important;
  background-color: rgba(255, 255, 255, 0.1) !important;
  border-left-color: var(--primary, #3b82f6);
  font-weight: 600;
}

:deep(.el-menu-item:hover) {
  background-color: rgba(255, 255, 255, 0.06) !important;
  color: white !important;
}

/* 父项标题样式 */
:deep(.el-sub-menu__title) {
  height: 48px;
  line-height: 48px;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.7);
}
:deep(.el-sub-menu__title:hover) {
  background-color: rgba(255, 255, 255, 0.06) !important;
  color: white !important;
}
:deep(.el-sub-menu.is-active > .el-sub-menu__title) {
  color: white !important;
}

/* 嵌套子菜单背景 */
:deep(.el-sub-menu .el-menu) {
  --el-menu-bg-color: rgba(0, 0, 0, 0.15);
  background-color: rgba(0, 0, 0, 0.15);
}

/* 展开箭头颜色 */
:deep(.el-sub-menu__icon-arrow) {
  color: rgba(255, 255, 255, 0.4);
}

.empty-menu {
  padding: 24px 20px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;
}

/* ---- 动画 ---- */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(-100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
