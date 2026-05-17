<script lang="ts" setup>
import type { HistoryField, HistoryGroup, HistoryRow } from "../buoy/config"
import { computed, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { formatDateTime } from "@/common/utils/datetime"
import { getHistoricalData, getLatestData } from "../../apis"

const props = defineProps<{
  serialNumber: string
  title: string
  groups: HistoryGroup[]
  subtitle?: string
  getLocationStatus?: (row: HistoryRow) => string
}>()

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const rows = ref<HistoryRow[]>([])
const pickingStartDate = ref<Date | null>(null)
const requestSeq = ref(0)
const groupDateCache = ref<Record<string, [string, string]>>({})
const MAX_RANGE_DAYS = 30
const DAY_MS = 24 * 60 * 60 * 1000

const routeGroup = computed(() => getValidGroupKey(getSingleQuery(route.query.group)))
const routeDateRange = computed(() => getValidDateRange(getSingleQuery(route.query.start), getSingleQuery(route.query.end)))
const activeGroup = computed(() => props.groups.find(group => group.key === routeGroup.value))
const routeQueryState = computed(() => `${routeGroup.value}|${routeDateRange.value?.[0] ?? ""}|${routeDateRange.value?.[1] ?? ""}|${props.serialNumber}`)
const groupModel = computed({
  get: () => routeGroup.value,
  set: (groupKey: string) => {
    // URL 只表达当前 group 的查询状态；每个 group 自己的日期范围放在 groupDateCache 里。
    // 切换 group 时优先恢复该 group 的缓存日期，没有缓存再交给 ensureDateRange 查最新日期。
    if (!props.groups.some(group => group.key === groupKey) || groupKey === routeGroup.value) return
    rows.value = []
    const cachedRange = groupDateCache.value[groupKey]
    void replaceQuery({
      group: groupKey,
      start: cachedRange?.[0],
      end: cachedRange?.[1]
    })
  }
})
const dateRangeModel = computed<[string, string]>({
  get: () => routeDateRange.value ?? getDefaultRange(),
  set: (range) => {
    // 日期选择器同样只写 URL。URL 变化后 watcher 会用新的 start/end 重新查询。
    pickingStartDate.value = null
    if (!getValidDateRange(range?.[0], range?.[1])) return
    rows.value = []
    groupDateCache.value[routeGroup.value] = range
    void replaceQuery({
      group: routeGroup.value,
      start: range[0],
      end: range[1]
    })
  }
})

function getSingleQuery(value: unknown) {
  return Array.isArray(value) ? value[0] : value
}

function getValidGroupKey(value: unknown) {
  // URL 是当前页面唯一的查询状态来源；group 无效时只在内存中兜底到第一个分组。
  // 注意：兜底值只用于展示和查询，不主动写回 URL，避免刷新时把有效 query 覆盖掉。
  return typeof value === "string" && props.groups.some(group => group.key === value)
    ? value
    : props.groups[0]?.key ?? ""
}

function isValidDay(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00`).getTime())
}

function getValidDateRange(start: unknown, end: unknown): [string, string] | null {
  return isValidDay(start) && isValidDay(end) ? [start, end] : null
}

function cacheRouteDateRange() {
  const range = routeDateRange.value
  if (!range) return
  groupDateCache.value[routeGroup.value] = range
}

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

function getQueryRange(range: [string, string]) {
  // 日期选择器只选到天，接口查询时扩展为当天完整时间段。
  const [startDay, endDay] = range
  return {
    startTime: new Date(`${startDay}T00:00:00`).toISOString(),
    endTime: new Date(`${endDay}T23:59:59`).toISOString()
  }
}

function getSelectColumns(group: HistoryGroup) {
  // 后端默认返回时间字段，这里只提交业务字段；queryColumn 处理 do 这类 SQL 关键字。
  const columns = new Set<string>()
  group.fields.forEach((field) => {
    columns.add(field.queryColumn ?? field.column)
  })
  return [...columns]
}

async function replaceQuery(next: Record<string, string | null | undefined>) {
  const query = { ...route.query }
  Object.entries(next).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      delete query[key]
    } else {
      query[key] = value
    }
  })
  const same = Object.entries(next).every(([key, value]) => {
    const currentValue = getSingleQuery(route.query[key])
    return value === undefined || value === null ? currentValue === undefined : currentValue === value
  })
  if (same) return
  await router.replace({ query })
}

async function ensureDateRange(group: HistoryGroup): Promise<[string, string] | null> {
  const range = routeDateRange.value
  if (range) {
    groupDateCache.value[group.key] = range
    return range
  }

  // 只有 URL 没有合法 start/end 时才查最新数据日期并补齐 query。
  // 如果分享链接已经带了日期，绝不会用最新日期覆盖它。
  const latestRange = await getLatestDateRange(group)
  groupDateCache.value[group.key] = latestRange
  await replaceQuery({
    group: group.key,
    start: latestRange[0],
    end: latestRange[1]
  })
  // 补齐 URL 后交给 routeQueryState watcher 重新进入查询流程，避免本轮和下一轮重复查历史数据。
  return null
}

async function loadActiveGroup() {
  const group = activeGroup.value
  if (!group || group.placeholder || !group.tableName) {
    rows.value = []
    return
  }

  const seq = ++requestSeq.value
  loading.value = true

  try {
    const range = await ensureDateRange(group)
    if (!range) return
    const { startTime, endTime } = getQueryRange(range)
    const { data } = await getHistoricalData({
      tableName: group.tableName,
      serialNumber: props.serialNumber,
      selectColumns: getSelectColumns(group),
      startTime,
      endTime,
      sortDirection: "desc"
    })
    if (seq !== requestSeq.value) return
    rows.value = Array.isArray(data) ? data : (data?.items ?? data?.records ?? [])
  } catch (error) {
    console.error(`查询 ${props.serialNumber} ${group.label} 历史数据失败`, error)
    if (seq === requestSeq.value) rows.value = []
  } finally {
    if (seq === requestSeq.value) loading.value = false
  }
}

async function getLatestDateRange(group: HistoryGroup): Promise<[string, string]> {
  if (!group.tableName) return getDefaultRange()

  try {
    const { data } = await getLatestData(group.tableName, props.serialNumber, getSelectColumns(group))
    const row = getFirstRow(data)
    const day = getRowDay(row)
    return day ? [day, day] : getDefaultRange()
  } catch (error) {
    console.error(`获取 ${props.serialNumber} ${group.label} 最新数据失败`, error)
    return getDefaultRange()
  }
}

function getFirstRow(data: unknown) {
  if (Array.isArray(data)) return data[0] ?? null
  const result = data as { items?: unknown[], records?: unknown[] } | null | undefined
  if (Array.isArray(result?.items)) return result.items[0] ?? null
  if (Array.isArray(result?.records)) return result.records[0] ?? null
  return data ?? null
}

function getRowDay(row: unknown) {
  if (!row || typeof row !== "object") return null
  const item = row as HistoryRow
  const time = item.samp_time ?? item.recv_time ?? item.sampleTime ?? item.receiveTime
  if (!isDateInput(time)) return null

  const date = new Date(time)
  return Number.isNaN(date.getTime()) ? null : formatDay(date)
}

function isDateInput(value: unknown): value is string | number | Date {
  return typeof value === "string" || typeof value === "number" || value instanceof Date
}

function onCalendarChange(value: [Date, Date | null]) {
  pickingStartDate.value = value?.[0] ?? null
}

function disabledDate(date: Date) {
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
  routeQueryState,
  () => {
    cacheRouteDateRange()
    loadActiveGroup()
  },
  { immediate: true }
)
</script>

<template>
  <div class="history-data-page">
    <div class="page-toolbar">
      <div>
        <div class="page-title">
          {{ title }}
        </div>
        <div class="page-subtitle">
          {{ subtitle ?? "历史数据" }}
        </div>
      </div>

      <div class="query-tools">
        <el-date-picker
          v-model="dateRangeModel"
          type="daterange"
          single-panel
          value-format="YYYY-MM-DD"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          range-separator="至"
          :clearable="false"
          :disabled-date="disabledDate"
          @calendar-change="onCalendarChange"
        />
        <el-button type="primary" :loading="loading" @click="loadActiveGroup">
          查询
        </el-button>
      </div>
    </div>

    <el-tabs v-model="groupModel" class="type-tabs">
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
      <el-table :data="rows" stripe size="small" height="100%" empty-text="暂无数据">
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

        <el-table-column v-if="activeGroup?.locationStatus && getLocationStatus" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag
              v-if="getLocationStatus(row) !== '--'"
              size="small"
              :type="getLocationStatus(row) === '正常' ? 'success' : 'danger'"
            >
              {{ getLocationStatus(row) }}
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
.history-data-page {
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
