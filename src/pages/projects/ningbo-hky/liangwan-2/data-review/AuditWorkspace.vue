<script setup lang="ts">
import type { ManualReviewStatus, MeasurementCell, MeasurementColumn, MeasurementQueryResult } from "../types"
import { Check, EditPen } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { computed, onMounted, reactive, ref, watch } from "vue"
import { useUserStore } from "@/pinia/stores/user"
import { getApiErrorMessage, queryMeasurements, saveManualReview } from "../apis"
import QueryFilter from "../components/QueryFilter.vue"
import { getLatestGroupDayRange, useProjectOptions } from "../composables/useProjectOptions"
import { displayMeasurementValue, displayParameterLabel, displayTime, getDefaultDateRange, manualReviewLabels, toDayEndIso, toDayStartIso } from "../utils"

const props = defineProps<{
  /** 当前人工审核等级。 */
  level: 1 | 2 | 3
}>()

const userStore = useUserStore()
const { stations, stationGroups, loadStations, loadStationGroups, stationById } = useProjectOptions()
const stationId = ref("")
const groupId = ref("")
const dateRange = ref<[Date, Date]>(getDefaultDateRange())
const result = ref<MeasurementQueryResult>()
const loading = ref(false)
const batchLoading = ref(false)
const dialogVisible = ref(false)
const activeCell = ref<MeasurementCell>()
const activeColumn = ref<MeasurementColumn>()
const form = reactive({
  status: "Valid" as ManualReviewStatus,
  reviewer: "",
  comment: ""
})

/** 当前审核人优先使用实名，其次使用昵称、用户名和租户成员名。 */
const defaultReviewer = computed(() => userStore.user?.realName || userStore.user?.nickName || userStore.user?.userName || userStore.memberProfile?.memberName || "")

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

/** 组装固定为 Raw 粒度的审核查询，聚合数据没有 pointId，不能人工审核。 */
function buildRequest() {
  if (!stationId.value || !groupId.value) {
    ElMessage.warning("请选择站点和参数分类")
    return null
  }
  return {
    stationId: stationId.value,
    parameterGroupId: groupId.value,
    parameterDefinitionIds: null,
    from: toDayStartIso(dateRange.value[0]),
    to: toDayEndIso(dateRange.value[1]),
    granularity: "Raw" as const
  }
}

/** 查询当前站点、参数分类和时间范围内的原始数据。 */
async function search() {
  const request = buildRequest()
  if (!request) return
  loading.value = true
  try {
    const { data } = await queryMeasurements(request)
    result.value = data
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "审核数据加载失败"))
  } finally {
    loading.value = false
  }
}

/** 判断数据点是否符合严格的逐级审核顺序。 */
function canReview(cell: MeasurementCell | null) {
  if (!cell?.pointId) return false
  return (cell.manualReview?.currentLevel ?? 0) === props.level - 1
}

/** 单元格只展示当前人工审核等级和人工结论，不混入自动审核状态。 */
function manualReviewText(cell: MeasurementCell) {
  const review = cell.manualReview
  if (!review?.currentLevel) return "未审核"
  const statusLabel = review.currentStatus ? manualReviewLabels[review.currentStatus] : "已审核"
  return `${review.currentLevel}级 · ${statusLabel}`
}

/** 人工审核结论对应标签颜色。 */
function manualReviewTagType(cell: MeasurementCell) {
  const status = cell.manualReview?.currentStatus
  if (status === "Valid") return "success"
  if (status === "Invalid" || status === "Fault") return "danger"
  if (status) return "warning"
  return "info"
}

/** 打开单点审核对话框，并保留当前有效值用于可选修正。 */
function openReview(column: MeasurementColumn, cell: MeasurementCell | null) {
  if (!cell?.pointId) return
  const currentLevel = cell.manualReview?.currentLevel ?? 0
  if (currentLevel < props.level - 1) {
    ElMessage.warning(`请先完成${props.level - 1}级审核`)
    return
  }
  if (currentLevel >= props.level) {
    ElMessage.info(`该数据已完成${currentLevel}级审核`)
    return
  }
  activeCell.value = cell
  activeColumn.value = column
  Object.assign(form, {
    status: "Valid",
    reviewer: defaultReviewer.value,
    comment: ""
  })
  dialogVisible.value = true
}

