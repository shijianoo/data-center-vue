<script lang="ts" setup>
import { computed, onMounted, ref, watch } from "vue"
import { formatDateTime } from "@/common/utils/datetime"
import { getShoreCurrentPageData, getShoreNutrientPageData, getShoreWaterPageData } from "./apis"

type ShoreKey = "NB09" | "NB10" | "NB11"

type TabKey = "water" | "nutrient" | "current"
type PageKey = `${ShoreKey}_${TabKey}`

interface ColumnRule {
  /** 白名单：只显示列表中的列（不配置则不限制） */
  onlyShow?: string[]
  /** 黑名单：强制隐藏列表中的列，优先级高于 onlyShow（不配置则不额外隐藏） */
  hidden?: string[]
}

interface TableColumn {
  key: string
  label: string
  width?: number
  align?: "left" | "center" | "right"
  decimals?: number
  formatter?: (value: unknown) => string
}

interface CommonRow {
  sampleTime?: string | null
  receiveTime?: string | null
  uploadChannel?: number | null
  [key: string]: unknown
}

interface PageResponse<T = CommonRow> {
  total?: number
  items?: T[]
}

const PAGE_SIZE = 20

const shoreOptions: { key: ShoreKey, label: string, code: string }[] = [
  { key: "NB09", label: "甬江入海河口岸基站", code: "NB09" },
  { key: "NB10", label: "西周综合污水处理厂排污口岸基站", code: "NB10" },
  { key: "NB11", label: "大嵩江入海口岸基站", code: "NB11" }
]

const allTabOptions: { key: TabKey, label: string }[] = [
  { key: "water", label: "水质数据" },
  { key: "nutrient", label: "营养盐数据" },
  { key: "current", label: "海流数据" }
]

// ============================================================
// 配置区：每个设备显示哪些参数类型（删掉不需要的 TabKey 即可）
// ============================================================
const shoreTabConfig: Record<ShoreKey, TabKey[]> = {
  NB09: ["water", "nutrient"],
  NB10: ["water", "nutrient"],
  NB11: ["water", "nutrient", "current"]
}

// ============================================================
// 配置区：每个设备每种参数类型下的列显示规则
// onlyShow: 白名单，只显示指定的列（不配置 = 不限制）
// hidden:   黑名单，强制隐藏指定的列，优先级高于 onlyShow（不配置 = 不额外隐藏）
// 两者可同时使用，最终显示：(在 onlyShow 中 或 onlyShow 未设置) 且 (不在 hidden 中) 且 (有数据)
// 列的 key 参见各 xxxColumns 数组定义
// ============================================================
const shoreColumnConfig: Partial<Record<ShoreKey, Partial<Record<TabKey, ColumnRule>>>> = {
  // 示例：NB09 的水质数据隐藏叶竪素a列
  // NB09: {
  //   water: { hidden: ["chlorophyllA"] },
  // },
  // 示例：NB11 的海流数据只显示流速和水深
  // NB11: {
  //   current: { onlyShow: ["flowVelocity", "waterLevel"] },
  // },
}

const waterColumns: TableColumn[] = [
  { key: "waterTemp", label: "水温(℃)", width: 110, align: "right", decimals: 2 },
  { key: "salinity", label: "盐度(‰)", width: 100, align: "right", decimals: 2 },
  { key: "cond", label: "电导率(mS/cm)", width: 110, align: "right", decimals: 3 },
  { key: "ph", label: "pH", width: 90, align: "right", decimals: 2 },
  { key: "do", label: "溶解氧(mg/L)", width: 110, align: "right", decimals: 2 },
  { key: "dos", label: "溶解氧饱和度(％)", width: 130, align: "right", decimals: 1 },
  { key: "turb", label: "浊度(NTU)", width: 100, align: "right", decimals: 1 },
  { key: "chlorophyllA", label: "叶绿素a(μg/L)", width: 100, align: "right", decimals: 2 }
]

const nutrientColumns: TableColumn[] = [
  { key: "cod", label: "COD(mg/L)", width: 90, align: "right", decimals: 3 },
  { key: "ammoniaNitrogen", label: "氨氮(mg/L)", width: 120, align: "right", decimals: 3 },
  { key: "totalPhosphorus", label: "总磷(mg/L)", width: 120, align: "right", decimals: 3 },
  { key: "totalNitrogen", label: "总氮(mg/L)", width: 120, align: "right", decimals: 3 }
]

