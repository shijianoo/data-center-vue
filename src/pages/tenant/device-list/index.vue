<script lang="ts" setup>
import { ref } from "vue"
import { useRouter } from "vue-router"

const router = useRouter()

// --- Types ---
interface Device {
  id: string
  name: string
  sn: string
  status: "正常" | "异常告警" | "离线"
  statusClass: string
  val1: string
  val1Unit: string
  val1Class?: string
  channel: string
  channelIcon: string
  channelClass: string
  lastReport: string
  firmware: string
}

// --- Data ---
const devices = ref<Device[]>([
  {
    id: "d1",
    name: "Buoy-A001",
    sn: "SN-2023-8812",
    status: "正常",
    statusClass: "bg-green",
    val1: "102.4",
    val1Unit: "MPa",
    channel: "4G LTE",
    channelIcon: "fas fa-wifi",
    channelClass: "c-success",
    lastReport: "刚刚",
    firmware: "v2.1"
  },
  {
    id: "d2",
    name: "Buoy-A005",
    sn: "SN-2023-8816",
    status: "异常告警",
    statusClass: "bg-red",
    val1: "145.2",
    val1Unit: "MPa",
    val1Class: "c-danger",
    channel: "4G LTE",
    channelIcon: "fas fa-wifi",
    channelClass: "c-success",
    lastReport: "2分钟前",
    firmware: "v2.0"
  },
  {
    id: "d3",
    name: "Buoy-A008",
    sn: "SN-2023-8819",
    status: "正常",
    statusClass: "bg-green",
    val1: "101.8",
    val1Unit: "MPa",
    channel: "北斗",
    channelIcon: "fas fa-satellite",
    channelClass: "c-warning",
    lastReport: "15分钟前",
    firmware: "v2.1"
  },
  {
    id: "d4",
    name: "Buoy-A012",
    sn: "SN-2023-8822",
    status: "离线",
    statusClass: "bg-gray",
    val1: "--",
    val1Unit: "",
    val1Class: "text-sub",
    channel: "-",
    channelIcon: "",
    channelClass: "text-sub",
    lastReport: "2天前",
    firmware: "v1.0"
  }
])

// --- Methods ---
function goHome() {
  router.push("/console/dashboard")
}

function goProject() {
  router.push("/console/project")
}

function goToDetail(id: string) {
  console.log("Go to detail", id)
  // router.push(`/console/device/${id}`)
}

function deviceDetails() {
  router.push(`/console/device-detail`)
}
</script>

<template>
  <div class="device-list-page">
    <div class="container">
      <!-- 1. Breadcrumb -->
      <div class="breadcrumb">
        <a class="bc-item" @click="goHome">首页</a>
        <i class="fas fa-chevron-right bc-sep" />
        <a class="bc-item" @click="goProject">东海浮标监测网 A</a>
        <i class="fas fa-chevron-right bc-sep" />
        <span class="bc-current">浅海压力浮标列表</span>
      </div>

      <!-- 2. Page Header -->
      <div class="page-header">
        <div class="ph-info">
          <h1>
            浅海压力浮标 (Device List)
            <span class="model-tag">Model: X-200</span>
          </h1>
          <div class="ph-stats">
            共 <strong>120</strong> 台设备 &nbsp;|&nbsp;
            <span class="c-success">118 在线</span> &nbsp;|&nbsp;
            <span class="c-danger">2 告警</span>
          </div>
        </div>
        <div class="ph-actions">
          <button class="btn">
            <i class="fas fa-sync-alt" /> <span class="btn-text">刷新</span>
          </button>
          <button class="btn btn-primary">
            <i class="fas fa-file-export" /> <span class="btn-text">导出数据</span>
          </button>
        </div>
      </div>

      <!-- 3. Toolbar -->
      <div class="toolbar">
        <div class="search-box">
          <i class="fas fa-search" />
          <input type="text" placeholder="搜索设备名称、SN序列号...">
        </div>

        <div class="filter-row">
          <select class="filter-select">
            <option value="all">
              所有状态
            </option>
            <option value="online">
              正常在线
            </option>
            <option value="alert">
              异常告警
            </option>
            <option value="offline">
              离线失联
            </option>
          </select>
          <select class="filter-select">
            <option value="all">
              所有通道
            </option>
            <option value="4g">
              4G 优先
            </option>
            <option value="sat">
              北斗卫星
            </option>
          </select>
        </div>
      </div>

      <!-- 4. Data Table -->
      <div class="table-container">
        <div class="table-scroll">
          <table class="data-table">
            <thead>
              <tr>
                <th width="5%">
                  <input type="checkbox">
                </th>
                <th width="25%">
                  设备信息 (Name/SN)
                </th>
                <th width="10%">
                  状态
                </th>
                <th width="15%">
                  实时读数 (水压)
                </th>
                <th width="15%">
                  通信通道
                </th>
                <th width="15%" class="col-opt">
                  最后上报
                </th>
                <th width="10%" class="col-opt">
                  固件
                </th>
                <th width="10%">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="dev in devices" :key="dev.id" :class="{ 'bg-danger-light': dev.status === '异常告警' }" @click="goToDetail(dev.id)">
                <td @click.stop>
                  <input type="checkbox">
                </td>
                <td>
                  <div class="dev-name" :class="{ 'text-sub': dev.status === '离线' }">
                    {{ dev.name }}
                  </div>
                  <div class="dev-sn">
                    {{ dev.sn }}
                  </div>
                </td>
                <td><span class="badge" :class="dev.statusClass"><span class="dot" /> {{ dev.status }}</span></td>
                <td><span class="val-primary" :class="dev.val1Class">{{ dev.val1 }}</span> <span class="val-unit">{{ dev.val1Unit }}</span></td>
                <td>
                  <div class="channel-tag" :class="dev.channelClass">
                    <i v-if="dev.channelIcon" :class="dev.channelIcon" /> {{ dev.channel }}
                  </div>
                </td>
                <td class="col-opt text-sub">
                  {{ dev.lastReport }}
                </td>
                <td class="col-opt text-sub">
                  {{ dev.firmware }}
                </td>
                <td><span class="link-primary" @click="deviceDetails()">详情</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 5. Pagination -->
        <div class="pagination">
          <span class="pg-info">显示 1-10 条，共 120 条</span>
          <div class="pg-ctrl">
            <button class="pg-btn" disabled>
              &lt;
            </button>
            <button class="pg-btn active">
              1
            </button>
            <button class="pg-btn">
              2
            </button>
            <button class="pg-btn">
              3
            </button>
            <span class="pg-dots">...</span>
            <button class="pg-btn">
              12
            </button>
            <button class="pg-btn">
              &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.device-list-page {
  font-family: "Inter", sans-serif;
  background: var(--bg-body);
  padding: 24px;
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
  .bg-danger-light {
    background: #fff5f5;
  }
  .link-primary {
    color: var(--primary);
    font-weight: 500;
    &:hover {
      text-decoration: underline;
    }
  }
}

