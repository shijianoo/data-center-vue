<script lang="ts" setup>
import type { HistoryField, HistoryGroup, HistoryRow } from "../buoy/config"
import type { ShoreKey } from "./config"
import { computed, onMounted, ref, watch } from "vue"
import { formatDateTime } from "@/common/utils/datetime"
import { getHistoricalData, getLatestData } from "../../apis"
import { getShoreName, shoreHistoryConfig } from "./config"

const props = defineProps<{
  shore: ShoreKey
}>()

interface GroupState {
  // 岸基站和浮标共用 daterange 交互：界面保存日期，接口使用当天完整时间段。
  dateRange: [string, string]
  rows: HistoryRow[]
  // 每个参数分组第一次打开时才取最新日期，避免页面初始化时同时打多个接口。
  initialized: boolean
}

const groups = computed(() => shoreHistoryConfig[props.shore] ?? [])
const activeGroupKey = ref(groups.value[0]?.key ?? "")
const loading = ref(false)
// 岸基站不同参数类型的查询日期和结果互不覆盖，切换 tab 后能继续沿用。
const stateMap = ref<Record<string, GroupState>>({})
const pickingStartDate = ref<Date | null>(null)
const MAX_RANGE_DAYS = 30
const DAY_MS = 24 * 60 * 60 * 1000

const activeGroup = computed<HistoryGroup | undefined>(() => {
  return groups.value.find(item => item.key === activeGroupKey.value)
})
const currentState = computed(() => getGroupState(activeGroupKey.value))
const currentRows = computed(() => currentState.value.rows)
const pageTitle = computed(() => `${props.shore} ${getShoreName(props.shore)}`)

