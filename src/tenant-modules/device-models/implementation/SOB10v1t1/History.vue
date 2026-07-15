<script setup lang="ts">
import type { Device } from "@/common/apis/devices/type"
import { buildDownloadExcelByRangeUrl } from "@/common/apis/data-download"
import { selectDateRange } from "@/common/composables/useDateRangeSelector"
import { useHistoryDataQuery } from "@/common/hooks/useHistoryDataQuery"
import { parseLeakStatus } from "@/common/utils/data-parse"
import { formatDateTime } from "@/common/utils/datetime"
import { downloadFile } from "@/common/utils/download"
import TenantBreadcrumb from "@/layouts/components/TenantHeader/TenantBreadcrumb.vue"

const props = defineProps<{
  device: Device
}>()

const deviceRef = toRef(props, "device")
const {
  dataList,
  loading,
  pageIndex,
  pageSize,
  total
} = useHistoryDataQuery(deviceRef, 1, 1)

// 计算每一行的背景色类名，按照接收时间(recv_time)分组，交替显示两种浅色
function getRowColorClass(index: number) {
  if (index === 0) return "row-bg-1"

  let groupIndex = 0
  for (let i = 1; i <= index; i++) {
    const prevTime = formatDateTime(dataList.value[i - 1]?.recv_time)
    const currTime = formatDateTime(dataList.value[i]?.recv_time)
    if (currTime !== prevTime) {
      groupIndex++
    }
  }

  return groupIndex % 2 === 0 ? "row-bg-1" : "row-bg-2"
}

async function handleDownload() {
  const data = await selectDateRange({ maxDays: 30 })
  if (data) {
    const url = buildDownloadExcelByRangeUrl({
      model: deviceRef.value.modelNumber!,
      version: 1,
      dataType: 1,
      serialNumber: deviceRef.value.serialNumber,
      uploadChannel: 0,
      startTime: data.startDate,
      endTime: data.endDate
    })
    downloadFile(url)
  }
}
</script>

<template>
  <div class="history-container">
    <TenantBreadcrumb />
    <div class="page-header">
      <div class="ph-info">
        <h1>历史数据查询</h1>
        <p>设备: <strong>{{ device.serialNumber }} ({{ device.deviceCode }})</strong></p>
      </div>
    </div>

    <div class="content-card">
      <div class="filter-card">
        <div style="margin-left:auto; display:flex; gap:10px;">
          <button class="btn btn-primary" @click="handleDownload">
            <i class="fas fa-file-download" /> 下载
          </button>
        </div>
      </div>

      <div class="table-area">
        <table>
          <thead>
            <tr>
              <th>采样时间</th>
              <th>接收时间</th>
              <th>经度(°)</th>
              <th>纬度(°)</th>
              <th>水温(°C)</th>
              <th>湿度(g/m^3)</th>
              <th>电池电压(V)</th>
              <th>漏水状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in dataList" :key="index" :class="getRowColorClass(index)">
              <td>
                <span class="value">
                  {{ formatDateTime(row.samp_time) }}
                </span>
              </td>
              <td>
                <span class="value">
                  {{ formatDateTime(row.recv_time) }}
                </span>
              </td>
              <td>
                <span class="value">
                  {{ row.lon }}
                </span>
              </td>
              <td>
                <span class="value">
                  {{ row.lat }}
                </span>
              </td>
              <td>
                <span class="value">
                  {{ row.temp_wat }}
                </span>
              </td>
              <td>
                <span class="value">
                  {{ row.humid }}
                </span>
              </td>
              <td>
                <span class="value">
                  {{ row.ubatt }}
                </span>
              </td>
              <td>
                <span class="value">
                  {{ parseLeakStatus(row.leak_stat) }}
                </span>
              </td>
            </tr>
            <tr v-if="dataList.length === 0 && !loading">
              <td colspan="10" class="no-data">
                暂无数据
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination-bar">
        <el-pagination
          layout="total, prev, pager, next"
          :total="total"
          v-model:page-size="pageSize"
          v-model:current-page="pageIndex"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.history-container {
  max-width: 1280px;
  min-height: calc(100vh - var(--header-h));
  margin: 0 auto;
  padding: 20px 0 0 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 10px;
  flex-wrap: wrap;
  gap: 15px;
}

.ph-info {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ph-info h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
}
.ph-info p {
  margin: 4px 0 0 0;
  color: var(--text-sub);
  font-size: 13px;
}

.content-card {
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;

  .filter-card {
    padding: 15px 20px;
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #fff;
  }

  .btn {
    padding: 8px 16px;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: white;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s;
  }
  .btn:hover {
    border-color: var(--primary);
    color: var(--primary);
  }

  .table-area {
    width: 100%;
    height: calc(100vh - 270px);
    overflow: auto;
    background: white;

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th {
      text-align: left;
      padding: 10px;
      background: #f8fafc;
      font-size: 13px;
      color: var(--text-sub);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 10;
      white-space: nowrap;
    }
    th,
    td {
      border-right: 1px solid var(--border);
    }

    th:last-child,
    td:last-child {
      border-right: none;
    }

    td {
      padding: 10px;
      border-bottom: 1px solid var(--border);
      vertical-align: top;
      color: var(--text);
      white-space: nowrap;
      transition: background-color 0.2s ease;
    }

    td:last-child {
      font-size: 13px;
    }

    tr:last-child td {
      border-bottom: none;
    }

    tr.row-bg-1 td {
      background-color: white; /* 非常浅的偏蓝色 */
    }

    tr.row-bg-2 td {
      background-color: #f1f5f9; /* 稍微深一点点的浅灰蓝色 */
    }

    tr:hover td {
      filter: brightness(0.97);
    }

    .value {
      color: var(--text-sub);
    }

    .no-data {
      line-height: 100px;
      text-align: center;
    }
  }

  .pagination-bar {
    padding: 10px 20px;
    border-top: 1px solid var(--border);
    background: white;
    display: flex;
    justify-content: end;
    align-items: center;
    flex-wrap: wrap;
    gap: 15px;
  }
}

@media (max-width: 900px) {
  .history-container {
    padding: 10px;
  }
}
</style>
