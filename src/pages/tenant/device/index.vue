<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from "vue"
import { useTenantBreadcrumbsStore } from "@/pinia/stores/useTenantBreadcrumbs"

const breadcrumbStore = useTenantBreadcrumbsStore()

// --- Types ---
interface DeviceMeta {
  name: string
  sn: string
  fw: string
  lastReport: string
  signal: string
  status: string
  statusClass: string
  statusIcon: string
}

interface KPI {
  label: string
  value: string
  unit: string
}

interface Log {
  time: string
  msg: string
}

interface ControlAction {
  icon: string
  label: string
  color?: string
  action: () => void
}

// --- Data ---
const device = ref<DeviceMeta>({
  name: "Buoy-001",
  sn: "2023-8812",
  fw: "v2.1.0",
  lastReport: "刚刚",
  signal: "-65 dBm",
  status: "在线 (4G)",
  statusClass: "bg-green",
  statusIcon: "fas fa-wifi"
})

const kpis = ref<KPI[]>([
  { label: "水压 (Pressure)", value: "102.4", unit: "MPa" },
  { label: "水温 (Temp)", value: "24.5", unit: "°C" },
  { label: "电池电压 (Bat)", value: "12.8", unit: "V" },
  { label: "波高 (Wave H)", value: "1.2", unit: "m" }
])

const logs = ref<Log[]>([
  { time: "创建时间", msg: "2023-01-15" },
  { time: "所属项目", msg: "东海监测 A" },
  { time: "通信卡号", msg: "89860...1293" },
  { time: "维护责任人", msg: "王运维" }
])

const controls = ref<ControlAction[]>([
  { icon: "fas fa-crosshairs", label: "立即采样", color: "var(--primary)", action: () => console.log("指令已下发: 立即采样") },
  { icon: "fas fa-power-off", label: "远程重启", color: "var(--danger)", action: () => console.log("指令已下发: 远程重启") },
  { icon: "fas fa-upload", label: "上报间隔", color: "var(--warning)", action: () => console.log("上报间隔") },
  { icon: "fas fa-bug", label: "调试模式", color: "#64748b", action: () => console.log("调试模式") }
])

const terminalLines = ref([
  { ts: "[10:42:05]", hex: "AA 55 01 02 4E 20 00 FF ..." },
  { ts: "[10:41:05]", hex: "AA 55 01 02 4E 1F 00 FE ..." },
  { ts: "[10:40:05]", hex: "AA 55 01 02 4E 1E 00 FD ..." },
  { ts: "[10:39:05]", hex: "AA 55 01 02 4E 1D 00 FC ..." },
  { ts: "[10:38:05]", hex: "AA 55 01 02 4E 1C 00 FB ..." }
])

// --- Methods ---

function refreshData() {
  console.log("Refreshing...")
}

onMounted(() => {
  breadcrumbStore.setBreadcrumbs([
    breadcrumbStore.home,
    breadcrumbStore.project(),
    breadcrumbStore.deviceList(),
    { name: device.value.name }
  ])
})

onUnmounted(() => {
  breadcrumbStore.clearBreadcrumbs()
})
</script>

