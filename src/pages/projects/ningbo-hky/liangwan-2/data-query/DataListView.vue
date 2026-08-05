<script setup lang="ts">
import type { EntityId } from "../apis/common/type"
import type { Granularity, MeasurementTableCell, MeasurementTableColumn, MeasurementTableResult } from "../types"
import { Download } from "@element-plus/icons-vue"
import dayjs from "dayjs"
import { ElMessage, ElMessageBox } from "element-plus"
import { computed, onMounted, ref, watch } from "vue"
import { useUserStore } from "@/pinia/stores/user"
import { exportMeasurements, getApiErrorMessage, queryMeasurementAutoReviewResult, queryMeasurements, updateEffectiveValue } from "../apis"
import QueryFilter from "../components/QueryFilter.vue"
import { useProjectOptions } from "../composables/useProjectOptions"
import { autoReviewLabels, autoReviewTagType, displayMeasurementValue, displayParameterLabel, displayTime, getWholeDayRange, toDayEndIso, toDayStartIso } from "../utils"

const { stations, stationGroups, loadStations, loadStationGroups, stationById, groupById } = useProjectOptions()
const userStore = useUserStore()
const stationId = ref<number | "">("")
const groupId = ref<number | "">("")
const dateRange = ref<[Date, Date]>(getWholeDayRange())
const granularity = ref<Granularity>("Raw")
const result = ref<MeasurementTableResult>()
const loading = ref(false)
const exporting = ref(false)
const detailVisible = ref(false)
const detailCell = ref<MeasurementTableCell>()
const detailColumn = ref<MeasurementTableColumn>()
const correctionValue = ref("")
const correctionSaving = ref(false)
const autoReviewLoading = ref(false)
const autoReviewResults = ref<any[]>([])

/** 表格时间列加动态参数列，保证水质等级派生列优先排在数据时间右侧。 */
const columns = computed(() => {
  const list = result.value?.columns ?? []
  const gradeCol = list.find(c => c.code === "waterQualityGrade" || c.isDerived)
  if (!gradeCol) return list
  return [gradeCol, ...list.filter(c => c !== gradeCol)]
})

watch(stationId, async (value) => {
  const station = typeof value === "number" ? stationById.value.get(value) : undefined
  const groups = await loadStationGroups(station?.mn)
  if (stationId.value !== value) return
  const defaultGroupId = groups[0]?.id || ""
  groupId.value = defaultGroupId
  result.value = undefined
  if (!station || !defaultGroupId) return
  dateRange.value = getWholeDayRange()
  await search()
})