const currentColumns: TableColumn[] = [
  { key: "sectionFlow", label: "断面流量", width: 120, align: "right", decimals: 3 },
  { key: "sectionArea", label: "断面面积", width: 120, align: "right", decimals: 3 },
  { key: "flowVelocity", label: "流速(m/s)", width: 110, align: "right", decimals: 3 },
  { key: "waterLevel", label: "水深(m)", width: 100, align: "right", decimals: 2 }
]

const columnMap: Record<TabKey, TableColumn[]> = {
  water: waterColumns,
  nutrient: nutrientColumns,
  current: currentColumns
}

const activeShore = ref<ShoreKey>("NB09")
const activeTab = ref<TabKey>(shoreTabConfig.NB09[0] ?? "water")
const loading = ref(false)
const pages = ref<Record<string, number>>({})
const totals = ref<Record<string, number>>({})
const tableCache = ref<Record<string, CommonRow[]>>({})

// 根据配置过滤当前设备可见的参数类型
const tabOptions = computed(() => {
  const allowed = shoreTabConfig[activeShore.value]
  return allTabOptions.filter(tab => allowed.includes(tab.key))
})

function makePageKey(shore: ShoreKey, tab: TabKey): PageKey {
  return `${shore}_${tab}`
}

function getCurrentKey() {
  return makePageKey(activeShore.value, activeTab.value)
}

function getPage() {
  return pages.value[getCurrentKey()] ?? 1
}

function setPage(page: number) {
  pages.value[getCurrentKey()] = page
}

function getTotal() {
  return totals.value[getCurrentKey()] ?? 0
}

const currentRows = computed<CommonRow[]>(() => tableCache.value[getCurrentKey()] ?? [])

const visibleColumns = computed(() => {
  const rows = currentRows.value
  const rule = shoreColumnConfig[activeShore.value]?.[activeTab.value]
  return columnMap[activeTab.value].filter((column) => {
    // 1. 白名单：若设置了 onlyShow，则必须在列表中
    if (rule?.onlyShow && !rule.onlyShow.includes(column.key)) return false
    // 2. 黑名单：在 hidden 中则强制隐藏（优先级高于 onlyShow）
    if (rule?.hidden?.includes(column.key)) return false
    // 3. 空列自动隐藏：该列所有行均无数据则不显示
    return rows.some(row => hasValue(row[column.key]))
  })
})

function hasValue(value: unknown) {
  return value !== null && value !== undefined && value !== ""
}

function fmt(value: unknown, decimals?: number) {
  if (!hasValue(value)) return "--"
  if (typeof value === "number") {
    return decimals === undefined ? `${value}` : value.toFixed(decimals)
  }
  return `${value}`
}

async function fetchPageData(shore: ShoreKey, tab: TabKey, page: number) {
  loading.value = true
  try {
    const requestMap: Record<TabKey, (sn: string, p: number, ps: number) => Promise<{ data: PageResponse }>> = {
      water: getShoreWaterPageData,
      nutrient: getShoreNutrientPageData,
      current: getShoreCurrentPageData
    }
    const res = await requestMap[tab](shore, page, PAGE_SIZE)
    const key = makePageKey(shore, tab)
    tableCache.value[key] = res.data?.items ?? []
    totals.value[key] = res.data?.total ?? 0
  } catch (error) {
    console.error(`获取 ${shore} ${tab} 数据失败`, error)
    const key = makePageKey(shore, tab)
    tableCache.value[key] = []
    totals.value[key] = 0
  } finally {
    loading.value = false
  }
}

function loadCurrent() {
  fetchPageData(activeShore.value, activeTab.value, getPage())
}

function onPageChange(page: number) {
  setPage(page)
  loadCurrent()
}

// 切换设备：若当前 Tab 不在新设备的可见列表中，自动回退到第一个可见 Tab
watch(activeShore, (shore) => {
  const allowed = shoreTabConfig[shore]
  if (!allowed.includes(activeTab.value)) {
    activeTab.value = allowed[0] ?? "water"
  }
  const key = makePageKey(shore, activeTab.value)
  if (tableCache.value[key] === undefined) {
    fetchPageData(shore, activeTab.value, pages.value[key] ?? 1)
  }
})

