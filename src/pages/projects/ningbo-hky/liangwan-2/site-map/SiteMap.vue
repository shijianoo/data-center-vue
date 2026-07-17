<script setup lang="ts">
import type { Station, StationLatestMeasurements } from "../types"
import { ElMessage } from "element-plus"
import maplibregl from "maplibre-gl"
import { computed, onMounted, onUnmounted, ref, shallowRef } from "vue"
import MapStyleSwitcher from "@/common/components/MapStyleSwitcher/index.vue"
import { maplibreStyle } from "@/common/utils/tianditu-constants"
import { createMarkerEl } from "../../liangwan-1/DeviceLocation/marker"
import { getApiErrorMessage, getStationLatestMeasurements, getStations, queryMeasurementSeries } from "../apis"
import { toLocalIso } from "../utils"
import StationLatestPanel from "./StationLatestPanel.vue"
import "maplibre-gl/dist/maplibre-gl.css"

/** 合并站点配置和实时经纬度后的地图站点。 */
interface LocatedStation {
  /** 原始站点数据。 */
  station: Station
  /** 地图使用的最新经度。 */
  longitude: number | null
  /** 地图使用的最新纬度。 */
  latitude: number | null
  /** 最新参数快照，点击后可直接复用。 */
  latest?: StationLatestMeasurements
  /** 各参数编码对应的最近 24 小时数值序列。 */
  histories?: Record<string, Array<[string, number]>>
  /** 是否正在加载历史曲线。 */
  historyLoading?: boolean
  /** 是否已经尝试加载历史曲线。 */
  historyLoaded?: boolean
}

const mapContainer = ref<HTMLElement>()
const map = shallowRef<maplibregl.Map | null>(null)
const markerMap = shallowRef(new Map<string, maplibregl.Marker>())
const locatedStations = ref<LocatedStation[]>([])
const selectedMn = ref("")
const loading = ref(false)
const detailLoading = ref(false)

const selectedItem = computed(() => locatedStations.value.find(item => item.station.mn === selectedMn.value))

/** 从最新参数中读取独立 Longitude/Latitude 参数；没有实时坐标时退回站点配置坐标。 */
function resolveLocation(station: Station, latest?: StationLatestMeasurements) {
  const longitude = latest?.parameters.find(item => item.parameter.dataType === "Longitude")?.point?.effectiveNumericValue
  const latitude = latest?.parameters.find(item => item.parameter.dataType === "Latitude")?.point?.effectiveNumericValue
  return {
    longitude: Number.isFinite(longitude) ? Number(longitude) : (station.longitude ?? null),
    latitude: Number.isFinite(latitude) ? Number(latitude) : (station.latitude ?? null)
  }
}

/** 以固定并发数拉取所有站点最新快照，避免站点较多时瞬间占满浏览器连接。 */
async function loadLatestInBatches(stations: Station[], concurrency = 6) {
  const results: LocatedStation[] = []
  let cursor = 0
  async function worker() {
    while (cursor < stations.length) {
      const station = stations[cursor++]
      try {
        const { data } = await getStationLatestMeasurements(station.mn)
        results.push({ station, latest: data, ...resolveLocation(station, data) })
      } catch {
        results.push({ station, ...resolveLocation(station) })
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, stations.length) }, worker))
  return results
}

/** 加载站点、最新坐标并绘制 Marker。 */
async function loadStations() {
  if (!map.value) return
  loading.value = true
  try {
    const { data } = await getStations()
    locatedStations.value = await loadLatestInBatches(data.items ?? [])
    renderMarkers()
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "站点地图加载失败"))
  } finally {
    loading.value = false
  }
}

