<script lang="ts" setup>
import type maplibregl from "maplibre-gl"
import type { MapStyleType } from "@/common/utils/tianditu-constants"
import { MAP_STYLE_OPTIONS } from "@/common/utils/tianditu-constants"

const props = withDefaults(
  defineProps<{
    /** maplibre-gl Map 实例（shallowRef 的 .value） */
    map: maplibregl.Map | null
    /** 默认地图样式，不传则使用矢量图 */
    defaultStyle?: MapStyleType
  }>(),
  { defaultStyle: "vector" }
)

// ── State ──────────────────────────────────────────────────────────────────────

const activeType = ref<MapStyleType>(props.defaultStyle)
const open = ref(false)
const panelRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)

const activeOption = computed(() => MAP_STYLE_OPTIONS.find(o => o.type === activeType.value))

// ── Logic ──────────────────────────────────────────────────────────────────────

function applyStyle(type: MapStyleType) {
  const map = props.map
  if (!map) return
  if (!map.isStyleLoaded()) {
    map.once("idle", () => applyStyle(type))
    return
  }
  const visibleIds = MAP_STYLE_OPTIONS.find(o => o.type === type)?.layerIds ?? []
  const allIds = MAP_STYLE_OPTIONS.flatMap(o => o.layerIds)
  allIds.forEach((id) => {
    if (!map.getLayer(id)) return
    map.setLayoutProperty(id, "visibility", visibleIds.includes(id) ? "visible" : "none")
  })
}

function switchStyle(type: MapStyleType) {
  activeType.value = type
  applyStyle(type)
  open.value = false
}

function toggleOpen() {
  open.value = !open.value
}

function onClickOutside(e: MouseEvent) {
  if (
    panelRef.value?.contains(e.target as Node)
    || triggerRef.value?.contains(e.target as Node)
  ) {
    return
  }
  open.value = false
}

onMounted(() => document.addEventListener("click", onClickOutside, true))
onBeforeUnmount(() => document.removeEventListener("click", onClickOutside, true))

watch(
  () => props.map,
  (newMap) => {
    if (!newMap) return
    if (newMap.isStyleLoaded()) applyStyle(activeType.value)
    else newMap.once("load", () => applyStyle(activeType.value))
  },
  { immediate: true }
)
</script>

<template>
  <div class="map-style-switcher" @click.stop>
    <!-- 触发按钮 -->
    <button
      ref="triggerRef"
      class="trigger-btn"
      :class="{ open }"
      :aria-expanded="open"
      aria-haspopup="listbox"
      aria-label="切换地图样式"
      @click.stop="toggleOpen"
    >
      <span class="trigger-icon" aria-hidden="true">
        <svg v-if="activeOption?.type === 'vector'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
        <svg v-else-if="activeOption?.type === 'image'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="m3 20 4-8 4 4 4-6 6 10H3z" />
        </svg>
      </span>
      <span class="trigger-label">{{ activeOption?.label }}</span>
      <span class="trigger-chevron" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </span>
    </button>

    <!-- 下拉面板 -->
    <Transition name="panel-slide">
      <div
        v-show="open"
        ref="panelRef"
        class="style-panel"
        role="listbox"
        aria-label="地图样式"
        @click.stop
      >
        <div class="panel-header">
          地图样式
        </div>
        <div class="panel-options">
          <button
            v-for="opt in MAP_STYLE_OPTIONS"
            :key="opt.type"
            class="option-btn"
            :class="{ active: activeType === opt.type }"
            role="option"
            :aria-selected="activeType === opt.type"
            @click="switchStyle(opt.type)"
          >
            <span class="option-icon" aria-hidden="true">
              <svg v-if="opt.type === 'vector'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              <svg v-else-if="opt.type === 'image'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="m3 20 4-8 4 4 4-6 6 10H3z" />
              </svg>
            </span>
            <span class="option-label">{{ opt.label }}</span>
            <span v-if="activeType === opt.type" class="option-check" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="m5 12 5 5L20 7" />
              </svg>
            </span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
// ── 根节点：固定左上角 ────────────────────────────────────────────────────────
.map-style-switcher {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  display: inline-flex;
  flex-direction: column;
  align-items: flex-end;
  pointer-events: all;
}

// ── 触发按钮 ─────────────────────────────────────────────────────────────────
.trigger-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  background: rgba(10, 18, 35, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 9px;
  color: #cbd5e1;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  transition:
    background 0.18s,
    border-color 0.18s,
    box-shadow 0.18s,
    color 0.18s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.22);
    color: #f1f5f9;
  }

  &.open {
    background: rgba(59, 130, 246, 0.15);
    border-color: rgba(59, 130, 246, 0.45);
    color: #60a5fa;
    box-shadow: 0 0 14px rgba(59, 130, 246, 0.18);
  }
}

.trigger-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;

  svg {
    width: 15px;
    height: 15px;
  }
}

.trigger-label {
  line-height: 1;
  min-width: 2em;
  text-align: left;
}

.trigger-chevron {
  display: flex;
  align-items: center;
  margin-left: 2px;
  opacity: 0.6;
  transition: transform 0.22s ease;

  svg {
    width: 14px;
    height: 14px;
  }

  .open & {
    transform: rotate(180deg);
    opacity: 1;
  }
}

// ── 下拉面板 ─────────────────────────────────────────────────────────────────
.style-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 136px;
  background: rgba(10, 18, 35, 0.92);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  box-shadow:
    0 8px 28px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.04);
  overflow: hidden;
  z-index: 100;
}

.panel-header {
  padding: 8px 12px 6px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: #475569;
  text-transform: uppercase;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.panel-options {
  padding: 5px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.option-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition:
    background 0.15s,
    color 0.15s;
  user-select: none;

  &:hover {
    background: rgba(255, 255, 255, 0.07);
    color: #e2e8f0;
  }

  &.active {
    background: rgba(59, 130, 246, 0.15);
    color: #60a5fa;
  }

  &.active:hover {
    background: rgba(59, 130, 246, 0.22);
  }
}

.option-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;

  svg {
    width: 15px;
    height: 15px;
  }
}

.option-label {
  flex: 1;
  line-height: 1;
}

.option-check {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  color: #3b82f6;

  svg {
    width: 14px;
    height: 14px;
  }
}

// ── 展开/收起动画 ─────────────────────────────────────────────────────────────
.panel-slide-enter-active,
.panel-slide-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
  transform-origin: top right;
}

.panel-slide-enter-from,
.panel-slide-leave-to {
  opacity: 0;
  transform: scale(0.93) translateY(-6px);
}
</style>
