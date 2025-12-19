<script lang="ts" setup>
import AMapLoader from "@amap/amap-jsapi-loader"
import { ElMessage } from "element-plus"
import { onMounted, onUnmounted, shallowRef, watch } from "vue"
import { wgs84togcj02 } from "@/common/utils/lnglat-convert"

const {
  locationInfos = []
} = defineProps<LocationInfoProps>()

export interface LocationInfo {
  id: string
  desc?: string
  lon: number
  lat: number
  data: Map<string, string>
}

export interface LocationInfoProps {
  /** 设备数组 */
  locationInfos?: LocationInfo[]
}

/** 地图实例 */
let map: any | null = null
/** 高德地图 API */
let AMap: any = null
/** 标记点数组 */
const markers = shallowRef<any[]>([])

/** 初始化地图 */
async function initMap() {
  try {
    window._AMapSecurityConfig = {
      securityJsCode: "315e9072c6e3433a437aede3570020c9"
    }

    AMap = await AMapLoader.load({
      key: "ad4165a2acd181970b0f8313af6b7a0b",
      version: "2.0",
      plugins: ["AMap.Scale", "AMap.ToolBar", "AMap.Marker", "AMap.InfoWindow"]
    })

    // 创建地图实例
    map = new AMap.Map("container", {
      viewMode: "3D",
      zoom: 0,
      center: [0, 0], // 默认中心点（北京）
      mapStyle: "amap://styles/normal"
    })

    // 添加比例尺控件
    map.addControl(new AMap.Scale())

    // 渲染初始标记点
    renderMarkers()
  } catch (error) {
    console.error("地图加载失败:", error)
    ElMessage.error("地图加载失败")
  }
}

/** 清除所有标记点 */
function clearMarkers() {
  markers.value.forEach((marker) => {
    marker.setMap(null)
  })
  markers.value = []
}

/** 渲染所有标记点 */
function renderMarkers() {
  clearMarkers()

  const newMarkers: any[] = []

  // 遍历所有位置信息创建标记点
  for (const locationInfo of locationInfos) {
    const marker = new AMap.Marker({
      map,
      position: wgs84togcj02(locationInfo.lon, locationInfo.lat)
    })
    marker.setLabel({
      direction: "right",
      offset: new AMap.Pixel(5, 0), // 设置文本标注偏移量
      content: `<div class='info'>${locationInfo.id}</div>` // 设置文本标注内容
    })

    // 构建信息窗体内容
    const buildContent = (info: LocationInfo) => {
      // 遍历 data Map 生成数据项
      let dataItems = ""
      if (info.data && info.data.size > 0) {
        info.data.forEach((value, key) => {
          dataItems += `
            <div class="info-data-item">
              <span class="info-data-label">${key}</span>
              <span class="info-data-value">${value}</span>
            </div>
          `
        })
      } else {
        dataItems = "<div class=\"info-empty\">暂无数据</div>"
      }

      return `
        <div class="info-window-content">
          <div class="info-header">
            <div class="info-id">${info.id}</div>
            <div class="info-desc">${info.desc}</div>
          </div>
          <div class="info-body">
            <div class="info-location">
              <div class="info-location-item">
                <span class="info-label">经度：</span>
                <span class="info-value">${info.lon.toFixed(6)}</span>
              </div>
              <div class="info-location-item">
                <span class="info-label">纬度：</span>
                <span class="info-value">${info.lat.toFixed(6)}</span>
              </div>
            </div>
            <div class="info-divider"></div>
            <div class="info-data-section">
              <div class="info-section-title">最新数据</div>
              <div class="info-data-list">
                ${dataItems}
              </div>
            </div>
          </div>
        </div>
      `
    }

    marker.on("click", () => {
      const infoWindow = new AMap.InfoWindow({
        isCustom: true,
        closeWhenClickMap: true,
        content: buildContent(locationInfo),
        offset: new AMap.Pixel(0, -40)
      })
      infoWindow.open(map, marker.getPosition())
    })

    newMarkers.push(marker)
  }

  markers.value = newMarkers
  map.setFitView(null, false, [150, 60, 100, 60])
}

/** 监听位置信息变化 */
watch(
  () => locationInfos,
  () => {
    renderMarkers()
  },
  { deep: true }
)

onMounted(() => {
  initMap()
})

onUnmounted(() => {
  clearMarkers()
  map?.destroy()
  map = null
  AMap = null
})
</script>

<template>
  <div id="container" class="device-location-map" />
</template>

<style scoped lang="scss">
.device-location-map {
  width: 100%;
  height: 100%;

  // 隐藏高德地图 logo 和版权信息
  :deep(.amap-logo) {
    display: none !important;
    opacity: 0 !important;
  }

  :deep(.amap-copyright) {
    opacity: 0 !important;
  }
}
</style>

<style lang="scss">
// 信息窗体样式
.info-window-content {
  width: 280px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  .info-header {
    height: 30px;
    background: #667eea;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 14px;
    color: #fff;
    padding: 0 10px;
  }

  .info-body {
    max-height: 200px;
    padding: 5px 10px;
    background: #fafbfc;
    overflow: auto;

    .info-location {
      display: flex;
      gap: 6px;

      .info-location-item {
        flex: 1;
        display: flex;
        font-size: 12px;
        align-items: center;

        .info-label {
          color: #888;
        }

        .info-value {
          font-weight: 600;
        }
      }
    }

    .info-divider {
      height: 1px;
      background: #e0e0e0;
      margin: 4px 0;
    }

    .info-data-section {
      .info-section-title {
        font-size: 12px;
        margin-bottom: 3px;
        font-weight: bold;
        padding-left: 6px;
        border-left: 2px solid #667eea;
      }

      .info-data-list {
        display: grid;
        gap: 2px;

        .info-data-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 24px;
          line-height: 24px;
          padding: 4px 4px;
          background: #fff;
          border-radius: 3px;
          border: 1px solid #e8eaed;
          color: #333;
          font-size: 12px;
          padding: 0 5px;
        }

        .info-empty {
          padding: 10px 8px;
          text-align: center;
          color: #999;
          font-size: 11px;
          background: #f8f9fa;
          border-radius: 3px;
          border: 1px dashed #ddd;
        }
      }
    }
  }
}

.amap-icon img {
  width: 25px;
  height: 34px;
}

.amap-marker-label {
  height: 26px;
  border: 0;
  padding: 0 10px;
  text-align: center;
  background-color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.info {
  line-height: 26px;
}
</style>
