<script lang="ts" setup>
import type { MonitorItem } from "../components/MonitorGrid.vue"
import type { Device } from "@/common/apis/devices/type"
import { Clock } from "@element-plus/icons-vue"
import { useRouter } from "vue-router"
import { getLatestTelemetryData } from "@/common/apis/telemetry"
import { formatHybridAgo } from "@/common/utils/datetime"
import TenantBreadcrumb from "@/layouts/components/TenantHeader/TenantBreadcrumb.vue"
import DynamicCmdBtn from "../components/device-ctrl/DynamicCmdBtn.vue"
import StaticCmdBtn from "../components/device-ctrl/StaticCmdBtn.vue"
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
const csq = ref(0)
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
        { label: "平均波高", value: data.data.hm, unit: "m" },
        { label: "平均波周期", value: data.data.tm, unit: "s" },
        { label: "1/3波高", value: data.data.h13, unit: "m" },
        { label: "1/3波周期", value: data.data.t13, unit: "s" }
      ]
      latestDataTime.value = data.data.time
      csq.value = data.data.csq
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
          <span v-if="device.uploadInterval" class="meta-item">上报间隔: <strong>{{ device.uploadInterval }} </strong>分钟</span>
          <span v-if="device.lastUploadTime" class="meta-item">上次上报: <strong>{{ formatHybridAgo(device.lastUploadTime) }}</strong></span>
          <span v-if="csq" class="meta-item"><i class="fas fa-signal" /> 信号: <strong>{{ csq }}</strong></span>
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

      <div class="card remote-control-card">
        <div class="card-header">
          远程控制
        </div>
        <div class="card-body">
          <div class="control-grid">
            <StaticCmdBtn
              v-role-enable="['platform_admin', 'platform_ops']"
              :device="device"
              command="Reset"
              command-name="重启"
              btn-icon="fas fa-power-off"
              btn-color="var(--danger)"
            />
            <DynamicCmdBtn
              v-role-enable="['platform_admin', 'platform_ops']"
              :device="device"
              command="SetReportInterval"
              command-name="设置上报间隔"
              btn-icon="fas fa-clock"
              btn-color="var(--primary)"
              param-type="numeric"
              unit="分钟"
            />
          </div>
        </div>
      </div>

      <TelemetryChart
        bucket="sob23bs_v1_t1"
        measurement="data"
        :device="device"
        :latest-time="latestDataTime"
        :fields="[
          { label: '平均波高', field: 'hm', unit: 'm' },
          { label: '平均波周期', field: 'tm', unit: 's' },
          { label: '最大波高', field: 'hmax', unit: 'm' },
          { label: '最大波周期', field: 'tmax', unit: 's' },
          { label: '1/3波高', field: 'h13', unit: 'm' },
          { label: '1/3波周期', field: 't13', unit: 's' },
          { label: '1/10波高', field: 'h10', unit: 'm' },
          { label: '1/10波周期', field: 't10', unit: 's' },
          { label: '谱有效波高', field: 'spec_hm', unit: 'm' },
          { label: '谱平均周期', field: 'spec_tm', unit: 's' },
          { label: '气压', field: 'air_press', unit: 'dBar' },
          { label: '温度', field: 'water_temp', unit: '℃' },
          { label: '主板温度', field: 'board_temp', unit: '℃' },
          { label: '电池电压', field: 'bat_volt', unit: 'V' },
        ]"
      />

      <DeviceLocation
        :longitude="lon"
        :latitude="lat"
      />
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

.data-view-container {
  margin-top: 24px;
}

// --- Layout ---
.layout-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-top: 20px;
  align-items: stretch;

  & > * {
    margin-bottom: 0 !important;
  }
}

// --- Cards ---
.card {
  background: white;
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.card-header {
  padding: 16px 20px;
  height: 50px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: 700;
  background: #fcfcfc;
}
.card-body {
  padding: 20px;
}

.control-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.ctrl-btn {
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    border-color: var(--primary);
    color: var(--primary);
    box-shadow: 0 4px 10px rgba(37, 99, 235, 0.1);
  }
  i {
    font-size: 20px;
  }
  span {
    font-size: 13px;
    font-weight: 500;
  }
}

// Mobile
@media (max-width: 900px) {
  .device-container {
    padding: 10px;
  }
  .layout-grid {
    grid-template-columns: 1fr;
    margin-top: 10px;
    gap: 10px;
  }
  .device-header {
    flex-direction: column;
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
