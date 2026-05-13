<script lang="ts" setup>
import { computed, onMounted, ref, watch } from "vue"
import { formatDateTime } from "@/common/utils/datetime"
import { getBuoyMeteoPageData, getBuoyNutrientPageData, getBuoyWaterPageData } from "./apis"

// ── 浮标选择 ──
type BuoyKey = "001" | "002"
const activeBuoy = ref<BuoyKey>("001")

const buoys: { key: BuoyKey, label: string }[] = [
  { key: "001", label: "1号浮标" },
  { key: "002", label: "2号浮标" }
]

// ── Tab 切换 ──
type TabKey = "meteo" | "water" | "nutrient"
const activeTab = ref<TabKey>("meteo")

const tabs: { key: TabKey, label: string, color: string }[] = [
  { key: "meteo", label: "水文与气象", color: "#3b82f6" },
  { key: "water", label: "水质", color: "#10b981" },
  { key: "nutrient", label: "营养盐", color: "#f59e0b" }
]

const PAGE_SIZE = 20

// ── 分页状态（按浮标+类型组合独立维护） ──
type PageKey = `${BuoyKey}_${TabKey}`
function makePageKey(buoy: BuoyKey, tab: TabKey): PageKey {
  return `${buoy}_${tab}`
}

const pages = ref<Record<string, number>>({})
const totals = ref<Record<string, number>>({})

function getPage(): number {
  const k = makePageKey(activeBuoy.value, activeTab.value)
  return pages.value[k] ?? 1
}
function setPage(v: number) {
  pages.value[makePageKey(activeBuoy.value, activeTab.value)] = v
}
function getTotal(): number {
  return totals.value[makePageKey(activeBuoy.value, activeTab.value)] ?? 0
}

// ── 数据 ──
const loading = ref(false)

// 用 buoy+tab 组合做 key 缓存各组数据
const meteoCache = ref<Record<string, []>>({})
const waterCache = ref<Record<string, []>>({})
const nutrientCache = ref<Record<string, []>>({})

const currentMeteo = computed<[]>(() =>
  meteoCache.value[makePageKey(activeBuoy.value, "meteo")] ?? []
)
const currentWater = computed<[]>(() =>
  waterCache.value[makePageKey(activeBuoy.value, "water")] ?? []
)
const currentNutrient = computed<[]>(() =>
  nutrientCache.value[makePageKey(activeBuoy.value, "nutrient")] ?? []
)

// ── 格式化 ──
function fmt(val: number | null | undefined, decimals = 1): string {
  if (val === null || val === undefined) return "—"
  return val.toFixed(decimals)
}

// 数据请求, 水文与气象
async function fetchMeteo(sn: BuoyKey, page: number) {
  loading.value = true
  try {
    const res = await getBuoyMeteoPageData(sn, page, PAGE_SIZE)
    meteoCache.value[makePageKey(sn, "meteo")] = res.data?.items ?? []
    totals.value[makePageKey(sn, "meteo")] = res.data?.total ?? 0
  } catch (e) {
    console.error("获取浮标水文气象数据失败", e)
  } finally {
    loading.value = false
  }
}
// 数据请求, 水质
async function fetchWater(sn: BuoyKey, page: number) {
  loading.value = true
  try {
    const res = await getBuoyWaterPageData(sn, page, PAGE_SIZE)
    waterCache.value[makePageKey(sn, "water")] = res.data?.items ?? []
    totals.value[makePageKey(sn, "water")] = res.data?.total ?? 0
  } catch (e) {
    console.error("获取浮标水质数据失败", e)
  } finally {
    loading.value = false
  }
}
// 数据请求, 营养盐
async function fetchNutrient(sn: BuoyKey, page: number) {
  loading.value = true
  try {
    const res = await getBuoyNutrientPageData(sn, page, PAGE_SIZE)
    nutrientCache.value[makePageKey(sn, "nutrient")] = res.data?.items ?? []
    totals.value[makePageKey(sn, "nutrient")] = res.data?.total ?? 0
  } catch (e) {
    console.error("获取浮标营养盐数据失败", e)
  } finally {
    loading.value = false
  }
}

function loadCurrent() {
  const sn = activeBuoy.value
  const p = getPage()
  if (activeTab.value === "meteo") fetchMeteo(sn, p)
  else if (activeTab.value === "water") fetchWater(sn, p)
  else fetchNutrient(sn, p)
}

function onPageChange(page: number) {
  setPage(page)
  loadCurrent()
}

