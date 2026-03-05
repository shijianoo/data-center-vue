<script lang="ts" setup>
import type { MonitorItem } from "../components/MonitorGrid.vue"
import type { Device } from "@/common/apis/devices/type"
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
        { label: "湿度", value: data.data.humid },
        { label: "主板温度", value: data.data.temp_mb, unit: "℃" },
        { label: "倾角", value: data.data.tilt_ang },
        { label: "电池", value: data.data.ubatt, unit: "V" }
      ]
      lon.value = data.data.lon
      lat.value = data.data.lat
      console.log("设备最新数据", data.data)
    } else {
      monitorItems.value = [
        { label: "无数据", value: "无数据" }
      ]
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
          <span class="model-info">{{ device.modelName }}</span>
        </h1>
        <div class="dh-meta">
          <span v-if="displayTitle !== device.serialNumber" class="meta-item">SN: <strong>{{ device.serialNumber }}</strong></span>
          <span class="meta-item">ID: <strong>{{ device.deviceCode }}</strong></span>
          <span class="meta-item">FW: <strong>{{ device.firmwareVersion }}</strong></span>
          <span class="meta-item">HW: <strong>{{ device.hardwareVersion }}</strong></span>
          <span class="meta-item">上次上报: <strong>{{ formatHybridAgo(device.lastUploadTime) }}</strong></span>
        </div>
      </div>
      <div class="dh-actions">
        <button class="btn" @click="goToHistoryPage">
          <i class="fas fa-history" /> 历史数据
        </button>
      </div>
    </div>

    <div class="layout-grid">
      <MonitorGrid :items="monitorItems" />
      <div class="layout-grid-data">
        <TelemetryChart
          bucket="sob10_v1_t1_data"
          :device="device"
          :fields="[
            { label: '水温', field: 'temp_wat', unit: 'm' },
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

    .tab-toggle {
      display: flex;
      background: #f1f5f9;
      padding: 4px;
      border-radius: 8px;
      gap: 4px;

      .tab-btn {
        border: none;
        background: transparent;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 500;
        color: #64748b;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: all 0.2s;

        &:hover {
          color: var(--primary);
        }

        &.active {
          background: white;
          color: var(--primary);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
      }
    }

    .divider-v {
      width: 1px;
      height: 24px;
      background: var(--border);
      margin: 0 4px;
    }

    .btn {
      padding: 8px 16px;
      border-radius: 6px;
      border: 1px solid var(--border);
      background: white;
      font-size: 13px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
      white-space: nowrap;
      font-weight: 500;
      &:hover {
        border-color: var(--primary);
        color: var(--primary);
      }
      &.btn-primary {
        background: var(--primary);
        color: white;
        border-color: var(--primary);
        &:hover {
          opacity: 0.9;
        }
      }
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
    .btn {
      flex: 1;
      justify-content: center;
    }
  }
}
</style>
