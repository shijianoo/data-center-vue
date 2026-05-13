<script lang="ts" setup>
import maplibregl from "maplibre-gl"
import { onMounted, onUnmounted, ref, shallowRef } from "vue"
import { influxBatchLatestDataQueryApi, influxLatestDataQueryApi } from "@/common/apis/data-query"
import { formatHybridAgo } from "@/common/utils/datetime"
import { maplibreStyle } from "@/common/utils/tianditu-constants"
import "maplibre-gl/dist/maplibre-gl.css"

export interface DeviceLocation {
  id: string
  name: string
  log: number
  lat: number
  color?: string // marker 显示颜色，默认 #3b82f6
}

/** 通用的设备参数 */
interface DeviceData {
  meteo: {
    time: string | null
    wind_spd: number | null
    air_temp: number | null
    rh: number | null
    air_press: number | null
  } | null
  water: {
    time: string | null
    water_temp: number | null
    sal: number | null
    ph: number | null
    turb: number | null
  } | null
  nutri: {
    time: string | null
    no3: number | null
    no2: number | null
    po4: number | null
    sio3: number | null
  } | null
}

const router = useRouter()
const route = useRoute()
const mapContainer = ref<HTMLElement | null>(null)
const map = shallowRef<maplibregl.Map | null>(null)
const markers = shallowRef<maplibregl.Marker[]>([])

const popupVisible = ref(false)
const selectedDevice = ref<DeviceLocation | null>(null)
const popupStyle = ref({ left: "0px", top: "0px" })

/** 当前选中设备的地理坐标，用于跟随地图移动更新 popup 位置 */
const selectedLngLat = ref<[number, number] | null>(null)

const dataLoading = ref(false)
const deviceData = ref<DeviceData | null>()

// 获取设备位置数据
async function fetchDeviceLocations(): Promise<DeviceLocation[]> {
  const { data: buoyData } = await influxBatchLatestDataQueryApi({ bucket: "tianjin_data_store", measurement: "buoy_met_hydro_data" }, ["001", "002"])
  console.log("天津浮标数据", buoyData)
  return [
    { id: "001", name: "1号浮标", log: 117.778, lat: 38.9000, color: "#3b82f6" },
    { id: "002", name: "2号浮标", log: 117.728, lat: 38.829, color: "#f59e0b" },
    { id: "003", name: "岸基站", log: 117.717056, lat: 38.958458, color: "#10b981" }
  ]
}

// 查询指定设备最新数据
async function fetchDeviceData(sn: string) {
  let met_hydro = null
  let water = null
  let nutri = null

  if (sn === "001" || sn === "002") {
    const met_hydroRes = await influxLatestDataQueryApi({
      bucket: "tianjin_data_store",
      measurement: "buoy_met_hydro_data",
      serialNumber: sn
    })
    console.log(`${sn}号浮标最新水文与气象数据`, met_hydroRes.data)
    met_hydro = met_hydroRes.data

    const waterRes = await influxLatestDataQueryApi({
      bucket: "tianjin_data_store",
      measurement: "buoy_water_data",
      serialNumber: sn
    })
    console.log(`${sn}号浮标最新水质数据`, waterRes.data)
    water = waterRes.data

    const nutriRes = await influxLatestDataQueryApi({
      bucket: "tianjin_data_store",
      measurement: "buoy_nutri_data",
      serialNumber: sn
    })
    console.log(`${sn}号浮标最新营养盐数据`, nutriRes.data)
    nutri = nutriRes.data
  } else if (sn === "003") {
    const met_hydroRes = await influxLatestDataQueryApi({
      bucket: "tianjin_data_store",
      measurement: "shore_met_hydro_data",
      serialNumber: "001"
    })
    met_hydro = met_hydroRes.data
    console.log("岸基站最新水文与气象数据", met_hydro)

    const waterRes = await influxLatestDataQueryApi({
      bucket: "tianjin_data_store",
      measurement: "shore_water_data",
      serialNumber: "001"
    })
    water = waterRes.data
    console.log("岸基站最新水质数据", water)

    const nutriRes = await influxLatestDataQueryApi({
      bucket: "tianjin_data_store",
      measurement: "shore_nutri_data",
      serialNumber: "001"
    })
    nutri = nutriRes.data
    console.log("岸基站最新营养盐数据", nutri)
  }

  if (met_hydro === null && water === null && nutri === null) {
    deviceData.value = null
    return
  }

  deviceData.value = {
    meteo: met_hydro !== null
      ? {
          time: met_hydro?.time,
          wind_spd: met_hydro?.wind_spd,
          air_temp: met_hydro?.air_temp,
          rh: met_hydro?.rh,
          air_press: met_hydro?.air_press
        }
      : null,
    water: water !== null
      ? {
          time: water?.time,
          water_temp: water?.water_temp,
          sal: water?.sal,
          ph: water?.ph,
          turb: water?.turb
        }
      : null,
    nutri: nutri !== null
      ? {
          time: nutri?.time,
          no3: nutri?.no3,
          no2: nutri?.no2,
          po4: nutri?.po4,
          sio3: nutri?.sio3
        }
      : null
  }
  console.log("设备数据", deviceData.value)
}

