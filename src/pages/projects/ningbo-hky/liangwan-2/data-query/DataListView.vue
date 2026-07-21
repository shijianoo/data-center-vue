<script setup lang="ts">
import type { Granularity, MeasurementCell, MeasurementColumn, MeasurementQueryResult } from "../types"
import { Download } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { computed, onMounted, ref, watch } from "vue"
import { useUserStore } from "@/pinia/stores/user"
import { exportMeasurements, getApiErrorMessage, queryMeasurements, updateEffectiveValue } from "../apis"
import QueryFilter from "../components/QueryFilter.vue"
import { getLatestGroupDayRange, useProjectOptions } from "../composables/useProjectOptions"
import { autoReviewLabels, autoReviewTagType, displayMeasurementValue, displayParameterLabel, displayTime, getDefaultDateRange, toDayEndIso, toDayStartIso } from "../utils"

const { stations, stationGroups, loadStations, loadStationGroups, stationById } = useProjectOptions()
const userStore = useUserStore()
const stationId = ref("")
const groupId = ref("")
const dateRange = ref<[Date, Date]>(getDefaultDateRange())
const granularity = ref<Granularity>("Raw")
const result = ref<MeasurementQueryResult>()
const loading = ref(false)
const exporting = ref(false)
const detailVisible = ref(false)
const detailCell = ref<MeasurementCell>()
const detailColumn = ref<MeasurementColumn>()
const correctionValue = ref("")
const correctionSaving = ref(false)

/** 表格时间列加动态参数列，参数列宽度适合展示状态和样本数。 */
const columns = computed(() => result.value?.columns ?? [])

watch(stationId, async (value) => {
  const station = stationById.value.get(value)
  const groups = await loadStationGroups(station?.mn)
  if (stationId.value !== value) return
  const defaultGroupId = groups[0]?.id || ""
  groupId.value = defaultGroupId
  result.value = undefined
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

/** 组装所有查询/导出共用的请求体。 */
function buildRequest() {
  if (!stationId.value || !groupId.value) {
    ElMessage.warning("请选择站点和参数组")
    return null
  }
  return {
    stationId: stationId.value,
    parameterGroupId: groupId.value,
    parameterDefinitionIds: null,
    from: toDayStartIso(dateRange.value[0]),
    to: toDayEndIso(dateRange.value[1]),
    granularity: granularity.value
  }
}

/** 查询时间对齐数据表。 */
async function search() {
  const request = buildRequest()
  if (!request) return
  loading.value = true
  try {
    const { data } = await queryMeasurements(request)
    result.value = data
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "数据查询失败"))
  } finally {
    loading.value = false
  }
}

/** 只有平台管理员可以修正带 pointId 的原始数据，聚合值不能直接修改。 */
function canCorrect(cell: MeasurementCell | null) {
  return Boolean(userStore.isPlatformAdmin && granularity.value === "Raw" && cell?.pointId)
}

/** 管理员点击原始数据单元格后打开数据修正对话框。 */
function showCellDetail(column: MeasurementColumn, cell: MeasurementCell | null) {
  if (!canCorrect(cell) || !cell) return
  detailColumn.value = column
  detailCell.value = cell
  correctionValue.value = cell.valueText ?? cell.numericValue?.toString() ?? ""
  detailVisible.value = true
}

/** 直接修改有效值；该作弊修改不会重新执行自动审核，提交前必须二次确认。 */
async function submitCorrection() {
  if (!userStore.isPlatformAdmin || !detailCell.value?.pointId) return
  if (!correctionValue.value.trim()) {
    ElMessage.warning("请输入修正后的有效值")
    return
  }
  try {
    await ElMessageBox.confirm(
      "该操作会直接修改数据有效值，且不会重新执行自动审核。确认继续？",
      "管理员数据修正确认",
      { type: "error", confirmButtonText: "确认修正", cancelButtonText: "取消" }
    )
  } catch {
    return
  }
  correctionSaving.value = true
  try {
    await updateEffectiveValue(detailCell.value.pointId, correctionValue.value.trim())
    ElMessage.success("数据有效值已修正")
    detailVisible.value = false
    await search()
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "数据修正失败"))
  } finally {
    correctionSaving.value = false
  }
}

/** 安全解析后端保存的自动审核结果 JSON。 */
function parseReviewResults(json?: string) {
  if (!json) return []
  try {
    const parsed = JSON.parse(json)
    return Array.isArray(parsed) ? parsed : [parsed]
  } catch {
    return [{ message: json }]
  }
}

/** 未通过和规则异常需要在单元格中用浅色背景及警告图标提醒。 */
function isAutoReviewWarning(cell: MeasurementCell | null) {
  return cell?.autoReviewStatus === "Failed" || cell?.autoReviewStatus === "Error"
}

/** 动态计算表格单元格的 class，用于显示告警背景色和可修正样式 */
function getCellClassName({ row, column }: { row: any, column: any }) {
  if (!column.property) return ""
  const cell = row.values?.[column.property]
  if (!cell) return ""

  const classes = []
  if (isAutoReviewWarning(cell)) {
    classes.push("measurement-cell--warning")
  }
  if (canCorrect(cell)) {
    classes.push("is-correctable")
  }
  return classes.join(" ")
}