/** 清除旧 Marker 后按最新坐标重建，并自动适配全部有效站点。 */
function renderMarkers() {
  const mapInstance = map.value
  if (!mapInstance) return
  markerMap.value.forEach(marker => marker.remove())
  markerMap.value.clear()
  const bounds = new maplibregl.LngLatBounds()

  locatedStations.value.forEach((item) => {
    if (item.longitude == null || item.latitude == null) return
    const element = createMarkerEl(item.station.status === "Active" ? "#2f80ed" : "#8b9bb0")
    element.title = `${item.station.name}（${item.station.mn}）`
    element.addEventListener("click", (event) => {
      event.stopPropagation()
      selectStation(item)
    })
    const marker = new maplibregl.Marker({ element, anchor: "bottom" })
      .setLngLat([item.longitude, item.latitude])
      .addTo(mapInstance)
    markerMap.value.set(item.station.mn, marker)
    bounds.extend([item.longitude, item.latitude])
  })

  if (!bounds.isEmpty()) mapInstance.fitBounds(bounds, { padding: 100, maxZoom: 11, duration: 700 })
}

/** 数值、经纬度参数可以绘制历史曲线，其他数据类型只显示最新值。 */
function isNumericParameter(dataType: string) {
  return ["Decimal", "Integer", "Longitude", "Latitude"].includes(dataType)
}

/**
 * 按站点参数组查询最近 24 小时原始序列，并拆分成逐参数迷你曲线数据。
 * 同一参数组只请求一次，避免为每个参数分别发送接口请求。
 */
async function loadStationHistories(item: LocatedStation) {
  if (!item.latest || item.historyLoading || item.historyLoaded) return
  const groupIds = [...new Set(item.latest.parameters
    .filter(parameter => isNumericParameter(parameter.parameter.dataType) && parameter.parameter.groupId)
    .map(parameter => parameter.parameter.groupId!))]

  item.historyLoading = true
  item.histories = {}
  const to = new Date()
  const from = new Date(to.getTime() - 24 * 60 * 60 * 1000)
  try {
    const responses = await Promise.allSettled(groupIds.map(async (parameterGroupId) => {
      const { data } = await queryMeasurementSeries({
        stationId: item.station.id,
        parameterGroupId,
        parameterDefinitionIds: null,
        from: toLocalIso(from),
        to: toLocalIso(to),
        granularity: "Raw"
      })
      return { parameterGroupId, data }
    }))

    responses.forEach((response) => {
      if (response.status !== "fulfilled") return
      response.value.data.columns.forEach((column, columnIndex) => {
        const historyKey = `${response.value.parameterGroupId}:${column.code}`
        item.histories![historyKey] = response.value.data.rows
          .map(row => [String(row[0]), Number(row[columnIndex + 1])] as [string, number])
          .filter(point => Number.isFinite(point[1]))
      })
    })
  } finally {
    item.historyLoading = false
    item.historyLoaded = true
  }
}

/** 列表和 Marker 共用定位逻辑，放大到站点并打开右侧最新数据面板。 */
async function selectStation(item: LocatedStation) {
  selectedMn.value = item.station.mn
  if (item.longitude != null && item.latitude != null) {
    map.value?.flyTo({ center: [item.longitude, item.latitude], zoom: 14, duration: 900 })
  }
  if (!item.latest) {
    detailLoading.value = true
    try {
      const { data } = await getStationLatestMeasurements(item.station.mn)
      item.latest = data
    } catch (error) {
      ElMessage.error(getApiErrorMessage(error, "最新数据加载失败"))
    } finally {
      detailLoading.value = false
    }
  }
  await loadStationHistories(item)
}

onMounted(() => {
  if (!mapContainer.value) return
  map.value = new maplibregl.Map({
    container: mapContainer.value,
    style: maplibreStyle as any,
    center: [121.9, 29.5],
    zoom: 9
  })
  map.value.on("load", loadStations)
  // 点击底图空白区域收起详情；Marker 的 DOM 事件会停止冒泡。
  map.value.on("click", () => {
    selectedMn.value = ""
  })
})

onUnmounted(() => {
  markerMap.value.forEach(marker => marker.remove())
  markerMap.value.clear()
  map.value?.remove()
  map.value = null
})
</script>

