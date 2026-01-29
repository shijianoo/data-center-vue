<script lang="ts" setup>
import type { DeviceSummary } from "@/common/apis/devices/type"
import DeviceDrawer from "./components/DeviceDrawer.vue"
import TracksRightToolbar from "./components/TracksRightToolbar.vue"
import TracksTopBar from "./components/TracksTopBar.vue"

const T = (window as any).T
let map: any = null
let lineTool: any = null

const deviceDrawerOpen = ref(false)
const devices = ref<DeviceSummary[]>([])

onMounted(() => {
  try {
    map = new T.Map("map")
    map.centerAndZoom(new T.LngLat(120.20, 30.25), 13)
    map.setStyle("indigo")
    lineTool = new T.PolylineTool(map, {
      showLabel: true
    })
  } catch (e) {
    console.error("地图加载失败", e)
  }
})

function renderTrajectories(devices: DeviceSummary[]) {
  console.log("查询设备轨迹", devices)
  // if (devices.length === 0) {
  //   alert("请选择至少一个设备")
  //   return
  // }

  // // TODO: Implement trajectory rendering on T.Map
  // console.log("Render trajectories for:", selectedDeviceIds.value)

  // // Simulate clearing and adding
  // clearMap()
  // Add mock overlays...

  deviceDrawerOpen.value = false
}

// 清空所有标记
function stadiometry() {
  console.log("开始测距")
  lineTool.open()
}

// 清空所有标记
function clearMap() {
  console.log("清空所有标记")
  lineTool.clear()
}
</script>

<template>
  <div class="device-tracks-container">
    <div id="map" class="map-container" />

    <!-- 顶部工具栏 -->
    <TracksTopBar
      v-model:devices="devices"
      v-model:device-drawer-open="deviceDrawerOpen"
    />

    <!-- 设备选择 -->
    <DeviceDrawer
      :devices="devices"
      v-model:visible="deviceDrawerOpen"
      @search="renderTrajectories"
    />

    <!-- 右边工具栏 -->
    <TracksRightToolbar
      @stadiometry="stadiometry"
      @clear-map="clearMap"
    />
  </div>
</template>

<style lang="scss" scoped>
.device-tracks-container {
  --bg-glass: rgba(15, 23, 42, 0.85);
  --border-glass: 1px solid rgba(255, 255, 255, 0.1);
  --accent: #0ea5e9;
  --accent-hover: #38bdf8;
  --text-main: #f8fafc;
  --text-sub: #94a3b8;
  --radius: 4px;
  --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  position: relative;
  width: 100%;
  height: calc(100vh - var(--header-h, 60px));
  overflow: hidden;
  background: #000;
  color: var(--text-main);
}

.map-container {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: #0f172a;

  :deep(.tdt-control-copyright) {
    display: none !important;
    opacity: 0 !important;
  }
}
.cursor-crosshair {
  cursor: crosshair !important;
}
</style>