<template>
  <div class="device-dashboard">
    <div class="container">
      <!-- 1. Breadcrumb -->

      <!-- 2. Header -->
      <div class="device-header">
        <div class="dh-main">
          <h1>
            {{ device.name }}
            <span class="status-badge" :class="device.statusClass"><i :class="device.statusIcon" /> {{ device.status }}</span>
          </h1>
          <div class="dh-meta">
            <span class="meta-item"><i class="fas fa-fingerprint" /> SN: <strong>{{ device.sn }}</strong></span>
            <span class="meta-item"><i class="fas fa-code-branch" /> FW: <strong>{{ device.fw }}</strong></span>
            <span class="meta-item"><i class="far fa-clock" /> 上次上报: <strong>{{ device.lastReport }}</strong></span>
            <span class="meta-item"><i class="fas fa-signal" /> 信号: <strong>{{ device.signal }}</strong></span>
          </div>
        </div>
        <div class="dh-actions">
          <button class="btn">
            <i class="fas fa-history" /> 历史数据
          </button>
          <button class="btn">
            <i class="fas fa-cog" /> 远程配置
          </button>
          <button class="btn btn-primary" @click="refreshData">
            <i class="fas fa-sync" /> 刷新
          </button>
        </div>
      </div>

      <!-- 3. Layout Grid -->
      <div class="layout-grid">
        <!-- Left Column -->
        <div class="left-col">
          <!-- KPI Card -->
          <div class="card">
            <div class="card-header">
              实时监测数据
            </div>
            <div class="card-body">
              <div class="kpi-grid">
                <div v-for="(kpi, idx) in kpis" :key="idx" class="kpi-item">
                  <div class="kpi-label">
                    {{ kpi.label }}
                  </div>
                  <div class="kpi-val">
                    {{ kpi.value }} <span class="kpi-unit">{{ kpi.unit }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Chart Card -->
          <div class="card">
            <div class="card-header">
              <span>24小时水压趋势</span>
              <select class="chart-select">
                <option>水压</option>
                <option>温度</option>
              </select>
            </div>
            <div class="card-body">
              <div class="chart-box">
                <div class="chart-bar" style="height:40%" data-val="101.2" />
                <div class="chart-bar" style="height:60%" data-val="102.5" />
                <div class="chart-bar" style="height:55%" data-val="102.1" />
                <div class="chart-bar" style="height:70%" data-val="103.0" />
                <div class="chart-bar" style="height:85%" data-val="104.2" />
                <div class="chart-bar" style="height:50%" data-val="101.8" />
                <div class="chart-bar" style="height:65%" data-val="102.4" />
                <div class="chart-bar" style="height:90%" data-val="105.1" />
              </div>
              <div class="chart-footer">
                过去 24 小时数据采样点
              </div>
            </div>
          </div>

          <!-- Terminal Card -->
          <div class="card">
            <div class="card-header">
              实时报文流 (Live Hex Stream)
            </div>
            <div class="terminal-box">
              <div v-for="(line, i) in terminalLines" :key="i" class="term-line">
                <span class="term-ts">{{ line.ts }}</span> <span class="term-hex">{{ line.hex }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column -->
        <div class="right-col">
          <!-- Controls -->
          <div class="card">
            <div class="card-header">
              远程控制
            </div>
            <div class="card-body">
              <div class="control-grid">
                <div v-for="(ctrl, idx) in controls" :key="idx" class="ctrl-btn" @click="ctrl.action">
                  <i :class="ctrl.icon" :style="{ color: ctrl.color }" />
                  <span>{{ ctrl.label }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Map -->
          <div class="card">
            <div class="card-header">
              设备位置
            </div>
            <div class="card-body" style="padding:0">
              <div class="map-container">
                <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgNDAwIDIwMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2UyZThmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmF0LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5NGEzYjgiPk1hcCBQbGFjZWhvbGRlcjwvdGV4dD48L3N2Zz4=" class="map-placeholder">
                <i class="fas fa-map-marker-alt map-marker" />
                <div class="map-info">
                  E 121.455, N 31.220
                </div>
              </div>
            </div>
            <div class="map-footer">
              <i class="fas fa-map-pin" /> 上海市浦东新区东海大桥附近
            </div>
          </div>

          <!-- Info -->
          <div class="card">
            <div class="card-header">
              基础属性
            </div>
            <div class="card-body">
              <ul class="log-list">
                <li v-for="(log, idx) in logs" :key="idx" class="log-item">
                  <span class="log-time">{{ log.time }}</span>
                  <span class="log-msg">{{ log.msg }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.device-dashboard {
  font-family: "Inter", sans-serif;
  background: var(--bg-body);

  min-height: 100vh;

  // Utilities
  .text-sub {
    color: var(--text-sub);
  }
  .c-success {
    color: var(--success);
  }
  .c-danger {
    color: var(--danger);
  }
  .c-warning {
    color: var(--warning);
  }
  .bg-green {
    background: var(--success-bg);
    color: var(--success);
  }
  .bg-red {
    background: var(--danger-bg);
    color: var(--danger);
  }
}

.container {
  max-width: 1400px;
  margin: 0 auto;
}

// --- Breadcrumb ---

// --- Header ---
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
    gap: 10px;
    flex-wrap: wrap;
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

// --- Layout ---
.layout-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  margin-top: 24px;
}

// --- Cards ---
.card {
  background: white;
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 24px;
}
.card-header {
  padding: 16px 20px;
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

// --- KPI ---
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
}
.kpi-item {
  background: #f8fafc;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}
.kpi-label {
  font-size: 11px;
  color: var(--text-sub);
  margin-bottom: 5px;
  text-transform: uppercase;
}
.kpi-val {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-main);
}
.kpi-unit {
  font-size: 12px;
  color: var(--text-sub);
  margin-left: 2px;
  font-weight: 400;
}

// --- Chart ---
.chart-select {
  font-size: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 2px;
}
.chart-box {
  height: 250px;
  width: 100%;
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding-top: 20px;
  gap: 5px;
}
.chart-bar {
  background: #bfdbfe;
  border-radius: 4px 4px 0 0;
  flex: 1;
  transition: height 0.5s;
  position: relative;
  &:hover {
    background: var(--primary);
    &::after {
      content: attr(data-val);
      position: absolute;
      top: -25px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 12px;
      background: #1e293b;
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
    }
  }
}
.chart-footer {
  text-align: center;
  font-size: 11px;
  color: #94a3b8;
  margin-top: 10px;
}

// --- Terminal ---
.terminal-box {
  background: #1e293b;
  color: #e2e8f0;
  padding: 15px;
  border-radius: 8px;
  font-family: "JetBrains Mono", monospace;
  font-size: 12px;
  height: 150px;
  overflow-y: auto;
}
.term-line {
  margin-bottom: 6px;
  display: flex;
  gap: 10px;
}
.term-ts {
  color: #64748b;
}
.term-hex {
  color: #a5b4fc;
}

// --- Controls ---
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

// --- Map ---
.map-container {
  height: 200px;
  background: #e2e8f0;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.map-placeholder {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.6;
  filter: grayscale(30%);
}
.map-marker {
  position: absolute;
  font-size: 32px;
  color: var(--primary);
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3));
  animation: bounce 2s infinite;
}
.map-info {
  position: absolute;
  bottom: 10px;
  left: 10px;
  background: rgba(255, 255, 255, 0.9);
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
.map-footer {
  padding: 15px;
  font-size: 13px;
  color: var(--text-sub);
  border-top: 1px solid var(--border);
}

// --- Logs ---
.log-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.log-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
  font-size: 13px;
  &:last-child {
    border-bottom: none;
  }
}
.log-time {
  color: var(--text-sub);
  font-family: "JetBrains Mono", monospace;
}
.log-msg {
  font-weight: 500;
  color: var(--text-main);
}

// Mobile
@media (max-width: 900px) {
  .layout-grid {
    grid-template-columns: 1fr;
  }
  .device-header {
    flex-direction: column;
    gap: 15px;
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
