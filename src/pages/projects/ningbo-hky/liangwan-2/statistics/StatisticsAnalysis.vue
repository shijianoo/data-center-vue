<script setup lang="ts">
import type { DataRateResult } from "../types"
import { Download } from "@element-plus/icons-vue"
import dayjs from "dayjs"
import { ElMessage } from "element-plus"
import { computed, onMounted, ref, watch } from "vue"
import { useUserStore } from "@/pinia/stores/user"
import { exportDataRates, getApiErrorMessage, getDataRates } from "../apis"
import { useProjectOptions } from "../composables/useProjectOptions"
import { displayRate, filterVisibleParameterGroups, getDefaultDateRange, toDayEndIso, toDayStartIso } from "../utils"

const { stations, stationGroups, loadStations, loadStationGroups, stationById } = useProjectOptions()
const userStore = useUserStore()

const stationId = ref<number | "">("")
const groupId = ref<number | "">("")
const dateRange = ref<[Date, Date]>(getDefaultDateRange(24 * 30))
const excludeMaintenancePeriods = ref(true)
const rows = ref<DataRateResult[]>([])
const loading = ref(false)
const exportLoading = ref(false)

const selectedStation = computed(() => typeof stationId.value === "number" ? stationById.value.get(stationId.value) : undefined)

/** 根据用户身份过滤后可展示的参数组 */
const filteredStationGroups = computed(() => filterVisibleParameterGroups(stationGroups.value, userStore.isPlatformUser))

watch(stationId, async (value) => {
  groupId.value = ""
  rows.value = []
  await loadStationGroups(typeof value === "number" ? value : undefined)
  if (filteredStationGroups.value[0]) {
    groupId.value = filteredStationGroups.value[0].id
    await search()
  }
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
      stationId: selectedStation.value.id,
      parameterGroupId: groupId.value,
      from: toDayStartIso(dateRange.value[0]),
      to: toDayEndIso(dateRange.value[1]),
      calculationMode: "Direct",
      excludeMaintenancePeriods: excludeMaintenancePeriods.value
    })
    rows.value = data ?? []
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "统计数据加载失败"))
  } finally {
    loading.value = false
  }
}

/** 导出当前选择站点下的参数组统计 Excel 文件 */
async function exportData() {
  if (!selectedStation.value || !groupId.value) {
    ElMessage.warning("请选择站点和参数组")
    return
  }
  exportLoading.value = true
  try {
    const stationName = selectedStation.value.name || "站点"
    const currentGroup = filteredStationGroups.value.find(g => g.id === groupId.value)
    const groupName = currentGroup?.name || "参数组"
    const startDate = dayjs(dateRange.value[0]).format("YYYY-MM-DD")
    const endDate = dayjs(dateRange.value[1]).format("YYYY-MM-DD")
    const fileName = `${stationName}_${startDate}_${endDate}_${groupName}_统计信息`

    const response = await exportDataRates({
      stationId: selectedStation.value.id,
      parameterGroupId: Number(groupId.value),
      from: toDayStartIso(dateRange.value[0]),
      to: toDayEndIso(dateRange.value[1]),
      calculationMode: "Direct",
      excludeMaintenancePeriods: excludeMaintenancePeriods.value,
      fileName
    })

    const url = URL.createObjectURL(response.data)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `${fileName}.xlsx`
    anchor.click()
    URL.revokeObjectURL(url)
    ElMessage.success("导出文件下载成功")
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "统计导出失败"))
  } finally {
    exportLoading.value = false
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
      <el-form inline @submit.prevent="search">
        <el-form-item label="站点">
          <el-select v-model="stationId" filterable placeholder="请选择站点" style="width: 210px">
            <el-option v-for="station in stations" :key="station.id" :label="station.name" :value="station.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="参数组">
          <el-select v-model="groupId" placeholder="请选择参数组" style="width: 180px">
            <el-option v-for="group in filteredStationGroups" :key="group.id" :label="group.name" :value="group.id" />
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
          <el-button :icon="Download" :loading="exportLoading" @click="exportData">
            导出统计
          </el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="lw2-content statistics-table">
      <div class="lw2-page-title">
        <h2>数据质量统计</h2>
        <el-tag>{{ selectedStation?.name || '未选择站点' }}</el-tag>
      </div>
      <el-table v-loading="loading" :data="rows" height="100%" empty-text="请选择条件并开始统计">
        <el-table-column label="参数" min-width="180" fixed>
          <template #default="scope">
            {{ scope.row.parameter.name }}
          </template>
        </el-table-column>
        <el-table-column prop="expectedCount" label="应收数据量" align="right" min-width="110" />
        <el-table-column prop="receivedCount" label="实收数据量" align="right" min-width="110" />
        <el-table-column prop="validCount" label="有效数据量" align="right" min-width="110" />
        <el-table-column prop="missingCount" label="缺失数据量" align="right" min-width="110" />
        <el-table-column prop="duplicateCount" label="重复数据量" align="right" min-width="110" />
        <el-table-column label="获取率" align="center" min-width="110">
          <template #default="scope">
            <el-tag :type="scope.row.acquisitionRate >= 0.9 ? 'success' : 'warning'">
              {{ displayRate(scope.row.acquisitionRate) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="有效率" align="center" min-width="110">
          <template #default="scope">
            <el-tag :type="scope.row.validityRate >= 0.9 ? 'success' : 'danger'">
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
