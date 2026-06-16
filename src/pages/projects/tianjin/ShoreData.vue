<script lang="ts" setup>
import { computed, onMounted, ref, watch } from "vue"
import { formatDateTime } from "@/common/utils/datetime"
import { getShoreMeteoPageData, getShoreNutrientPageData, getShoreWaterPageData } from "./apis"

// ── 序列号（固定岸基站 SN） ──
const SN = "001"
const PAGE_SIZE = 20

// ── Tab 切换 ──
type TabKey = "meteo" | "water" | "nutrient"
const activeTab = ref<TabKey>("meteo")

const tabs: { key: TabKey, label: string, color: string }[] = [
  { key: "meteo", label: "水文与气象", color: "#3b82f6" },
  { key: "water", label: "水质", color: "#10b981" },
  { key: "nutrient", label: "营养盐", color: "#f59e0b" }
]

// ── 分页状态（每个 tab 独立维护） ──
const pages = ref<Record<TabKey, number>>({ meteo: 1, water: 1, nutrient: 1 })
const totals = ref<Record<TabKey, number>>({ meteo: 0, water: 0, nutrient: 0 })

// ── 数据 ──
const loading = ref(false)

const meteoList = ref<[]>([])
const waterList = ref<[]>([])
const nutrientList = ref<[]>([])

const currentTotal = computed(() => totals.value[activeTab.value])

// ── 格式化工具 ──
function fmt(val: number | null | undefined, decimals = 1): string {
  if (val === null || val === undefined) return "—"
  return val.toFixed(decimals)
}

// 数据请求, 水文与气象
async function fetchMeteo(page: number) {
  loading.value = true
  try {
    const res = await getShoreMeteoPageData(SN, page, PAGE_SIZE)
    meteoList.value = res.data?.items ?? []
    totals.value.meteo = res.data?.total ?? 0
  } catch (e) {
    console.error("获取水文气象数据失败", e)
  } finally {
    loading.value = false
  }
}
// 数据请求, 水质
async function fetchWater(page: number) {
  loading.value = true
  try {
    const res = await getShoreWaterPageData(SN, page, PAGE_SIZE)
    waterList.value = res.data?.items ?? []
    totals.value.water = res.data?.total ?? 0
  } catch (e) {
    console.error("获取水质数据失败", e)
  } finally {
    loading.value = false
  }
}
// 数据请求, 营养盐
async function fetchNutrient(page: number) {
  loading.value = true
  try {
    const res = await getShoreNutrientPageData(SN, page, PAGE_SIZE)
    nutrientList.value = res.data?.items ?? []
    totals.value.nutrient = res.data?.total ?? 0
  } catch (e) {
    console.error("获取营养盐数据失败", e)
  } finally {
    loading.value = false
  }
}

function loadCurrent(page?: number) {
  const p = page ?? pages.value[activeTab.value]
  pages.value[activeTab.value] = p
  if (activeTab.value === "meteo") fetchMeteo(p)
  else if (activeTab.value === "water") fetchWater(p)
  else fetchNutrient(p)
}

function onPageChange(page: number) {
  pages.value[activeTab.value] = page
  loadCurrent(page)
}

// ── tab 切换时加载数据（若还没有数据） ──
watch(activeTab, (tab) => {
  if (tab === "meteo" && meteoList.value.length === 0) fetchMeteo(pages.value.meteo)
  if (tab === "water" && waterList.value.length === 0) fetchWater(pages.value.water)
  if (tab === "nutrient" && nutrientList.value.length === 0) fetchNutrient(pages.value.nutrient)
})

onMounted(() => fetchMeteo(1))
</script>