/** 生成 SVG marker 字符串，将原始绿色替换为指定颜色 */
function createMarkerSvg(color: string): string {
  // marker.svg 原始 fill 为 #00C13A，替换为目标颜色
  return `<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
    <path d="M510.690247 1023.913083L211.869483 725.034375l0.811226-0.840198a421.026113 421.026113 0 0 1-124.581082-300.211436A421.170975 421.170975 0 0 1 212.275096 124.20589 421.170975 421.170975 0 0 1 512.051947 0.030421a421.315837 421.315837 0 0 1 299.718906 124.204442 421.11303 421.11303 0 0 1 124.146497 299.747878 420.678445 420.678445 0 0 1-37.664048 174.732211 422.387814 422.387814 0 0 1-101.750875 139.443895l-285.754236 285.783208z m0.724308-925.029022a319.04346 319.04346 0 0 0-318.695791 318.695792 319.04346 319.04346 0 0 0 318.695791 318.695792 319.04346 319.04346 0 0 0 318.695792-318.695792 319.04346 319.04346 0 0 0-318.695792-318.811681z" fill="${color}"/>
    <path d="M509.965938 93.031647A325.330459 325.330459 0 1 1 184.635479 418.362106 325.330459 325.330459 0 0 1 509.965938 93.031647z" fill="#FFFFFF"/>
    <path d="M734.849278 574.146404a5.504745 5.504745 0 0 1-5.388856 5.591662h-0.782254a81.933791 81.933791 0 0 1-52.15022-17.383407 38.18555 38.18555 0 0 1-6.402888-8.199173c-16.137596 23.35171-59.393307 25.350802-61.65315 25.437719h-0.86917a81.933791 81.933791 0 0 1-52.150221-17.383407 37.982744 37.982744 0 0 1-6.402888-8.199174 81.122565 81.122565 0 0 1-55.626902 24.974161 5.359884 5.359884 0 0 1-2.114981 0.463558h-3.911266a5.591663 5.591663 0 0 1-1.448618 0 77.327188 77.327188 0 0 1-47.543617-17.093684 38.156578 38.156578 0 0 1-6.402889-8.199173 80.861814 80.861814 0 0 1-55.221289 24.916216 5.301939 5.301939 0 0 1-2.201898 0.521503h-4.143045A5.272967 5.272967 0 0 1 368.899592 579.448343a76.97952 76.97952 0 0 1-47.166977-17.064711 38.156578 38.156578 0 0 1-6.402889-8.199174c-16.137596 23.35171-59.393307 25.350802-61.653149 25.437719a5.446801 5.446801 0 0 1-5.794469-5.272967 5.504745 5.504745 0 0 1 5.272967-5.794469c0.579447 0 57.075519-2.665456 57.075519-34.245311a5.504745 5.504745 0 1 1 11.009491 0 26.741474 26.741474 0 0 0 8.083284 20.135779 68.374734 68.374734 0 0 0 41.720176 14.051587c8.025339-0.550475 55.916625-5.099133 55.916625-34.187366a5.504745 5.504745 0 1 1 11.009491 0 26.741474 26.741474 0 0 0 8.083285 20.135779 68.635485 68.635485 0 0 0 41.922982 14.051587c7.619727-0.521502 56.032515-4.954271 56.032515-34.187366a5.504745 5.504745 0 0 1 11.009491 0 26.712502 26.712502 0 0 0 8.083284 20.135779 73.039281 73.039281 0 0 0 44.936107 14.08056c1.680396 0 56.988602-2.897234 56.988602-34.216339a5.504745 5.504745 0 0 1 11.009491 0 26.712502 26.712502 0 0 0 8.083284 20.135779 73.184143 73.184143 0 0 0 44.965079 14.08056 5.417828 5.417828 0 0 1 5.765497 5.620635z m40.851006-50.759548a5.504745 5.504745 0 0 1-5.388856 5.620635h-0.782254a81.933791 81.933791 0 0 1-52.15022-17.383407 37.924799 37.924799 0 0 1-6.402888-8.199174c-16.137596 23.35171-59.393307 25.350802-61.65315 25.437719h-0.782253a106.299533 106.299533 0 0 1-27.987285-4.085101v-0.289723a53.598838 53.598838 0 0 1-27.205032-12.342219 26.770447 26.770447 0 0 1-8.083284-20.13578 5.504745 5.504745 0 1 0-11.009491 0c0 29.233096-48.44176 33.665865-56.032515 34.187367a68.57754 68.57754 0 0 1-41.922982-14.051587 26.799419 26.799419 0 0 1-8.083285-20.13578 5.504745 5.504745 0 1 0-11.009491 0c0 19.759139-22.076927 28.132147-38.764997 31.695746l-1.622451 0.347668-0.637392-0.550475a74.980428 74.980428 0 0 1-45.254802-16.919849 38.156578 38.156578 0 0 1-6.402888-8.199174c-16.137596 23.35171-59.393307 25.350802-61.65315 25.437719a5.446801 5.446801 0 0 1-5.794469-5.272967 5.504745 5.504745 0 0 1 5.272967-5.794469c0.579447 0 57.075519-2.694428 57.075519-34.245311a5.504745 5.504745 0 0 1 11.009491 0 26.741474 26.741474 0 0 0 8.083284 20.135779 50.353935 50.353935 0 0 0 24.162936 11.588938 69.128014 69.128014 0 0 1-15.007675-42.937015v-26.654557c0-35.780846-2.34676-42.705236 28.219064-43.458517l54.757731-188.030517a51.310022 51.310022 0 1 1 102.18546-7.53281l56.95963 195.621272c27.900368 1.129921 25.495663 8.691703 25.495663 43.458517v26.654557a69.533627 69.533627 0 0 1-20.51242 49.252986 98.766723 98.766723 0 0 0 14.109532 1.187866c1.680396 0 56.988602-2.897234 56.988602-34.216339a5.504745 5.504745 0 0 1 11.009491 0 26.741474 26.741474 0 0 0 8.083284 20.13578 73.184143 73.184143 0 0 0 44.965079 14.080559 5.417828 5.417828 0 0 1 5.794469 5.620635z m-162.245131-126.058672l-48.615594-167.112484a51.223105 51.223105 0 0 1-84.570274 2.694428l-47.862314 164.331139z" fill="${color}"/>
  </svg>`
}

