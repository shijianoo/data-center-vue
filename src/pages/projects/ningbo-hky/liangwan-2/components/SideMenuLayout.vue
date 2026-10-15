<script setup lang="ts">
import type { Component } from "vue"
import { onMounted, onUnmounted, ref } from "vue"
import MobileTableZoom from "./MobileTableZoom.vue"

/** 页面内左侧菜单项。 */
interface MenuItem {
  /** 菜单唯一键。 */
  key: string
  /** 显示名称。 */
  label: string
  /** 可选的 Element Plus 图标组件。 */
  icon?: Component
}

defineProps<{
  /** 当前选中的菜单键。 */
  modelValue: string
  /** 可见菜单项。 */
  items: MenuItem[]
}>()

const emit = defineEmits<{ "update:modelValue": [value: string] }>()

const isMobile = ref(false)
let mediaQuery: MediaQueryList | null = null

function updateMobileState(e: MediaQueryListEvent | MediaQueryList) {
  isMobile.value = e.matches
}

onMounted(() => {
  if (typeof window !== "undefined") {
    mediaQuery = window.matchMedia("(max-width: 768px)")
    isMobile.value = mediaQuery.matches
    mediaQuery.addEventListener("change", updateMobileState)
  }
})

onUnmounted(() => {
  mediaQuery?.removeEventListener("change", updateMobileState)
})
</script>

<template>
  <div class="side-menu-layout">
    <aside class="side-menu-layout__aside">
      <el-menu
        :default-active="modelValue"
        :mode="isMobile ? 'horizontal' : 'vertical'"
        class="side-menu-layout__menu"
        @select="emit('update:modelValue', $event)"
      >
        <el-menu-item v-for="item in items" :key="item.key" :index="item.key">
          <el-icon v-if="item.icon">
            <component :is="item.icon" :key="`${item.key}-icon`" />
          </el-icon>
          <span>{{ item.label }}</span>
        </el-menu-item>
      </el-menu>
    </aside>
    <main class="side-menu-layout__content">
      <MobileTableZoom>
        <slot />
      </MobileTableZoom>
    </main>
  </div>
</template>

<style scoped lang="scss">
.side-menu-layout {
  display: flex;
  height: calc(100vh - var(--header-h));
  min-height: 0;
  background: #f3f6fa;
}

.side-menu-layout__aside {
  flex: 0 0 196px;
  padding: 16px 0;
  background: #fff;
  border-right: 1px solid var(--el-border-color-lighter);
}

.side-menu-layout__menu {
  border-right: 0;
}

.side-menu-layout__content {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  min-width: 0;
  min-height: 0;
  box-sizing: border-box;
  padding: 16px;
  overflow: hidden;
}

.side-menu-layout__content :deep(> *) {
  flex: 1;
  height: 100%;
  min-height: 0;
}

@media (max-width: 768px) {
  .side-menu-layout {
    flex-direction: column;
    height: calc(100vh - var(--header-h));
    overflow: hidden;
  }

  .side-menu-layout__aside {
    flex: 0 0 auto;
    width: 100%;
    padding: 0;
    border-right: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
  }

  .side-menu-layout__menu {
    display: flex !important;
    border-bottom: 0 !important;

    :deep(.el-menu-item) {
      height: 44px;
      line-height: 44px;
      padding: 0 14px;
      flex-shrink: 0;
    }
  }

  .side-menu-layout__content {
    padding: 10px;
    overflow-y: auto;
  }
}
</style>
