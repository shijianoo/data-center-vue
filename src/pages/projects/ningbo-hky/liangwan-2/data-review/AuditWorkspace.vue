<script setup lang="ts">
import type { ManualReviewStatus, MeasurementReviewCell, MeasurementReviewResult, MeasurementTableColumn } from "../types"
import { Check, EditPen } from "@element-plus/icons-vue"
import { getToken } from "@/common/utils/cache/cookies"
import { useUserStore } from "@/pinia/stores/user"
import { getApiErrorMessage, queryMeasurementReview, saveBatchManualReview, saveManualReview } from "../apis"
import QueryFilter from "../components/QueryFilter.vue"
import { useProjectOptions } from "../composables/useProjectOptions"
import { displayMeasurementValue, displayParameterLabel, displayTime, getWholeDayRange, manualReviewLabels, toDayEndIso, toDayStartIso } from "../utils"

const props = defineProps<{
  level: 1 | 2 | 3
}>()

const { stations, stationGroups, loadStations, loadStationGroups, stationById } = useProjectOptions()
const userStore = useUserStore()
const stationId = ref<number | "">("")
const groupId = ref<number | "">("")
const dateRange = ref<[Date, Date]>(getWholeDayRange())
const result = ref<MeasurementReviewResult>()
const loading = ref(false)
const batchLoading = ref(false)
const dialogVisible = ref(false)
const batchDialogVisible = ref(false)
const activeCell = ref<MeasurementReviewCell>()
const activeColumn = ref<MeasurementTableColumn>()

/** 表格复选框选中的行集合 */
const selectedRows = ref<any[]>([])

const form = reactive({
  status: "Valid" as ManualReviewStatus,
  comment: ""
})
const batchForm = reactive({
  status: "Valid" as ManualReviewStatus,
  comment: ""
})

/** 表格时间列加动态参数列。 */
const columns = computed(() => result.value?.columns ?? [])

watch(stationId, async (value) => {
  const station = typeof value === "number" ? stationById.value.get(value) : undefined
  const groups = await loadStationGroups(station?.id)
  if (stationId.value !== value) return
  const defaultGroupId = groups[0]?.id || ""
  groupId.value = defaultGroupId
  result.value = undefined
  dateRange.value = getWholeDayRange()
  await search()
})

/** 组装固定为 Raw 粒度的审核查询，聚合数据没有 pointId，不能人工审核。 */
function buildRequest() {
  if (!stationId.value || !groupId.value) {
    ElMessage.warning("请选择站点和参数分类")
    return null
  }
  return {
    stationId: stationId.value,
    parameterGroupId: groupId.value,
    from: toDayStartIso(dateRange.value[0]),
    to: toDayEndIso(dateRange.value[1]),
    reviewLevel: props.level
  }
}

/** 查询当前站点、参数分类和时间范围内的原始数据。 */
async function search() {
  const request = buildRequest()
  if (!request) return
  loading.value = true
  selectedRows.value = []
  try {
    const { data } = await queryMeasurementReview(request)
    result.value = data
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "审核数据加载失败"))
  } finally {
    loading.value = false
  }
}

function handleSelectionChange(rows: any[]) {
  selectedRows.value = rows
}

/** 判断数据点是否符合可审核/查看条件。 */
function canReview(cell: MeasurementReviewCell | null) {
  return Boolean(cell?.pointId)
}

/** 动态计算表格单元格的 class，根据 reviewStatus 显示对应背景色 */
function getCellClassName({ row, column }: { row: any, column: any }) {
  if (!column.property) return ""
  const cell: MeasurementReviewCell | null = row.values?.[column.property]
  if (!cell) return ""

  const classes = []
  if (!cell.reviewStatus) {
    classes.push("cell-unreviewed")
  } else if (cell.reviewStatus === "Valid") {
    classes.push("cell-reviewed-valid")
  } else {
    classes.push("cell-reviewed-abnormal")
  }

  if (canReview(cell)) {
    classes.push("is-reviewable")
  }
  return classes.join(" ")
}

// #region 单元格点击与人工审核

/** 单元格点击事件，用于触发人工审核 */
function handleCellClick(row: any, column: any) {
  if (!column.property) return
  const colDef = columns.value.find(c => c.code === column.property)
  const cell = row.values?.[column.property]
  if (colDef && cell) {
    openReview(colDef, cell)
  }
}

