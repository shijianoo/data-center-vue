<script lang="ts" setup>
import { computed, onMounted, ref, watch } from "vue"
import { formatDateTime } from "@/common/utils/datetime"
import { getBuoyMeteoPageData, getBuoyNutrientPageData, getBuoyWaterPageData } from "./apis"

// ── 浮标选择 ──
type BuoyKey = "002" | "003"
const activeBuoy = ref<BuoyKey>("002")

const buoys: { key: BuoyKey, label: string }[] = [
  { key: "002", label: "1号浮标" },
  { key: "003", label: "2号浮标" }
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

onMounted(() => fetchMeteo("002", 1))
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
        <el-button type="primary" @click="loadCurrent">
          刷新
        </el-button>
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
          <el-table-column prop="sampleTime" label="采样时间" width="130" fixed>
            <template #default="{ row }">
              {{ formatDateTime(row.sampleTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="receiveTime" label="接收时间" width="130">
            <template #default="{ row }">
              {{ formatDateTime(row.receiveTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="longitude" label="经度" width="100" align="right" />
          <el-table-column prop="latitude" label="纬度" width="100" align="right" />
          <el-table-column prop="batteryVoltage" label="电池电压" width="100" align="right" />
          <el-table-column prop="windSpd" label="风速 (m/s)" width="100" align="right" />
          <el-table-column prop="windDir" label="风向 (°)" width="90" align="right" />
          <el-table-column prop="airTemp" label="气温 (°C)" width="95" align="right" />
          <el-table-column prop="rh" label="湿度 (%RH)" width="100" align="right" />
          <el-table-column prop="pressure" label="气压 (hPa)" width="100" align="right" />
          <el-table-column prop="rain" label="降雨 (mm)" width="100" align="right" />
          <el-table-column prop="visibility" label="能见度" width="90" align="right" />
          <el-table-column prop="azimuth" label="方位" width="90" align="right" />
          <el-table-column prop="waveDir" label="波向 (°)" width="90" align="right" />
          <el-table-column prop="waveHeight" label="波高 (m)" width="90" align="right" />
          <el-table-column prop="wavePeriod" label="波周期 (s)" width="100" align="right" />
          <el-table-column prop="flowSped" label="流速" width="100" align="right" />
          <el-table-column prop="flowDir" label="流向" width="100" align="right" />
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
          <el-table-column prop="cod" label="COD (mg/L)" width="110" align="right" />
          <el-table-column prop="oil" label="水中油" width="110" align="right" />
          <el-table-column prop="cO2" label="二氧化碳" width="110" align="right" />
          <el-table-column prop="waterTemp" label="水温 (°C)" width="95" align="right" />
          <el-table-column prop="salinity" label="盐度 (psu)" width="100" align="right" />
          <el-table-column prop="ph" label="pH" width="80" align="right" />
          <el-table-column prop="do" label="溶解氧 (mg/L)" width="125" align="right" />
          <el-table-column prop="turb" label="浊度 (NTU)" width="110" align="right" />
          <el-table-column prop="chlorophyllA" label="叶绿素a" width="90" align="center" />
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
          <el-table-column prop="nitrite" label="亚硝酸盐" width="160" align="right" />
          <el-table-column prop="nitrate" label="硝酸盐" width="160" align="right" />
          <el-table-column prop="phosphate" label="磷酸盐" width="160" align="right" />
          <el-table-column prop="silicate" label="硅酸盐" width="160" align="right" />
          <el-table-column prop="ammoniaNitrogen" label="氨氮" width="160" align="right" />
          <el-table-column prop="totalNitrogen" label="总氮" width="160" align="right" />
          <el-table-column prop="totalPhosphorus" label="总磷" width="160" align="right" />
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
