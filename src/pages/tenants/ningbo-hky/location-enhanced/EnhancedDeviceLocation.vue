<script lang="ts" setup>
import type { DevicePoint, TrackPayload, TrackQueryState } from "./types"
import maplibregl from "maplibre-gl"
import { computed, onMounted, onUnmounted, ref, shallowRef } from "vue"
import MapStyleSwitcher from "@/common/components/MapStyleSwitcher/index.vue"
import { maplibreStyle } from "@/common/utils/tianditu-constants"
import { getLatestDeviceLocations } from "../apis"
import DeviceDataDrawer from "./components/DeviceDataDrawer.vue"
import TrackQueryPanel from "./components/TrackQueryPanel.vue"
import { getMeta } from "./device-meta"
import {
  clearFenceLabel,
  drawFenceLabel,
  drawFencesForSelection,
  getConfiguredFenceRadius,
  getFenceCoordinates,
  getFenceRadius
} from "./fence-layer"
import { fitBounds, parseCoordinate, toMapLngLat } from "./map-utils"
import { createMarkerEl } from "./marker"
import { createPlaybackController } from "./playback"
import { hideMarkerTooltip, showMarkerTooltip } from "./tooltip"
import { drawTracks, getVisibleTrackPoints } from "./track-layer"
import "maplibre-gl/dist/maplibre-gl.css"

const mapContainer = ref<HTMLElement | null>(null)
const map = shallowRef<maplibregl.Map | null>(null)
const markerMap = shallowRef<Record<string, maplibregl.Marker>>({})
const hoverPopup = shallowRef<maplibregl.Popup | null>(null)
const loading = ref(false)
const selectedCode = ref<string | null>(null)
const latestLocations = ref<DevicePoint[]>([])
const drawerVisible = ref(false)
const trackPanelVisible = ref(false)
// 每台浮标单独缓存轨迹查询状态，切换浮标后可恢复日期、过滤参数、回放进度和已加载轨迹。
const trackStateMap = ref<Record<string, TrackQueryState>>({})

const selectedLocation = computed(() => latestLocations.value.find(item => item.serialNumber === selectedCode.value) ?? null)
const selectedDevice = computed(() => selectedCode.value ? getMeta(selectedCode.value) : null)
const selectedTrackState = computed(() => {
  const device = selectedDevice.value
  if (!device || device.kind !== "buoy") return null
  return getTrackState(device.code)
})

// 回放控制独立在 playback.ts 中维护 requestAnimationFrame；页面只提供状态和 Marker 访问入口。
const playback = createPlaybackController({
  markerMap: () => markerMap.value,
  getTrackState,
  getVisibleTrackPoints
})

async function loadMarkers() {
  if (!map.value) return
  loading.value = true

  try {
    const { data } = await getLatestDeviceLocations()
    // 后端只负责返回最新位置，页面在这里统一做字段兼容和坐标转换，再创建 MapLibre Marker。
    const devices = normalizeLatestLocations(Array.isArray(data) ? data : (data?.items ?? data?.records ?? []))
    latestLocations.value = devices
    clearMarkers()

    const bounds: [number, number][] = []
    devices.forEach((device) => {
      const meta = getMeta(device.serialNumber)
      const lngLat = toMapLngLat(device.longitude, device.latitude)
      const marker = new maplibregl.Marker({ element: createMarkerEl(meta.color), anchor: "bottom" })
        .setLngLat(lngLat)
        .addTo(map.value!)

      marker.getElement().addEventListener("mouseenter", () => {
        hoverPopup.value = showMarkerTooltip(map.value, hoverPopup.value, device.serialNumber, meta.name, meta.color, lngLat)
      })
      marker.getElement().addEventListener("mouseleave", () => {
        hideMarkerTooltip(hoverPopup.value)
        hoverPopup.value = null
      })
      marker.getElement().addEventListener("click", () => selectDevice(device.serialNumber))

      markerMap.value = {
        ...markerMap.value,
        [device.serialNumber]: marker
      }
      bounds.push(lngLat)
    })

    fitBounds(map.value, bounds, 120)
    drawFencesForSelection(getFenceContext(), selectedCode.value)
  } catch (err) {
    console.error("获取设备位置失败", err)
  } finally {
    loading.value = false
  }
}

function normalizeLatestLocations(rows: Record<string, unknown>[]): DevicePoint[] {
  return rows
    .map((row) => {
      // 兼容接口直接返回 longitude/latitude，或沿用历史宽表里的 g02/g03 字段。
      const longitude = parseCoordinate(row.longitude ?? row.g02)
      const latitude = parseCoordinate(row.latitude ?? row.g03)
      if (longitude === null || latitude === null) return null
      return {
        serialNumber: String(row.serialNumber ?? row.sn ?? row.deviceCode ?? ""),
        sampleTime: row.sampleTime as string | null,
        longitude,
        latitude
      }
    })
    .filter((item): item is DevicePoint => Boolean(item?.serialNumber))
}

