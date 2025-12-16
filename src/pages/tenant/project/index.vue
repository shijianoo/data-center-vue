<script lang="ts" setup>
import { ref } from "vue"
import { useTenantBreadcrumbsStore } from "@/pinia/stores/useTenantBreadcrumbs"

const breadcrumbStore = useTenantBreadcrumbsStore()

onMounted(() => {
  breadcrumbStore.setBreadcrumbs([
    breadcrumbStore.home,
    breadcrumbStore.project()
  ])
})

// --- Types ---
interface ProjectMeta {
  title: string
  customer: string
  location: string
  daysRunning: number
}

interface StatCard {
  label: string
  value: string | number
  valueClass?: string
  footer: string
  footerClass?: string
  cardStyle?: string
  labelStyle?: string
}

interface DeviceRow {
  sn: string
  status: "正常" | "离线" | "卫星"
  statusClass: string
  val1: string // Pressure / Wind Speed
  val2: string // Temp / Wind Direction
  val3?: string // Comm / Battery
  val3Class?: string
  val3Icon?: string
  val3IconClass?: string
  progress?: number
  progressText?: string
}

interface DeviceGroup {
  id: string
  type: "water" | "wind"
  icon: string
  iconColor?: string
  name: string
  model: string
  desc: string
  count: number
  statusText: string
  statusClass?: string // style object or class
  headers: string[]
  rows: DeviceRow[]
}

// --- Data ---
const meta = ref<ProjectMeta>({
  title: "测试项目1",
  customer: "测试客户",
  location: "测试位置",
  daysRunning: 123
})

const stats = ref<StatCard[]>([
  { label: "总设备数", value: 128, footer: "全型号合计", footerClass: "text-sub" },
  { label: "指标1", value: "98.4%", valueClass: "c-success", footer: "2 台离线", footerClass: "c-danger" },
  { label: "指标2", value: 1, valueClass: "c-danger", footer: "Critical Error", footerClass: "c-danger", cardStyle: "border-bottom: 3px solid var(--danger)", labelStyle: "color:var(--danger)" },
  { label: "指标3", value: 15, valueClass: "c-warning", footer: "11.7% 占比", footerClass: "text-sub" },
  { label: "指标4", value: "452 MB", footer: "正常范围" }
])

const groups = ref<DeviceGroup[]>([
  {
    id: "g1",
    type: "water",
    icon: "fas fa-water",
    name: "波浪浮标",
    model: "Model: SOB23BS",
    desc: "主要监测波浪",
    count: 100,
    statusText: "100% 在线",
    statusClass: "color:var(--success)",
    headers: ["设备 SN", "状态", "平均波高 (m)", "平均周期 (s)", "最大波高 (m)", "操作"],
    rows: [
      { sn: "24201", status: "正常", statusClass: "sb-green", val1: "102.4", val2: "24.5", val3: "100.2" },
      { sn: "24202", status: "正常", statusClass: "sb-green", val1: "101.8", val2: "24.2", val3: "100.2" }
    ]
  },
  {
    id: "g2",
    type: "wind",
    icon: "fas fa-wind",
    iconColor: "#8b5cf6",
    name: "岸基气象站",
    model: "Model: AT-Pro",
    desc: "主要监测风速、风向、湿度",
    count: 28,
    statusText: "2 离线",
    statusClass: "color:var(--danger)",
    headers: ["设备 SN", "状态", "风速 (m/s)", "风向", "电池电压", "操作"],
    rows: [
      { sn: "WX-9901", status: "正常", statusClass: "sb-green", val1: "12.5", val2: "东南 (SE)", val3: "12.8 V" },
      { sn: "WX-9902", status: "离线", statusClass: "sb-red", val1: "--", val2: "--", val3: "10.1 V (Low)", val3Class: "c-danger font-bold" },
      { sn: "WX-9903", status: "卫星", statusClass: "sb-orange", val1: "14.2", val2: "南 (S)", val3: "12.5 V" }
    ]
  }
])

function refreshData() {
  console.log("Refreshing data...")
}

