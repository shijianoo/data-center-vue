<script lang="ts" setup>
import type { BuoyKey, HistoryField, HistoryGroup, HistoryRow } from "./config"
import { computed, onMounted, ref, watch } from "vue"
import { formatDateTime } from "@/common/utils/datetime"
import { getHistoricalData, getLatestData } from "../../apis"
import { buoyHistoryConfig, buoyOptions, getBuoyName } from "./config"

const props = defineProps<{
  buoy: BuoyKey
}>()

interface GroupState {
  // el-date-picker 使用 YYYY-MM-DD，真正请求接口时再扩展成当天起止时间。
  dateRange: [string, string]
  rows: HistoryRow[]
  // initialized 标记用于区分“还没打开过”和“打开过但查询为空”，避免重复取默认日期。
  initialized: boolean
}

const groups = computed(() => buoyHistoryConfig[props.buoy] ?? [])
const activeGroupKey = ref(groups.value[0]?.key ?? "")
const loading = ref(false)
// 每个参数类型独立保存日期范围和表格数据，切换 tab 时保留上一次查询现场。
const stateMap = ref<Record<string, GroupState>>({})
const pickingStartDate = ref<Date | null>(null)
const MAX_RANGE_DAYS = 30
const DAY_MS = 24 * 60 * 60 * 1000

const activeGroup = computed<HistoryGroup | undefined>(() => {
  return groups.value.find(item => item.key === activeGroupKey.value)
})

const currentState = computed(() => getGroupState(activeGroupKey.value))
const currentRows = computed(() => currentState.value.rows)
const pageTitle = computed(() => `${props.buoy} ${getBuoyName(props.buoy)}`)
const locationConfig = computed(() => buoyOptions.find(item => item.key === props.buoy))

function getDefaultRange(): [string, string] {
  const today = formatDay(new Date())
  return [today, today]
}

function formatDay(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

function getGroupState(groupKey: string): GroupState {
  // 参数类型第一次被打开时再创建默认状态，减少初始化时的无效请求。
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
  // 日期选择器只选到天，接口查询时扩展为当天完整时间段。
  const [startDay, endDay] = range
  const startDate = new Date(`${startDay}T00:00:00`)
  const endDate = new Date(`${endDay}T23:59:59`)
  return {
    startTime: startDate.toISOString(),
    endTime: endDate.toISOString()
  }
}

function getSelectColumns(group: HistoryGroup) {
  // 后端默认返回时间字段，这里只提交配置字段；queryColumn 处理 do 这类 SQL 关键字。
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
    // 历史查询始终按当前激活分组发起；同一台浮标的不同参数分组不会互相覆盖表格数据。
    const { data } = await getHistoricalData({
      tableName: group.tableName,
      serialNumber: props.buoy,
      selectColumns: getSelectColumns(group),
      startTime,
      endTime,
      sortDirection: "desc"
    })
    currentState.value.rows = Array.isArray(data) ? data : (data?.items ?? data?.records ?? [])
  } catch (error) {
    console.error(`查询 ${props.buoy} ${group.label} 历史数据失败`, error)
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
    // 第一次进入某类参数时，用最新一条数据所在日期作为默认查询日期。
    state.initialized = true
    state.dateRange = await getLatestDateRange(group)
  }

  await loadData()
}

async function getLatestDateRange(group: HistoryGroup): Promise<[string, string]> {
  if (!group.tableName) return getDefaultRange()

  try {
    // 第一次打开分组时先查最新一条，拿它的采样日期作为默认日期，比固定今天更容易查到数据。
    const { data } = await getLatestData(group.tableName, props.buoy, getSelectColumns(group))
    const row = getFirstRow(data)
    const day = getRowDay(row)
    return day ? [day, day] : getDefaultRange()
  } catch (error) {
    console.error(`获取 ${props.buoy} ${group.label} 最新数据失败`, error)
    return getDefaultRange()
  }
}

function getFirstRow(data: unknown) {
  // 兼容接口直接返回数组、分页对象或单行对象，页面只关心“最新一条记录”。
  if (Array.isArray(data)) return data[0] ?? null
  const result = data as { items?: unknown[], records?: unknown[] } | null | undefined
  if (Array.isArray(result?.items)) return result.items[0] ?? null
  if (Array.isArray(result?.records)) return result.records[0] ?? null
  return data ?? null
}

