<script setup lang="ts">
import type { Granularity, MeasurementSeriesResult } from "../types"
import { LineChart } from "echarts/charts"
import { DataZoomComponent, GridComponent, LegendComponent, TitleComponent, ToolboxComponent, TooltipComponent } from "echarts/components"
import * as echarts from "echarts/core"
import { CanvasRenderer } from "echarts/renderers"
import { ElMessage } from "element-plus"
import { computed, onMounted, ref, watch } from "vue"
import VChart from "vue-echarts"
import { getApiErrorMessage, queryMeasurementSeries } from "../apis"
import QueryFilter from "../components/QueryFilter.vue"
import { getLatestGroupDayRange, useProjectOptions } from "../composables/useProjectOptions"
import { getDefaultDateRange, toDayEndIso, toDayStartIso } from "../utils"

echarts.use([CanvasRenderer, LineChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent, DataZoomComponent, ToolboxComponent])

const { stations, stationGroups, loadStations, loadStationGroups, stationById } = useProjectOptions()
const stationId = ref("")
const groupId = ref("")
const dateRange = ref<[Date, Date]>(getDefaultDateRange(24 * 7))
const granularity = ref<Granularity>("Raw")
const result = ref<MeasurementSeriesResult>()
const selectedCode = ref("")
const loading = ref(false)

watch(stationId, async (value) => {
  const station = stationById.value.get(value)
  const groups = await loadStationGroups(station?.mn)
  if (stationId.value !== value) return
  const defaultGroupId = groups[0]?.id || ""
  groupId.value = defaultGroupId
  result.value = undefined
  selectedCode.value = ""
  if (!station || !defaultGroupId) return
  loading.value = true
  try {
    const range = await getLatestGroupDayRange(station.mn, defaultGroupId)
    if (stationId.value !== value || groupId.value !== defaultGroupId) return
    dateRange.value = range
    await search()
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "参数组最新数据时间加载失败"))
  } finally {
    loading.value = false
  }
})

/** 当前选择的数值参数列。 */
const selectedColumn = computed(() => result.value?.columns.find(item => item.code === selectedCode.value))

/** 将紧凑二维数组按列下标转换为 ECharts 时间序列。 */
const chartOption = computed(() => {
  const columnIndex = result.value?.columns.findIndex(item => item.code === selectedCode.value) ?? -1
  const column = selectedColumn.value
  return {
    title: { text: column ? `${column.name}历史曲线` : "历史曲线", left: 12, textStyle: { fontSize: 16 } },
    tooltip: { trigger: "axis", valueFormatter: (value: unknown) => `${value ?? "—"}${column?.unit || ""}` },
    toolbox: { right: 16, feature: { saveAsImage: { title: "保存图片" }, dataZoom: { title: { zoom: "区域缩放", back: "缩放还原" } }, restore: { title: "还原" } } },
    grid: { left: 65, right: 30, top: 65, bottom: 75 },
    xAxis: { type: "time", name: "时间" },
    yAxis: { type: "value", name: column?.unit || "数值", scale: true },
    dataZoom: [{ type: "inside" }, { type: "slider", bottom: 18 }],
    series: [{
      name: column?.name || "参数",
      type: "line",
      smooth: true,
      showSymbol: false,
      connectNulls: false,
      areaStyle: { opacity: 0.08 },
      data: columnIndex < 0 ? [] : (result.value?.rows ?? []).map(row => [row[0], row[columnIndex + 1]])
    }]
  }
})

/** 查询参数组中的数值序列，响应后默认展示第一列。 */
async function search() {
  if (!stationId.value || !groupId.value) {
    ElMessage.warning("请选择站点和参数组")
    return
  }
  loading.value = true
  try {
    const { data } = await queryMeasurementSeries({
      stationId: stationId.value,
      parameterGroupId: groupId.value,
      parameterDefinitionIds: null,
      from: toDayStartIso(dateRange.value[0]),
      to: toDayEndIso(dateRange.value[1]),
      granularity: granularity.value
    })
    result.value = data
    if (!data.columns.some(item => item.code === selectedCode.value)) selectedCode.value = data.columns[0]?.code || ""
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "曲线查询失败"))
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
  <div class="lw2-full-height">
    <QueryFilter
      v-model:station-id="stationId"
      v-model:group-id="groupId"
      v-model:date-range="dateRange"
      v-model:granularity="granularity"
      :stations="stations"
      :groups="stationGroups"
      :loading="loading"
      @search="search"
    />
    <section class="lw2-content chart-area">
      <div class="parameter-picker">
        <span>显示参数</span>
        <el-radio-group v-model="selectedCode" size="small">
          <el-radio-button v-for="column in result?.columns" :key="column.code" :value="column.code">
            {{ column.name }}
          </el-radio-button>
        </el-radio-group>
      </div>
      <VChart v-if="result?.columns.length" v-loading="loading" autoresize :option="chartOption" class="chart" />
      <el-empty v-else v-loading="loading" description="请选择条件查询历史曲线" />
    </section>
  </div>
</template>

<style scoped lang="scss">
@use "../styles.scss";
.chart-area {
  flex: 1;
  height: auto;
  min-height: 0;
}
.parameter-picker {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 32px;
  overflow-x: auto;
  color: var(--el-text-color-regular);
  font-size: 13px;
}
.parameter-picker > span {
  flex-shrink: 0;
  font-weight: 600;
}
.chart {
  flex: 1;
  min-height: 0;
  width: 100%;
  height: auto;
}
</style>
