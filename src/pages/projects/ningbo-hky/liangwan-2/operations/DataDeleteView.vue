<script setup lang="ts">
import type { DeleteMeasurementPointsRequest, DeleteMeasurementPointsResult } from "../apis/data-query/type"
import type { Granularity, MeasurementTableCell, MeasurementTableResult } from "../types"
import { Delete } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import { computed, onMounted, ref, watch } from "vue"
import { getToken } from "@/common/utils/cache/cookies"
import { useUserStore } from "@/pinia/stores/user"
import { deleteMeasurementPoints, getApiErrorMessage, queryMeasurements } from "../apis"
import QueryFilter from "../components/QueryFilter.vue"
import { useProjectOptions } from "../composables/useProjectOptions"
import { displayMeasurementValue, displayParameterLabel, displayTime, getWholeDayRange, toDayEndIso, toDayStartIso } from "../utils"

const { stations, stationGroups, loadStations, loadStationGroups, stationById, groupById } = useProjectOptions()
const userStore = useUserStore()

const stationId = ref<number | "">("")
const groupId = ref<number | "">("")
const dateRange = ref<[Date, Date]>(getWholeDayRange())
const granularity = ref<Granularity>("Raw")
const result = ref<MeasurementTableResult>()
const loading = ref(false)

// #region 删除模式与多选状态

/** 是否处于“进入删除”操作模式 */
const isDeleteMode = ref(false)
/** 当前勾选的行列表 */
const selectedRows = ref<any[]>([])

/** 自动提取当前选中行中包含的所有有效数据点 ID (pointId) */
const selectedPointIds = computed<number[]>(() => {
  const idsSet = new Set<number>()
  selectedRows.value.forEach((row) => {
    if (row.values) {
      Object.values(row.values).forEach((cell: any) => {
        if (cell?.pointId != null) {
          const idNum = Number(cell.pointId)
          if (!Number.isNaN(idNum) && idNum > 0) {
            idsSet.add(idNum)
          }
        }
      })
    }
  })
  return Array.from(idsSet)
})

// #endregion

// #region 删除确认与结果弹窗状态

const confirmDialogVisible = ref(false)
const deleteReason = ref("")
const confirmChecked = ref(false)
const deleting = ref(false)

const resultDialogVisible = ref(false)
const deleteResult = ref<DeleteMeasurementPointsResult | null>(null)

// #endregion

/** 表格时间列加动态参数列，保证水质等级派生列优先排在数据时间右侧。 */
const columns = computed(() => {
  const list = result.value?.columns ?? []
  const gradeCol = list.find(c => c.code === "waterQualityGrade" || c.isDerived)
  if (!gradeCol) return list
  return [gradeCol, ...list.filter(c => c !== gradeCol)]
})

watch(stationId, async (value) => {
  const station = typeof value === "number" ? stationById.value.get(value) : undefined
  const groups = await loadStationGroups(station?.id)
  if (stationId.value !== value) return
  const defaultGroupId = groups[0]?.id || ""
  groupId.value = defaultGroupId
  result.value = undefined
  selectedRows.value = []
  if (!station || !defaultGroupId) return
  dateRange.value = getWholeDayRange()
  await search()
})

/** 组装所有查询共用的请求体。仅针对 Raw 粒度的原始数据进行查询与删除。 */
function buildRequest() {
  if (!stationId.value || !groupId.value) {
    ElMessage.warning("请选择站点和参数组")
    return null
  }
  const currentStation = typeof stationId.value === "number" ? stationById.value.get(stationId.value) : undefined
  const stationCode = String(currentStation?.code || (currentStation as any)?.mn || "")
  const currentGroup = groupById.value.get(groupId.value) || stationGroups.value.find(g => g.id === groupId.value)
  const isWaterQualityGroup = (currentGroup?.name?.includes("水质") ?? false) && stationCode.startsWith("26")

  return {
    stationId: stationId.value,
    parameterGroupId: groupId.value,
    parameterDefinitionIds: null,
    from: toDayStartIso(dateRange.value[0]),
    to: toDayEndIso(dateRange.value[1]),
    granularity: "Raw" as Granularity,
    includeWaterQualityGrade: isWaterQualityGroup
  }
}

/** 查询原始时间对齐数据表。 */
async function search() {
  const request = buildRequest()
  if (!request) return
  loading.value = true
  selectedRows.value = []
  try {
    const { data } = await queryMeasurements(request)
    result.value = data
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "数据查询失败"))
  } finally {
    loading.value = false
  }
}

/** 切换“进入删除/退出删除”模式 */
function toggleDeleteMode() {
  isDeleteMode.value = !isDeleteMode.value
  if (!isDeleteMode.value) {
    selectedRows.value = []
  } else {
    ElMessage.info("已进入数据删除模式，请勾选需要删除的数据行")
  }
}