function formatDay(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

function getDefaultRange(): [string, string] {
  const today = formatDay(new Date())
  return [today, today]
}

function getGroupState(groupKey: string): GroupState {
  // 延迟创建分组状态，避免一次性初始化所有类型的数据。
  if (!stateMap.value[groupKey]) {
    stateMap.value[groupKey] = {
      dateRange: getDefaultRange(),
      rows: [],
      initialized: false
    }
  }
  return stateMap.value[groupKey]
}

function getQueryRange(range: [string, string]) {
  // 页面上按日期选择，实际查询覆盖开始日零点到结束日 23:59:59。
  const [startDay, endDay] = range
  const startDate = new Date(`${startDay}T00:00:00`)
  const endDate = new Date(`${endDay}T23:59:59`)
  return {
    startTime: startDate.toISOString(),
    endTime: endDate.toISOString()
  }
}

function getSelectColumns(group: HistoryGroup) {
  // 只传业务字段，采样时间和接收时间由后端默认返回。
  // queryColumn 的语义沿用浮标配置，便于 do 等特殊字段在岸基站表里也能复用。
  const columns = new Set<string>()
  group.fields.forEach((field) => {
    columns.add(field.queryColumn ?? field.column)
  })
  return [...columns]
}

async function loadData() {
  const group = activeGroup.value
  if (!group || group.placeholder || !group.tableName) return

  loading.value = true
  try {
    const { startTime, endTime } = getQueryRange(currentState.value.dateRange)
    // 岸基站没有围栏状态列，表格渲染只依赖配置里的字段定义。
    const { data } = await getHistoricalData({
      tableName: group.tableName,
      serialNumber: props.shore,
      selectColumns: getSelectColumns(group),
      startTime,
      endTime,
      sortDirection: "desc"
    })
    currentState.value.rows = Array.isArray(data) ? data : (data?.items ?? data?.records ?? [])
  } catch (error) {
    console.error(`查询 ${props.shore} ${group.label} 历史数据失败`, error)
    currentState.value.rows = []
  } finally {
    loading.value = false
  }
}

async function initAndLoadData() {
  const group = activeGroup.value
  if (!group || group.placeholder || !group.tableName) return

  const state = currentState.value
  if (!state.initialized) {
    // 首次打开参数类型时，优先用最新数据日期作为默认查询日期。
    state.initialized = true
    state.dateRange = await getLatestDateRange(group)
  }

  await loadData()
}

async function getLatestDateRange(group: HistoryGroup): Promise<[string, string]> {
  if (!group.tableName) return getDefaultRange()

  try {
    // 优先跟随该分组最新数据所在日期，避免设备当天未上报时默认查出空表。
    const { data } = await getLatestData(group.tableName, props.shore, getSelectColumns(group))
    const row = getFirstRow(data)
    const day = getRowDay(row)
    return day ? [day, day] : getDefaultRange()
  } catch (error) {
    console.error(`获取 ${props.shore} ${group.label} 最新数据失败`, error)
    return getDefaultRange()
  }
}

function getFirstRow(data: unknown) {
  // 兼容最新数据接口的多种返回包装，减少页面对接口结构变动的敏感度。
  if (Array.isArray(data)) return data[0] ?? null
  const result = data as { items?: unknown[], records?: unknown[] } | null | undefined
  if (Array.isArray(result?.items)) return result.items[0] ?? null
  if (Array.isArray(result?.records)) return result.records[0] ?? null
  return data ?? null
}

function getRowDay(row: unknown) {
  if (!row || typeof row !== "object") return null
  const item = row as HistoryRow
  // 部分岸基站表沿用 sampleTime/receiveTime，部分表沿用 samp_time/recv_time，两套都兼容。
  const time = item.sampleTime ?? item.receiveTime ?? item.samp_time ?? item.recv_time
  if (!isDateInput(time)) return null

  const date = new Date(time)
  return Number.isNaN(date.getTime()) ? null : formatDay(date)
}

function isDateInput(value: unknown): value is string | number | Date {
  return typeof value === "string" || typeof value === "number" || value instanceof Date
}

function onGroupChange(groupKey: string | number) {
  const nextKey = `${groupKey}`
  activeGroupKey.value = nextKey
  // 切回已查询过的分组时直接展示缓存结果；第一次打开才自动加载。
  if (!getGroupState(nextKey).initialized) {
    initAndLoadData()
  }
}

function onRangeChange() {
  // 用户变更日期意味着当前结果已过期，先清空再重新请求。
  pickingStartDate.value = null
  currentState.value.rows = []
  loadData()
}

function onCalendarChange(value: [Date, Date | null]) {
  // 记录正在选择的起始日期，用于 disabledDate 实现 30 天跨度限制。
  pickingStartDate.value = value?.[0] ?? null
}

function disabledDate(date: Date) {
  // 限制单次 daterange 查询跨度不超过 30 天。
  if (!pickingStartDate.value) return false
  const maxRange = (MAX_RANGE_DAYS - 1) * DAY_MS
  return Math.abs(date.getTime() - pickingStartDate.value.getTime()) > maxRange
}

function hasValue(value: unknown) {
  return value !== null && value !== undefined && value !== ""
}

function fmt(value: unknown, decimals?: number) {
  if (!hasValue(value)) return "--"
  if (typeof value === "number") return decimals === undefined ? `${value}` : value.toFixed(decimals)
  const numberValue = Number(value)
  if (decimals !== undefined && Number.isFinite(numberValue)) return numberValue.toFixed(decimals)
  return `${value}`
}

function getFieldValue(row: HistoryRow, field: HistoryField) {
  return field.formatter ? field.formatter(row) : fmt(row[field.column], field.decimals)
}

function getThresholdValue(row: HistoryRow, field: HistoryField) {
  // 默认按字段原始值判断；如果字段是公式展示值，可在配置里提供 thresholdValue。
  return field.thresholdValue ? field.thresholdValue(row) : row[field.column]
}

function isThresholdExceeded(row: HistoryRow, field: HistoryField) {
  if (!field.threshold) return false
  const value = Number(getThresholdValue(row, field))
  if (!Number.isFinite(value)) return false
  const { min, max } = field.threshold
  return (min !== undefined && value < min) || (max !== undefined && value > max)
}

watch(
  () => props.shore,
  () => {
    // 切换岸基站时重建分组状态，避免上一站点的日期和数据残留到新站点。
    activeGroupKey.value = groups.value[0]?.key ?? ""
    stateMap.value = {}
    initAndLoadData()
  }
)

onMounted(initAndLoadData)
</script>

<template>
  <div class="shore-history-page">
    <div class="page-toolbar">
      <div>
        <div class="page-title">
          {{ pageTitle }}
        </div>
        <div class="page-subtitle">
          历史数据
        </div>
      </div>

      <div class="query-tools">
        <el-date-picker
          v-model="currentState.dateRange"
          type="daterange"
          single-panel
          value-format="YYYY-MM-DD"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          range-separator="至"
          :clearable="false"
          :disabled-date="disabledDate"
          @calendar-change="onCalendarChange"
          @change="onRangeChange"
        />
        <el-button type="primary" :loading="loading" @click="loadData">
          查询
        </el-button>
      </div>
    </div>

    <el-tabs v-model="activeGroupKey" class="type-tabs" @tab-change="onGroupChange">
      <el-tab-pane
        v-for="group in groups"
        :key="group.key"
        :name="group.key"
        :label="group.label"
      />
    </el-tabs>

    <div class="table-wrapper" v-loading="loading">
      <el-table :data="currentRows" stripe size="small" height="100%" empty-text="暂无数据">
        <el-table-column prop="samp_time" label="采样时间" width="180" fixed>
          <template #default="{ row }">
            {{ formatDateTime(row.samp_time) }}
          </template>
        </el-table-column>

        <el-table-column prop="recv_time" label="接收时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.recv_time) }}
          </template>
        </el-table-column>

        <el-table-column
          v-for="field in activeGroup?.fields ?? []"
          :key="field.key"
          :prop="field.column"
          :label="field.label"
          :width="field.width"
          :min-width="field.minWidth ?? (field.width ? undefined : 120)"
          :align="field.align ?? 'right'"
        >
          <template #default="{ row }">
            <span :class="{ 'threshold-exceeded': isThresholdExceeded(row, field) }">
              {{ getFieldValue(row, field) }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.shore-history-page {
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
  padding: 16px 20px;
  box-sizing: border-box;
}

.page-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 10px;
}

.page-title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  line-height: 1.4;
}

.page-subtitle {
  margin-top: 2px;
  font-size: 13px;
  color: #64748b;
}

.query-tools {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.type-tabs {
  flex-shrink: 0;
}

.table-wrapper {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}

.threshold-exceeded {
  color: #dc2626;
  font-weight: 600;
}

@media (max-width: 768px) {
  .page-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .query-tools {
    width: 100%;
    flex-wrap: wrap;
  }
}
</style>