/** 提交单点人工审核结论；数据修正由数据查询中的管理员功能独立处理。 */
async function submitReview() {
  if (!activeCell.value?.pointId || !form.reviewer.trim()) {
    ElMessage.warning("请填写审核人")
    return
  }
  loading.value = true
  try {
    await saveManualReview(activeCell.value.pointId, props.level, {
      status: form.status,
      reviewer: form.reviewer.trim(),
      comment: form.comment.trim() || undefined
    })
    ElMessage.success(`${props.level}级审核提交成功`)
    dialogVisible.value = false
    await search()
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "审核提交失败"))
  } finally {
    loading.value = false
  }
}

/** 当前表格中符合逐级审核顺序、可批量提交的数据点。 */
const reviewableCells = computed(() => {
  const ids = new Set<string>()
  result.value?.rows.forEach((row) => {
    Object.values(row.values).forEach((cell) => {
      if (canReview(cell) && cell?.pointId) ids.add(cell.pointId)
    })
  })
  return [...ids]
})

/** 按 10 个并发批量提交当前范围所有可审核参数，并报告成功和失败数量。 */
async function reviewAll() {
  if (!reviewableCells.value.length) {
    ElMessage.info("当前范围没有可提交的数据点")
    return
  }
  if (!defaultReviewer.value) {
    ElMessage.warning("当前账号缺少审核人名称")
    return
  }
  await ElMessageBox.confirm(
    `将以“有效”结论提交 ${reviewableCells.value.length} 个数据点的${props.level}级审核，是否继续？`,
    "批量审核确认",
    { type: "warning", confirmButtonText: "全部审核", cancelButtonText: "取消" }
  )
  batchLoading.value = true
  let succeeded = 0
  let failed = 0
  try {
    const queue = [...reviewableCells.value]
    async function worker() {
      while (queue.length) {
        const pointId = queue.shift()!
        try {
          await saveManualReview(pointId, props.level, { status: "Valid", reviewer: defaultReviewer.value, comment: "批量审核" })
          succeeded++
        } catch {
          failed++
        }
      }
    }
    await Promise.all(Array.from({ length: Math.min(10, queue.length) }, worker))
    failed ? ElMessage.warning(`批量审核完成：成功 ${succeeded} 条，失败 ${failed} 条`) : ElMessage.success(`批量审核完成，共 ${succeeded} 条`)
    await search()
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
        <el-button type="success" :icon="Check" :loading="batchLoading" :disabled="!reviewableCells.length" @click="reviewAll">
          全部审核（{{ reviewableCells.length }}）
        </el-button>
      </template>
    </QueryFilter>

    <section class="lw2-content">
      <el-table v-loading="loading || batchLoading" :data="result?.rows || []" height="100%" empty-text="请选择条件并查询">
        <el-table-column fixed prop="time" label="数据时间" width="170">
          <template #default="scope">
            {{ displayTime(scope.row.time) }}
          </template>
        </el-table-column>
        <el-table-column v-for="column in result?.columns" :key="column.code" :label="displayParameterLabel(column)" min-width="160">
          <template #default="scope">
            <div
              v-if="scope.row.values[column.code]"
              class="review-cell" :class="[{ 'is-reviewable': canReview(scope.row.values[column.code]) }]"
              @click="openReview(column, scope.row.values[column.code])"
            >
              <div class="audit-cell__value">
                {{ displayMeasurementValue(scope.row.values[column.code], column) }}
              </div>
              <div class="audit-cell__status">
                <el-tag size="small" :type="manualReviewTagType(scope.row.values[column.code])">
                  {{ manualReviewText(scope.row.values[column.code]) }}
                </el-tag>
              </div>
            </div>
            <span v-else>—</span>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <el-dialog v-model="dialogVisible" :title="`${activeColumn?.name || ''} · ${level}级审核`" width="560px" destroy-on-close>
      <el-form label-width="92px" class="review-form">
        <el-form-item label="当前值">
          <strong>{{ activeColumn ? displayMeasurementValue(activeCell, activeColumn) : '—' }} {{ activeColumn?.unit }}</strong>
        </el-form-item>
        <el-form-item label="审核结论" required>
          <el-select v-model="form.status" style="width: 100%">
            <el-option v-for="(label, value) in manualReviewLabels" :key="value" :label="label" :value="value" />
          </el-select>
        </el-form-item>
        <el-form-item label="审核人" required>
          <el-input v-model="form.reviewer" maxlength="50" />
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
.is-reviewable {
  outline: 1px solid rgba(64, 158, 255, 0.35);
  cursor: pointer;
}
.is-reviewable:hover {
  background: rgba(64, 158, 255, 0.12);
}
.audit-cell__value {
  font-weight: 600;
}
.audit-cell__status {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: 3px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
}
.review-form {
  margin-top: 18px;
}
</style>