/** 监听表格多选变更 */
function handleSelectionChange(rows: any[]) {
  selectedRows.value = rows
}

interface CellBadge {
  key: string
  text: string
  title: string
}

const MEASUREMENT_FLAG_MAP: Record<string, { text: string, title: string }> = {
  C: { text: "标液", title: "数据标志：校准/标定数据 (C)" },
  F: { text: "停", title: "数据标志：停运数据 (F)" },
  T: { text: "超", title: "数据标志：超标数据 (T)" },
  D: { text: "故", title: "数据标志：故障数据 (D)" },
  M: { text: "维", title: "数据标志：维护数据 (M)" },
  B: { text: "采", title: "数据标志：采样数据 (B)" },
  S: { text: "手", title: "数据标志：手工数据 (S)" }
}

function getCellBadges(cell: MeasurementTableCell | null | undefined): CellBadge[] {
  if (!cell) return []
  const badges: CellBadge[] = []
  if (cell.source === "Beidou") {
    badges.push({ key: "source-beidou", text: "北斗", title: "数据来源：北斗转发" })
  }
  if (cell.measurementDataFlag && cell.measurementDataFlag.toUpperCase() !== "N") {
    const flagKey = cell.measurementDataFlag.toUpperCase()
    const known = MEASUREMENT_FLAG_MAP[flagKey]
    if (known) {
      badges.push({ key: `flag-${flagKey}`, text: known.text, title: known.title })
    } else {
      badges.push({ key: `flag-${flagKey}`, text: flagKey.length > 2 ? flagKey.slice(0, 2) : flagKey, title: `数据标志：${cell.measurementDataFlag}` })
    }
  }
  return badges
}

function getCellClassName({ row, column }: { row: any, column: any }) {
  if (!column.property) return ""
  const cell = row.values?.[column.property]
  if (!cell) return ""
  if (cell.autoReviewStatus === "Failed" || cell.autoReviewStatus === "Error") {
    return "measurement-cell--warning"
  }
  return ""
}

// #region 提交删除与弹窗处理

/** 打开二次删除确认对话框 */
function openDeleteConfirm() {
  if (selectedPointIds.value.length === 0) {
    return ElMessage.warning("所选行中无有效的数据点 ID")
  }
  deleteReason.value = ""
  confirmChecked.value = false
  confirmDialogVisible.value = true
}

/** 提交批量删除点请求，提取本地访问 token (AccessToken) 作为认证头 */
async function submitDelete() {
  if (!deleteReason.value.trim()) {
    return ElMessage.warning("请输入数据删除原因")
  }
  if (!confirmChecked.value) {
    return ElMessage.warning("请先勾选二次确认复选框")
  }

  deleting.value = true
  try {
    const token = getToken() || userStore.token || ""
    const headers: Record<string, string> = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const payload: DeleteMeasurementPointsRequest = {
      pointIds: selectedPointIds.value,
      reason: deleteReason.value.trim(),
      confirm: true
    }

    const { data } = await deleteMeasurementPoints(payload, { headers })
    deleteResult.value = data
    confirmDialogVisible.value = false
    resultDialogVisible.value = true
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "批量删除数据点失败"))
  } finally {
    deleting.value = false
  }
}

/** 关闭结果弹窗并自动刷新数据 */
async function handleResultClose() {
  resultDialogVisible.value = false
  deleteResult.value = null
  selectedRows.value = []
  await search()
}