function selectDevice(serialNumber: string) {
  const meta = getMeta(serialNumber)
  selectedCode.value = serialNumber
  drawerVisible.value = true
  trackPanelVisible.value = meta.kind === "buoy"

  // 浮标才有轨迹和电子围栏；岸基站只展示最新数据抽屉，避免左侧面板出现无效操作。
  if (meta.kind === "buoy") {
    getTrackState(serialNumber)
    drawAllTracks()
    drawFencesForSelection(getFenceContext(), serialNumber)
    drawFenceLabel(getFenceContext(), serialNumber)
  } else {
    drawFencesForSelection(getFenceContext(), null)
    clearFenceLabel(map.value)
  }
}

function getTrackState(serialNumber: string): TrackQueryState {
  if (!trackStateMap.value[serialNumber]) {
    const location = latestLocations.value.find(item => item.serialNumber === serialNumber)
    // 首次打开某台浮标时初始化它自己的查询上下文，后续切换设备不会丢失已选日期和轨迹。
    trackStateMap.value[serialNumber] = {
      dateRange: getDefaultTrackRange(location?.sampleTime),
      showPoints: false,
      filterStable: true,
      minDistance: 20,
      fenceRadius: getConfiguredFenceRadius(serialNumber) ?? 300,
      points: [],
      loaded: false,
      playbackStatus: "idle",
      playbackSpeed: 1,
      playbackIndex: 0,
      playbackProgress: 0
    }
  }
  return trackStateMap.value[serialNumber]
}

function updateSelectedTrackState(patch: Partial<TrackQueryState>) {
  const device = selectedDevice.value
  if (!device || device.kind !== "buoy") return
  const state = getTrackState(device.code)
  Object.assign(state, patch)
  // 轨迹已经加载后，过滤距离、点位显示、围栏半径等参数变化需要立即重绘。
  if (state.loaded) drawAllTracks()
  drawFencesForSelection(getFenceContext(), device.code)
  if (playback.isPlaying(device.code)) {
    playback.pause(device.code)
  }
}

function handleShowTrack(payload: TrackPayload) {
  const state = getTrackState(payload.serialNumber)
  // TrackQueryPanel 只负责查询和表单交互，真正的地图状态仍然统一落在父组件缓存里。
  Object.assign(state, {
    points: payload.points,
    showPoints: payload.showPoints,
    filterStable: payload.filterStable,
    minDistance: payload.minDistance,
    fenceRadius: payload.fenceRadius,
    loaded: true,
    playbackStatus: "idle",
    playbackIndex: 0,
    playbackProgress: 0
  })
  playback.stop(payload.serialNumber)

  const mapInstance = map.value
  if (!mapInstance) return

  drawAllTracks()
  drawFencesForSelection(getFenceContext(), payload.serialNumber)
  drawFenceLabel(getFenceContext(), payload.serialNumber)

  // 轨迹加载完成后，把轨迹点、当前 Marker 和围栏一起纳入视野，减少用户再手动缩放的次数。
  const points = getVisibleTrackPoints(state)
  const coordinates = points.map(point => toMapLngLat(point.longitude, point.latitude))
  const selectedLngLat = getDeviceLngLat(payload.serialNumber)
  const fenceCoordinates = getFenceCoordinates(getFenceContext(), payload.serialNumber, payload.fenceRadius)
  if (selectedLngLat) coordinates.push(selectedLngLat)
  coordinates.push(...fenceCoordinates)
  fitBounds(mapInstance, coordinates)
}

function handleClearTrack(serialNumber: string) {
  const state = getTrackState(serialNumber)
  playback.stop(serialNumber)
  state.points = []
  state.loaded = false
  state.playbackIndex = 0
  state.playbackProgress = 0
  drawAllTracks()
  resetMarkerPosition(serialNumber)
  drawFencesForSelection(getFenceContext(), selectedCode.value)
}

function focusSelectedFence() {
  const device = selectedDevice.value
  if (!device || device.kind !== "buoy") return
  focusDeviceFence(device.code)
}

function focusDeviceFence(serialNumber: string) {
  const mapInstance = map.value
  if (!mapInstance) return

  const context = getFenceContext()
  const radius = getFenceRadius(context, serialNumber)
  // 抽屉里的“定位到浮标”会同时强调该浮标的围栏，便于判断当前位置是否越界。
  drawFencesForSelection(context, serialNumber)
  drawFenceLabel(context, serialNumber)

  const coordinates = getFenceCoordinates(context, serialNumber, radius)
  const markerLngLat = getDeviceLngLat(serialNumber)
  if (markerLngLat) coordinates.push(markerLngLat)
  fitBounds(mapInstance, coordinates, 120)
}

function handleTogglePlayback(serialNumber: string) {
  playback.toggle(serialNumber)
}

function drawAllTracks() {
  drawTracks(map.value, trackStateMap.value)
}

