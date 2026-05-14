<script lang="ts" setup>
import maplibregl from "maplibre-gl"
import MapStyleSwitcher from "@/common/components/MapStyleSwitcher/index.vue"
import { formatDateTime } from "@/common/utils/datetime"
import { wgs84togcj02 } from "@/common/utils/lnglat-convert"
import { maplibreStyle } from "@/common/utils/tianditu-constants"
import { getLatestDeviceLocations } from "./apis"
import "maplibre-gl/dist/maplibre-gl.css"

interface DevicePoint {
  serialNumber: string
  sampleTime: string | null
  longitude: number
  latitude: number
}

/** 设备元数据：名称、颜色 */
interface DeviceMeta {
  name: string
  color: string
}

/** 浮标 NB00-NB08 */
const buoyMeta: Record<string, DeviceMeta> = {
  NB00: { name: "强蛟生态浮标", color: "#3b82f6" },
  NB01: { name: "南韭山生态浮标", color: "#3b82f6" },
  NB02: { name: "松兰山海滨浮标", color: "#3b82f6" },
  NB03: { name: "渔山生态浮标", color: "#3b82f6" },
  NB04: { name: "三门生态浮标", color: "#3b82f6" },
  NB05: { name: "杭州湾生态浮标", color: "#3b82f6" },
  NB06: { name: "镇海重点化工区排污口浮标", color: "#f59e0b" },
  NB07: { name: "松兰山生态浮标", color: "#3b82f6" },
  NB08: { name: "杭州湾新区北污水排放口浮标", color: "#f59e0b" }
}

/** 岸基站 NB09-NB11 */
const shoreMeta: Record<string, DeviceMeta> = {
  NB09: { name: "甬江入海河口岸基站", color: "#10b981" },
  NB10: { name: "西周综合污水处理厂排污口岸基站", color: "#10b981" },
  NB11: { name: "大嵩江入海口岸基站", color: "#10b981" }
}

function getMeta(sn: string): DeviceMeta {
  return buoyMeta[sn] ?? shoreMeta[sn] ?? { name: sn, color: "#64748b" }
}

const mapContainer = ref<HTMLElement | null>(null)
const map = shallowRef<maplibregl.Map | null>(null)
const markers = shallowRef<maplibregl.Marker[]>([])
const loading = ref(false)