const router = useRouter()
function showDeviceDetails() {
  router.push(`/console/${router.currentRoute.value.params.tenantIdentifier}/device-list/shc374s`)
}

function deviceDetails() {
  router.push(`/console/${router.currentRoute.value.params.tenantIdentifier}/device/24205`)
}
</script>

<template>
  <div class="project-dashboard">
    <div class="container">
      <div class="project-hero">
        <div>
          <div class="ph-title">
            <h1>{{ meta.title }}</h1>
          </div>
          <div class="ph-meta">
            <span class="meta-item"><i class="far fa-building" /> 客户: <strong>{{ meta.customer }}</strong></span>
            <span class="meta-item"><i class="fas fa-map-marker-alt" /> 部署地: {{ meta.location }}</span>
            <span class="meta-item"><i class="far fa-clock" /> 运行天数: {{ meta.daysRunning }} 天</span>
          </div>
        </div>
        <div class="ph-actions">
          <button class="btn" @click="refreshData">
            <i class="fas fa-sync-alt" /> 刷新数据
          </button>
        </div>
      </div>

      <div class="stats-row">
        <div v-for="(stat, idx) in stats" :key="idx" class="stat-card" :style="stat.cardStyle">
          <div class="stat-label" :style="stat.labelStyle">
            {{ stat.label }}
          </div>
          <div class="stat-value" :class="stat.valueClass">
            {{ stat.value }}
          </div>
          <div class="stat-footer" :class="stat.footerClass">
            {{ stat.footer }}
          </div>
        </div>
      </div>

      <!-- 3. Model Groups -->
      <div v-for="group in groups" :key="group.id" class="model-group">
        <div class="group-header">
          <div class="model-info">
            <div class="model-icon" :style="{ color: group.iconColor }">
              <i :class="group.icon" />
            </div>
            <div class="model-name">
              <h3>{{ group.name }} <span class="text-sub">({{ group.model }})</span></h3>
              <span>{{ group.desc }}</span>
            </div>
          </div>
          <div class="group-stats">
            <div class="gs-item">
              数量: <strong>{{ group.count }}</strong>
            </div>
            <div class="gs-item">
              状态: <strong :style="group.statusClass">{{ group.statusText }}</strong>
            </div>
          </div>
        </div>

        <table class="custom-table">
          <thead>
            <tr>
              <th v-for="(h, i) in group.headers" :key="i" :width="i === 0 ? '20%' : '15%'">
                {{ h }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, rIdx) in group.rows" :key="rIdx" :class="{ 'bg-danger-light': row.status === '离线' }">
              <td><strong>{{ row.sn }}</strong></td>
              <td><span class="status-badge" :class="row.statusClass"><span class="dot" /> {{ row.status }}</span></td>
              <td :class="{ 'text-sub': row.val1 === '--' }">
                {{ row.val1 }}
              </td>
              <td :class="{ 'text-sub': row.val2 === '--' }">
                {{ row.val2 }}
              </td>

              <!-- Dynamic Column 5 -->
              <td>
                <!-- Case 1: Icon + Text -->
                <div v-if="row.val3Icon">
                  <i :class="[row.val3Icon, row.val3IconClass]" /> {{ row.val3 }}
                </div>
                <!-- Case 2: Progress -->
                <div v-else-if="row.progress !== undefined">
                  <div class="progress-mini">
                    <div class="pm-bar" :style="{ width: `${row.progress}%` }" />
                  </div>
                  <span style="font-size:12px">{{ row.progressText }}</span>
                </div>
                <!-- Case 3: Text Only -->
                <div v-else :class="row.val3Class">
                  {{ row.val3 }}
                </div>
              </td>

              <td><a class="link-primary" @click="deviceDetails()">详情</a></td>
            </tr>
          </tbody>
        </table>

        <div v-if="group.count > group.rows.length" class="group-footer-btn" @click="showDeviceDetails()">
          查看全部 {{ group.count }} 台设备 <i class="fas fa-chevron-down" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.project-dashboard {
  font-family: "Inter", sans-serif;
  background: var(--bg-body);
  padding: 32px 24px;

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
  .font-bold {
    font-weight: 600;
  }
  .bg-danger-light {
    background: var(--danger-bg);
  }
  .link-primary {
    color: var(--accent);
    cursor: pointer;
    &:hover {
      text-decoration: underline;
    }
  }
}