watch(activeTab, (tab) => {
  const key = makePageKey(activeShore.value, tab)
  if (tableCache.value[key] === undefined) {
    fetchPageData(activeShore.value, tab, pages.value[key] ?? 1)
  }
})

onMounted(() => {
  fetchPageData(activeShore.value, activeTab.value, 1)
})
</script>

<template>
  <div class="shore-page">
    <div class="page-header">
      <div class="page-title">
        岸基站历史数据
      </div>

      <div class="controls">
        <!-- 岸基站选择 -->
        <div class="selector-wrap">
          <button
            v-for="shore in shoreOptions"
            :key="shore.key"
            class="switch-btn shore-btn"
            :class="{ active: activeShore === shore.key }"
            @click="activeShore = shore.key"
          >
            <span class="shore-name">{{ shore.label }}</span>
            <span class="shore-code">{{ shore.code }}</span>
          </button>
        </div>

        <!-- 数据类型选择 -->
        <div class="selector-wrap">
          <button
            v-for="tab in tabOptions"
            :key="tab.key"
            class="switch-btn"
            :class="{ active: activeTab === tab.key }"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>
    </div>

    <div class="table-wrapper" v-loading="loading">
      <el-table
        :data="currentRows"
        stripe
        size="small"
        height="100%"
        empty-text="暂无数据"
      >
        <!-- <el-table-column prop="serialNumber" label="设备编号" width="120" fixed>
          <template #default="{ row }">
            {{ row.serialNumber ?? "--" }}
          </template>
        </el-table-column> -->

        <el-table-column prop="sampleTime" label="采样时间" width="180" fixed>
          <template #default="{ row }">
            {{ formatDateTime(row.sampleTime) }}
          </template>
        </el-table-column>

        <el-table-column prop="receiveTime" label="接收时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.receiveTime) }}
          </template>
        </el-table-column>
        <!--
        <el-table-column prop="uploadChannel" label="上传通道" width="100" align="center">
          <template #default="{ row }">
            {{ row.uploadChannel ?? "--" }}
          </template>
        </el-table-column> -->

        <el-table-column
          v-for="column in visibleColumns"
          :key="column.key"
          :prop="column.key"
          :label="column.label"
          :width="column.width"
          :align="column.align ?? 'left'"
        >
          <template #default="{ row }">
            {{ column.formatter ? column.formatter(row[column.key]) : fmt(row[column.key], column.decimals) }}
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="pagination-bar">
      <el-pagination
        :current-page="getPage()"
        :page-size="PAGE_SIZE"
        :total="getTotal()"
        layout="total, prev, pager, next"
        :disabled="loading"
        @current-change="onPageChange"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.shore-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - var(--header-h));
  padding: 16px 20px 0;
  background: #f5f7fa;
  color: #1f2937;
  box-sizing: border-box;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.page-title {
  font-size: 16px;
  font-weight: 700;
  line-height: 32px;
  color: #111827;
  flex-shrink: 0;
}

.controls {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.selector-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.switch-btn {
  min-width: 76px;
  padding: 6px 12px;
  border: 1px solid #d7deea;
  border-radius: 6px;
  background: #fff;
  color: #4b5563;
  font-size: 13px;
  line-height: 1.2;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #9db7e5;
    color: #1d4ed8;
  }

  &.active {
    border-color: #2563eb;
    background: #2563eb;
    color: #fff;
  }
}

.shore-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-width: 160px;
  text-align: left;
}

.shore-name {
  font-size: 13px;
  line-height: 1.25;
  white-space: nowrap;
}

.shore-code {
  font-size: 11px;
  line-height: 1.1;
  color: #94a3b8;
}

.shore-btn.active .shore-code {
  color: rgba(255, 255, 255, 0.8);
}

.table-wrapper {
  flex: 1;
  min-height: 0;
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}

.pagination-bar {
  display: flex;
  justify-content: flex-end;
  padding: 12px 0;
  flex-shrink: 0;
}
</style>
