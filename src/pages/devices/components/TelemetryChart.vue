<script lang="ts" setup>
import type { HistoryField } from "@/common/apis/data-query/type"
import type { Device } from "@/common/apis/devices/type"
import dayjs from "dayjs"
import timezone from "dayjs/plugin/timezone"
import utc from "dayjs/plugin/utc"
import { LineChart } from "echarts/charts"
import {
  DataZoomComponent,
  GridComponent,
  TooltipComponent
} from "echarts/components"
import * as echarts from "echarts/core"
import { CanvasRenderer } from "echarts/renderers"
import VChart from "vue-echarts"
import { queryDeviceFieldData } from "@/common/apis/data-query"

const { device, bucket, fields } = defineProps<{
  device: Device
  bucket?: string
  fields: Array<{ label: string, field: string, unit?: string }>
}>()

dayjs.extend(utc)
dayjs.extend(timezone)

echarts.use([
  CanvasRenderer,
  TooltipComponent,
  GridComponent,
  DataZoomComponent,
  LineChart
])

const start = ref<string | null>(null)
const end = ref<string | null>(null)
const selectedField = ref<string | null>(fields[0]?.field || null)
const selectedHours = ref(24)
const queryMode = ref<"hours" | "range">("hours")
const timeRange = ref<[string, string]>([
  dayjs(device.lastUploadTime).format("YYYY-MM-DD"),
  dayjs(device.lastUploadTime).format("YYYY-MM-DD")
])

// 当设备最后上报时间变化时，更新默认时间区间
watch(() => device.lastUploadTime, (newVal) => {
  if (newVal) {
    timeRange.value = [
      dayjs(newVal).format("YYYY-MM-DD"),
      dayjs(newVal).format("YYYY-MM-DD")
    ]
  }
}, { immediate: true })

const historyData = ref<HistoryField[]>([])
const loading = ref(false)

const hourOptions = [
  { label: "24h", value: 24 },
  { label: "48h", value: 48 }
]

async function fetchHistory() {
  if (!start.value
    || !end.value
    || !selectedField.value
    || !device.serialNumber) {
    return
  }

  // 根据时间范围动态设置 window 和 agg，防止数据量过大导致卡顿
  const diffDays = dayjs(end.value).diff(dayjs(start.value), "day")
  let windowParam: string | undefined
  let aggParam: string | undefined

  if (diffDays > 30) {
    windowParam = "8h"
    aggParam = "mean"
  } else if (diffDays > 15) {
    windowParam = "4h"
    aggParam = "mean"
  } else if (diffDays > 7) {
    windowParam = "2h"
    aggParam = "mean"
  } else if (diffDays > 2) {
    windowParam = "1h"
    aggParam = "mean"
  } else if (diffDays > 1) {
    windowParam = "30m"
    aggParam = "mean"
  }

  loading.value = true
  try {
    const { data } = await queryDeviceFieldData({
      modelNumber: device.modelNumber!,
      bucket,
      serialNumber: device.serialNumber!,
      field: selectedField.value,
      start: start.value,
      end: end.value,
      window: windowParam,
      agg: aggParam
    })
    historyData.value = data
  } catch (error) {
    console.error("获取历史数据失败:", error)
  } finally {
    loading.value = false
  }
}

watch([
  () => device.deviceCode,
  () => selectedField.value,
  () => selectedHours.value,
  () => queryMode.value,
  () => timeRange.value
], () => {
  if (queryMode.value === "hours") {
    end.value = dayjs(device.lastUploadTime).utc().toISOString()
    start.value = dayjs(end.value).add(-selectedHours.value, "hour").utc().toISOString()
  } else {
    if (timeRange.value && timeRange.value.length === 2) {
      start.value = dayjs(timeRange.value[0]).startOf("day").utc().toISOString()
      end.value = dayjs(timeRange.value[1]).endOf("day").utc().toISOString()
    }
  }
  console.log(start.value, end.value)
  fetchHistory()
}, { immediate: true })

const selectedLabel = computed(() => {
  return fields.find(f => f.field === selectedField.value)?.label || ""
})

const selectedUnit = computed(() => {
  return fields.find(f => f.field === selectedField.value)?.unit || ""
})

