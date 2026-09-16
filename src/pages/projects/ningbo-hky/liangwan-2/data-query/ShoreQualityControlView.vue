<script setup lang="ts">
import type { QualityControlDataRecord } from "../types"
import { Search } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import { computed, onMounted, ref, watch } from "vue"
import { getApiErrorMessage, queryQualityControlData } from "../apis"
import { useProjectOptions } from "../composables/useProjectOptions"
import { displayTime, getWholeDayRange, toDayEndIso, toDayStartIso } from "../utils"

const { stations, loadStations } = useProjectOptions()

const stationId = ref<number | "">("")
const dateRange = ref<[Date, Date]>(getWholeDayRange())

const loading = ref(false)
const optionsLoading = ref(false)
const records = ref<QualityControlDataRecord[]>([])

/** 仅展示 MN/编码为 NBA 开头的站点 */
const nbaStations = computed(() => {
  return stations.value.filter((s) => {
    const mn = String(s.code || (s as any).mn || "")
    return mn.toUpperCase().startsWith("NBA")
  })
})

/** 固定的质控指标列定义 */
const METRIC_COLUMNS = [
  { key: "Check", name: "核查值" },
  { key: "StandardValue", name: "标准值" },
  { key: "SpanValue", name: "跨度值" }
]

const COMMAND_CODE_LABELS: Record<string, string> = {
  2065: "低浓度核查数据",
  2066: "高度浓度核查数据"
}

/** 格式化 HJ212 命令编码 */
function displayCommandCode(code?: string | number | null): string {
  if (!code) return "—"
  const str = String(code)
  return COMMAND_CODE_LABELS[str] || str
}

/** 从 row.metrics 对象中根据 key 获取对应的显示值 */
function getMetricValue(row: QualityControlDataRecord, key: string): string {
  if (!row || !row.metrics) return "—"
  const metrics = row.metrics
  if (metrics[key] != null && metrics[key] !== "") {
    return String(metrics[key])
  }
  const lowerKey = key.toLowerCase()
  const foundKey = Object.keys(metrics).find(k => k.toLowerCase() === lowerKey)
  if (foundKey && metrics[foundKey] != null && metrics[foundKey] !== "") {
    return String(metrics[foundKey])
  }
  return "—"
}

/** 站点切换时，自动查询质控数据 */
watch(stationId, async (val) => {
  records.value = []
  if (!val || typeof val !== "number") return
  await search()
})

/** 执行质控数据查询 */
async function search() {
  if (!stationId.value || typeof stationId.value !== "number") {
    ElMessage.warning("请选择站点")
    return
  }
  if (!dateRange.value || dateRange.value.length !== 2) {
    ElMessage.warning("请选择日期范围")
    return
  }

  loading.value = true
  try {
    const { data } = await queryQualityControlData({
      stationId: stationId.value,
      from: toDayStartIso(dateRange.value[0]),
      to: toDayEndIso(dateRange.value[1])
    })
    records.value = data ?? []
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "查询岸基站质控数据失败"))
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  optionsLoading.value = true
  try {
    await loadStations()
    if (nbaStations.value.length > 0) {
      stationId.value = nbaStations.value[0].id
    }
  } finally {
    optionsLoading.value = false
  }
})
</script>

<template>
  <div class="lw2-full-height">
    <el-form inline class="qc-filter-bar" @submit.prevent="search">
      <el-form-item label="站点">
        <el-select
          v-model="stationId"
          filterable
          placeholder="请选择NBA站点"
          style="width: 220px"
          :loading="optionsLoading"
        >
          <el-option
            v-for="item in nbaStations"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          >
            <div class="station-option-item">
              <span class="station-option-name">{{ item.name }}</span>
              <span class="station-option-mn">({{ item.code }})</span>
            </div>
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="时间范围">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          format="YYYY-MM-DD"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          range-separator="至"
          :clearable="false"
        />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" native-type="submit" :icon="Search" :loading="loading">
          查询
        </el-button>
      </el-form-item>
    </el-form>

    <section class="lw2-content">
      <el-table
        v-loading="loading"
        :data="records"
        height="100%"
        stripe
        empty-text="暂无质控数据，请选择站点和时间范围后查询"
      >
        <el-table-column prop="observedAt" label="时间" width="160" align="left">
          <template #default="{ row }">
            {{ displayTime(row.observedAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="parameterName" label="参数" width="180" align="left">
          <template #default="{ row }">
            <span>{{ row.parameterName }}</span>
            <span v-if="row.unit" class="unit-text">({{ row.unit }})</span>
          </template>
        </el-table-column>
        <el-table-column prop="commandCode" label="类型" width="160" align="left">
          <template #default="{ row }">
            {{ displayCommandCode(row.commandCode) }}
          </template>
        </el-table-column>

        <!-- 质控指标列 (固定展示: 核查值、标准值、跨度值) -->
        <el-table-column
          v-for="col in METRIC_COLUMNS"
          :key="col.key"
          :label="col.name"
          min-width="130"
          align="center"
        >
          <template #default="{ row }">
            {{ getMetricValue(row, col.key) }}
          </template>
        </el-table-column>
      </el-table>
    </section>
  </div>
</template>

<style scoped lang="scss">
.qc-filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.station-option-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 12px;
}

.station-option-name {
  font-weight: 500;
}

.station-option-mn {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.unit-text {
  margin-left: 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
