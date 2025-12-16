<script setup lang="ts">
import type { Links } from "./type"
import TenantLogo from "./TenantLogo.vue"

defineProps<{
  links?: Links[]
}>()
const visible = defineModel<boolean>("visible")// v-model:visible
</script>

<template>
  <div>
    <!-- 移动端遮罩层 -->
    <transition name="fade">
      <div
        v-if="visible"
        class="mobile-menu-overlay"
        @click="visible = false"
      />
    </transition>

    <!-- 移动端侧边菜单 -->
    <transition name="slide-right">
      <div v-if="visible" class="mobile-menu-panel">
        <div class="mobile-nav-header">
          <TenantLogo always-show-brand />
        </div>
        <div class="mobile-nav-list">
          <router-link
            v-for="link in links"
            :key="link.path"
            :to="link.path"
            custom
            v-slot="{ navigate, isActive, isExactActive }"
          >
            <a
              @click="() => { navigate(); visible = false }"
              class="mobile-nav-item"
              :class="{ active: link.exact ? isExactActive : isActive }"
            >
              {{ link.name }}
            </a>
          </router-link>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
/* 移动端菜单样式 */
.mobile-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.mobile-menu-panel {
  position: fixed;
  top: 0;
  left: 0;
  width: 240px;
  height: 100vh;
  background: #1e293b;
  z-index: 1002;
  box-shadow: 4px 0 15px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
}

.mobile-nav-header {
  height: var(--header-h);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.mobile-nav-list {
  padding: 20px 0;
  display: flex;
  flex-direction: column;
}

.mobile-nav-item {
  padding: 15px 24px;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-size: 15px;
  transition: all 0.2s;
  border-left: 3px solid transparent;
  display: block;
}

.mobile-nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: white;
}

.mobile-nav-item.active {
  color: white;
  background: rgba(255, 255, 255, 0.1);
  border-left-color: var(--primary);
  font-weight: 600;
}

/* 侧边栏动画 */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.3s ease;
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(-100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