// #endregion

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
      :show-granularity="false"
      :stations="stations"
      :groups="stationGroups"
      :loading="loading"
      @search="search"
    >
      <template #actions>
        <el-button
          :type="isDeleteMode ? 'warning' : 'danger'"
          :icon="Delete"
          @click="toggleDeleteMode"
        >
          {{ isDeleteMode ? '退出删除模式' : '进入删除' }}
        </el-button>

        <el-button
          v-if="isDeleteMode"
          type="danger"
          :disabled="selectedRows.length === 0 || selectedPointIds.length === 0"
          @click="openDeleteConfirm"
        >
          确认删除所选点 ({{ selectedRows.length }}行 / {{ selectedPointIds.length }}点)
        </el-button>
      </template>
    </QueryFilter>

    <section class="lw2-content">
      <el-alert
        v-if="isDeleteMode"
        title="当前处于数据删除模式。请在表格左侧勾选需删除的数据行。"
        type="warning"
        show-icon
        :closable="false"
        style="margin-bottom: 8px"
      />

      <el-table
        v-loading="loading"
        :data="result?.rows || []"
        height="100%"
        empty-text="请选择条件并查询"
        :cell-class-name="getCellClassName"
        @selection-change="handleSelectionChange"
      >
        <el-table-column v-if="isDeleteMode" type="selection" width="48" fixed align="center" />
        <el-table-column fixed prop="time" label="数据时间" width="160">
          <template #default="scope">
            {{ displayTime(scope.row.time) }}
          </template>
        </el-table-column>
        <el-table-column
          v-for="column in columns"
          :key="column.code"
          :prop="column.code"
          :label="displayParameterLabel(column)"
          align="left"
          width="140"
        >
          <template #default="scope">
            <div v-if="scope.row.values[column.code]" class="cell-value-container">
              <div class="cell-badges-top-right">
                <span
                  v-for="badge in getCellBadges(scope.row.values[column.code])"
                  :key="badge.key"
                  class="beidou-badge"
                  :title="badge.title"
                >{{ badge.text }}</span>
              </div>
              <span class="cell-value">
                {{ displayMeasurementValue(scope.row.values[column.code], column) }}
              </span>
            </div>
            <span v-else class="empty-cell">—</span>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <!-- 二次删除确认弹窗 -->
    <el-dialog
      v-model="confirmDialogVisible"
      title="高危操作：批量删除数据点确认"
      width="580px"
      destroy-on-close
    >
      <el-alert
        title="删除警告：该操作将永久从数据库中移除选中的原始测量数据点，无法恢复！"
        type="error"
        show-icon
        :closable="false"
        style="margin-bottom: 16px"
      />

      <el-descriptions :column="2" border style="margin-bottom: 16px">
        <el-descriptions-item label="所属站点">
          {{ result?.stationName || '—' }}
        </el-descriptions-item>
        <el-descriptions-item label="所属参数组">
          {{ result?.parameterGroupName || '—' }}
        </el-descriptions-item>
        <el-descriptions-item label="勾选行数">
          <el-tag size="small" type="danger">
            {{ selectedRows.length }} 行
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="待删除点数">
          <el-tag size="small" type="danger">
            {{ selectedPointIds.length }} 个 pointId
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <el-form label-width="90px">
        <el-form-item label="删除原因" required>
          <el-input
            v-model="deleteReason"
            type="textarea"
            :rows="3"
            maxlength="200"
            show-word-limit
            placeholder="请输入批量删除数据的合理原因（如：设备异常漂移测试数据清除）"
          />
        </el-form-item>
        <el-form-item label="二次确认" required>
          <el-checkbox v-model="confirmChecked">
            我已核对上述勾选信息
          </el-checkbox>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="confirmDialogVisible = false">
          取消
        </el-button>
        <el-button
          type="danger"
          :disabled="!deleteReason.trim() || !confirmChecked"
          :loading="deleting"
          @click="submitDelete"
        >
          确认高危删除
        </el-button>
      </template>
    </el-dialog>

    <!-- 删除结果反馈弹窗 -->
    <el-dialog
      v-model="resultDialogVisible"
      title="数据点批量删除处理结果"
      width="520px"
      :before-close="handleResultClose"
    >
      <el-result
        icon="success"
        title="数据点批量删除处理完成"
        sub-title="服务端已处理完成本次提交的删除指令"
      >
        <template #extra>
          <el-descriptions :column="1" border style="width: 100%; text-align: left;">
            <el-descriptions-item label="操作批次号 (OperationId)">
              <code>{{ deleteResult?.operationId || '—' }}</code>
            </el-descriptions-item>
            <el-descriptions-item label="请求总点数">
              {{ deleteResult?.requestedCount ?? 0 }} 个
            </el-descriptions-item>
            <el-descriptions-item label="成功删除数">
              <span style="color: #67c23a; font-weight: bold;">{{ deleteResult?.deletedCount ?? 0 }} 个</span>
            </el-descriptions-item>
            <el-descriptions-item label="未找到/已被删除数">
              <span style="color: #e6a23c;">{{ deleteResult?.notFoundCount ?? 0 }} 个</span>
            </el-descriptions-item>
          </el-descriptions>

          <el-alert
            v-if="deleteResult?.notFoundPointIds && deleteResult.notFoundPointIds.length > 0"
            :title="`存在 ${deleteResult.notFoundPointIds.length} 个未找到的数据点 ID: ${deleteResult.notFoundPointIds.join(', ')}`"
            type="info"
            style="margin-top: 12px; text-align: left;"
            :closable="false"
          />
        </template>
      </el-result>
      <template #footer>
        <el-button type="primary" @click="handleResultClose">
          确定并刷新表格
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
@use "../styles.scss";

.cell-value-container {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 100%;
}
.cell-value {
  font-weight: 600;
}
.cell-badges-top-right {
  position: absolute;
  top: -2px;
  right: 0;
  display: flex;
  align-items: center;
  gap: 2px;
  user-select: none;
  z-index: 1;
}
.beidou-badge {
  font-size: 10px;
  line-height: 1.2;
  color: var(--el-color-warning, #e6a23c);
  cursor: help;
  user-select: none;
}
:deep(.measurement-cell--warning) {
  background-color: rgba(230, 162, 60, 0.14) !important;
}
.empty-cell {
  color: var(--el-text-color-placeholder);
}
</style>