function addDeviceMarkers(devices: DeviceLocation[]) {
  if (!map.value) return
  markers.value.forEach(m => m.remove())
  markers.value = []
  const bounds = new maplibregl.LngLatBounds()

  // 先添加所有 marker，收集所有坐标
  devices.forEach((device) => {
    const color = device.color ?? "#3b82f6"

    const el = document.createElement("div")
    el.className = "device-marker"
    el.title = device.name
    el.innerHTML = createMarkerSvg(color)

    el.addEventListener("click", (e) => {
      e.stopPropagation()
      openPopup(device)
    })

    const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
      .setLngLat([device.log, device.lat])
      .addTo(map.value!)
    bounds.extend([device.log, device.lat])

    markers.value.push(marker)
  })

  // 所有 marker 添加完毕后，统一调用一次 fitBounds
  // 避免在循环内反复触发地图动画，导致移动端性能差时后续 marker 丢失
  if (!bounds.isEmpty()) {
    map.value!.fitBounds(bounds, { padding: 150, maxZoom: 12 })
  }
}

function updatePopupPosition() {
  if (!map.value || !selectedLngLat.value || !mapContainer.value) return

  const point = map.value.project(selectedLngLat.value) // 相对地图容器的像素坐标
  const rect = mapContainer.value.getBoundingClientRect() // 容器在视口中的偏移

  // 基础设置
  const offsetX = 18 // marker 右/左侧的绝对偏移量
  const offsetY = 20 // marker 上/下侧的绝对偏移量 (改为正数便于计算对称逻辑)
  const popupWidth = 300
  const popupHeight = 360

  // Marker 在当前视口中的绝对坐标
  const markerX = rect.left + point.x
  const markerY = rect.top + point.y

  // 默认位置：右侧，稍微偏上 (兼容你原本的 offsetY = -20 的意图)
  let x = markerX + offsetX
  let y = markerY - offsetY

  // --- 1. 水平方向碰撞检测 (X轴) ---
  if (x + popupWidth > window.innerWidth) {
    // 超出右边界：翻转到左侧
    x = markerX - popupWidth - offsetX

    // 极端保护：如果翻转到左侧后依然超出左边界（屏幕太窄），则强制留出 10px 安全边距
    if (x < 0) x = 10
  } else if (x < 0) {
    // 超出左边界：强制翻转回右侧
    x = markerX + offsetX
  }

  // --- 2. 垂直方向碰撞检测 (Y轴) ---
  if (y + popupHeight > window.innerHeight) {
    // 超出下边界：翻转到上侧 (Marker Y - 弹窗高度 - 偏移量)
    y = markerY - popupHeight - offsetY

    // 极端保护：如果翻转到上侧后依然超出上边界，强制贴边
    if (y < 0) y = 10
  } else if (y < 0) {
    // 超出上边界：翻转到下侧 (Marker Y + 偏移量)
    y = markerY + offsetY
  }

  // 赋值渲染
  popupStyle.value = { left: `${x}px`, top: `${y}px` }
}

