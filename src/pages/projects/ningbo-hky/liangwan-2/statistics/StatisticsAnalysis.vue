<script setup lang="ts">
import type { DataRateItem } from "../types"
import { ElMessage } from "element-plus"
import { computed, onMounted, ref, watch } from "vue"
import { getApiErrorMessage, getDataRates } from "../apis"
import { useProjectOptions } from "../composables/useProjectOptions"
import { displayRate, getDefaultDateRange, toDayEndIso, toDayStartIso } from "../utils"

const { stations, stationGroups, loadStations, loadStationGroups, stationById } = useProjectOptions()
const stationId = ref("")
const groupId = ref("")
const dateRange = ref<[Date, Date]>(getDefaultDateRange(24 * 30))
const excludeMaintenancePeriods = ref(true)
const rows = ref<DataRateItem[]>([])
const loading = ref(false)

const selectedStation = computed(() => stationById.value.get(stationId.value))

watch(stationId, async (value) => {
  groupId.value = ""
  await loadStationGroups(stationById.value.get(value)?.mn)
})

/** 查询参数组内每个参数的应收、实收、有效、缺失与重复指标。 */
async function search() {
  if (!selectedStation.value || !groupId.value) {
    ElMessage.warning("请选择站点和参数组")
    return
  }
  loading.value = true
  try {
    const { data } = await getDataRates({
      mn: selectedStation.value.mn,
      parameterGroupId: groupId.value,
      from: toDayStartIso(dateRange.value[0]),
      to: toDayEndIso(dateRange.value[1]),
      excludeMaintenancePeriods: excludeMaintenancePeriods.value
    })
    rows.value = data ?? []
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "统计数据加载失败"))
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  const list = await loadStations()
  if (list[0]) stationId.value = list[0].id
})
</script>

<template>
  <div class="statistics-page">
    <section class="statistics-filter">
      <div class="lw2-page-title">
        <h2>统计条件</h2>
        <span>获取率 = 实收 / 应收；有效率 = 有效 / 应收</span>
      </div>
      <el-form inline @submit.prevent="search">
        <el-form-item label="站点">
          <el-select v-model="stationId" filterable placeholder="请选择站点" style="width: 210px">
            <el-option v-for="station in stations" :key="station.id" :label="`${station.name}（${station.mn}）`" :value="station.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="参数组">
          <el-select v-model="groupId" placeholder="请选择参数组" style="width: 180px">
            <el-option v-for="group in stationGroups" :key="group.id" :label="group.name" :value="group.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker v-model="dateRange" type="daterange" format="YYYY-MM-DD" :clearable="false" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="excludeMaintenancePeriods">
            跳过大修/维护时段
          </el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit" :loading="loading">
            开始统计
          </el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="lw2-content statistics-table">
      <div class="lw2-page-title">
        <h2>参数数据质量统计</h2>
        <el-tag>{{ selectedStation?.name || '未选择站点' }}</el-tag>
      </div>
      <el-table v-loading="loading" :data="rows" height="100%" empty-text="请选择条件并开始统计">
        <el-table-column label="参数" min-width="180" fixed>
          <template #default="scope">
            <b>{{ scope.row.parameter.name }}</b><small class="parameter-code">{{ scope.row.parameter.code }} · {{ scope.row.parameter.unit || '无单位' }}</small>
          </template>
        </el-table-column>
        <el-table-column prop="expectedCount" label="应收数据量" align="right" min-width="110" />
        <el-table-column prop="receivedCount" label="实收数据量" align="right" min-width="110" />
        <el-table-column prop="validCount" label="有效数据量" align="right" min-width="110" />
        <el-table-column prop="missingCount" label="缺失数据量" align="right" min-width="110" />
        <el-table-column prop="duplicateCount" label="重复数据量" align="right" min-width="110" />
        <el-table-column label="获取率" align="center" min-width="170">
          <template #default="scope">
            <el-progress :percentage="scope.row.acquisitionRate == null ? 0 : Number((scope.row.acquisitionRate * 100).toFixed(2))" :status="scope.row.acquisitionRate >= 0.9 ? 'success' : 'warning'" />
          </template>
        </el-table-column>
        <el-table-column label="有效率" align="center" min-width="170">
          <template #default="scope">
            <el-progress :percentage="scope.row.validityRate == null ? 0 : Number((scope.row.validityRate * 100).toFixed(2))" :status="scope.row.validityRate >= 0.9 ? 'success' : 'exception'" />
          </template>
        </el-table-column>
        <el-table-column label="统计结果" align="center" min-width="100">
          <template #default="scope">
            <el-tag :type="scope.row.acquisitionRate >= 0.9 && scope.row.validityRate >= 0.9 ? 'success' : 'danger'">
              {{ displayRate(scope.row.validityRate) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </section>
  </div>
</template>

<style scoped lang="scss">
@use "../styles.scss";
.statistics-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - var(--header-h));
  min-height: 0;
  box-sizing: border-box;
  padding: 16px;
  overflow: hidden;
  background: #f3f6fa;
}
.statistics-table {
  flex: 1;
  min-height: 0;
}
.statistics-filter {
  padding: 0 0 1px;
  margin-bottom: 16px;
  background: transparent;
  border-bottom: 1px solid var(--el-border-color-light);
  border-radius: 0;
  box-shadow: none;
}
.lw2-page-title > span {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.parameter-code {
  display: block;
  margin-top: 3px;
  color: var(--el-text-color-secondary);
}
</style>
