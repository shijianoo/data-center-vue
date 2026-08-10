<script setup lang="ts">
import type { Device } from "@/common/apis/devices/type"
import { buildDownloadExcelByRangeUrl } from "@/common/apis/data-download"
import { selectDateRange } from "@/common/composables/useDateRangeSelector"
import { useHistoryDataQuery } from "@/common/hooks/useHistoryDataQuery"
import { formatNumber, parseLeakStatus, parseUploadChannel } from "@/common/utils/data-parse"
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
  uploadChannel,
  total,
  fetchFirstPageData
} = useHistoryDataQuery(deviceRef, 2, 1)

async function handleDownload() {
  const data = await selectDateRange({ maxDays: 30 })
  if (data) {
    const url = buildDownloadExcelByRangeUrl({
      model: deviceRef.value.modelNumber!,
      version: 2,
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
        <div class="filter-group">
          <span style="font-size:13px; font-weight:600">通道:</span>
          <select class="select-input" v-model="uploadChannel">
            <option value="0">
              全部通道
            </option>
            <option value="1">
              4G LTE
            </option>
            <option value="2">
              北斗卫星
            </option>
          </select>
        </div>
        <div style="margin-left:auto; display:flex; gap:10px;">
          <button class="btn" @click="fetchFirstPageData">
            <i class="fas fa-search" /> 查询
          </button>
          <button class="btn btn-primary" @click="handleDownload">
            <i class="fas fa-file-download" />下载
          </button>
        </div>
      </div>

      <div class="table-area">
        <table>
          <thead>
            <tr>
              <th>时间与定位</th>
              <th>设备运行与状态</th>
              <th>姿态参数</th>
              <th>波浪参数</th>
              <th>波浪参数</th>
              <th>气象风向</th>
              <th>水文</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in dataList" :key="index">
              <td>
                <div class="data-row">
                  <span class="label">序列号</span>
                  <span class="value">{{ row.sn }}</span>
                </div>
                <div class="data-row">
                  <span class="label">采样时间</span>
                  <span class="value">{{ formatDateTime(row.samp_time) }}</span>
                </div>
                <div class="data-row">
                  <span class="label">接收时间</span>
                  <span class="value">{{ formatDateTime(row.recv_time) }}</span>
                </div>
                <div class="data-row">
                  <span class="label">上传通道</span>
                  <span class="value">{{ parseUploadChannel(row.upld_ch) }}</span>
                </div>
                <div class="data-row">
                  <span class="label">经度</span>
                  <span class="value">{{ row.lon }} {{ row.lon != null ? '°' : '' }}</span>
                </div>
                <div class="data-row">
                  <span class="label">纬度</span>
                  <span class="value">{{ row.lat }} {{ row.lat != null ? '°' : '' }}</span>
                </div>
              </td>
              <td>
                <div class="data-row">
                  <span class="label">信号强度</span>
                  <span class="value">{{ row.csq }}</span>
                </div>
                <div class="data-row">
                  <span class="label">电池电压</span>
                  <span class="value">{{ row.ubatt }} {{ row.ubatt != null ? 'V' : '' }}</span>
                </div>
                <div class="data-row">
                  <span class="label">主板温度</span>
                  <span class="value">{{ row.temp_mb }} {{ row.temp_mb != null ? '℃' : '' }}</span>
                </div>
                <div class="data-row">
                  <span class="label">充电状态</span>
                  <span class="value">{{ row.chg_stat }}</span>
                </div>
                <div class="data-row">
                  <span class="label">漏水状态</span>
                  <span class="value">{{ parseLeakStatus(row.leak_stat) }}</span>
                </div>
                <div class="data-row">
                  <span class="label">绝对湿度</span>
                  <span class="value">{{ formatNumber(row.humi, 4) }} {{ row.humi != null ? 'g/m³' : '' }}</span>
                </div>
              </td>
              <td>
                <div class="data-row">
                  <span class="label">姿态X轴角度</span>
                  <span class="value">{{ row.ang_x }} {{ row.ang_x != null ? '°' : '' }}</span>
                </div>
                <div class="data-row">
                  <span class="label">姿态Y轴角度</span>
                  <span class="value">{{ row.ang_y }} {{ row.ang_y != null ? '°' : '' }}</span>
                </div>
                <div class="data-row">
                  <span class="label">姿态Z轴角度</span>
                  <span class="value">{{ row.ang_z }} {{ row.ang_z != null ? '°' : '' }}</span>
                </div>
              </td>
              <td>
                <div class="data-row">
                  <span class="label">平均波高</span>
                  <span class="value">{{ formatNumber(row.hm, 4) }} {{ row.hm != null ? 'm' : '' }}</span>
                </div>
                <div class="data-row">
                  <span class="label">平均周期</span>
                  <span class="value">{{ formatNumber(row.tm, 4) }} {{ row.tm != null ? 's' : '' }}</span>
                </div>
                <div class="data-row">
                  <span class="label">最大波高</span>
                  <span class="value">{{ formatNumber(row.hmax, 4) }} {{ row.hmax != null ? 'm' : '' }}</span>
                </div>
                <div class="data-row">
                  <span class="label">最大周期</span>
                  <span class="value">{{ formatNumber(row.tmax, 4) }} {{ row.tmax != null ? 's' : '' }}</span>
                </div>
                <div class="data-row">
                  <span class="label">波向</span>
                  <span class="value">{{ formatNumber(row.dir, 4) }} {{ row.dir != null ? '°' : '' }}</span>
                </div>
                <div class="data-row">
                  <span class="label">平均波向</span>
                  <span class="value">{{ formatNumber(row.dm, 4) }} {{ row.dm != null ? '°' : '' }}</span>
                </div>
              </td>
              <td>
                <div class="data-row">
                  <span class="label">三分之一波高</span>
                  <span class="value">{{ formatNumber(row.h13, 4) }} {{ row.h13 != null ? 'm' : '' }}</span>
                </div>
                <div class="data-row">
                  <span class="label">三分之一周期</span>
                  <span class="value">{{ formatNumber(row.t13, 4) }} {{ row.t13 != null ? 's' : '' }}</span>
                </div>
                <div class="data-row">
                  <span class="label">十分之一波高</span>
                  <span class="value">{{ formatNumber(row.h10, 4) }} {{ row.h10 != null ? 'm' : '' }}</span>
                </div>
                <div class="data-row">
                  <span class="label">十分之一周期</span>
                  <span class="value">{{ formatNumber(row.t10, 4) }} {{ row.t10 != null ? 's' : '' }}</span>
                </div>
              </td>
              <td>
                <div class="data-row">
                  <span class="label">气压</span>
                  <span class="value">{{ formatNumber(row.air_press, 4) }} {{ row.air_press != null ? 'bar' : '' }}</span>
                </div>
                <div class="data-row">
                  <span class="label">气温</span>
                  <span class="value">{{ formatNumber(row.air_temp, 4) }} {{ row.air_temp != null ? '℃' : '' }}</span>
                </div>
                <div class="data-row">
                  <span class="label">风向</span>
                  <span class="value">{{ formatNumber(row.wind_dir, 1) }} {{ row.wind_dir != null ? '°' : '' }}</span>
                </div>
                <div class="data-row">
                  <span class="label">风速</span>
                  <span class="value">{{ formatNumber(row.wind_spd, 4) }} {{ row.wind_spd != null ? 'm/s' : '' }}</span>
                </div>
              </td>
              <td>
                <div class="data-row">
                  <span class="label">水温</span>
                  <span class="value">{{ formatNumber(row.water_temp, 4) }} {{ row.water_temp != null ? '℃' : '' }}</span>
                </div>
                <div class="data-row">
                  <span class="label">电导率</span>
                  <span class="value">{{ formatNumber(row.cond, 4) }} {{ row.cond != null ? 'mS/m' : '' }}</span>
                </div>
                <div class="data-row">
                  <span class="label">盐度</span>
                  <span class="value">{{ formatNumber(row.sal, 4) }} {{ row.sal != null ? '%' : '' }}</span>
                </div>
                <div class="data-row">
                  <span class="label">潮位</span>
                  <span class="value">{{ formatNumber(row.wl, 4) }} {{ row.wl != null ? 'm' : '' }}</span>
                </div>
              </td>
            </tr>
            <tr v-if="dataList.length === 0 && !loading">
              <td colspan="7" class="no-data">
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
  max-width: 1600px;
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

  .filter-group {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }
  .date-input {
    padding: 8px 12px;
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 13px;
    color: var(--text-main);
    background: white;
  }
  .select-input {
    padding: 6px 16px;
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 13px;
    background: white;
    cursor: pointer;
    min-width: 120px;
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
      padding: 12px 20px;
      background: #f8fafc;
      font-size: 12px;
      color: var(--text-sub);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 10;
    }
    th,
    td {
      border-right: 1px solid var(--border);
      white-space: nowrap;
    }

    th:last-child,
    td:last-child {
      border-right: none;
    }

    td {
      padding: 5px;
      border-bottom: 1px solid var(--border);
      vertical-align: top;
      color: var(--text);
      white-space: nowrap;
      transition: background-color 0.2s ease;
    }

    td:first-child {
      padding-left: 20px;
    }

    // tr:last-child td {
    //   border-bottom: none;
    // }

    tr:hover td {
      background-color: #fcfcfc;
    }

    .data-row {
      display: flex;
      line-height: 1.3;
      margin-bottom: 2px;
      font-size: 12px;
      color: var(--text);
      &:last-child {
        margin-bottom: 0;
      }

      .label {
        color: var(--text-sub);
        width: 85px;
        flex-shrink: 0;
      }
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
