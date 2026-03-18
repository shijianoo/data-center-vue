<script lang="ts" setup>
import type { MonitorItem } from "../components/MonitorGrid.vue"
import type { Device } from "@/common/apis/devices/type"
import { Clock } from "@element-plus/icons-vue"
import { getLatestTelemetryData } from "@/common/apis/telemetry"
import { formatHybridAgo } from "@/common/utils/datetime"
import TenantBreadcrumb from "@/layouts/components/TenantHeader/TenantBreadcrumb.vue"
import DeviceLocation from "../components/DeviceLocation.vue"
import MonitorGrid from "../components/MonitorGrid.vue"
import TelemetryChart from "../components/TelemetryChart.vue"

const { device } = defineProps<{
  device: Device
}>()
const route = useRoute()
const router = useRouter()

const displayTitle = computed(() => device.displayName || device.deviceName || device.serialNumber)

const monitorItems = ref<MonitorItem[]>([])
const latestDataTime = ref<string | undefined>(undefined)
const lon = ref(0)
const lat = ref(0)

async function fetchLatestData() {
  try {
    monitorItems.value = []
    const { data } = await getLatestTelemetryData(
      { modelNumber: device.modelNumber!, version: 1, dataType: 1 },
      device.serialNumber
    )
    if (data.data) {
      monitorItems.value = [
        { label: "水温", value: data.data.temp_wat, unit: "℃" },
        { label: "湿度", value: data.data.humid, unit: "g/m^3" },
        { label: "主板温度", value: data.data.temp_mb, unit: "℃" },
        { label: "倾角", value: data.data.tilt_ang, unit: "度" },
        { label: "电池", value: data.data.ubatt, unit: "V" }
      ]
      latestDataTime.value = data.data.time
      lon.value = data.data.lon
      lat.value = data.data.lat
      console.log("设备最新数据", data.data)
    } else {
      lon.value = 0
      lat.value = 0
      console.log("设备没有数据")
    }
  } catch (error) {
    console.error("获取最新数据失败:", error)
  }
}

function goToHistoryPage() {
  router.push(`${route.fullPath}/history`)
}

watch(() => device.deviceCode, () => {
  fetchLatestData()
}, { immediate: true })
</script>

<template>
  <div class="device-container">
    <TenantBreadcrumb />
    <div class="device-header">
      <div class="dh-main">
        <h1>
          <template v-if="device.displayName || device.deviceName">
            <span class="display-name">{{ device.displayName || device.deviceName }}</span>
            <span v-if="device.displayName && device.deviceName && device.displayName !== device.deviceName" class="device-name-sub">
              {{ device.deviceName }}
            </span>
          </template>
          <template v-else>
            <span class="display-name">{{ device.serialNumber }}</span>
          </template>
          <el-tag>{{ device.modelName }}</el-tag>
        </h1>
        <div class="dh-meta">
          <span v-if="displayTitle !== device.serialNumber" class="meta-item">SN: <strong>{{ device.serialNumber }}</strong></span>
          <span class="meta-item">ID: <strong>{{ device.deviceCode }}</strong></span>
          <span v-if="device.firmwareVersion" class="meta-item">FW: <strong>{{ device.firmwareVersion }}</strong></span>
          <span v-if="device.hardwareVersion" class="meta-item">HW: <strong>{{ device.hardwareVersion }}</strong></span>
          <span v-if="device.uploadInterval" class="meta-item">上报间隔: <strong>{{ device.uploadInterval }} 分</strong></span>
          <span v-if="device.lastUploadTime" class="meta-item">上次上报: <strong>{{ formatHybridAgo(device.lastUploadTime) }}</strong></span>
        </div>
      </div>
      <div class="dh-actions">
        <el-button :icon="Clock" @click="goToHistoryPage">
          历史数据
        </el-button>
      </div>
    </div>

    <div class="layout-grid">
      <MonitorGrid :device="device" :items="monitorItems" />
      <div class="layout-grid-data">
        <TelemetryChart
          bucket="sob10_v1_t1_data"
          :device="device"
          :latest-time="latestDataTime"
          :fields="[
            { label: '水温', field: 'temp_wat', unit: 'm' },
            { label: '湿度', field: 'humid', unit: '%' },
            { label: '主板温度', field: 'temp_mb', unit: '℃' },
            { label: '电池', field: 'ubatt', unit: 'V' },
          ]"
        />
        <DeviceLocation
          :longitude="lon"
          :latitude="lat"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.device-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 20px;
}

.device-header {
  background: white;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 20px;
  .dh-main {
    h1 {
      margin: 0 0 8px 0;
      font-size: 22px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .model-info {
      font-size: 12px;
      color: #94a3b8;
      font-weight: 400;
      background: #f1f5f9;
      padding: 2px 8px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
      white-space: nowrap;
    }
    .status-badge {
      font-size: 12px;
      padding: 4px 12px;
      border-radius: 20px;
      font-weight: 600;
      white-space: nowrap;
    }
  }
  .dh-meta {
    display: flex;
    gap: 20px;
    font-size: 13px;
    color: var(--text-sub);
    flex-wrap: wrap;
    .meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
      i {
        color: #94a3b8;
      }
    }
  }
  .dh-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;

    .el-button {
      flex: 1;
      justify-content: center;
    }
  }
}

.layout-grid {
  margin-top: 20px;
}

.layout-grid-data {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-top: 20px;
  align-items: stretch;

  & > * {
    margin-bottom: 0 !important;
  }
}

// Mobile
@media (max-width: 900px) {
  .device-container {
    padding: 10px;
  }
  .device-header {
    flex-direction: column;
    gap: 10px;
  }
  .layout-grid {
    margin-top: 10px;
  }
  .layout-grid-data {
    grid-template-columns: 1fr;
    margin-top: 10px;
    gap: 10px;
  }
  .dh-actions {
    width: 100%;
  }
}
</style>