async function openPopup(device: DeviceLocation) {
  selectedDevice.value = device
  selectedLngLat.value = [device.log, device.lat]
  popupVisible.value = true
  dataLoading.value = true

  updatePopupPosition()
  try {
    deviceData.value = null
    await fetchDeviceData(device.id)
  } catch (err) {
    console.log("获取数据失败", err)
    deviceData.value = null
  } finally {
    dataLoading.value = false
  }
}

function closePopup() {
  popupVisible.value = false
  selectedDevice.value = null
  selectedLngLat.value = null
  deviceData.value = null
}

function goToDetail(device: DeviceLocation) {
  if (device.id === "001" || device.id === "002") {
    router.push(`${route.fullPath}/history-data/buoy`)
  } else if (device.id === "003") {
    router.push(`${route.fullPath}/history-data/shore`)
  }
}

function fmt(val: number | null | undefined, unit = "", decimals = 1): string {
  if (val === null || val === undefined) return "—"
  return `${val.toFixed(decimals)} ${unit}`.trim()
}

onMounted(async () => {
  if (!mapContainer.value) return

  map.value = new maplibregl.Map({
    container: mapContainer.value,
    style: maplibreStyle as any,
    center: [117.717056, 38.958458],
    zoom: 10,
    maxZoom: 13
  })

  map.value.on("load", async () => {
    const devices = await fetchDeviceLocations()
    addDeviceMarkers(devices)
  })

  // 地图移动/缩放时实时更新 popup 位置，实现跟随 marker
  map.value.on("move", updatePopupPosition)
  map.value.on("click", () => closePopup())
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
  <div class="app-container project-over" @click="closePopup">
    <!-- 地图 -->
    <div ref="mapContainer" class="map-container" />

    <Transition name="popup-fade">
      <div
        v-if="popupVisible && selectedDevice"
        class="device-popup"
        :style="popupStyle"
        @click.stop
      >
        <!-- 标题栏 -->
        <div class="popup-header">
          <span
            class="popup-dot" :style="{
              background: selectedDevice.color,
              boxShadow: `0 0 5px ${selectedDevice.color}`,
            }"
          />
          <span class="popup-title">{{ selectedDevice.name }}</span>
          <!-- <span class="popup-id">{{ selectedDevice.id }}</span> -->
          <button class="popup-close" @click="closePopup">
            ✕
          </button>
        </div>

        <!-- Loading -->
        <div v-if="dataLoading" class="popup-loading">
          <span class="loading-dot" /><span class="loading-dot" /><span class="loading-dot" />
          <span class="loading-text">数据加载中…</span>
        </div>

        <!-- 无数据 -->
        <div v-else-if="!deviceData" class="popup-empty">
          暂无传感器数据
        </div>

        <div v-else class="popup-body">
          <div class="param-group" v-if="deviceData.meteo">
            <div class="group-title">
              <span>气象与水文</span>
              <span>
                {{ formatHybridAgo(deviceData.meteo.time) }}
              </span>
            </div>
            <div class="param-grid">
              <div class="param-item">
                <span class="param-name">风速</span>
                <span class="param-val">{{ fmt(deviceData.meteo.wind_spd, 'm/s') }}</span>
              </div>
              <div class="param-item">
                <span class="param-name">气温</span>
                <span class="param-val">{{ fmt(deviceData.meteo.air_temp, '°C') }}</span>
              </div>
              <div class="param-item">
                <span class="param-name">湿度</span>
                <span class="param-val">{{ fmt(deviceData.meteo.rh, '%RH', 0) }}</span>
              </div>
              <div class="param-item">
                <span class="param-name">气压</span>
                <span class="param-val">{{ fmt(deviceData.meteo.air_press, 'hPa') }}</span>
              </div>
            </div>
          </div>

          <div class="group-divider" v-if="deviceData.water" />

          <div class="param-group" v-if="deviceData.water">
            <div class="group-title">
              <span>水质</span>
              <span>
                {{ formatHybridAgo(deviceData.water.time) }}
              </span>
            </div>
            <div class="param-grid">
              <div class="param-item">
                <span class="param-name">水温</span>
                <span class="param-val">{{ fmt(deviceData.water.water_temp, '°C') }}</span>
              </div>
              <div class="param-item">
                <span class="param-name">盐度</span>
                <span class="param-val">{{ fmt(deviceData.water.sal, 'psu') }}</span>
              </div>
              <div class="param-item">
                <span class="param-name">pH</span>
                <span class="param-val">{{ fmt(deviceData.water.ph, '', 2) }}</span>
              </div>
              <div class="param-item">
                <span class="param-name">浊度</span>
                <span class="param-val">{{ fmt(deviceData.water.turb, 'NTU') }}</span>
              </div>
            </div>
          </div>

          <div class="group-divider" v-if="deviceData.nutri" />

          <div class="param-group" v-if="deviceData.nutri">
            <div class="group-title">
              <span>
                营养盐
              </span>
              <span>
                {{ formatHybridAgo(deviceData.nutri.time) }}
              </span>
            </div>
            <div class="param-grid">
              <div class="param-item">
                <span class="param-name">硝酸盐</span>
                <span class="param-val">{{ fmt(deviceData.nutri.no3, 'μmol/L') }}</span>
              </div>
              <div class="param-item">
                <span class="param-name">亚硝酸盐</span>
                <span class="param-val">{{ fmt(deviceData.nutri.no2, 'μmol/L') }}</span>
              </div>
              <div class="param-item">
                <span class="param-name">磷酸盐</span>
                <span class="param-val">{{ fmt(deviceData.nutri.po4, 'μmol/L') }}</span>
              </div>
              <div class="param-item">
                <span class="param-name">硅酸盐</span>
                <span class="param-val">{{ fmt(deviceData.nutri.sio3, 'μmol/L') }}</span>
              </div>
            </div>
          </div>
        </div>
        <div v-if="!dataLoading" class="popup-footer">
          <button class="popup-detail-btn" @click="goToDetail(selectedDevice!)">
            查看详情
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.project-over {
  padding: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

.map-container {
  flex: 1;
  width: 100%;
  height: 100%;
}

// ── 设备 Marker ──
:deep(.device-marker) {
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

// ── Popup 容器 ──
.device-popup {
  position: fixed;
  z-index: 9999;
  width: 300px;
  height: 360px;
  display: flex;
  flex-direction: column;
  background: rgba(10, 18, 35, 0.93);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  color: #e2e8f0;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.45);
  overflow: hidden;
  pointer-events: all;
}

// ── 标题栏 ──
.popup-header {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 11px 14px;
  background: rgba(255, 255, 255, 0.04);
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.popup-dot {
  width: 7px;
  height: 7px;
  flex-shrink: 0;
  border-radius: 50%;
  background: #3b82f6;
  box-shadow: 0 0 5px #3b82f6;
}

.popup-title {
  font-size: 14px;
  font-weight: 600;
  color: #f8fafc;
}

.popup-id {
  font-size: 12px;
  color: #64748b;
}

.popup-close {
  margin-left: auto;
  background: none;
  border: none;
  color: #64748b;
  font-size: 12px;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  line-height: 1;
  transition: color 0.15s;

  &:hover {
    color: #f1f5f9;
  }
}

// ── Loading ──
.popup-loading {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 18px 14px;
  color: #64748b;
  font-size: 13px;
}

.loading-dot {
  width: 4px;
  height: 4px;
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

.loading-text {
  margin-left: 4px;
}

// ── 无数据 ──
.popup-empty {
  padding: 20px 14px;
  text-align: center;
  font-size: 13px;
  color: #475569;
}

// ── 参数主体（可滚动）──
.popup-body {
  flex: 1 1 0; // 占满剩余高度
  min-height: 0; // 允许 flex 子项收缩到 0（需要显式声明）
  overflow-y: auto;
  padding: 8px 0 2px;

  // 滚动条样式
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.12) transparent;
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.12);
    border-radius: 2px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
}

.group-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
  margin: 4px 14px;
}

.param-group {
  padding: 5px 14px 7px;
}

.group-title {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #64748b;
  margin-bottom: 6px;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

// 2 列网格
.param-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
}

.param-item {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 4px 8px;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.03);

  &.wide {
    grid-column: 1 / -1;
  }
}

.param-name {
  font-size: 12px;
  color: #64748b;
  white-space: nowrap;
}

.param-val {
  font-size: 13px;
  font-weight: 600;
  color: #cbd5e1;
  font-variant-numeric: tabular-nums;
}

// ── 底栏（始终固定在最底部）──
.popup-footer {
  display: flex;
  align-items: center;
  justify-content: end;
  padding: 7px 14px 9px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.popup-detail-btn {
  font-size: 12px;
  font-weight: 600;
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.25);
  border-radius: 4px;
  padding: 4px 10px;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;

  &:hover {
    background: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
  }
}

// ── 动画 ──
.popup-fade-enter-active,
.popup-fade-leave-active {
  transition:
    opacity 0.17s ease,
    transform 0.17s ease;
}

.popup-fade-enter-from,
.popup-fade-leave-to {
  opacity: 0;
  transform: scale(0.94) translateY(6px);
}
</style>
