<script setup lang="ts">
import type { LatestMeasurementResult, Station, StationMapItem } from "../types"
import { ElMessage } from "element-plus"
import maplibregl from "maplibre-gl"
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from "vue"
import MapStyleSwitcher from "@/common/components/MapStyleSwitcher/index.vue"
import { maplibreStyle } from "@/common/utils/tianditu-constants"
import { createCirclePolygon } from "../../liangwan-1/DeviceLocation/map-utils"
import { createMarkerEl } from "../../liangwan-1/DeviceLocation/marker"
import { getApiErrorMessage, getStationLatestMeasurements, getStationMap, getStationTrajectory } from "../apis"
import { formatWaterQualityGrade, toDayEndIso, toDayStartIso, waterQualityGradeTagType } from "../utils"
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
  latest?: LatestMeasurementResult
  /** 站点基本海水水质等级。 */
  waterQualityGrade?: string
}

const mapContainer = ref<HTMLElement>()
const map = shallowRef<maplibregl.Map | null>(null)
const markerMap = shallowRef(new Map<string, maplibregl.Marker>())
const locatedStations = ref<LocatedStation[]>([])
const selectedMn = ref("")
const loading = ref(false)
const detailLoading = ref(false)

const selectedItem = computed(() => locatedStations.value.find(item => item.station.mn === selectedMn.value))

/** 加载站点、最新坐标并绘制 Marker 和围栏。 */
async function loadStations() {
  if (!map.value) return
  loading.value = true
  try {
    const { data } = await getStationMap()
    locatedStations.value = data.map(item => ({
      station: item.station,
      longitude: item.latestCoordinates?.longitude ?? item.station.longitude ?? null,
      latitude: item.latestCoordinates?.latitude ?? item.station.latitude ?? null,
      waterQualityGrade: item.waterQualityGrade
    }))
    renderMarkers()
    drawGeofences(data)
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

/** 绘制电子围栏 */
function drawGeofences(items: StationMapItem[]) {
  const mapInstance = map.value
  if (!mapInstance) return

  const features = items.map((item) => {
    const lng = item.station.longitude
    const lat = item.station.latitude
    const radius = item.station.geofenceRadiusMeters
    if (lng == null || lat == null || !radius) return null

    return {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [createCirclePolygon(lng, lat, radius)]
      }
    }
  }).filter(Boolean) as any

  mapInstance.addSource("geofences", {
    type: "geojson",
    data: { type: "FeatureCollection", features }
  })

  mapInstance.addLayer({
    id: "geofence-fill",
    type: "fill",
    source: "geofences",
    paint: {
      "fill-color": "#3b82f6",
      "fill-opacity": 0.08
    }
  })

  mapInstance.addLayer({
    id: "geofence-line",
    type: "line",
    source: "geofences",
    paint: {
      "line-color": "#3b82f6",
      "line-width": 2,
      "line-dasharray": [2, 2]
    }
  })
}

/** 列表和 Marker 共用定位逻辑，放大到站点并打开右侧最新数据面板。 */
async function selectStation(item: LocatedStation) {
  selectedMn.value = item.station.mn
  if (item.longitude != null && item.latitude != null) {
    map.value?.flyTo({ center: [item.longitude, item.latitude], zoom: 10, duration: 900 })
  }
  if (!item.latest) {
    detailLoading.value = true
    try {
      const { data } = await getStationLatestMeasurements(item.station.id)
      item.latest = data
    } catch (error) {
      ElMessage.error(getApiErrorMessage(error, "最新数据加载失败"))
    } finally {
      detailLoading.value = false
    }
  }
}

watch(selectedMn, (val) => {
  if (!val) {
    clearTrajectory()
  } else {
    clearTrajectory()
  }
})

function clearTrajectory() {
  const mapInstance = map.value
  if (!mapInstance) return
  const source = mapInstance.getSource("station-trajectory") as maplibregl.GeoJSONSource
  if (source) {
    source.setData({ type: "FeatureCollection", features: [] } as any)
  }
}

async function queryAndDrawTrajectory(range?: [Date, Date]) {
  const item = selectedItem.value
  const mapInstance = map.value
  if (!item || !mapInstance) return

  let from: Date
  let to: Date
  if (range && range.length === 2) {
    from = range[0]
    to = range[1]
  } else {
    to = new Date()
    from = new Date(to.getTime() - 7 * 24 * 3600 * 1000)
  }

  ElMessage.info("正在查询轨迹...")
  try {
    const { data } = await getStationTrajectory(item.station.id, {
      from: toDayStartIso(from),
      to: toDayEndIso(to)
    })

    if (!data.points || data.points.length === 0) {
      ElMessage.warning("该时间段内无轨迹数据")
      return
    }

    const coordinates = data.points.map(p => [p.longitude, p.latitude])

    const geojson = {
      type: "FeatureCollection",
      features: coordinates.length > 1
        ? [{
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates
            }
          }]
        : []
    }

    const source = mapInstance.getSource("station-trajectory") as maplibregl.GeoJSONSource
    if (source) {
      source.setData(geojson as any)
    } else {
      mapInstance.addSource("station-trajectory", {
        type: "geojson",
        data: geojson as any
      })
      mapInstance.addLayer({
        id: "station-trajectory-line",
        type: "line",
        source: "station-trajectory",
        paint: {
          "line-color": "#f59e0b",
          "line-width": 3,
          "line-opacity": 0.9
        }
      })
    }

    if (coordinates.length > 0) {
      const bounds = new maplibregl.LngLatBounds()
      coordinates.forEach(coord => bounds.extend(coord as [number, number]))
      mapInstance.fitBounds(bounds, { padding: 80, duration: 800 })
    }

    ElMessage.success("轨迹加载完成")
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "轨迹查询失败"))
  }
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
      <div class="station-list_title">
        站点列表
      </div>
      <el-scrollbar>
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
            <small>{{ item.station.mn }}</small>
          </span>
          <el-tag
            v-if="item.waterQualityGrade"
            size="small"
            :type="waterQualityGradeTagType(item.waterQualityGrade)"
          >
            {{ formatWaterQualityGrade(item.waterQualityGrade) }}
          </el-tag>
        </button>
        <el-empty v-if="!loading && !locatedStations.length" description="暂无站点" :image-size="64" />
      </el-scrollbar>
    </aside>

    <Transition name="panel">
      <StationLatestPanel
        v-if="selectedItem"
        :station="selectedItem.station"
        :latest="selectedItem.latest"
        :map-item-grade="selectedItem.waterQualityGrade"
        :loading="detailLoading"
        @close="selectedMn = ''"
        @query-trajectory="queryAndDrawTrajectory"
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
  color: #334155;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(12px);
}

.station-list_title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  color: #1e293b;
  font-weight: 600;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.station-item {
  display: grid;
  grid-template-columns: 10px 1fr auto;
  gap: 10px;
  align-items: center;
  width: 100%;
  padding: 11px 10px;
  color: #334155;
  text-align: left;
  background: transparent;
  border: 0;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover,
  &--active {
    background: rgba(59, 130, 246, 0.1);
  }
  b,
  small {
    display: block;
  }
  b {
    color: #1e293b;
    font-size: 14px;
  }
  small {
    margin-top: 3px;
    color: #64748b;
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