/** 单元格点击事件，用于触发管理员修正 */
function handleCellClick(row: any, column: any) {
  if (!column.property) return
  const colDef = columns.value.find(c => c.code === column.property)
  const cell = row.values?.[column.property]
  if (colDef && cell) {
    showCellDetail(colDef, cell)
  }
}

/** 调用流式导出接口并使用后端文件名下载。 */
async function exportFile() {
  const request = buildRequest()
  if (!request) return
  exporting.value = true
  try {
    const response = await exportMeasurements({ ...request, fileName: `${stationById.value.get(stationId.value)?.mn || "station"}-data` })
    const disposition = response.headers["content-disposition"] as string | undefined
    const fileName = decodeURIComponent(disposition?.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)/i)?.[1] || "监测数据.xlsx")
    const url = URL.createObjectURL(response.data)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = fileName
    anchor.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "数据导出失败"))
  } finally {
    exporting.value = false
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
      :show-auto-review-legend="true"
      @search="search"
    >
      <template #actions>
        <el-button :icon="Download" :loading="exporting" @click="exportFile">
          导出
        </el-button>
      </template>
    </QueryFilter>

    <section class="lw2-content">
      <el-table v-loading="loading" :data="result?.rows || []" height="100%" empty-text="请选择条件并查询" :cell-class-name="getCellClassName" @cell-click="handleCellClick">
        <el-table-column fixed prop="time" label="数据时间" width="170">
          <template #default="scope">
            {{ displayTime(scope.row.time) }}
          </template>
        </el-table-column>
        <el-table-column v-for="column in columns" :key="column.code" :prop="column.code" :label="displayParameterLabel(column)" align="left" width="150">
          <template #default="scope">
            <div v-if="scope.row.values[column.code]" class="cell-value">
              {{ displayMeasurementValue(scope.row.values[column.code], column) }}
            </div>
            <span v-else class="empty-cell">—</span>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <el-dialog v-if="userStore.isPlatformAdmin" v-model="detailVisible" :title="`${detailColumn?.name || ''} 数据修正`" width="600px">
      <el-descriptions v-if="detailCell" :column="2" border>
        <el-descriptions-item label="当前值">
          {{ detailColumn ? displayMeasurementValue(detailCell, detailColumn) : '—' }} {{ detailColumn?.unit }}
        </el-descriptions-item>
        <el-descriptions-item label="接收时间">
          {{ displayTime(detailCell.receivedAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="自动审核">
          <el-tag :type="autoReviewTagType(detailCell.autoReviewStatus)">
            {{ autoReviewLabels[detailCell.autoReviewStatus || ''] || detailCell.autoReviewStatus || '—' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="人工审核">
          {{ detailCell.manualReview?.currentLevel ? `${detailCell.manualReview.currentLevel} 级` : '未审核' }}
        </el-descriptions-item>
        <el-descriptions-item label="数据点 ID" :span="2">
          {{ detailCell.pointId || '聚合数据无数据点 ID' }}
        </el-descriptions-item>
      </el-descriptions>
      <el-form label-width="100px" class="correction-form">
        <el-form-item label="修正有效值" required>
          <el-input v-model="correctionValue" placeholder="请输入修正后的有效值" />
        </el-form-item>
      </el-form>
      <el-divider content-position="left">
        自动审核结果
      </el-divider>
      <el-empty v-if="!parseReviewResults(detailCell?.autoReviewResultsJson).length" description="暂无规则详情" :image-size="60" />
      <el-collapse v-else>
        <el-collapse-item v-for="(item, index) in parseReviewResults(detailCell?.autoReviewResultsJson)" :key="index" :title="item.ruleName || item.name || `规则 ${index + 1}`">
          <pre class="review-json">{{ JSON.stringify(item, null, 2) }}</pre>
        </el-collapse-item>
      </el-collapse>
      <template #footer>
        <el-button @click="detailVisible = false">
          取消
        </el-button>
        <el-button type="danger" :loading="correctionSaving" @click="submitCorrection">
          确认修正
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
@use "../styles.scss";
.list-notices {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0;
}
.cell-value {
  font-weight: 600;
}
:deep(.measurement-cell--warning) {
  background-color: rgba(230, 162, 60, 0.14) !important;
}
:deep(.is-correctable) {
  cursor: pointer;
}
:deep(.is-correctable:hover) {
  box-shadow: inset 0 0 0 1px rgba(245, 108, 108, 0.55) !important;
  background-color: rgba(245, 108, 108, 0.12) !important;
}
.cell-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 20px;
  margin-top: 3px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
}
.empty-cell {
  color: var(--el-text-color-placeholder);
}
.review-json {
  max-height: 280px;
  padding: 10px;
  overflow: auto;
  font-size: 12px;
  background: #f5f7fa;
  border-radius: 0;
  white-space: pre-wrap;
}
.correction-form {
  margin-top: 16px;
}
</style>
