<script lang="ts" setup>
const props = defineProps<{
  longitude: number
  latitude: number
}>()

/** 地图实例 */
let map: any = null
/** 标记点 */
let marker: any = null

// 监听坐标变化
watch(() => [props.longitude, props.latitude], ([lng, lat]) => {
  if (!lng || !lat) return
  const T = window.T
  if (map === null) {
    map = new T.Map("device-location-map")
  }

  const lng_lat = new T.LngLat(lng, lat)
  if (marker === null) {
    marker = new T.Marker(lng_lat)
    map.addOverLay(marker)
  } else {
    marker.setLngLat(lng_lat)
  }
  map.centerAndZoom(lng_lat, 6)
})
</script>

<template>
  <div class="card device-location-card">
    <div class="card-header">
      设备位置
    </div>
    <div class="card-body">
      <div id="device-location-map" class="map-container" />
      <div class="no-data" v-if="longitude === 0 && latitude === 0">
        暂无设备位置信息
      </div>
    </div>
    <div class="map-footer">
      <i class="fas fa-map-pin" /> E {{ longitude || 0 }}, N {{ latitude || 0 }}
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

    .no-data {
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;
      color: var(--text-sub);
      font-size: 14px;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999;
    }
  }
}

.map-container {
  width: 100%;
  height: 100%;

  :deep(.tdt-control-copyright) {
    display: none !important;
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