const chartOption = computed(() => {
  return {
    grid: {
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      containLabel: true
    },
    tooltip: {
      trigger: "axis",
      formatter: (params: any) => {
        const item = params[0]
        const date = new Date(item.value[0])
        const timeStr = date.toLocaleString()
        const unitStr = selectedUnit.value ? ` ${selectedUnit.value}` : ""
        return `${timeStr}<br/>${item.marker} ${selectedLabel.value}: <b>${item.value[1]}${unitStr}</b>`
      }
    },
    xAxis: {
      type: "time",
      splitLine: {
        show: false
      }
    },
    yAxis: {
      type: "value",
      splitLine: {
        lineStyle: {
          type: "dashed",
          color: "#eee"
        }
      }
    },
    series: [
      {
        name: selectedLabel.value,
        type: "line",
        smooth: true,
        showSymbol: false,
        data: historyData.value.map(item => [item.time, Number(item.value.toFixed(4))]),
        lineStyle: {
          width: 2,
          color: "#3b82f6"
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(59, 130, 246, 0.3)" },
            { offset: 1, color: "rgba(59, 130, 246, 0)" }
          ])
        }
      }
    ]
  }
})
</script>

<template>
  <div class="card telemetry-chart-card">
    <div class="card-header">
      <div class="header-left">
        <span class="title">{{ selectedLabel }}</span>
        <div class="hours-selector">
          <button
            v-for="opt in hourOptions"
            :key="opt.value"
            class="hour-btn"
            :class="{ active: queryMode === 'hours' && selectedHours === opt.value }"
            @click="queryMode = 'hours'; selectedHours = opt.value"
          >
            {{ opt.label }}
          </button>
          <button
            class="hour-btn"
            :class="{ active: queryMode === 'range' }"
            @click="queryMode = 'range'"
          >
            自定义
          </button>
        </div>
        <el-tooltip placement="top">
          <template #content>
            <div class="density-info">
              <p>系统将根据时间范围自动调整数据密度：</p>
              <ul>
                <li>大于等于 30 天：8 小时采样</li>
                <li>大于等于 15 天：4 小时采样</li>
                <li>大于等于 7 天：2 小时采样</li>
                <li>大于等于 2 天：1 小时采样</li>
                <li>大于等于 1 天：30 分钟采样</li>
              </ul>
            </div>
          </template>
          <i class="fas fa-info-circle density-icon" />
        </el-tooltip>
        <el-date-picker
          v-if="queryMode === 'range'"
          v-model="timeRange"
          type="daterange"
          size="small"
          value-format="YYYY-MM-DD"
          :clearable="false"
          class="range-picker"
        />
      </div>
      <select v-model="selectedField" class="chart-select">
        <option v-for="f in fields" :key="f.field" :value="f.field">
          {{ f.label }}
        </option>
      </select>
    </div>
    <div v-loading="loading" class="card-body">
      <div class="chart-box">
        <VChart
          v-if="historyData.length > 0"
          :option="chartOption"
          autoresize
        />
        <div v-if="historyData.length === 0 && !loading" class="no-data">
          暂无历史数据
        </div>
      </div>
      <div class="chart-footer">
        <template v-if="queryMode === 'hours'">
          最新数据前 {{ selectedHours }} 小时采样点
        </template>
        <template v-else>
          {{ timeRange[0] }} 至 {{ timeRange[1] }} 数据采样点
        </template>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.telemetry-chart-card {
  background: white;
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  height: 100%;

  .card-header {
    flex-shrink: 0;
    padding: 0 20px;
    height: auto;
    min-height: 50px;
    padding-top: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    background: #fcfcfc;

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;

      .title {
        font-size: 14px;
        font-weight: 700;
        color: var(--text-main);
      }

      .density-icon {
        font-size: 14px;
        color: #94a3b8;
        cursor: help;
        transition: color 0.2s;
        &:hover {
          color: var(--primary);
        }
      }
    }
  }

  .card-body {
    padding: 20px;
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
}

.density-info {
  p {
    margin: 0 0 0px 0;
    font-weight: 600;
    font-size: 12px;
    color: white;
  }
  ul {
    margin: 0;
    padding-left: 16px;
    li {
      font-size: 12px;
      line-height: 1.4;
      color: rgba(255, 255, 255, 0.9);
    }
  }
}

.hours-selector {
  display: flex;
  background: #f1f5f9;
  padding: 3px;
  border-radius: 6px;
  gap: 2px;

  .hour-btn {
    border: none;
    background: transparent;
    padding: 4px 10px;
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      color: var(--primary);
    }

    &.active {
      background: white;
      color: var(--primary);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
  }

  .range-picker {
    width: 120px;
  }
}

.chart-select {
  appearance: none;
  background-color: white;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 5px 28px 5px 12px;
  font-size: 12px;
  font-weight: 500;
  color: #1e293b;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;

  &:hover {
    border-color: var(--primary);
  }

  &:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
}

.chart-box {
  flex: 1;
  min-height: 250px;
  width: 100%;
  position: relative;

  .no-data {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: var(--text-sub);
    font-size: 13px;
  }
}

.chart-footer {
  text-align: center;
  font-size: 11px;
  color: #94a3b8;
  margin-top: 10px;
}
</style>