// ── 切换浮标或 Tab 时加载数据（未缓存则请求） ──
watch([activeBuoy, activeTab], ([buoy, tab]) => {
  const key = makePageKey(buoy, tab)
  const alreadyLoaded
    = tab === "meteo"
      ? (meteoCache.value[key]?.length ?? 0) > 0
      : tab === "water"
        ? (waterCache.value[key]?.length ?? 0) > 0
        : (nutrientCache.value[key]?.length ?? 0) > 0
  if (!alreadyLoaded) loadCurrent()
})

onMounted(() => fetchMeteo("001", 1))
</script>

<template>
  <div class="buoy-page">
    <!-- ── 顶部标题 + 控件区 ── -->
    <div class="page-header">
      <div class="page-title">
        浮标历史数据
      </div>

      <div class="controls">
        <!-- 浮标选择 -->
        <div class="buoy-selector">
          <button
            v-for="b in buoys"
            :key="b.key"
            class="buoy-btn"
            :class="{ active: activeBuoy === b.key }"
            @click="activeBuoy = b.key"
          >
            {{ b.label }}
          </button>
        </div>

        <!-- 分隔线 -->
        <div class="divider" />

        <!-- 数据类型 Tab -->
        <div class="tab-bar">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="tab-btn"
            :class="{ active: activeTab === tab.key }"
            :style="activeTab === tab.key ? { '--tab-color': tab.color } : {}"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── 表格主体 ── -->
    <div class="table-wrapper" v-loading="loading">
      <!-- 水文与气象 -->
      <template v-if="activeTab === 'meteo'">
        <el-table
          :data="currentMeteo"
          stripe
          size="small"
          height="100%"
          empty-text="暂无数据"
        >
          <el-table-column prop="sampleTime" label="采样时间" width="165" fixed>
            <template #default="{ row }">
              {{ formatDateTime(row.sampleTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="receiveTime" label="接收时间" width="165">
            <template #default="{ row }">
              {{ formatDateTime(row.receiveTime) }}
            </template>
          </el-table-column>
          <el-table-column label="风速 (m/s)" width="100" align="right">
            <template #default="{ row }">
              {{ fmt(row.windSpd) }}
            </template>
          </el-table-column>
          <el-table-column label="风向 (°)" width="90" align="right">
            <template #default="{ row }">
              {{ fmt(row.windDir, 0) }}
            </template>
          </el-table-column>
          <el-table-column label="气温 (°C)" width="95" align="right">
            <template #default="{ row }">
              {{ fmt(row.airTemp) }}
            </template>
          </el-table-column>
          <el-table-column label="湿度 (%RH)" width="100" align="right">
            <template #default="{ row }">
              {{ fmt(row.rh, 0) }}
            </template>
          </el-table-column>
          <el-table-column label="气压 (hPa)" width="100" align="right">
            <template #default="{ row }">
              {{ fmt(row.pressure) }}
            </template>
          </el-table-column>
          <el-table-column label="降雨 (mm)" width="100" align="right">
            <template #default="{ row }">
              {{ fmt(row.rain) }}
            </template>
          </el-table-column>
          <el-table-column label="潮位 (m)" width="90" align="right">
            <template #default="{ row }">
              {{ fmt(row.tideLevel) }}
            </template>
          </el-table-column>
          <el-table-column label="水温 (°C)" width="90" align="right">
            <template #default="{ row }">
              {{ fmt(row.waterTemp) }}
            </template>
          </el-table-column>
          <el-table-column label="盐度 (psu)" width="100" align="right">
            <template #default="{ row }">
              {{ fmt(row.salinity) }}
            </template>
          </el-table-column>
          <el-table-column label="波向 (°)" width="90" align="right">
            <template #default="{ row }">
              {{ fmt(row.waveDir, 0) }}
            </template>
          </el-table-column>
          <el-table-column label="波高 (m)" width="90" align="right">
            <template #default="{ row }">
              {{ fmt(row.waveHeight) }}
            </template>
          </el-table-column>
          <el-table-column label="波周期 (s)" width="100" align="right">
            <template #default="{ row }">
              {{ fmt(row.wavePeriod) }}
            </template>
          </el-table-column>
          <el-table-column prop="uploadChannel" label="上传通道" width="90" align="center" />
        </el-table>
      </template>

      <!-- 水质 -->
      <template v-else-if="activeTab === 'water'">
        <el-table
          :data="currentWater"
          stripe
          size="small"
          height="100%"
          empty-text="暂无数据"
        >
          <el-table-column prop="sampleTime" label="采样时间" width="165" fixed>
            <template #default="{ row }">
              {{ formatDateTime(row.sampleTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="receiveTime" label="接收时间" width="165">
            <template #default="{ row }">
              {{ formatDateTime(row.receiveTime) }}
            </template>
          </el-table-column>
          <el-table-column label="COD (mg/L)" width="110" align="right">
            <template #default="{ row }">
              {{ fmt(row.cod) }}
            </template>
          </el-table-column>
          <el-table-column label="TOC (mg/L)" width="110" align="right">
            <template #default="{ row }">
              {{ fmt(row.toc) }}
            </template>
          </el-table-column>
          <el-table-column label="油含量 (mg/L)" width="120" align="right">
            <template #default="{ row }">
              {{ fmt(row.oil) }}
            </template>
          </el-table-column>
          <el-table-column label="水温 (°C)" width="95" align="right">
            <template #default="{ row }">
              {{ fmt(row.waterTemp) }}
            </template>
          </el-table-column>
          <el-table-column label="盐度 (psu)" width="100" align="right">
            <template #default="{ row }">
              {{ fmt(row.salinity) }}
            </template>
          </el-table-column>
          <el-table-column label="pH" width="80" align="right">
            <template #default="{ row }">
              {{ fmt(row.ph, 2) }}
            </template>
          </el-table-column>
          <el-table-column label="溶解氧 (mg/L)" width="125" align="right">
            <template #default="{ row }">
              {{ fmt(row.do) }}
            </template>
          </el-table-column>
          <el-table-column label="浊度 (NTU)" width="110" align="right">
            <template #default="{ row }">
              {{ fmt(row.turb) }}
            </template>
          </el-table-column>
          <el-table-column prop="uploadChannel" label="上传通道" width="90" align="center" />
        </el-table>
      </template>

      <!-- 营养盐 -->
      <template v-else>
        <el-table
          :data="currentNutrient"
          stripe
          size="small"
          height="100%"
          empty-text="暂无数据"
        >
          <el-table-column prop="sampleTime" label="采样时间" width="165" fixed>
            <template #default="{ row }">
              {{ formatDateTime(row.sampleTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="receiveTime" label="接收时间" width="165">
            <template #default="{ row }">
              {{ formatDateTime(row.receiveTime) }}
            </template>
          </el-table-column>
          <el-table-column label="亚硝酸盐 (μmol/L)" width="160" align="right">
            <template #default="{ row }">
              {{ fmt(row.nitrite) }}
            </template>
          </el-table-column>
          <el-table-column label="硝酸盐 (μmol/L)" width="150" align="right">
            <template #default="{ row }">
              {{ fmt(row.nitrate) }}
            </template>
          </el-table-column>
          <el-table-column label="磷酸盐 (μmol/L)" width="150" align="right">
            <template #default="{ row }">
              {{ fmt(row.phosphate) }}
            </template>
          </el-table-column>
          <el-table-column label="硅酸盐 (μmol/L)" width="150" align="right">
            <template #default="{ row }">
              {{ fmt(row.silicate) }}
            </template>
          </el-table-column>
          <el-table-column label="氨氮 (μmol/L)" width="140" align="right">
            <template #default="{ row }">
              {{ fmt(row.ammoniaNitrogen) }}
            </template>
          </el-table-column>
          <el-table-column prop="uploadChannel" label="上传通道" width="90" align="center" />
        </el-table>
      </template>
    </div>

    <!-- ── 分页栏 ── -->
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
  color: #1e293b;
  font-family: "Inter", "Helvetica Neue", sans-serif;
  box-sizing: border-box;
}

// ── 标题栏 ──
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 14px;
  flex-shrink: 0;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

// ── 控件行（浮标选择 + Tab）──
.controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.divider {
  width: 1px;
  height: 24px;
  background: #e2e8f0;
  flex-shrink: 0;
}

// ── 浮标选择器 ──
.buoy-selector {
  display: flex;
  gap: 4px;
  background: #e2e8f0;
  border-radius: 8px;
  padding: 4px;
}

.buoy-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: #334155;
    background: rgba(255, 255, 255, 0.6);
  }

  &.active {
    background: #ffffff;
    color: #0f172a;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
  }
}

// ── 数据类型 Tab ──
.tab-bar {
  display: flex;
  gap: 4px;
  background: #e2e8f0;
  border-radius: 8px;
  padding: 4px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: #334155;
    background: rgba(255, 255, 255, 0.6);
  }

  &.active {
    background: #ffffff;
    color: #0f172a;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
  }
}

// ── 表格容器 ──
.table-wrapper {
  flex: 1;
  min-height: 0;
  overflow: auto;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
}

// ── 分页栏 ──
.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 12px 0;
  flex-shrink: 0;
}
</style>
