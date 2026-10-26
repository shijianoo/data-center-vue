<script setup lang="ts">
import type { Device } from "@/common/apis/devices/type"
import { InfoFilled } from "@element-plus/icons-vue"
import { buildDownloadExcelByRangeUrl } from "@/common/apis/data-download"
import { selectDateRange } from "@/common/composables/useDateRangeSelector"
import { useHistoryDataQuery } from "@/common/hooks/useHistoryDataQuery"
import { formatNumber, parseUploadChannel } from "@/common/utils/data-parse"
import { formatDateTime } from "@/common/utils/datetime"
import { downloadFile } from "@/common/utils/download"
import TenantBreadcrumb from "@/layouts/components/TenantHeader/TenantBreadcrumb.vue"

/** 气象参数展开后的单行数据 */
interface WeatherRow {
  samp_time: string
  met_time: string
  met_status: number
  air_press: number
  air_temp: number
  wind_dir: number
  wind_spd: number
}

interface LeakStatusItem {
  bit: number
  label: string
  type: "danger" | "warning"
}

interface LeakBitDetail {
  bit: number
  name: string
  triggered: boolean
  type: "danger" | "warning"
  statusText: string
}

const props = defineProps<{
  device: Device
}>()

const SOB23_LEAK_BIT_DEFINITIONS = [
  { bit: 0, name: "顶部漏水", type: "danger" as const, activeLabel: "漏水", normalLabel: "正常" },
  { bit: 1, name: "底部漏水", type: "danger" as const, activeLabel: "漏水", normalLabel: "正常" },
  { bit: 2, name: "顶部检测线路断路", type: "warning" as const, activeLabel: "断路", normalLabel: "正常" },
  { bit: 3, name: "底部检测线路断路", type: "warning" as const, activeLabel: "断路", normalLabel: "正常" },
  { bit: 4, name: "顶部检测线路短路", type: "warning" as const, activeLabel: "短路", normalLabel: "正常" },
  { bit: 5, name: "底部检测线路短路", type: "warning" as const, activeLabel: "短路", normalLabel: "正常" }
]

/** 按位 (Bit) 解析 SOB23 机器的漏水状态 (leak_stat) */
function parseSob23LeakStatusItems(rawValue: number | null | undefined): LeakStatusItem[] {
  if (rawValue == null || typeof rawValue !== "number") return []
  const val = Math.floor(rawValue) & 0x3F
  if (val === 0) return []

  const items: LeakStatusItem[] = []
  if (val & 1) items.push({ bit: 0, label: "顶部漏水", type: "danger" })
  if (val & 2) items.push({ bit: 1, label: "底部漏水", type: "danger" })
  if (val & 4) items.push({ bit: 2, label: "顶部检测线路断路", type: "warning" })
  if (val & 8) items.push({ bit: 3, label: "底部检测线路断路", type: "warning" })
  if (val & 16) items.push({ bit: 4, label: "顶部检测线路短路", type: "warning" })
  if (val & 32) items.push({ bit: 5, label: "底部检测线路短路", type: "warning" })

  return items
}

function parseSob23LeakStatusText(rawValue: number | null | undefined): string {
  if (rawValue == null) return "—"
  const items = parseSob23LeakStatusItems(rawValue)
  if (items.length === 0) return "正常"
  return items.map(i => i.label).join("，")
}

function getLeakBitDetails(rawValue: number | null | undefined): LeakBitDetail[] {
  if (rawValue == null || typeof rawValue !== "number") return []
  const val = Math.floor(rawValue) & 0x3F
  return SOB23_LEAK_BIT_DEFINITIONS.map((def) => {
    const isTriggered = (val & (1 << def.bit)) !== 0
    return {
      bit: def.bit,
      name: def.name,
      triggered: isTriggered,
      type: def.type,
      statusText: isTriggered ? def.activeLabel : def.normalLabel
    }
  })
}

function parseWeatherStatus(rawValue: number | null | undefined): string {
  if (rawValue == null) return "—"
  switch (rawValue) {
    case 0: return "未执行"
    case 1: return "成功"
    case 2: return "初始化失败"
    case 3: return "接收超时"
    case 4: return "内部忙"
    default: return "未知"
  }
}

const deviceRef = toRef(props, "device")
const {
  dataList,
  loading,
  pageIndex,
  pageSize,
  uploadChannel,
  total,
  fetchFirstPageData
} = useHistoryDataQuery(deviceRef, 1, 2)

async function handleDownload() {
  const data = await selectDateRange({ maxDays: 30 })
  if (data) {
    const url = buildDownloadExcelByRangeUrl({
      model: deviceRef.value.modelNumber!,
      version: 1,
      dataType: 2,
      serialNumber: deviceRef.value.serialNumber,
      uploadChannel: 0,
      startTime: data.startDate,
      endTime: data.endDate
    })
    downloadFile(url)
  }
}

