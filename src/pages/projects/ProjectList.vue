<script lang="ts" setup>
import { ref } from "vue"

// --- Types ---
interface TenantInfo {
  name: string
  description: string
  accountId: string
  contact: string
  validUntil: string
}

interface KPI {
  label: string
  icon: string
  value: string | number
  sub?: string
  subClass?: string
  valueClass?: string
}

interface Project {
  id: number
  name: string
  code: string
  status: "正常" | "告警"
  statusClass?: string // 'alert' for warning/danger
  location: string
  modelCount: number
  network: string
  totalDevices: number
  onlineDevices: number
  onlineClass?: string
  traffic: string
  health: number
  healthClass?: string // 'warn' etc.
  lastUpdated: string
}

// --- Data ---

const tenant = ref<TenantInfo>({
  name: "测试租户",
  description: "负责东海沿岸及近海海域的水文、气象监测项目管理",
  accountId: "882910-CN",
  contact: "无",
  validUntil: "无"
})

const kpis = ref<KPI[]>([
  { label: "项目总数", icon: "fas fa-folder", value: 3, sub: "(+1)", subClass: "c-green" },
  { label: "设备总数", icon: "fas fa-microchip", value: 173 },
  { label: "在线设备数", icon: "fas fa-exclamation-circle", value: 2, sub: "需处理", valueClass: "c-red", subClass: "text-sub" },
  { label: "整体在线率", icon: "fas fa-wifi", value: "98.2%", valueClass: "c-blue" }
])

const projects = ref<Project[]>([
  {
    id: 1,
    name: "测试项目1",
    code: "PROJ-DH01",
    status: "正常",
    location: "上海",
    modelCount: 2,
    network: "4G/Sat",
    totalDevices: 128,
    onlineDevices: 126,
    onlineClass: "c-green",
    traffic: "4.2G",
    health: 98,
    lastUpdated: "刚刚"
  },
  {
    id: 2,
    name: "测试项目2",
    code: "PROJ-PAC02",
    status: "告警",
    statusClass: "alert",
    location: "太平洋",
    modelCount: 2,
    network: "Sat Only",
    totalDevices: 45,
    onlineDevices: 42,
    onlineClass: "c-warning",
    traffic: "120M",
    health: 85,
    healthClass: "warn",
    lastUpdated: "5分钟前"
  },
  {
    id: 3,
    name: "测试项目3",
    code: "PROJ-CJ03",
    status: "正常",
    location: "江苏",
    modelCount: 1,
    network: "4G",
    totalDevices: 210,
    onlineDevices: 210,
    onlineClass: "c-green",
    traffic: "8.5G",
    health: 100,
    lastUpdated: "10分钟前"
  }
])

const router = useRouter()
// --- Methods ---
// eslint-disable-next-line unused-imports/no-unused-vars
function goToProject(id: number) {
  router.push(`/console/project`)
}
</script>

<template>
  <div class="tenant-dashboard">
    <div class="container">
      <div class="tenant-card">
        <div class="tc-title-row">
          <div class="tc-name">
            {{ tenant.name }}
          </div>
        </div>
        <div class="tc-desc">
          {{ tenant.description }}
        </div>

        <div class="tc-info-grid">
          <div class="info-block">
            <label>Account ID</label>
            <div><i class="far fa-id-card" /> {{ tenant.accountId }}</div>
          </div>
          <div class="info-block">
            <label>主要联系人</label>
            <div><i class="far fa-user" /> {{ tenant.contact }}</div>
          </div>
          <div class="info-block">
            <label>服务有效期</label>
            <div><i class="far fa-calendar-alt" /> {{ tenant.validUntil }}</div>
          </div>
        </div>
      </div>

      <div class="kpi-row">
        <div v-for="(kpi, idx) in kpis" :key="idx" class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">{{ kpi.label }}</span>
            <i class="kpi-icon" :class="[kpi.icon]" />
          </div>
          <div class="kpi-main">
            <span class="kpi-val" :class="kpi.valueClass">{{ kpi.value }}</span>
            <span v-if="kpi.sub" class="kpi-sub" :class="kpi.subClass">{{ kpi.sub }}</span>
          </div>
        </div>
      </div>

      <div class="section-bar">
        <div class="section-title">
          项目列表 <span class="count-badge">{{ projects.length }}</span>
        </div>
        <div class="toolbar-right">
          <div class="search-box">
            <i class="fas fa-search" />
            <input type="text" placeholder="按名称或 ID 搜索...">
          </div>
        </div>
      </div>

      <div class="grid-view">
        <div v-for="p in projects" :key="p.id" class="proj-card" @click="goToProject(p.id)">
          <div class="pc-header">
            <div class="pc-title-box">
              <h3>{{ p.name }}</h3>
              <span class="pc-id">ID: {{ p.code }}</span>
            </div>
            <div class="pc-status" :class="p.statusClass">
              {{ p.status === '告警' ? `${p.health < 90 ? '2' : '1'} 告警` : '运行正常' }}
            </div>
          </div>
          <div class="pc-body">
            <div class="pc-tags">
              <span class="pc-tag"><i class="fas fa-map-marker-alt" /> {{ p.location }}</span>
              <span class="pc-tag"><i class="fas fa-cubes" /> {{ p.modelCount }} 型号</span>
              <span class="pc-tag"><i class="fas fa-network-wired" /> {{ p.network }}</span>
            </div>
            <div class="pc-metrics">
              <div class="metric-item">
                <div class="metric-label">
                  设备总数
                </div>
                <div class="metric-val">
                  {{ p.totalDevices }}
                </div>
              </div>
              <div class="metric-item">
                <div class="metric-label">
                  在线数
                </div>
                <div class="metric-val" :class="p.onlineClass">
                  {{ p.onlineDevices }}
                </div>
              </div>
            </div>
          </div>
          <div class="pc-footer">
            <span><i class="far fa-clock" /> 最近更新: {{ p.lastUpdated }}</span>
            <span class="link-arrow">进入管理 &rarr;</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.tenant-dashboard {
  font-family: "Inter", sans-serif;
  background: var(--bg-body);
  padding: 32px 24px;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
}