function getDeviceLngLat(serialNumber: string) {
  const location = latestLocations.value.find(item => item.serialNumber === serialNumber)
  if (!location) return null
  return toMapLngLat(location.longitude, location.latitude)
}

function resetMarkerPosition(serialNumber: string) {
  const marker = markerMap.value[serialNumber]
  const lngLat = getDeviceLngLat(serialNumber)
  if (marker && lngLat) marker.setLngLat(lngLat)
}

function getFenceContext() {
  // 围栏模块需要地图实例、最新位置和轨迹状态；集中组装可以让 fence-layer 保持纯工具函数形态。
  return {
    map: map.value,
    latestLocations: latestLocations.value,
    trackStateMap: trackStateMap.value
  }
}

function getDefaultTrackRange(time?: string | null): [string, string] {
  const end = time ? new Date(time) : new Date()
  if (Number.isNaN(end.getTime())) return getDefaultTrackRange()
  const start = new Date(end)
  start.setDate(end.getDate() - 7)
  return [formatDay(start), formatDay(end)]
}

function formatDay(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

function clearMarkers() {
  Object.values(markerMap.value).forEach(marker => marker.remove())
  markerMap.value = {}
}

function closeDrawer() {
  drawerVisible.value = false
}

onMounted(() => {
  if (!mapContainer.value) return

  // 地图实例只在页面挂载后创建，避免服务端/预渲染阶段访问 DOM。
  map.value = new maplibregl.Map({
    container: mapContainer.value,
    style: maplibreStyle as any,
    center: [121.9, 29.5],
    zoom: 9
  })

  map.value.on("load", () => {
    // 等底图和 style 加载完成后再创建 Marker 和 GeoJSON source/layer，否则 MapLibre 会拒绝 addLayer。
    loadMarkers()
  })
})

onUnmounted(() => {
  // 离开页面时统一停止动画、移除 Popup/Marker/Map，避免后台 requestAnimationFrame 继续运行。
  playback.stop()
  hideMarkerTooltip(hoverPopup.value)
  clearMarkers()
  if (map.value) {
    map.value.remove()
    map.value = null
  }
})
</script>

<template>
  <div class="nb-location-page">
    <div ref="mapContainer" class="map-container" />
    <MapStyleSwitcher :map="map" default-style="vector" />

    <DeviceDataDrawer
      :visible="drawerVisible"
      :device="selectedDevice"
      :latest-location="selectedLocation"
      :latest-location-time="selectedLocation?.sampleTime"
      @close="closeDrawer"
      @focus-fence="focusSelectedFence"
    />

    <TrackQueryPanel
      :visible="trackPanelVisible"
      :device="selectedDevice"
      :latest-location="selectedLocation"
      :state="selectedTrackState"
      @close="trackPanelVisible = false"
      @update-state="updateSelectedTrackState"
      @loaded="handleShowTrack"
      @clear="handleClearTrack"
      @toggle-playback="handleTogglePlayback"
    />

    <Transition name="fade">
      <div v-if="loading" class="map-loading">
        <span class="loading-dot" />
        <span class="loading-dot" />
        <span class="loading-dot" />
        <span>设备位置加载中...</span>
      </div>
    </Transition>

    <div class="legend">
      <div class="legend-item">
        <span class="legend-dot buoy" />
        <span>浮标</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot shore" />
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

.map-loading {
  position: absolute;
  top: 16px;
  left: 50%;
  z-index: 15;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  color: #cbd5e1;
  font-size: 13px;
  background: rgba(10, 18, 35, 0.85);
  border-radius: 20px;
  transform: translateX(-50%);
  pointer-events: none;
  backdrop-filter: blur(8px);
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

.legend {
  position: absolute;
  right: 16px;
  bottom: 28px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 14px;
  color: #374151;
  font-size: 13px;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(6px);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 7px;
}

.legend-dot {
  flex-shrink: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;

  &.buoy {
    background: #3b82f6;
  }

  &.shore {
    background: #10b981;
  }
}

@keyframes bounce {
  0%,
  80%,
  100% {
    opacity: 0.4;
    transform: scale(0.6);
  }

  40% {
    opacity: 1;
    transform: scale(1);
  }
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

<style lang="scss">
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

.nb-device-popup.maplibregl-popup {
  z-index: 25;
}

.nb-device-popup .maplibregl-popup-content {
  padding: 0;
  background: transparent;
  border-radius: 0;
  box-shadow: none;
}

.nb-popup-inner {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 144px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.96);
  border-bottom: 3px solid var(--accent, #3b82f6);
  border-radius: 6px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);
  white-space: nowrap;
}

.nb-device-popup .maplibregl-popup-tip {
  border-top-color: rgba(255, 255, 255, 0.96);
}

.nb-popup-name {
  overflow: hidden;
  color: #1f2937;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.3;
  text-overflow: ellipsis;
}

.nb-popup-code {
  color: var(--accent, #3b82f6);
  font-size: 11px;
  font-weight: 700;
  line-height: 1.2;
}
</style>
