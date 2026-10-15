<script setup lang="ts">
import { Refresh, ZoomIn, ZoomOut } from "@element-plus/icons-vue"
import { onMounted, onUnmounted, ref } from "vue"

const zoomScale = ref(1.0)
const isMobile = ref(false)
const containerRef = ref<HTMLElement | null>(null)

let mediaQuery: MediaQueryList | null = null

function updateMobileState(e: MediaQueryListEvent | MediaQueryList) {
  isMobile.value = e.matches
  if (e.matches) {
    zoomScale.value = 0.75
  } else {
    zoomScale.value = 1.0
  }
}

function zoomIn() {
  zoomScale.value = Number(Math.min(zoomScale.value + 0.15, 2.5).toFixed(2))
}

function zoomOut() {
  zoomScale.value = Number(Math.max(zoomScale.value - 0.15, 0.4).toFixed(2))
}

function resetZoom() {
  zoomScale.value = isMobile.value ? 0.75 : 1.0
}

let touchStartDist = 0
let touchStartScale = 1.0

function handleTouchStart(e: TouchEvent) {
  if (e.touches.length === 2) {
    const t1 = e.touches[0]
    const t2 = e.touches[1]
    touchStartDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
    touchStartScale = zoomScale.value
  }
}

function handleTouchMove(e: TouchEvent) {
  if (e.touches.length === 2 && touchStartDist > 0) {
    const t1 = e.touches[0]
    const t2 = e.touches[1]
    const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
    const factor = dist / touchStartDist
    const newScale = Math.min(Math.max(touchStartScale * factor, 0.4), 2.5)
    zoomScale.value = Number(newScale.toFixed(2))
  }
}

function handleTouchEnd(e: TouchEvent) {
  if (e.touches.length < 2) {
    touchStartDist = 0
  }
}

onMounted(() => {
  if (typeof window !== "undefined") {
    mediaQuery = window.matchMedia("(max-width: 768px)")
    isMobile.value = mediaQuery.matches
    if (mediaQuery.matches) {
      zoomScale.value = 0.75
    }
    mediaQuery.addEventListener("change", updateMobileState)
  }
  const el = containerRef.value
  if (el) {
    el.addEventListener("touchstart", handleTouchStart, { passive: true })
    el.addEventListener("touchmove", handleTouchMove, { passive: true })
    el.addEventListener("touchend", handleTouchEnd, { passive: true })
  }
})

onUnmounted(() => {
  mediaQuery?.removeEventListener("change", updateMobileState)
  const el = containerRef.value
  if (el) {
    el.removeEventListener("touchstart", handleTouchStart)
    el.removeEventListener("touchmove", handleTouchMove)
    el.removeEventListener("touchend", handleTouchEnd)
  }
})
</script>

<template>
  <div
    ref="containerRef"
    class="mobile-table-zoom-container"
    :style="{ '--table-zoom-scale': zoomScale }"
  >
    <slot />

    <!-- 移动端表格缩放浮动控制条 -->
    <div v-if="isMobile" class="mobile-table-zoom-toolbar">
      <button
        type="button"
        class="zoom-btn"
        title="缩小表格"
        @click="zoomOut"
      >
        <el-icon><ZoomOut /></el-icon>
      </button>

      <button
        type="button"
        class="zoom-btn zoom-btn--text"
        title="重置缩放"
        @click="resetZoom"
      >
        {{ Math.round(zoomScale * 100) }}%
      </button>

      <button
        type="button"
        class="zoom-btn"
        title="放大表格"
        @click="zoomIn"
      >
        <el-icon><ZoomIn /></el-icon>
      </button>

      <button
        v-if="zoomScale !== (isMobile ? 0.75 : 1.0)"
        type="button"
        class="zoom-btn"
        title="重置"
        @click="resetZoom"
      >
        <el-icon><Refresh /></el-icon>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.mobile-table-zoom-container {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  width: 100%;
}

.mobile-table-zoom-container :deep(.el-table) {
  zoom: var(--table-zoom-scale, 1);
  @supports not (zoom: 1) {
    transform: scale(var(--table-zoom-scale, 1));
    transform-origin: top left;
  }
}

.mobile-table-zoom-toolbar {
  position: absolute;
  right: 12px;
  bottom: 12px;
  z-index: 99;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(15, 23, 42, 0.78);
  backdrop-filter: blur(8px);
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);

  .zoom-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 28px;
    min-width: 28px;
    padding: 0 6px;
    color: #ffffff;
    font-size: 14px;
    background: transparent;
    border: none;
    border-radius: 14px;
    cursor: pointer;
    user-select: none;
    transition: background 0.15s;

    &:active {
      background: rgba(255, 255, 255, 0.2);
    }
  }

  .zoom-btn--text {
    font-weight: 600;
    font-size: 12px;
    color: #60a5fa;
  }
}
</style>