.tenant-card {
  background: white;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 24px;

  .tc-title-row {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 10px;
    .tc-name {
      font-size: 24px;
      font-weight: 800;
    }
    .tc-badge {
      font-size: 12px;
      background: #eff6ff;
      color: var(--accent);
      padding: 4px 10px;
      border-radius: 20px;
      font-weight: 600;
      border: 1px solid #bfdbfe;
    }
  }
  .tc-desc {
    color: var(--text-sub);
    font-size: 14px;
    max-width: 600px;
    line-height: 1.5;
  }

  .tc-info-grid {
    display: flex;
    gap: 40px;
    margin-top: 20px;
    border-top: 1px solid var(--border);
    padding-top: 20px;
    .info-block {
      label {
        display: block;
        font-size: 12px;
        color: var(--text-sub);
        margin-bottom: 10px;
        text-transform: uppercase;
      }
      div {
        font-size: 14px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
        i {
          color: var(--text-sub);
        }
      }
    }
  }

  .tc-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
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
        border-color: var(--accent);
        color: var(--accent);
      }
      &.btn-primary {
        background: var(--primary);
        color: white;
        border-color: var(--primary);
        &:hover {
          background: #1e293b;
          color: white;
        }
      }
    }
  }
}

// --- KPI Cards ---
.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 32px;
  .kpi-card {
    background: white;
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 20px;
    height: 110px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    .kpi-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      .kpi-label {
        font-size: 12px;
        color: var(--text-sub);
        font-weight: 600;
      }
      .kpi-icon {
        color: var(--text-sub);
        opacity: 0.5;
        font-size: 16px;
      }
    }
    .kpi-main {
      display: flex;
      align-items: baseline;
      gap: 8px;
      .kpi-val {
        font-size: 30px;
        font-weight: 700;
        letter-spacing: -1px;
      }
      .kpi-sub {
        font-size: 13px;
        font-weight: 500;
      }
    }
  }
}

.section-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background: white;
  padding: 15px 20px;
  border-radius: 8px;
  border: 1px solid var(--border);

  .section-title {
    font-size: 16px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .count-badge {
    background: #f1f5f9;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    color: var(--text-sub);
  }

  .toolbar-right {
    display: flex;
    gap: 12px;
    align-items: center;
    .search-box {
      position: relative;
      input {
        padding: 8px 12px 8px 34px;
        border: 1px solid var(--border);
        border-radius: 6px;
        font-size: 13px;
        width: 240px;
        transition: border 0.2s;
        &:focus {
          border-color: var(--accent);
        }
      }
      i {
        position: absolute;
        left: 10px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-sub);
        font-size: 13px;
      }
    }
  }
}

.grid-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 24px;

  .proj-card {
    background: white;
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    cursor: pointer;
    transition: all 0.2s;
    &:hover {
      border-color: var(--accent);
      box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.05);
    }

    .pc-header {
      padding: 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      background: #fcfcfc;
      .pc-title-box {
        h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
        }
        .pc-id {
          font-family: monospace;
          font-size: 11px;
          color: var(--text-sub);
          margin-top: 4px;
          display: block;
        }
      }
      .pc-status {
        font-size: 11px;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 4px;
        background: var(--success-bg);
        color: var(--success);
        border: 1px solid #bbf7d0;
        &.alert {
          background: var(--danger-bg);
          color: var(--danger);
          border-color: #fecaca;
        }
      }
    }

    .pc-body {
      padding: 20px;
      flex: 1;
      .pc-tags {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 20px;
        .pc-tag {
          font-size: 11px;
          padding: 4px 8px;
          background: #f8fafc;
          border-radius: 4px;
          color: var(--text-sub);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 5px;
          i {
            color: var(--text-sub);
          }
        }
      }
      .pc-metrics {
        display: flex;
        justify-content: space-between;
        .metric-item {
          text-align: left;
          .metric-label {
            font-size: 11px;
            color: var(--text-sub);
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          .metric-val {
            font-size: 18px;
            font-weight: 700;
          }
        }
      }
      .pc-progress {
        margin-top: 15px;
        .pg-label {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--text-sub);
          margin-bottom: 5px;
        }
        .pg-track {
          height: 6px;
          background: #f1f5f9;
          border-radius: 3px;
          overflow: hidden;
          .pg-fill {
            height: 100%;
            background: var(--primary);
            &.warn {
              background: var(--warning);
            }
          }
        }
      }
    }

    .pc-footer {
      padding: 12px 20px;
      background: #fcfcfc;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: var(--text-sub);
      .link-arrow {
        color: var(--accent);
      }
    }
  }
}

// Mobile
@media (max-width: 900px) {
  .tenant-dashboard {
    padding: 15px;
  }
  .tenant-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
    .tc-info-grid {
      flex-direction: column;
      gap: 15px;
      width: 100%;
    }
    .tc-right {
      width: 100%;
      flex-direction: row;
      .btn {
        flex: 1;
        justify-content: center;
      }
    }
  }
  .kpi-row {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .section-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
    .toolbar-right {
      justify-content: space-between;
      flex-wrap: wrap;
      .search-box {
        width: 100%;
        input {
          width: 100%;
        }
      }
    }
  }
}
</style>