.container {
  max-width: 1400px;
  margin: 0 auto;
}

// --- Breadcrumb ---
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-sub);
  margin-bottom: 20px;
  .bc-item {
    cursor: pointer;
    &:hover {
      color: var(--primary);
    }
  }
  .bc-sep {
    font-size: 10px;
    color: #cbd5e1;
  }
  .bc-current {
    color: var(--text-main);
    font-weight: 600;
  }
}

// --- Header ---
.page-header {
  background: white;
  padding: 24px;
  border-radius: 12px 12px 0 0;
  border: 1px solid var(--border);
  border-bottom: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
  .ph-info {
    h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .model-tag {
      font-size: 12px;
      background: #eff6ff;
      color: var(--primary);
      padding: 2px 8px;
      border-radius: 4px;
      border: 1px solid #bfdbfe;
    }
    .ph-stats {
      font-size: 13px;
      color: var(--text-sub);
      margin-top: 5px;
    }
  }
  .ph-actions {
    display: flex;
    gap: 10px;
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

// --- Toolbar ---
.toolbar {
  background: #f8fafc;
  padding: 12px 24px;
  border: 1px solid var(--border);
  border-top: 1px solid #f1f5f9;
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  .search-box {
    position: relative;
    width: 300px;
    input {
      width: 100%;
      padding: 8px 12px 8px 34px;
      border: 1px solid var(--border);
      border-radius: 6px;
      font-size: 13px;
      outline: none;
      transition: border 0.2s;
      &:focus {
        border-color: var(--primary);
        background: white;
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
  .filter-row {
    display: flex;
    gap: 10px;
    flex: 1;
  }
  .filter-select {
    padding: 8px 12px;
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 13px;
    color: var(--text-main);
    background: white;
    cursor: pointer;
  }
}

// --- Table ---
.table-container {
  background: white;
  border: 1px solid var(--border);
  border-top: none;
  border-radius: 0 0 12px 12px;
  overflow: hidden;
  .table-scroll {
    width: 100%;
    overflow-x: auto;
  }
  .data-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 900px;
    th {
      text-align: left;
      padding: 12px 20px;
      font-size: 12px;
      color: var(--text-sub);
      font-weight: 600;
      background: #fcfcfc;
      border-bottom: 1px solid var(--border);
      white-space: nowrap;
    }
    td {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      font-size: 13px;
      color: var(--text-main);
      vertical-align: middle;
    }
    tr:hover {
      background: #f8fafc;
      cursor: pointer;
    }
    tr.bg-danger-light {
      background: #fff5f5;
      &:hover {
        background: #ffebeb;
      }
    }
  }
}

// --- Columns ---
.dev-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-main);
}
.dev-sn {
  font-size: 12px;
  color: var(--text-sub);
  font-family: monospace;
}
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  &.bg-green {
    background: var(--success-bg);
    color: var(--success);
  }
  &.bg-red {
    background: var(--danger-bg);
    color: var(--danger);
  }
  &.bg-gray {
    background: #f1f5f9;
    color: #64748b;
  }
  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }
}
.val-primary {
  font-weight: 600;
  font-size: 14px;
}
.val-unit {
  font-size: 12px;
  color: var(--text-sub);
  font-weight: 400;
}
.channel-tag {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 5px;
}

// --- Pagination ---
.pagination {
  padding: 15px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--border);
  .pg-info {
    font-size: 13px;
    color: var(--text-sub);
  }
  .pg-ctrl {
    display: flex;
    gap: 5px;
  }
  .pg-btn {
    padding: 6px 12px;
    border: 1px solid var(--border);
    background: white;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    color: var(--text-main);
    &:hover {
      border-color: var(--primary);
      color: var(--primary);
    }
    &.active {
      background: var(--primary);
      color: white;
      border-color: var(--primary);
    }
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
  .pg-dots {
    font-size: 12px;
    padding: 0 5px;
    color: #94a3b8;
    display: flex;
    align-items: center;
  }
}

// Mobile
@media (max-width: 768px) {
  .device-list-page {
    padding: 15px;
  }
  .toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    .search-box {
      width: 100%;
    }
    .filter-row {
      overflow-x: auto;
      padding-bottom: 5px;
    }
  }
  .btn-text,
  .col-opt {
    display: none;
  }
  .pagination {
    flex-direction: column;
    gap: 10px;
  }
}
</style>
