<script lang="ts" setup>
import { computed, onMounted, ref, watch } from "vue"
import { formatDateTime } from "@/common/utils/datetime"
import {
  getBuoyMeteoPageData,
  getBuoyNutrientPageData,
  getBuoyWaterPageData,
  getOneMinutePageData,
  getQuarterPageData
} from "./apis"

type BuoyKey = "NB00" | "NB01" | "NB02" | "NB03" | "NB04" | "NB05" | "NB06" | "NB07" | "NB08"

type TabKey = "minute" | "quarter" | "meteo" | "water" | "nutrient"
type PageKey = `${BuoyKey}_${TabKey}`

interface ColumnRule {
  /** 白名单：只显示列表中的列（不配置则不限制） */
  onlyShow?: string[]
  /** 黑名单：强制隐藏列表中的列，优先级高于 onlyShow（不配置则不额外隐藏） */
  hidden?: string[]
}

/**
 * Tab 配置项：
 * - 字符串形式（TabKey）：使用 allTabOptions 中对应的默认 label
 * - 对象形式：自定义显示文字，不写则回退默认 label
 */
type TabEntry = TabKey | { key: TabKey, label: string }

interface TableColumn {
  key: string
  label: string
  width?: number
  align?: "left" | "center" | "right"
  decimals?: number
  formatter?: (value: unknown | any) => string
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

const buoyOptions: { key: BuoyKey, label: string, code: string }[] = [
  { key: "NB00", label: "强蛟生态浮标", code: "NB00" },
  { key: "NB01", label: "南韭山生态浮标", code: "NB01" },
  { key: "NB02", label: "松兰山海滨浮标", code: "NB02" },
  { key: "NB03", label: "渔山生态浮标", code: "NB03" },
  { key: "NB04", label: "三门生态浮标", code: "NB04" },
  { key: "NB05", label: "杭州湾生态浮标", code: "NB05" },
  { key: "NB06", label: "镇海重点化工区排污口浮标", code: "NB06" },
  { key: "NB07", label: "松兰山生态浮标", code: "NB07" },
  { key: "NB08", label: "杭州湾新区北污水排放口浮标", code: "NB08" }
]

const allTabOptions: { key: TabKey, label: string }[] = [
  { key: "meteo", label: "气象表" },
  { key: "water", label: "水质表" },
  { key: "nutrient", label: "营养盐表" },
  { key: "minute", label: "1分钟数据表" },
  { key: "quarter", label: "15分钟数据表" }
]

// ============================================================
// 配置区：每个设备显示哪些参数类型
// - 直接写 TabKey 字符串 => 使用 allTabOptions 默认文字
// - 写对象 { key, label } => 自定义显示文字（不写 label 则回退默认）
// ============================================================
const buoyTabConfig: Record<BuoyKey, TabEntry[]> = {
  NB00: ["meteo", "water", "nutrient", "minute", "quarter"],
  NB01: ["meteo", "water", "nutrient", "minute", "quarter"],
  NB02: ["meteo", "water", "nutrient", "minute", "quarter"],
  NB03: ["meteo", "water", "nutrient", "minute", "quarter"],
  NB04: ["meteo", "water", "nutrient", "minute", "quarter"],
  NB05: ["meteo", "water", "nutrient", "minute", "quarter"],
  NB06: ["meteo", "water", "nutrient", "minute", "quarter"],
  NB07: ["meteo", "water", "nutrient", "minute", "quarter"],
  NB08: ["meteo", "water", "nutrient", "minute", "quarter"]
}

/** 提取 TabEntry 数组中的纯 key 列表，用于判断 Tab 是否在可见列表中 */
function getTabKeys(entries: TabEntry[]): TabKey[] {
  return entries.map(e => typeof e === "string" ? e : e.key)
}

// ============================================================
// 配置区：每个设备每种参数类型下的列显示规则
// onlyShow: 白名单，只显示指定的列（不配置 = 不限制）
// hidden:   黑名单，强制隐藏指定的列，优先级高于 onlyShow（不配置 = 不额外隐藏）
// 两者可同时使用，最终显示：(在 onlyShow 中 或 onlyShow 未设置) 且 (不在 hidden 中) 且 (有数据)
// 列的 key 参见各 xxxColumns 数组定义
// ============================================================
const buoyColumnConfig: Partial<Record<BuoyKey, Partial<Record<TabKey, ColumnRule>>>> = {
  // 示例：NB00 的气象水文数据隐藏光照列
  // NB00: {
  //   meteo: { onlyShow: ["par"] },
  //   minute: { hidden: ["q09", "q10", "q11", "s03"] },
  //   quarter: { onlyShow: ["receiveTime", "g02", "g03", "v02"] }
  // },
  // NB01: {
  //   quarter: { onlyShow: ["receiveTime", "g02", "g03", "v02"] }
  // },
  // NB02: {
  //   quarter: { onlyShow: ["receiveTime", "g02", "g03", "v02"] }
  // },
  // NB03: {
  //   meteo: { hidden: ["par", "waterDepth"] },
  //   quarter: { onlyShow: ["receiveTime", "g02", "g03", "v02"] }
  // },
  // NB04: {
  //   quarter: { onlyShow: ["receiveTime", "g02", "g03", "v02"] }
  // },
  // NB05: {
  //   quarter: { hidden: ["s00", "s01", "s02", "s03", "s04", "s05", "s07", "s08", "s09", "s18"] }
  // },
  // NB06: {
  //   quarter: { hidden: ["s00", "s01", "s02", "s03", "s04", "s05", "s07", "s08", "s09", "s18"] }
  // },
  // NB07: {
  //   quarter: { hidden: ["s00", "s01", "s02", "s03", "s04", "s05", "s07", "s08", "s09", "s18"] }
  // },
  // NB08: {
  //   quarter: { hidden: ["s00", "s01", "s02", "s03", "s04", "s05", "s07", "s08", "s09", "s18"] }
  // }
}

const minuteColumns: TableColumn[] = [
  { key: "q01", label: "气温(℃)", width: 90, align: "right" },
  { key: "q02", label: "气压(hPa)", width: 90, align: "right" },
  { key: "q03", label: "风速(m/s)", width: 90, align: "right" },
  { key: "q04", label: "风向(°)", width: 90, align: "right" },
  { key: "q05", label: "最大瞬时风速(m/s)", width: 130, align: "right" },
  { key: "q06", label: "最大瞬时风速风向(°)", width: 150, align: "right" },
  { key: "q07", label: "湿度(%)", width: 90, align: "right" },
  { key: "q08", label: "雨量(mm)", width: 90, align: "right" },
  { key: "q09", label: "航向(°)", width: 90, align: "right", decimals: 2 },
  { key: "q10", label: "纵摇(°)", width: 90, align: "right", decimals: 2 },
  { key: "q11", label: "横摇(°)", width: 90, align: "right", decimals: 2 },
  { key: "q13", label: "紫外线", width: 90, align: "right", decimals: 3 },
  { key: "s03", label: "气象采样周期(min)", width: 120, align: "right", decimals: 0 },
  { key: "s09", label: "紫外线采样周期(min)", width: 130, align: "right", decimals: 0 },
  { key: "v01", label: "水质传感器电压(V)", width: 100, align: "right", decimals: 2 }
]

const quarterColumns: TableColumn[] = [
  { key: "receiveTime", label: "GPS时间", width: 130, formatter: formatDateTime },
  { key: "g02", label: "GPS东经(°)", width: 120, align: "right", formatter: formatCoordinate },
  { key: "g03", label: "GPS北纬(°)", width: 120, align: "right", formatter: formatCoordinate },
  { key: "g04", label: "漏水报警", width: 90, align: "right", decimals: 0 },
  { key: "q12", label: "光照度(lux)", width: 90, align: "right" },
  { key: "q13", label: "紫外线", width: 90, align: "right" },
  { key: "v02", label: "电池电压(V)", width: 90, align: "right", decimals: 1 },
  { key: "w01", label: "深度(m)", width: 90, align: "right" },
  { key: "w02", label: "水温(°)", width: 90, align: "right" },
  { key: "w03", label: "盐度(‰)", width: 90, align: "right" },
  { key: "w04", label: "电导率(mS/cm)", width: 110, align: "right" },
  { key: "w05", label: "叶绿素a(μg/L)", width: 110, align: "right" },
  { key: "w06", label: "浊度(NTU)", width: 90, align: "right" },
  { key: "w07", label: "溶解氧(mg/L)", width: 90, align: "right" },
  { key: "w08", label: "溶解氧饱和度(％)", width: 120, align: "right" },
  { key: "w08O", label: "W08O", width: 90, align: "right" },
  { key: "w09", label: "pH", width: 90, align: "right" },
  { key: "w09O", label: "pH", width: 90, align: "right", formatter: value => (3.896 * value - 4.065).toFixed(3) },
  { key: "w10", label: "氨氮(mg/L)", width: 90, align: "right" },
  { key: "w11", label: "硝酸盐(mg/L)", width: 90, align: "right" },
  { key: "w12", label: "亚硝酸盐(mg/L)", width: 90, align: "right" },
  { key: "w13", label: "磷酸盐(mg/L)", width: 90, align: "right" },
  { key: "w13O", label: "W13O", width: 90, align: "right" },
  { key: "w14", label: "水深(m)", width: 90, align: "right" },
  { key: "w15", label: "石油类(ppm)", width: 90, align: "right" },
  { key: "w17", label: "流向(°)", width: 90, align: "right" },
  { key: "s00", label: "GPS采样周期", width: 100, align: "right", decimals: 0 },
  { key: "s01", label: "水质采样周期", width: 100, align: "right", decimals: 0 },
  { key: "s02", label: "光照采样周期", width: 100, align: "right", decimals: 0 },
  { key: "s03", label: "气象采样周期", width: 100, align: "right", decimals: 0 },
  { key: "s04", label: "磷酸盐采样周期", width: 100, align: "right", decimals: 0 },
  { key: "s05", label: "营养盐采样周期", width: 100, align: "right", decimals: 0 },
  { key: "s07", label: "高度计采样周期", width: 100, align: "right", decimals: 0 },
  { key: "s08", label: "S08", width: 100, align: "right", decimals: 0 },
  { key: "s09", label: "紫外线采样周期", width: 120, align: "right", decimals: 0 },
  { key: "s18", label: "COD采样周期", width: 100, align: "right", decimals: 0 }
]

const meteoColumns: TableColumn[] = [
  { key: "windSpd", label: "风速(m/s)", width: 90, align: "right", decimals: 1 },
  { key: "windDir", label: "风向(°)", width: 90, align: "right", decimals: 0 },
  { key: "maxWindSpd", label: "最大瞬时风速(m/s)", width: 130, align: "right", decimals: 1 },
  { key: "maxWindDir", label: "最大瞬时风速风向(°)", width: 140, align: "right", decimals: 0 },
  { key: "airTemp", label: "气温(°)", width: 110, align: "right", decimals: 1 },
  { key: "rh", label: "相对湿度(％)", width: 100, align: "right", decimals: 1 },
  { key: "airPress", label: "气压(hPa)", width: 90, align: "right", decimals: 1 },
  { key: "rain", label: "降雨量(mm)", width: 100, align: "right", decimals: 1 },
  { key: "waterDepth", label: "水深(m)", width: 90, align: "right", decimals: 1 },
  { key: "par", label: "光照(lux)", width: 90, align: "right", decimals: 0 }
]

const waterColumns: TableColumn[] = [
  { key: "waterTemp", label: "水温(℃)", width: 120, align: "right", decimals: 2 },
  { key: "salinity", label: "盐度(‰)", width: 100, align: "right", decimals: 2 },
  { key: "cond", label: "电导率(mS/cm)", width: 110, align: "right", decimals: 3 },
  { key: "ph", label: "pH", width: 90, align: "right", decimals: 2 },
  { key: "do", label: "溶解氧(mg/L)", width: 110, align: "right", decimals: 2 },
  { key: "dos", label: "溶解氧饱和度(％)", width: 120, align: "right", decimals: 1 },
  { key: "turb", label: "浊度(NTU)", width: 110, align: "right", decimals: 1 },
  { key: "chlorophyllA", label: "叶绿素a(μg/L)", width: 100, align: "right", decimals: 2 }
]

const nutrientColumns: TableColumn[] = [
  { key: "nitrite", label: "亚硝酸盐(mg/L)", width: 120, align: "right", decimals: 4 },
  { key: "nitrate", label: "硝酸盐(mg/L)", width: 120, align: "right", decimals: 4 },
  { key: "phosphate", label: "磷酸盐(mg/L)", width: 120, align: "right", decimals: 4 },
  { key: "ammonium", label: "铵盐(mg/L)", width: 120, align: "right", decimals: 4 }
]

const columnMap: Record<TabKey, TableColumn[]> = {
  minute: minuteColumns,
  quarter: quarterColumns,
  meteo: meteoColumns,
  water: waterColumns,
  nutrient: nutrientColumns
}

const activeBuoy = ref<BuoyKey>("NB00")
const activeTab = ref<TabKey>(getTabKeys(buoyTabConfig.NB00)[0] ?? "minute")

// 根据配置过滤当前设备可见的参数类型，支持自定义 label
const tabOptions = computed(() => {
  const entries = buoyTabConfig[activeBuoy.value]
  return entries.map((entry) => {
    if (typeof entry === "string") {
      // 字符串：回退 allTabOptions 中的默认 label
      return allTabOptions.find(t => t.key === entry) ?? { key: entry, label: entry }
    }
    // 对象：使用自定义 label，不写 label 则回退默认
    const defaultLabel = allTabOptions.find(t => t.key === entry.key)?.label ?? entry.key
    return { key: entry.key, label: entry.label ?? defaultLabel }
  })
})
const loading = ref(false)
const pages = ref<Record<string, number>>({})
const totals = ref<Record<string, number>>({})
const tableCache = ref<Record<string, CommonRow[]>>({})

function makePageKey(buoy: BuoyKey, tab: TabKey): PageKey {
  return `${buoy}_${tab}`
}

function getCurrentKey() {
  return makePageKey(activeBuoy.value, activeTab.value)
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
  const rule = buoyColumnConfig[activeBuoy.value]?.[activeTab.value]
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

function formatCoordinate(value: unknown) {
  if (!hasValue(value) || typeof value !== "number") return "--"
  const absValue = Math.abs(value)
  const degree = Math.floor(absValue / 100)
  const minutes = absValue - degree * 100
  const decimalDegree = degree + minutes / 60
  const signedValue = value < 0 ? -decimalDegree : decimalDegree
  return signedValue.toFixed(6)
}

async function fetchPageData(buoy: BuoyKey, tab: TabKey, page: number) {
  loading.value = true
  try {
    const requestMap: Record<TabKey, (sn: string, p: number, ps: number) => Promise<{ data: PageResponse }>> = {
      minute: getOneMinutePageData,
      quarter: getQuarterPageData,
      meteo: getBuoyMeteoPageData,
      water: getBuoyWaterPageData,
      nutrient: getBuoyNutrientPageData
    }
    const res = await requestMap[tab](buoy, page, PAGE_SIZE)
    const key = makePageKey(buoy, tab)
    tableCache.value[key] = res.data?.items ?? []
    totals.value[key] = res.data?.total ?? 0
  } catch (error) {
    console.error(`获取 ${buoy} ${tab} 数据失败`, error)
    const key = makePageKey(buoy, tab)
    tableCache.value[key] = []
    totals.value[key] = 0
  } finally {
    loading.value = false
  }
}

function loadCurrent() {
  fetchPageData(activeBuoy.value, activeTab.value, getPage())
}

function onPageChange(page: number) {
  setPage(page)
  loadCurrent()
}

// 切换设备：若当前 Tab 不在新设备的可见列表中，自动回退到第一个可见 Tab
watch(activeBuoy, (buoy) => {
  const allowedKeys = getTabKeys(buoyTabConfig[buoy])
  if (!allowedKeys.includes(activeTab.value)) {
    activeTab.value = allowedKeys[0] ?? "meteo"
  }
  const key = makePageKey(buoy, activeTab.value)
  if (tableCache.value[key] === undefined) {
    fetchPageData(buoy, activeTab.value, pages.value[key] ?? 1)
  }
})

// 切换参数类型：懒加载数据
watch(activeTab, (tab) => {
  const key = makePageKey(activeBuoy.value, tab)
  if (tableCache.value[key] === undefined) {
    fetchPageData(activeBuoy.value, tab, pages.value[key] ?? 1)
  }
})

onMounted(() => {
  fetchPageData(activeBuoy.value, activeTab.value, 1)
})
</script>

<template>
  <div class="buoy-page">
    <div class="page-header">
      <div class="page-title">
        浮标历史数据
      </div>

      <div class="controls">
        <div class="selector-wrap">
          <button
            v-for="buoy in buoyOptions"
            :key="buoy.key"
            class="switch-btn buoy-btn"
            :class="{ active: activeBuoy === buoy.key }"
            @click="activeBuoy = buoy.key"
          >
            <span class="buoy-name">{{ buoy.label }}</span>
            <span class="buoy-code">{{ buoy.code }}</span>
          </button>
        </div>

        <div class="selector-wrap" v-if="tabOptions.length > 0">
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
.buoy-page {
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

.buoy-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-width: 132px;
  text-align: left;
}

.buoy-name {
  font-size: 13px;
  line-height: 1.25;
  white-space: nowrap;
}

.buoy-code {
  font-size: 11px;
  line-height: 1.1;
  color: #94a3b8;
}

.buoy-btn.active .buoy-code {
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