function createMarkerSvg(color: string): string {
  // marker.svg 原始 fill 为 #00C13A，替换为目标颜色
  return `<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
    <path d="M510.690247 1023.913083L211.869483 725.034375l0.811226-0.840198a421.026113 421.026113 0 0 1-124.581082-300.211436A421.170975 421.170975 0 0 1 212.275096 124.20589 421.170975 421.170975 0 0 1 512.051947 0.030421a421.315837 421.315837 0 0 1 299.718906 124.204442 421.11303 421.11303 0 0 1 124.146497 299.747878 420.678445 420.678445 0 0 1-37.664048 174.732211 422.387814 422.387814 0 0 1-101.750875 139.443895l-285.754236 285.783208z m0.724308-925.029022a319.04346 319.04346 0 0 0-318.695791 318.695792 319.04346 319.04346 0 0 0 318.695791 318.695792 319.04346 319.04346 0 0 0 318.695792-318.695792 319.04346 319.04346 0 0 0-318.695792-318.811681z" fill="${color}"/>
    <path d="M509.965938 93.031647A325.330459 325.330459 0 1 1 184.635479 418.362106 325.330459 325.330459 0 0 1 509.965938 93.031647z" fill="#FFFFFF"/>
    <path d="M734.849278 574.146404a5.504745 5.504745 0 0 1-5.388856 5.591662h-0.782254a81.933791 81.933791 0 0 1-52.15022-17.383407 38.18555 38.18555 0 0 1-6.402888-8.199173c-16.137596 23.35171-59.393307 25.350802-61.65315 25.437719h-0.86917a81.933791 81.933791 0 0 1-52.150221-17.383407 37.982744 37.982744 0 0 1-6.402888-8.199174 81.122565 81.122565 0 0 1-55.626902 24.974161 5.359884 5.359884 0 0 1-2.114981 0.463558h-3.911266a5.591663 5.591663 0 0 1-1.448618 0 77.327188 77.327188 0 0 1-47.543617-17.093684 38.156578 38.156578 0 0 1-6.402889-8.199173 80.861814 80.861814 0 0 1-55.221289 24.916216 5.301939 5.301939 0 0 1-2.201898 0.521503h-4.143045A5.272967 5.272967 0 0 1 368.899592 579.448343a76.97952 76.97952 0 0 1-47.166977-17.064711 38.156578 38.156578 0 0 1-6.402889-8.199174c-16.137596 23.35171-59.393307 25.350802-61.653149 25.437719a5.446801 5.446801 0 0 1-5.794469-5.272967 5.504745 5.504745 0 0 1 5.272967-5.794469c0.579447 0 57.075519-2.665456 57.075519-34.245311a5.504745 5.504745 0 1 1 11.009491 0 26.741474 26.741474 0 0 0 8.083284 20.135779 68.374734 68.374734 0 0 0 41.720176 14.051587c8.025339-0.550475 55.916625-5.099133 55.916625-34.187366a5.504745 5.504745 0 1 1 11.009491 0 26.741474 26.741474 0 0 0 8.083285 20.135779 68.635485 68.635485 0 0 0 41.922982 14.051587c7.619727-0.521502 56.032515-4.954271 56.032515-34.187366a5.504745 5.504745 0 0 1 11.009491 0 26.712502 26.712502 0 0 0 8.083284 20.135779 73.039281 73.039281 0 0 0 44.936107 14.08056c1.680396 0 56.988602-2.897234 56.988602-34.216339a5.504745 5.504745 0 0 1 11.009491 0 26.712502 26.712502 0 0 0 8.083284 20.135779 73.184143 73.184143 0 0 0 44.965079 14.08056 5.417828 5.417828 0 0 1 5.765497 5.620635z m40.851006-50.759548a5.504745 5.504745 0 0 1-5.388856 5.620635h-0.782254a81.933791 81.933791 0 0 1-52.15022-17.383407 37.924799 37.924799 0 0 1-6.402888-8.199174c-16.137596 23.35171-59.393307 25.350802-61.65315 25.437719h-0.782253a106.299533 106.299533 0 0 1-27.987285-4.085101v-0.289723a53.598838 53.598838 0 0 1-27.205032-12.342219 26.770447 26.770447 0 0 1-8.083284-20.13578 5.504745 5.504745 0 1 0-11.009491 0c0 29.233096-48.44176 33.665865-56.032515 34.187367a68.57754 68.57754 0 0 1-41.922982-14.051587 26.799419 26.799419 0 0 1-8.083285-20.13578 5.504745 5.504745 0 1 0-11.009491 0c0 19.759139-22.076927 28.132147-38.764997 31.695746l-1.622451 0.347668-0.637392-0.550475a74.980428 74.980428 0 0 1-45.254802-16.919849 38.156578 38.156578 0 0 1-6.402888-8.199174c-16.137596 23.35171-59.393307 25.350802-61.65315 25.437719a5.446801 5.446801 0 0 1-5.794469-5.272967 5.504745 5.504745 0 0 1 5.272967-5.794469c0.579447 0 57.075519-2.694428 57.075519-34.245311a5.504745 5.504745 0 0 1 11.009491 0 26.741474 26.741474 0 0 0 8.083284 20.135779 50.353935 50.353935 0 0 0 24.162936 11.588938 69.128014 69.128014 0 0 1-15.007675-42.937015v-26.654557c0-35.780846-2.34676-42.705236 28.219064-43.458517l54.757731-188.030517a51.310022 51.310022 0 1 1 102.18546-7.53281l56.95963 195.621272c27.900368 1.129921 25.495663 8.691703 25.495663 43.458517v26.654557a69.533627 69.533627 0 0 1-20.51242 49.252986 98.766723 98.766723 0 0 0 14.109532 1.187866c1.680396 0 56.988602-2.897234 56.988602-34.216339a5.504745 5.504745 0 0 1 11.009491 0 26.741474 26.741474 0 0 0 8.083284 20.13578 73.184143 73.184143 0 0 0 44.965079 14.080559 5.417828 5.417828 0 0 1 5.794469 5.620635z m-162.245131-126.058672l-48.615594-167.112484a51.223105 51.223105 0 0 1-84.570274 2.694428l-47.862314 164.331139z" fill="${color}"/>
  </svg>`
}

/** 创建 Marker 的自定义 DOM 元素（仅图标，无标签） */
function createMarkerEl(color: string): HTMLElement {
  const el = document.createElement("div")
  el.className = "device-marker"
  el.innerHTML = createMarkerSvg(color)
  return el
}

/** 构建 Popup 的 HTML 内容 */
function buildPopupHtml(sn: string, meta: DeviceMeta, sampleTime: string | null): string {
  const timeRow = sampleTime
    ? `<div class="nb-popup-time">${formatDateTime(sampleTime)}</div>`
    : ""
  return `
    <div class="nb-popup-inner" style="--accent:${meta.color}">
      <span class="nb-popup-name">${meta.name}</span>
      <span class="nb-popup-code">${sn}</span>
      ${timeRow}
    </div>
  `
}