/** 将 dataList 中每条记录拆分为 6 条气象参数行，按 samp_time 降序排列 */
const weatherRows = computed<WeatherRow[]>(() => {
  const rows: WeatherRow[] = []
  for (const row of dataList.value) {
    for (let n = 1; n <= 6; n++) {
      rows.push({
        samp_time: row[`met_time_${n}`] ?? null,
        met_time: row[`met_time_${n}`] ?? null,
        met_status: row[`met_status_${n}`] ?? null,
        air_press: row[`air_press_${n}`] ?? null,
        air_temp: row[`air_temp_${n}`] ?? null,
        wind_dir: row[`wind_dir_${n}`] ?? null,
        wind_spd: row[`wind_spd_${n}`] ?? null
      })
    }
  }
  rows.sort((a, b) => {
    const ta = a.samp_time ?? ""
    const tb = b.samp_time ?? ""
    return tb > ta ? 1 : tb < ta ? -1 : 0
  })
  return rows
})

const activeTab = ref("status")
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

      <!-- Tab 切换 -->
      <el-tabs v-model="activeTab" class="data-tabs">
        <el-tab-pane label="设备状态" name="status">
          <div class="table-area">
            <table>
              <thead>
                <tr>
                  <th>采样时间</th>
                  <th>接收时间</th>
                  <th>上传通道</th>
                  <th>经度 (°)</th>
                  <th>纬度 (°)</th>
                  <th>信号强度</th>
                  <th>电池电压 (V)</th>
                  <th>主板温度 (°)</th>
                  <th>充电状态</th>
                  <th>漏水状态</th>
                  <th>相对湿度 (%)</th>
                  <th>姿态X轴 (°)</th>
                  <th>姿态Y轴 (°)</th>
                  <th>姿态Z轴 (°)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in dataList" :key="index">
                  <td style="width: 160px;">
                    <span class="value">{{ formatDateTime(row.samp_time) }}</span>
                  </td>
                  <td><span class="value">{{ formatDateTime(row.recv_time) }}</span></td>
                  <td><span class="value">{{ parseUploadChannel(row.upld_ch) }}</span></td>
                  <td><span class="value">{{ row.lon }}</span></td>
                  <td><span class="value">{{ row.lat }}</span></td>
                  <td><span class="value">{{ row.csq }}</span></td>
                  <td><span class="value">{{ row.ubatt }}</span></td>
                  <td><span class="value">{{ row.temp_mb }}</span></td>
                  <td><span class="value">{{ row.chg_stat }}</span></td>
                  <td>
                    <span class="value">
                      {{ parseSob23LeakStatusText(row.leak_stat) }}
                      <el-tooltip v-if="row.leak_stat != null" effect="light" placement="top">
                        <template #content>
                          <div class="leak-panels">
                            <div
                              v-for="panel in getLeakBitDetails(row.leak_stat)"
                              :key="panel.bit"
                              :class="[panel.triggered ? (panel.type === 'danger' ? 'triggered-danger' : 'triggered-warning') : 'leak-normal']"
                            >{{ panel.name }}: {{ panel.statusText }}</div>
                          </div>
                        </template>
                        <el-icon class="info-icon"><InfoFilled /></el-icon>
                      </el-tooltip>
                    </span>
                  </td>
                  <td><span class="value">{{ formatNumber(row.humi, 3) }}</span></td>
                  <td><span class="value">{{ row.ang_x }}</span></td>
                  <td><span class="value">{{ row.ang_y }}</span></td>
                  <td><span class="value">{{ row.ang_z }}</span></td>
                </tr>
                <tr v-if="dataList.length === 0 && !loading">
                  <td colspan="15" class="no-data">
                    暂无数据
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </el-tab-pane>

        <el-tab-pane label="波浪参数" name="wave">
          <div class="table-area">
            <table>
              <thead>
                <tr>
                  <th>采样时间</th>
                  <th>平均波高 (m)</th>
                  <th>平均周期 (°)</th>
                  <th>最大波高 (m)</th>
                  <th>最大周期 (°)</th>
                  <th>波向 (°)</th>
                  <th>平均波向 (°)</th>
                  <th>1/3波高 (m)</th>
                  <th>1/3周期 (°)</th>
                  <th>1/10波高 (m)</th>
                  <th>1/10周期 (°)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in dataList" :key="index">
                  <td style="width: 160px;">
                    <span class="value">{{ formatDateTime(row.samp_time) }}</span>
                  </td>
                  <td><span class="value">{{ formatNumber(row.hm, 4) }}</span></td>
                  <td><span class="value">{{ formatNumber(row.tm, 4) }}</span></td>
                  <td><span class="value">{{ formatNumber(row.hmax, 4) }}</span></td>
                  <td><span class="value">{{ formatNumber(row.tmax, 4) }}</span></td>
                  <td><span class="value">{{ formatNumber(row.dir, 4) }}</span></td>
                  <td><span class="value">{{ formatNumber(row.dm, 4) }}</span></td>
                  <td><span class="value">{{ formatNumber(row.h13, 4) }}</span></td>
                  <td><span class="value">{{ formatNumber(row.t13, 4) }}</span></td>
                  <td><span class="value">{{ formatNumber(row.h10, 4) }}</span></td>
                  <td><span class="value">{{ formatNumber(row.t10, 4) }}</span></td>
                </tr>
                <tr v-if="dataList.length === 0 && !loading">
                  <td colspan="14" class="no-data">
                    暂无数据
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </el-tab-pane>

        <el-tab-pane label="气象参数" name="weather">
          <div class="table-area">
            <table>
              <thead>
                <tr>
                  <th>气象采样时间</th>
                  <th>采样状态</th>
                  <th>气压 (hPa)</th>
                  <th>气温 (℃)</th>
                  <th>风向 (°)</th>
                  <th>风速 (m/s)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(wrow, idx) in weatherRows" :key="idx">
                  <td style="width: 160px;">
                    <span class="value">{{ formatDateTime(wrow.met_time) }}</span>
                  </td>
                  <td><span class="value">{{ parseWeatherStatus(wrow.met_status) }}</span></td>
                  <td><span class="value">{{ formatNumber(wrow.air_press, 3) }}</span></td>
                  <td><span class="value">{{ formatNumber(wrow.air_temp, 1) }}</span></td>
                  <td><span class="value">{{ formatNumber(wrow.wind_dir, 1) }}</span></td>
                  <td><span class="value">{{ formatNumber(wrow.wind_spd, 4) }}</span></td>
                </tr>
                <tr v-if="weatherRows.length === 0 && !loading">
                  <td colspan="6" class="no-data">
                    暂无数据
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </el-tab-pane>

        <el-tab-pane label="水文参数" name="hydro">
          <div class="table-area">
            <table>
              <thead>
                <tr>
                  <th>采样时间</th>
                  <th>水温 (℃)</th>
                  <th>电导率 (mS/m)</th>
                  <th>盐度 (%)</th>
                  <th>潮位 (m)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in dataList" :key="index">
                  <td style="width: 160px;">
                    <span class="value">{{ formatDateTime(row.samp_time) }}</span>
                  </td>
                  <td><span class="value">{{ formatNumber(row.water_temp, 4) }}</span></td>
                  <td><span class="value">{{ formatNumber(row.cond, 4) }}</span></td>
                  <td><span class="value">{{ formatNumber(row.sal, 4) }}</span></td>
                  <td><span class="value">{{ formatNumber(row.wl, 4) }}</span></td>
                </tr>
                <tr v-if="dataList.length === 0 && !loading">
                  <td colspan="8" class="no-data">
                    暂无数据
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </el-tab-pane>
      </el-tabs>

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
  padding: 10px;
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

  /* el-tabs 整体 */
  .data-tabs {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    :deep(.el-tabs__header) {
      margin: 0;
      padding: 0 20px;
      background: #fff;
      border-bottom: 1px solid var(--border);
    }

    :deep(.el-tabs__content) {
      flex: 1;
      overflow: hidden;
      padding: 0;
    }

    :deep(.el-tab-pane) {
      height: 100%;
    }
  }

  .table-area {
    width: 100%;
    height: calc(100vh - 315px);
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

    tr:hover td {
      background-color: #fcfcfc;
    }

    .no-data {
      text-align: center;
      padding: 40px;
      color: var(--text-sub);
      font-size: 13px;
    }

    .label {
      color: var(--text-sub);
      width: 60px;
      flex-shrink: 0;
    }

    .value {
      display: inline-flex;
      align-items: center;
      font-size: 14px;
      gap: 4px;
    }

    .weather-index {
      font-weight: 600;
      color: var(--primary);
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

.leak-tag {
  display: inline-block;
  padding: 1px 6px;
  font-size: 11px;
  line-height: 1.2;
  border-radius: 3px;
  margin-right: 4px;
  margin-bottom: 2px;
  font-weight: 500;

  &--normal {
    background-color: rgba(103, 194, 58, 0.12);
    color: #67c23a;
    border: 1px solid rgba(103, 194, 58, 0.3);
  }

  &--danger {
    background-color: rgba(245, 108, 108, 0.12);
    color: #f56c6c;
    border: 1px solid rgba(245, 108, 108, 0.3);
  }

  &--warning {
    background-color: rgba(230, 162, 60, 0.12);
    color: #e6a23c;
    border: 1px solid rgba(230, 162, 60, 0.3);
  }
}

.info-icon {
  cursor: pointer;
  margin-left: 5px;
  font-size: 13px;
}

.leak-panels {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}

.triggered-danger {
  border-radius: 2px;
  padding: 0 4px;
  background-color: #f56c6c;
  color: white;
}

.triggered-warning {
  border-radius: 2px;
  padding: 0 4px;
  background-color: #e6a23c;
  color: white;
}

.leak-normal {
  border-radius: 2px;
  padding: 0 4px;
  background-color: #67c23a;
  color: white;
}

@media (max-width: 900px) {
  .history-container {
    padding: 10px;
  }
}
</style>