<template>
  <div class="shore-page">
    <!-- ── 顶部标题栏 ── -->
    <div class="page-header">
      <div class="page-title">
        岸基站历史数据
        <span class="title-sn">SN: {{ SN }}</span>
      </div>

      <!-- 分段控件 -->
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

    <!-- ── 表格主体 ── -->
    <div class="table-wrapper" v-loading="loading">
      <!-- 水文与气象 -->
      <template v-if="activeTab === 'meteo'">
        <el-table
          :data="meteoList"
          class="data-table"
          stripe
          height="100%"
          empty-text="暂无数据"
        >
          <el-table-column prop="sampleTime" label="采样时间" min-width="165">
            <template #default="{ row }">
              {{ formatDateTime(row.sampleTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="receiveTime" label="接收时间" min-width="165">
            <template #default="{ row }">
              {{ formatDateTime(row.receiveTime) }}
            </template>
          </el-table-column>
          <el-table-column label="风速 (m/s)" min-width="100" align="right">
            <template #default="{ row }">
              {{ fmt(row.windSpd) }}
            </template>
          </el-table-column>
          <el-table-column label="风向 (°)" min-width="90" align="right">
            <template #default="{ row }">
              {{ fmt(row.windDir, 0) }}
            </template>
          </el-table-column>
          <el-table-column label="气温 (°C)" min-width="95" align="right">
            <template #default="{ row }">
              {{ fmt(row.airTemp) }}
            </template>
          </el-table-column>
          <el-table-column label="湿度 (%RH)" min-width="100" align="right">
            <template #default="{ row }">
              {{ fmt(row.rh, 0) }}
            </template>
          </el-table-column>
          <el-table-column label="气压 (hPa)" min-width="100" align="right">
            <template #default="{ row }">
              {{ fmt(row.pressure) }}
            </template>
          </el-table-column>
          <el-table-column label="降雨 (mm)" min-width="100" align="right">
            <template #default="{ row }">
              {{ fmt(row.rain) }}
            </template>
          </el-table-column>
          <el-table-column label="潮位 (m)" min-width="90" align="right">
            <template #default="{ row }">
              {{ fmt(row.tideLevel) }}
            </template>
          </el-table-column>
          <el-table-column label="水温 (°C)" min-width="90" align="right">
            <template #default="{ row }">
              {{ fmt(row.waterTemp) }}
            </template>
          </el-table-column>
          <el-table-column label="盐度 (psu)" min-width="100" align="right">
            <template #default="{ row }">
              {{ fmt(row.salinity) }}
            </template>
          </el-table-column>
          <el-table-column label="波向 (°)" min-width="90" align="right">
            <template #default="{ row }">
              {{ fmt(row.waveDir, 0) }}
            </template>
          </el-table-column>
          <el-table-column label="波高 (m)" min-width="90" align="right">
            <template #default="{ row }">
              {{ fmt(row.waveHeight) }}
            </template>
          </el-table-column>
          <el-table-column label="波周期 (s)" min-width="100" align="right">
            <template #default="{ row }">
              {{ fmt(row.wavePeriod) }}
            </template>
          </el-table-column>
          <el-table-column prop="uploadChannel" label="上传通道" min-width="90" align="center" />
        </el-table>
      </template>

      <!-- 水质 -->
      <template v-else-if="activeTab === 'water'">
        <el-table
          :data="waterList"
          class="data-table"
          stripe
          height="100%"
          empty-text="暂无数据"
        >
          <el-table-column prop="sampleTime" label="采样时间" min-width="165">
            <template #default="{ row }">
              {{ formatDateTime(row.sampleTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="receiveTime" label="接收时间" min-width="165">
            <template #default="{ row }">
              {{ formatDateTime(row.receiveTime) }}
            </template>
          </el-table-column>
          <el-table-column label="COD (mg/L)" min-width="110" align="right">
            <template #default="{ row }">
              {{ fmt(row.cod) }}
            </template>
          </el-table-column>
          <el-table-column label="TOC (mg/L)" min-width="110" align="right">
            <template #default="{ row }">
              {{ fmt(row.toc) }}
            </template>
          </el-table-column>
          <el-table-column label="油含量 (mg/L)" min-width="120" align="right">
            <template #default="{ row }">
              {{ fmt(row.oil) }}
            </template>
          </el-table-column>
          <el-table-column label="水温 (°C)" min-width="95" align="right">
            <template #default="{ row }">
              {{ fmt(row.waterTemp) }}
            </template>
          </el-table-column>
          <el-table-column label="盐度 (psu)" min-width="100" align="right">
            <template #default="{ row }">
              {{ fmt(row.salinity) }}
            </template>
          </el-table-column>
          <el-table-column label="pH" min-width="80" align="right">
            <template #default="{ row }">
              {{ fmt(row.ph, 2) }}
            </template>
          </el-table-column>
          <el-table-column label="溶解氧 (mg/L)" min-width="125" align="right">
            <template #default="{ row }">
              {{ fmt(row.do) }}
            </template>
          </el-table-column>
          <el-table-column label="浊度 (NTU)" min-width="110" align="right">
            <template #default="{ row }">
              {{ fmt(row.turb) }}
            </template>
          </el-table-column>
          <el-table-column prop="uploadChannel" label="上传通道" min-width="90" align="center" />
        </el-table>
      </template>

      <!-- 营养盐 -->
      <template v-else>
        <el-table
          :data="nutrientList"
          class="data-table"
          stripe
          height="100%"
          empty-text="暂无数据"
        >
          <el-table-column prop="sampleTime" label="采样时间" width="165">
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
        </el-table>
      </template>
    </div>

    <!-- ── 分页栏 ── -->
    <div class="pagination-bar">
      <el-pagination
        v-model:current-page="pages[activeTab]"
        :page-size="PAGE_SIZE"
        :total="currentTotal"
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
  box-sizing: border-box;
}

// ── 标题栏 ──
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.title-sn {
  font-size: 12px;
  font-weight: 400;
  color: #94a3b8;
  margin-left: 4px;
}

// ── 分段控件 ──
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
}

// ── 分页栏 ──
.pagination-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 12px 0;
  flex-shrink: 0;
}
</style>