/** 打开单点审核对话框，自动带出当前数据点的审核结论。审核意见默认为空。 */
function openReview(column: MeasurementTableColumn, cell: MeasurementReviewCell | null) {
  if (!cell?.pointId) return
  activeCell.value = cell
  activeColumn.value = column
  Object.assign(form, {
    status: cell.reviewStatus || "Valid",
    comment: cell.reviewComment || ""
  })
  dialogVisible.value = true
}

/** 提交单点人工审核结论；增加确认二次弹框。 */
async function submitReview() {
  if (!activeCell.value?.pointId) return
  const statusText = manualReviewLabels[form.status] || form.status
  const paramName = activeColumn.value?.name || "此参数"
  try {
    await ElMessageBox.confirm(
      `确认将“${paramName}”数据点（ID: ${activeCell.value.pointId}）提交为“${statusText}”审核结论？`,
      "单点审核确认",
      {
        type: "warning",
        confirmButtonText: "确认提交",
        cancelButtonText: "取消"
      }
    )
  } catch {
    return
  }
  loading.value = true
  try {
    const token = getToken() || userStore.token || ""
    const headers: Record<string, string> = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    await saveManualReview(activeCell.value.pointId, {
      level: props.level,
      status: form.status,
      comment: form.comment.trim() || undefined
    }, { headers })
    ElMessage.success(`${props.level}级审核提交成功`)
    dialogVisible.value = false
    await search()
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "审核提交失败"))
  } finally {
    loading.value = false
  }
}

// #endregion

/** 当前表格中所有符合条件、可批量提交的数据点。 */
const reviewableCells = computed(() => {
  const ids = new Set<string>()
  result.value?.rows.forEach((row: any) => {
    Object.values(row.values || {}).forEach((cell: any) => {
      if (cell?.pointId) ids.add(cell.pointId)
    })
  })
  return [...ids]
})

/** 勾选行中包含的所有有效数据点 ID */
const selectedRowPointIds = computed(() => {
  const ids = new Set<string>()
  selectedRows.value.forEach((row: any) => {
    Object.values(row.values || {}).forEach((cell: any) => {
      if (cell?.pointId) ids.add(cell.pointId)
    })
  })
  return [...ids]
})

/** 批量审核的目标数据点 ID 列表：优先使用选中的行数据点；未勾选时退回为全量可审核数据点 */
const targetBatchPointIds = computed(() => {
  if (selectedRows.value.length > 0) {
    return selectedRowPointIds.value
  }
  return reviewableCells.value
})

/** 打开批量审核弹窗。审核意见默认为空。 */
function openBatchReview() {
  if (!targetBatchPointIds.value.length) {
    ElMessage.info("当前选择范围内没有可提交的数据点")
    return
  }
  Object.assign(batchForm, {
    status: "Valid",
    comment: ""
  })
  batchDialogVisible.value = true
}