<template>
  <div class="site-map-page">
    <div ref="mapContainer" class="site-map-page__map" />
    <MapStyleSwitcher :map="map" default-style="vector" />

    <aside class="station-list">
      <div class="station-list__title">
        <strong>站点列表</strong>
        <el-tag size="small" effect="dark">
          {{ locatedStations.length }}
        </el-tag>
      </div>
      <el-scrollbar class="station-list__body">
        <button
          v-for="item in locatedStations"
          :key="item.station.mn"
          type="button"
          class="station-item"
          :class="{ 'station-item--active': item.station.mn === selectedMn }"
          @click="selectStation(item)"
        >
          <span class="station-item__dot" :class="`is-${item.station.status.toLowerCase()}`" />
          <span>
            <b>{{ item.station.name }}</b>
            <small>{{ item.station.mn }} · {{ item.station.groupName || '未分组' }}</small>
          </span>
          <em>{{ item.longitude == null ? '无坐标' : '定位' }}</em>
        </button>
        <el-empty v-if="!loading && !locatedStations.length" description="暂无站点" :image-size="64" />
      </el-scrollbar>
    </aside>

    <Transition name="panel">
      <StationLatestPanel
        v-if="selectedItem"
        :station="selectedItem.station"
        :latest="selectedItem.latest"
        :loading="detailLoading"
        :histories="selectedItem.histories"
        :history-loading="Boolean(selectedItem.historyLoading)"
        @close="selectedMn = ''"
      />
    </Transition>

    <div v-if="loading" class="map-loading">
      正在加载站点与最新坐标…
    </div>
  </div>
</template>

<style scoped lang="scss">
.site-map-page {
  position: relative;
  height: calc(100vh - var(--header-h));
  overflow: hidden;
}
.site-map-page__map {
  width: 100%;
  height: 100%;
}

.station-list {
  position: absolute;
  top: 16px;
  bottom: 16px;
  left: 16px;
  z-index: 11;
  display: flex;
  flex-direction: column;
  width: 300px;
  color: #e2e8f0;
  background: rgba(8, 20, 39, 0.78);
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 0;
  box-shadow: none;
  backdrop-filter: blur(12px);
}

.station-list__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.16);
}
.station-list__body {
  flex: 1;
  padding: 8px;
}

.station-item {
  display: grid;
  grid-template-columns: 10px 1fr auto;
  gap: 10px;
  align-items: center;
  width: 100%;
  padding: 11px 10px;
  color: #dce7f5;
  text-align: left;
  background: transparent;
  border: 0;
  border-radius: 0;
  cursor: pointer;
  transition: background 0.2s;

  &:hover,
  &--active {
    background: rgba(59, 130, 246, 0.2);
  }
  b,
  small {
    display: block;
  }
  b {
    font-size: 14px;
  }
  small {
    margin-top: 3px;
    color: #8da2ba;
    font-size: 11px;
  }
  em {
    color: #7090b1;
    font-size: 11px;
    font-style: normal;
  }
}

.station-item__dot {
  width: 8px;
  height: 8px;
  background: #64748b;
  border-radius: 50%;
}
.station-item__dot.is-active {
  background: #22c55e;
  box-shadow: 0 0 8px #22c55e;
}
.station-item__dot.is-maintenance {
  background: #f59e0b;
}
.station-item__dot.is-offline,
.station-item__dot.is-disabled {
  background: #94a3b8;
}

.map-loading {
  position: absolute;
  top: 18px;
  left: 50%;
  z-index: 15;
  padding: 8px 16px;
  color: #e5eef9;
  font-size: 13px;
  background: rgba(8, 20, 39, 0.82);
  border-radius: 0;
  transform: translateX(-50%);
  backdrop-filter: blur(8px);
}
.panel-enter-active,
.panel-leave-active {
  transition:
    transform 0.25s ease,
    opacity 0.25s ease;
}
.panel-enter-from,
.panel-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

@media (max-width: 760px) {
  .station-list {
    width: 240px;
  }
}
</style>

<style lang="scss">
.site-map-page .device-marker {
  cursor: pointer;
}
.site-map-page .device-marker svg {
  display: block;
  filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.4));
  transition: transform 0.2s;
}
.site-map-page .device-marker:hover svg {
  transform: scale(1.15) translateY(-2px);
}
</style>