function getRowDay(row: unknown) {
  if (!row || typeof row !== "object") return null
  const item = row as HistoryRow
  // 不同接口命名不完全一致，按采样时间优先、接收时间兜底的顺序取日期。
  const time = item.samp_time ?? item.recv_time ?? item.sampleTime ?? item.receiveTime
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
  // 已初始化过的分组保留原来的日期和结果，不做自动刷新；未初始化才走默认日期逻辑。
  if (!getGroupState(nextKey).initialized) {
    initAndLoadData()
  }
}

function onRangeChange() {
  // 用户手动改日期后立即清空旧结果再查询，避免短暂展示上一时间段的数据。
  pickingStartDate.value = null
  currentState.value.rows = []
  loadData()
}

function onCalendarChange(value: [Date, Date | null]) {
  // Element Plus 选择范围时会先给开始日期，disabledDate 依赖这个值动态限制结束日期。
  pickingStartDate.value = value?.[0] ?? null
}

function disabledDate(date: Date) {
  // daterange 在选中开始日期后，只允许继续选择 30 天以内的结束日期。
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
  // 默认使用原始字段做阈值判断；如果展示值来自公式或合计，可以通过 thresholdValue 指定判断值。
  return field.thresholdValue ? field.thresholdValue(row) : row[field.column]
}

function isThresholdExceeded(row: HistoryRow, field: HistoryField) {
  if (!field.threshold) return false
  const value = Number(getThresholdValue(row, field))
  if (!Number.isFinite(value)) return false
  const { min, max } = field.threshold
  return (min !== undefined && value < min) || (max !== undefined && value > max)
}

function formatLocationStatus(row: HistoryRow) {
  // GPS 状态根据当前点位到固定围栏中心的距离判断，超过配置半径即异常。
  // 这里用于历史表格逐行判断；地图页的实时围栏判断在 DeviceDataDrawer 中另行计算。
  const config = locationConfig.value
  if (!config || config.longitude == null || config.latitude == null || config.radius == null) return "--"

  const longitude = parseCoordinate(row.g02)
  const latitude = parseCoordinate(row.g03)
  if (longitude == null || latitude == null) return "--"

  return getDistance(longitude, latitude, config.longitude, config.latitude) > config.radius ? "异常" : "正常"
}

function parseCoordinate(value: unknown) {
  // 兼容 g02/g03 中的 ddmm.mmmm 格式，便于和固定围栏中心点做米级距离计算。
  if (value === null || value === undefined || value === "") return null
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) return null
  const absValue = Math.abs(numberValue)
  if (absValue > 180) {
    const degree = Math.floor(absValue / 100)
    const minutes = absValue - degree * 100
    const decimalDegree = degree + minutes / 60
    return numberValue < 0 ? -decimalDegree : decimalDegree
  }
  return numberValue
}

function getDistance(lng1: number, lat1: number, lng2: number, lat2: number) {
  // 使用 Haversine 公式计算两点球面距离，结果单位为米，适合电子围栏半径判断。
  const earthRadius = 6371000
  const radLat1 = toRad(lat1)
  const radLat2 = toRad(lat2)
  const deltaLat = toRad(lat2 - lat1)
  const deltaLng = toRad(lng2 - lng1)
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(deltaLng / 2) ** 2
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRad(value: number) {
  return value * Math.PI / 180
}

watch(
  () => props.buoy,
  () => {
    // 路由切换到另一台浮标时重置页面状态，避免沿用上一台设备的分组和查询结果。
    activeGroupKey.value = groups.value[0]?.key ?? ""
    stateMap.value = {}
    initAndLoadData()
  }
)

onMounted(initAndLoadData)
</script>

<template>
  <div class="buoy-history-page">
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

    <el-alert
      v-if="activeGroup?.placeholder"
      title="该参数暂未确认查询方式，已预留代码位置。"
      type="info"
      :closable="false"
      show-icon
    />

    <div v-else class="table-wrapper" v-loading="loading">
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

        <el-table-column v-if="activeGroup?.locationStatus" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag
              v-if="formatLocationStatus(row) !== '--'"
              size="small"
              :type="formatLocationStatus(row) === '正常' ? 'success' : 'danger'"
            >
              {{ formatLocationStatus(row) }}
            </el-tag>
            <span v-else>--</span>
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
.buoy-history-page {
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