/** 提交批量人工审核；增加确认二次弹框。 */
async function submitBatchReview() {
  const targetIds = targetBatchPointIds.value
  if (!targetIds.length) {
    ElMessage.warning("没有可提交的数据点")
    return
  }
  const statusText = manualReviewLabels[batchForm.status] || batchForm.status
  const targetDesc = selectedRows.value.length
    ? `已勾选的 ${selectedRows.value.length} 行（共 ${targetIds.length} 条数据点）`
    : `当前范围的全部 ${targetIds.length} 条数据点`

  try {
    await ElMessageBox.confirm(
      `确认将 ${targetDesc} 统一提交为“${statusText}”审核结论？`,
      "批量审核确认",
      {
        type: "warning",
        confirmButtonText: "确认提交",
        cancelButtonText: "取消"
      }
    )
  } catch {
    return
  }

  batchLoading.value = true
  try {
    const token = getToken() || userStore.token || ""
    const headers: Record<string, string> = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const { data } = await saveBatchManualReview({
      pointIds: targetIds,
      level: props.level,
      status: batchForm.status,
      comment: batchForm.comment.trim() || undefined
    }, { headers })
    ElMessage.success(`批量审核成功，共更新 ${data.updated} 条`)
    batchDialogVisible.value = false
    await search()
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "批量审核提交失败"))
  } finally {
    batchLoading.value = false
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
      granularity="Raw"
      :stations="stations"
      :groups="stationGroups"
      :show-granularity="false"
      :loading="loading"
      @search="search"
    >
      <template #actions>
        <el-button type="success" :icon="Check" :disabled="!targetBatchPointIds.length" @click="openBatchReview">
          <template v-if="selectedRows.length">
            审核选中行（{{ selectedRows.length }}行 / {{ targetBatchPointIds.length }}条）
          </template>
          <template v-else>
            全部审核（{{ targetBatchPointIds.length }}条）
          </template>
        </el-button>
      </template>
    </QueryFilter>

    <section class="lw2-content">
      <el-table
        v-loading="loading || batchLoading"
        :data="result?.rows || []"
        height="100%"
        empty-text="请选择条件并查询"
        :cell-class-name="getCellClassName"
        @cell-click="handleCellClick"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="40" fixed />
        <el-table-column fixed prop="time" label="数据时间" width="160">
          <template #default="scope">
            {{ displayTime(scope.row.time) }}
          </template>
        </el-table-column>
        <el-table-column v-for="column in columns" :key="column.code" :prop="column.code" :label="displayParameterLabel(column)" align="left" width="130">
          <template #default="scope">
            <div v-if="scope.row.values[column.code]" class="cell-value">
              {{ displayMeasurementValue(scope.row.values[column.code], column) }}
            </div>
            <span v-else class="empty-cell">—</span>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <el-dialog v-model="dialogVisible" :title="`${activeColumn?.name || ''} · ${level}级审核`" width="560px" destroy-on-close>
      <el-form label-width="92px" class="review-form">
        <el-form-item label="当前值">
          <strong>{{ activeColumn ? displayMeasurementValue(activeCell, activeColumn) : '—' }} {{ activeColumn?.unit }}</strong>
        </el-form-item>
        <el-form-item label="审核人">
          <span style="font-weight: 500;">{{ activeCell?.reviewer || '—' }}</span>
        </el-form-item>
        <el-form-item label="审核结论" required>
          <el-select v-model="form.status" style="width: 100%">
            <el-option v-for="(label, value) in manualReviewLabels" :key="value" :label="label" :value="value" />
          </el-select>
        </el-form-item>
        <el-form-item label="审核意见">
          <el-input v-model="form.comment" type="textarea" :rows="3" maxlength="500" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" :icon="EditPen" :loading="loading" @click="submitReview">
          提交审核
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchDialogVisible"
      :title="selectedRows.length ? `勾选行 ${level} 级批量审核 (${selectedRows.length} 行 / ${targetBatchPointIds.length} 条数据)` : `批量 ${level} 级审核 (${targetBatchPointIds.length} 条数据)`"
      width="560px"
      destroy-on-close
    >
      <el-form label-width="92px" class="review-form">
        <el-form-item label="审核结论" required>
          <el-select v-model="batchForm.status" style="width: 100%">
            <el-option v-for="(label, value) in manualReviewLabels" :key="value" :label="label" :value="value" />
          </el-select>
        </el-form-item>
        <el-form-item label="审核意见">
          <el-input v-model="batchForm.comment" type="textarea" :rows="3" maxlength="500" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchDialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" :icon="Check" :loading="batchLoading" @click="submitBatchReview">
          批量提交
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
@use "../styles.scss";
.audit-notice {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0;
}
.audit-notice :deep(.el-alert) {
  width: auto;
  max-width: 680px;
}
.cell-value {
  font-weight: 600;
}
.empty-cell {
  color: var(--el-text-color-placeholder);
}
:deep(.cell-unreviewed) {
  background-color: var(--el-fill-color-light) !important;
}
:deep(.cell-reviewed-valid) {
  background-color: #ffffff !important;
}
:deep(.cell-reviewed-abnormal) {
  background-color: rgba(230, 162, 60, 0.16) !important;
}
:deep(.is-reviewable) {
  cursor: pointer;
}
:deep(.is-reviewable:hover) {
  box-shadow: inset 0 0 0 1px rgba(64, 158, 255, 0.55) !important;
  background-color: rgba(64, 158, 255, 0.12) !important;
}
.audit-cell__value {
  font-weight: 600;
}
.review-form {
  margin-top: 18px;
}
</style>