/** 组装所有查询/导出共用的请求体。只在参数组名称包含“水质”时带入 includeWaterQualityGrade 为 true。 */
function buildRequest() {
  if (!stationId.value || !groupId.value) {
    ElMessage.warning("请选择站点和参数组")
    return null
  }
  const currentGroup = groupById.value.get(groupId.value) || stationGroups.value.find(g => g.id === groupId.value)
  const isWaterQualityGroup = currentGroup?.name?.includes("水质") ?? false

  return {
    stationId: stationId.value,
    parameterGroupId: groupId.value,
    parameterDefinitionIds: null,
    from: toDayStartIso(dateRange.value[0]),
    to: toDayEndIso(dateRange.value[1]),
    granularity: granularity.value,
    includeWaterQualityGrade: isWaterQualityGroup
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

/** 只有平台用户可以修正带 pointId 的原始数据，聚合值不能直接修改。 */
function canCorrect(cell: MeasurementTableCell | null) {
  return userStore.isPlatformUser && granularity.value === "Raw" && cell?.pointId
}

/** 未通过和规则异常需要在单元格中用浅色背景及警告图标提醒。 */
function isAutoReviewWarning(cell: MeasurementTableCell | null) {
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

// #region 单元格点击事件

/** 单元格点击事件，用于触发管理员修正 */
function handleCellClick(row: any, column: any) {
  if (!column.property) return
  const colDef = columns.value.find(c => c.code === column.property)
  const cell = row.values?.[column.property]
  if (colDef && cell) {
    showCellDetail(colDef, cell)
  }
}

/** 平台用户点击原始数据单元格后打开数据修正对话框。 */
function showCellDetail(column: MeasurementTableColumn, cell: MeasurementTableCell | null) {
  if (!canCorrect(cell) || !cell) return
  detailColumn.value = column
  detailCell.value = cell
  correctionValue.value = cell.valueText ?? cell.numericValue?.toString() ?? ""
  detailVisible.value = true
  if (cell.pointId) {
    loadAutoReviewResult(cell.pointId)
  }
}

/** 单独请求接口获取该数据点的自动审核结果 */
async function loadAutoReviewResult(pointId: EntityId) {
  autoReviewLoading.value = true
  autoReviewResults.value = []
  try {
    const { data } = await queryMeasurementAutoReviewResult(pointId)
    autoReviewResults.value = data?.map(item => item?.message) || []
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "自动审核结果加载失败"))
  } finally {
    autoReviewLoading.value = false
  }
}

/** 直接修改有效值；提交后重新刷新数据与自动审核结果。 */
async function submitCorrection() {
  if (!userStore.isPlatformAdmin || !detailCell.value?.pointId) return
  if (!correctionValue.value.trim()) {
    ElMessage.warning("请输入修正后的有效值")
    return
  }
  try {
    await ElMessageBox.confirm(
      "该操作会直接修改数据有效值，且会重新执行自动审核。确认继续？",
      "管理员数据修正确认",
      { type: "error", confirmButtonText: "确认修正", cancelButtonText: "取消" }
    )
  } catch {
    return
  }
  correctionSaving.value = true
  try {
    const pointId = detailCell.value.pointId
    await updateEffectiveValue(pointId, { effectiveValueText: correctionValue.value.trim(), rerunAutoReview: true })
    ElMessage.success("数据有效值已修正")
    await search()
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "数据修正失败"))
  } finally {
    detailVisible.value = false
    correctionSaving.value = false
  }
}

// #endregion

/** 调用流式导出接口，固定文件名格式：站点名称_开始时间_结束时间_参数分组名称.xlsx。 */
async function exportFile() {
  const request = buildRequest()
  if (!request) return
  exporting.value = true
  try {
    const stationName = (typeof stationId.value === "number" ? stationById.value.get(stationId.value)?.name : undefined) || result.value?.stationName || "站点"
    const currentGroup = (typeof groupId.value === "number" ? groupById.value.get(groupId.value) : undefined) || stationGroups.value.find(g => g.id === groupId.value)
    const groupName = currentGroup?.name || result.value?.parameterGroupName || "参数分组"
    const startDate = dayjs(dateRange.value[0]).format("YYYY-MM-DD")
    const endDate = dayjs(dateRange.value[1]).format("YYYY-MM-DD")
    const fileName = `${stationName}_${startDate}_${endDate}_${groupName}.xlsx`

    const response = await exportMeasurements({ ...request, fileName: fileName.replace(/\.xlsx$/i, "") })
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
        <el-table-column v-for="column in columns" :key="column.code" :prop="column.code" :label="displayParameterLabel(column)" align="left" width="140">
          <template #default="scope">
            <div v-if="scope.row.values[column.code]" class="cell-value">
              {{ displayMeasurementValue(scope.row.values[column.code], column) }}
            </div>
            <span v-else class="empty-cell">—</span>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <el-dialog v-if="userStore.isPlatformUser" v-model="detailVisible" :title="`${detailColumn?.name || ''} 数据修正`" width="600px">
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
      <div v-loading="autoReviewLoading">
        <el-empty v-if="!autoReviewLoading && !autoReviewResults.length" description="暂无规则详情" :image-size="60" />
        <div v-else-if="autoReviewResults.length" class="auto-review-list">
          <el-alert
            v-for="(msg, index) in autoReviewResults"
            :key="index"
            :title="msg"
            type="error"
            :closable="false"
            class="review-alert-item"
          />
        </div>
      </div>
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
.empty-cell {
  color: var(--el-text-color-placeholder);
}
.correction-form {
  margin-top: 16px;
}
.auto-review-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
