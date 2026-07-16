<script setup lang="ts">
/* eslint-disable style/max-statements-per-line */
import type { Station, StationLatest } from "./apis/type"
import { ElMessage } from "element-plus"
import maplibregl from "maplibre-gl"
import { onMounted, onUnmounted, ref } from "vue"
import { getStationLatest, getStations } from "./apis"
import "maplibre-gl/dist/maplibre-gl.css"

const container = ref<HTMLElement>()
const loading = ref(false)
const drawerVisible = ref(false)
const selectedStation = ref<Station>()
const latest = ref<StationLatest>()
let map: maplibregl.Map | undefined
let markers: maplibregl.Marker[] = []

function color(status: string) {
  return ({ Active: "#22c55e", Maintenance: "#f59e0b", Offline: "#94a3b8", Disabled: "#ef4444" } as Record<string, string>)[status] || "#409eff"
}
async function openStation(station: Station) {
  selectedStation.value = station
  latest.value = undefined
  drawerVisible.value = true
  loading.value = true
  try {
    latest.value = await getStationLatest(station.mn)
  } catch (error: any) {
    ElMessage.error(error.message)
  } finally {
    loading.value = false
  }
}
async function load() {
  try {
    const { items } = await getStations({ pageSize: 200 })
    const positioned = items.filter(item => item.longitude != null && item.latitude != null)
    markers.forEach(marker => marker.remove())
    markers = positioned.map((station) => {
      const element = document.createElement("button")
      element.className = "station-marker"
      element.style.setProperty("--marker-color", color(station.status))
      element.title = station.name
      element.addEventListener("click", () => openStation(station))
      return new maplibregl.Marker({ element }).setLngLat([Number(station.longitude), Number(station.latitude)]).addTo(map!)
    })
    if (positioned.length) map?.fitBounds(positioned.reduce((bounds, item) => bounds.extend([Number(item.longitude), Number(item.latitude)]), new maplibregl.LngLatBounds()), { padding: 80, maxZoom: 12 })
  } catch (error: any) {
    ElMessage.error(error.message)
  }
}
onMounted(() => {
  if (!container.value) return
  map = new maplibregl.Map({ container: container.value, style: "https://demotiles.maplibre.org/style.json", center: [114.3, 30.5], zoom: 7 })
  map.on("load", load)
})
onUnmounted(() => {
  markers.forEach(marker => marker.remove()); map?.remove()
})
</script>

<template>
  <div class="map-page">
    <div class="map-toolbar">
      <span>站点地图</span><el-button :loading="loading" @click="load">
        刷新站点
      </el-button>
    </div>
    <div ref="container" class="map" />
    <el-drawer v-model="drawerVisible" :title="selectedStation?.name || '站点最新数据'" size="420px">
      <template #header>
        <div><strong>{{ selectedStation?.name }}</strong><p>{{ selectedStation?.mn }} · {{ selectedStation?.status }}</p></div>
      </template>
      <el-skeleton v-if="loading" :rows="8" animated />
      <template v-else-if="latest">
        <el-alert v-if="!latest.parameters.length" title="该站点暂无参数数据" type="info" :closable="false" />
        <el-card v-for="item in latest.parameters" :key="item.parameter.code" shadow="never" class="latest-card">
          <div class="latest-title">
            {{ item.parameter.name }}（{{ item.parameter.code }}）<el-tag size="small" :type="item.point?.autoReviewStatus === 'Failed' ? 'danger' : item.point?.autoReviewStatus === 'Passed' ? 'success' : 'info'">
              {{ item.point?.autoReviewStatus || '暂无数据' }}
            </el-tag>
          </div>
          <strong class="latest-value">{{ item.point?.effectiveValueText ?? '—' }} {{ item.parameter.unit }}</strong>
          <p>采集时间：{{ item.point?.observedAt || '—' }} 人工审核：{{ item.point?.manualReview?.currentLevel ? `第${item.point.manualReview.currentLevel}级` : '待审核' }}</p>
        </el-card>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped lang="scss">
.map-page {
  position: relative;
  height: calc(100vh - var(--header-h));
  min-height: 550px;
}
.map {
  width: 100%;
  height: 100%;
}
.map-toolbar {
  position: absolute;
  z-index: 2;
  top: 16px;
  left: 16px;
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 10px 12px;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 10px #0002;
  font-weight: 600;
}
:deep(.station-marker) {
  width: 18px;
  height: 18px;
  border-radius: 50% 50% 50% 0;
  border: 2px solid white;
  background: var(--marker-color);
  transform: rotate(-45deg);
  cursor: pointer;
  box-shadow: 0 2px 6px #0006;
}
.latest-card {
  margin-bottom: 10px;
}
.latest-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.latest-value {
  display: block;
  font-size: 20px;
  margin: 12px 0 4px;
}
p {
  color: #909399;
  font-size: 12px;
  margin: 4px 0 0;
}
</style>