.container {
  max-width: 1400px;
  margin: 0 auto;
}

// --- Hero ---
.project-hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
  .ph-title {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;
    h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }
  }
  .ph-meta {
    display: flex;
    gap: 24px;
    font-size: 13px;
    color: var(--text-sub);
    .meta-item i {
      margin-right: 6px;
    }
  }
  .ph-actions {
    display: flex;
    gap: 10px;
    .btn {
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid var(--border);
      background: white;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
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
          color: white;
        }
      }
    }
  }
}

// --- Stats ---
.stats-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
  margin-bottom: 40px;
  .stat-card {
    background: white;
    padding: 20px;
    border-radius: 10px;
    border: 1px solid var(--border);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
    .stat-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-sub);
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .stat-value {
      font-size: 26px;
      font-weight: 700;
      color: var(--text-main);
    }
    .stat-footer {
      margin-top: 8px;
      font-size: 12px;
      display: flex;
      gap: 5px;
    }
  }
}

// --- Model Groups ---
.model-group {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  margin-bottom: 30px;
  overflow: hidden;

  .group-header {
    padding: 20px 24px;
    background: #fcfcfc;
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    .model-info {
      display: flex;
      align-items: center;
      gap: 12px;
      .model-icon {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        background: white;
        border: 1px solid var(--border);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        color: var(--primary);
      }
      .model-name {
        h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
        }
        span {
          font-size: 12px;
          color: var(--text-sub);
        }
      }
    }
    .group-stats {
      display: flex;
      gap: 20px;
      font-size: 13px;
      color: var(--text-sub);
      .gs-item strong {
        color: var(--text-main);
        font-weight: 600;
      }
    }
  }

  .custom-table {
    width: 100%;
    border-collapse: collapse;
    th {
      text-align: left;
      padding: 12px 24px;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-sub);
      background: white;
      border-bottom: 1px solid var(--border);
    }
    td {
      padding: 16px 24px;
      font-size: 14px;
      border-bottom: 1px solid var(--border);
      vertical-align: middle;
    }
    tr {
      background: white;
      &.bg-danger-light {
        background: var(--danger-bg);
      }
    }
    tr:last-child td {
      border-bottom: none;
    }
    tr:hover td {
      background: #f8fafc;
    }
  }

  .group-footer-btn {
    text-align: center;
    padding: 10px;
    font-size: 13px;
    color: var(--text-sub);
    border-top: 1px solid var(--border);
    cursor: pointer;
    background: #fcfcfc;
    &:hover {
      color: var(--primary);
    }
  }
}

// --- Components ---
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
  &.sb-green {
    background: var(--success-bg);
    color: var(--success);
  }
  &.sb-red {
    background: var(--danger-bg);
    color: var(--danger);
  }
  &.sb-orange {
    background: var(--warning-bg);
    color: var(--warning);
  }
  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }
}

.progress-mini {
  width: 80px;
  height: 4px;
  background: var(--bg-body);
  border-radius: 2px;
  overflow: hidden;
  display: inline-block;
  vertical-align: middle;
  margin-right: 5px;
  .pm-bar {
    height: 100%;
    background: var(--primary);
  }
}

// Mobile
@media (max-width: 900px) {
  .project-dashboard {
    padding: 15px;
  }
  .project-hero {
    flex-direction: column;
    gap: 20px;
    .ph-meta {
      flex-direction: column;
      gap: 10px;
    }
    .ph-actions {
      width: 100%;
      .btn {
        flex: 1;
        justify-content: center;
      }
    }
  }
  .stats-row {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .group-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
    .group-stats {
      width: 100%;
      justify-content: space-between;
    }
  }
  .custom-table {
    display: block;
    overflow-x: auto;
  }
}
</style>
