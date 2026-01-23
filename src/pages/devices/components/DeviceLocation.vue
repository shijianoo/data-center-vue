<script lang="ts" setup>
import AMapLoader from "@amap/amap-jsapi-loader"
import { onMounted, onUnmounted, shallowRef, watch } from "vue"
import { wgs84togcj02 } from "@/common/utils/lnglat-convert"

const props = defineProps<{
  longitude: number
  latitude: number
}>()

/** 地图实例 */
const map = shallowRef<any>(null)
/** 高德地图 API */
let AMap: any = null
/** 标记点 */
let marker: any = null

/** 初始化地图 */
async function initMap() {
  try {
    window._AMapSecurityConfig = {
      securityJsCode: "315e9072c6e3433a437aede3570020c9"
    }

    AMap = await AMapLoader.load({
      key: "ad4165a2acd181970b0f8313af6b7a0b",
      version: "2.0",
      plugins: ["AMap.Marker"]
    })

    const center = wgs84togcj02(props.longitude, props.latitude)

    // 创建地图实例
    map.value = new AMap.Map("device-location-map", {
      viewMode: "3D",
      zoom: 6,
      center,
      mapStyle: "amap://styles/normal"
    })

    // 添加标记点
    marker = new AMap.Marker({
      position: center,
      map: map.value
    })
  } catch (error) {
    console.error("地图加载失败:", error)
  }
}

// 监听坐标变化
watch(() => [props.longitude, props.latitude], ([lng, lat]) => {
  if (map.value && AMap) {
    const newCenter: [number, number] = [Number(lng), Number(lat)]
    map.value.setCenter(newCenter)
    if (marker) {
      marker.setPosition(newCenter)
    } else {
      marker = new AMap.Marker({
        position: newCenter,
        map: map.value
      })
    }
  }
})

onMounted(() => {
  initMap()
})

onUnmounted(() => {
  map.value?.destroy()
  map.value = null
  AMap = null
  marker = null
})
</script>

<template>
  <div class="card device-location-card">
    <div class="card-header">
      设备位置
    </div>
    <div class="card-body">
      <div id="device-location-map" class="map-container" />
    </div>
    <div class="map-footer">
      <i class="fas fa-map-pin" /> E {{ longitude }}, N {{ latitude }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.device-location-card {
  background: white;
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  height: 100%;

  .card-header {
    flex-shrink: 0;
    height: 50px;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
    font-size: 14px;
    font-weight: 700;
    background: #fcfcfc;
  }

  .card-body {
    padding: 0;
    flex: 1;
    min-height: 300px;
    position: relative;
  }
}

.map-container {
  width: 100%;
  height: 100%;

  :deep(.amap-logo) {
    display: none !important;
    opacity: 0 !important;
  }

  :deep(.amap-copyright) {
    opacity: 0 !important;
  }
}

.map-footer {
  padding: 15px;
  font-size: 13px;
  color: var(--text-sub);
  border-top: 1px solid var(--border);
  background: white;

  i {
    color: var(--primary);
    margin-right: 4px;
  }
}
</style>