async function loadMarkers() {
  if (!map.value) return
  loading.value = true

  try {
    const { data } = await getLatestDeviceLocations()
    const devices: DevicePoint[] = Array.isArray(data) ? data : (data?.items ?? [])

    // 清除旧 marker（setPopup 绑定的 popup 随 marker.remove() 一并清除）
    markers.value.forEach(m => m.remove())
    markers.value = []

    const bounds = new maplibregl.LngLatBounds()

    devices.forEach((device) => {
      const meta = getMeta(device.serialNumber)
      const a = wgs84togcj02(device.longitude, device.latitude)
      const lngLat: [number, number] = [a[0], a[1]]

      // Marker（仅图标）
      const el = createMarkerEl(meta.color)
      const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat(lngLat)
        .addTo(map.value!)

      // 点击 Marker 后显示的 Popup，出现在 Marker 上方
      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: true, // 点击地图其他地方关闭
        anchor: "bottom", // Popup 底部对齐坐标点 → 显示在 Marker 上方
        offset: [0, -42], // 向上偏移，清开 36px 图标
        className: "nb-device-popup",
        maxWidth: "none"
      })
        .setHTML(buildPopupHtml(device.serialNumber, meta, device.sampleTime))

      // 绑定到 Marker：点击切换显示，marker.remove() 时 popup 自动清除
      marker.setPopup(popup)

      bounds.extend(lngLat)
      markers.value.push(marker)
    })

    if (!bounds.isEmpty()) {
      map.value!.fitBounds(bounds, { padding: 120, maxZoom: 11 })
    }
  } catch (err) {
    console.error("获取设备位置失败", err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (!mapContainer.value) return

  map.value = new maplibregl.Map({
    container: mapContainer.value,
    style: maplibreStyle as any,
    center: [121.9, 29.5],
    zoom: 9,
    maxZoom: 14
  })

  map.value.on("load", () => {
    loadMarkers()
  })
})

onUnmounted(() => {
  markers.value.forEach(m => m.remove())
  if (map.value) {
    map.value.remove()
    map.value = null
  }
})
</script>

<template>
  <div class="nb-location-page">
    <!-- 地图容器 -->
    <div ref="mapContainer" class="map-container" />

    <!-- 底图样式切换器（自带绝对定位，无需额外包装层） -->
    <MapStyleSwitcher :map="map" default-style="vector" />

    <!-- 加载提示 -->
    <Transition name="fade">
      <div v-if="loading" class="map-loading">
        <span class="loading-dot" />
        <span class="loading-dot" />
        <span class="loading-dot" />
        <span>设备位置加载中…</span>
      </div>
    </Transition>

    <!-- 图例 -->
    <div class="legend">
      <div class="legend-item">
        <span class="legend-dot" style="background: #3b82f6;" />
        <span>生态浮标</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot" style="background: #f59e0b;" />
        <span>排污口浮标</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot" style="background: #10b981;" />
        <span>岸基站</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.nb-location-page {
  position: relative;
  width: 100%;
  height: calc(100vh - var(--header-h));
  overflow: hidden;
}

.map-container {
  width: 100%;
  height: 100%;
}

/* ── 加载提示 ── */
.map-loading {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(10, 18, 35, 0.85);
  backdrop-filter: blur(8px);
  border-radius: 20px;
  color: #cbd5e1;
  font-size: 13px;
  pointer-events: none;
}

.loading-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #3b82f6;
  animation: bounce 0.9s ease-in-out infinite;

  &:nth-child(2) {
    animation-delay: 0.15s;
  }
  &:nth-child(3) {
    animation-delay: 0.3s;
  }
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* ── 图例 ── */
.legend {
  position: absolute;
  bottom: 28px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(6px);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.18);
  font-size: 13px;
  color: #374151;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 7px;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ── Fade 过渡 ── */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

<!-- 非 scoped：MapLibre 渲染的 DOM 在组件作用域之外 -->
<style lang="scss">
/* ── 自定义 Marker 图标 ── */
.device-marker {
  cursor: pointer;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  transition:
    transform 0.15s ease,
    filter 0.15s ease;

  svg {
    display: block;
    filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.35));
    transition:
      transform 0.15s ease,
      filter 0.15s ease;
  }

  &:hover svg {
    transform: scale(1.2) translateY(-3px);
    filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.45));
  }
}

/* ── 常驻标签 Popup ── */

/* 覆盖 MapLibre 默认 Popup 外壳样式 */
.nb-device-popup {
  .maplibregl-popup-content {
    padding: 0;
    background: transparent;
    border-radius: 0;
    box-shadow: none;
  }

  /* 保留默认箭头（anchor=bottom 时箭头朝下，指向 Marker） */
  .maplibregl-popup-tip {
    border-top-color: rgba(255, 255, 255, 0.95); /* 与 nb-popup-inner 背景一致 */
  }
}

/* 标签内容本体 */
.nb-popup-inner {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  border-bottom: 3px solid var(--accent, #3b82f6); /* 底部色条，朝向 Marker */
  border-radius: 6px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.2);
  white-space: nowrap;
}

.nb-popup-name {
  font-size: 12px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.3;
}

.nb-popup-code {
  font-size: 11px;
  font-weight: 700;
  color: var(--accent, #3b82f6);
  line-height: 1.2;
}

.nb-popup-time {
  font-size: 10px;
  color: #6b7280;
  line-height: 1.2;
  margin-top: 1px;
}
</style>
