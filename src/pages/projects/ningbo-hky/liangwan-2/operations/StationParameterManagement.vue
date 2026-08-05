<script setup lang="ts">
import type { StationParameterBinding, StationParameterGroup } from "../types"
import { Delete, Edit, Plus, Refresh, Setting } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { computed, onMounted, reactive, ref, watch } from "vue"
import {
  batchCreateStationParameterBindings,
  createStationParameterGroup,
  deleteStationParameterBinding,
  deleteStationParameterGroup,
  getApiErrorMessage,
  getStationParameterBindings,
  setAutoReviewEnabled,
  updateStationParameterBinding,
  updateStationParameterGroup
} from "../apis"
import { useProjectOptions } from "../composables/useProjectOptions"

const { stations, parameterDefinitions, stationGroups, loadStations, loadParameterDefinitions, loadStationGroups, parameterById } = useProjectOptions()
const stationId = ref<number | null>(null)
const bindings = ref<StationParameterBinding[]>([])
const loading = ref(false)
const groupDialog = ref(false)
const batchBindingDialog = ref(false)
const bindingDialog = ref(false)
const editingGroupId = ref<number | null>(null)
const editingBindingId = ref<number | null>(null)
const activeCollapseNames = ref<number[]>([])

const groupForm = reactive({ name: "", reportIntervalMinutes: 15, sortOrder: 0 })
const batchBindingForm = reactive({ stationParameterGroupId: 0, parameterDefinitionIds: [] as number[] })
const bindingForm = reactive({ parameterDefinitionId: 0, stationParameterGroupId: 0, displayNameOverride: "", unitOverride: "", decimalPlacesOverride: null as number | null, sortOrder: 0, isAutoReviewEnabled: false })

const selectedStation = computed(() => stations.value.find(item => item.id === stationId.value))

/** 将所有绑定参数按组 ID 聚合 */
const bindingsByGroupId = computed(() => {
  const map = new Map<number, StationParameterBinding[]>()
  stationGroups.value.forEach(g => map.set(g.id, []))
  bindings.value.forEach((b) => {
    if (!map.has(b.stationParameterGroupId)) {
      map.set(b.stationParameterGroupId, [])
    }
    map.get(b.stationParameterGroupId)!.push(b)
  })
  // 按排序字段升序
  map.forEach(list => list.sort((a, b) => a.sortOrder - b.sortOrder))
  return map
})

watch(stationId, async () => {
  await loadStationConfig()
})

/** 加载当前站点的参数组和参数绑定。 */
async function loadStationConfig() {
  if (!selectedStation.value) {
    stationGroups.value = []
    bindings.value = []
    return
  }
  loading.value = true
  try {
    const [, bindingResponse] = await Promise.all([
      loadStationGroups(selectedStation.value.mn),
      getStationParameterBindings(selectedStation.value.mn)
    ])
    bindings.value = bindingResponse.data ?? []
    // 默认展开所有组
    activeCollapseNames.value = stationGroups.value.map(g => g.id)
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "站点参数配置加载失败"))
  } finally {
    loading.value = false
  }
}

/** 打开站点参数组表单。 */
function editGroup(row?: StationParameterGroup) {
  editingGroupId.value = row?.id || null
  Object.assign(groupForm, row ? { name: row.name, reportIntervalMinutes: row.reportIntervalMinutes, sortOrder: row.sortOrder } : { name: "", reportIntervalMinutes: 15, sortOrder: 0 })
  groupDialog.value = true
}

/** 保存站点参数组。 */
async function saveGroup() {
  if (!selectedStation.value || !groupForm.name.trim()) return ElMessage.warning("请选择站点并填写组名")
  try {
    editingGroupId.value ? await updateStationParameterGroup(selectedStation.value.mn, editingGroupId.value, { StationId: selectedStation.value.id, ...groupForm }) : await createStationParameterGroup(selectedStation.value.mn, { StationId: selectedStation.value.id, ...groupForm })
    ElMessage.success("站点参数组保存成功")
    groupDialog.value = false
    await loadStationConfig()
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "参数组保存失败"))
  }
}

/** 删除站点参数组，存在绑定时后端会拒绝删除。 */
async function removeGroup(row: StationParameterGroup) {
  if (!selectedStation.value) return
  await ElMessageBox.confirm(`确认删除参数组“${row.name}”？`, "删除确认", { type: "warning" })
  try {
    await deleteStationParameterGroup(selectedStation.value.mn, row.id)
    ElMessage.success("删除成功")
    await loadStationConfig()
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "删除失败"))
  }
}

/** 打开批量绑定参数弹窗。 */
function openBatchBinding(groupId: number) {
  batchBindingForm.stationParameterGroupId = groupId
  batchBindingForm.parameterDefinitionIds = []
  batchBindingDialog.value = true
}

/** 提交批量绑定。 */
async function saveBatchBinding() {
  if (!selectedStation.value || !batchBindingForm.stationParameterGroupId || batchBindingForm.parameterDefinitionIds.length === 0) {
    return ElMessage.warning("请选择至少一个参数进行绑定")
  }
  try {
    await batchCreateStationParameterBindings(selectedStation.value.mn, { ...batchBindingForm })
    ElMessage.success("批量绑定参数成功")
    batchBindingDialog.value = false
    await loadStationConfig()
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "批量绑定参数失败"))
  }
}

/** 打开参数设置表单（用于修改覆盖属性）。 */
function editBinding(row: StationParameterBinding) {
  editingBindingId.value = row.id
  Object.assign(bindingForm, {
    parameterDefinitionId: row.parameterDefinitionId,
    stationParameterGroupId: row.stationParameterGroupId,
    displayNameOverride: row.displayNameOverride || "",
    unitOverride: row.unitOverride || "",
    decimalPlacesOverride: row.decimalPlacesOverride ?? null,
    sortOrder: row.sortOrder,
    isAutoReviewEnabled: row.isAutoReviewEnabled
  })
  bindingDialog.value = true
}

/** 保存单个参数绑定的覆盖设置。 */
async function saveBinding() {
  if (!selectedStation.value) return
  const payload = {
    ...bindingForm,
    displayNameOverride: bindingForm.displayNameOverride || null,
    unitOverride: bindingForm.unitOverride || null
  }
  try {
    await updateStationParameterBinding(selectedStation.value.mn, editingBindingId.value!, payload)
    ElMessage.success("参数设置更新成功")
    bindingDialog.value = false
    await loadStationConfig()
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "参数设置更新失败"))
  }
}

/** 删除站点参数绑定。 */
async function removeBinding(row: StationParameterBinding) {
  if (!selectedStation.value) return
  await ElMessageBox.confirm(`确认解除参数“${parameterName(row.parameterDefinitionId)}”的绑定？`, "删除确认", { type: "warning" })
  try {
    await deleteStationParameterBinding(selectedStation.value.mn, row.id)
    ElMessage.success("解绑成功")
    await loadStationConfig()
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "解绑失败"))
  }
}

/** 切换自动审核开关 */
async function toggleAutoReview(row: StationParameterBinding, val: boolean) {
  if (!selectedStation.value) return
  try {
    await setAutoReviewEnabled(selectedStation.value.mn, row.id, val)
    ElMessage.success(`${val ? "启用" : "禁用"}自动审核成功`)
  } catch (error) {
    row.isAutoReviewEnabled = !val // 恢复原状
    ElMessage.error(getApiErrorMessage(error, "操作失败"))
  }
}

function parameterName(id: number) {
  const item = parameterById.value.get(id)
  return item ? `${item.name}（${item.code}）` : id
}

onMounted(async () => {
  const [list] = await Promise.all([loadStations(), loadParameterDefinitions()])
  if (list[0]) stationId.value = list[0].id
})
</script>

<template>
  <section class="lw2-content">
    <div class="lw2-page-title">
      <h2>站点参数组与绑定管理</h2>
      <el-space>
        <el-select v-model="stationId" filterable placeholder="请选择站点" style="width: 230px">
          <el-option v-for="station in stations" :key="station.id" :label="station.name" :value="station.id" />
        </el-select>
        <el-button :icon="Refresh" @click="loadStationConfig">
          刷新
        </el-button>
        <el-button type="primary" :icon="Plus" :disabled="!stationId" @click="editGroup()">
          新增参数组
        </el-button>
      </el-space>
    </div>

    <div v-loading="loading" class="group-container">
      <el-empty v-if="!stationId" description="请先选择站点" />
      <el-empty v-else-if="stationGroups.length === 0" description="暂无参数组，请先新增参数组" />

      <el-collapse v-else v-model="activeCollapseNames">
        <el-collapse-item v-for="group in stationGroups" :key="group.id" :name="group.id">
          <template #title>
            <div class="group-header">
              <span class="group-name">{{ group.name }}</span>
              <span class="group-interval">周期: {{ group.reportIntervalMinutes }}分钟</span>
              <div class="group-actions" @click.stop>
                <el-button link type="primary" :icon="Edit" @click="editGroup(group)">
                  编辑组
                </el-button>
                <el-button link type="danger" :icon="Delete" @click="removeGroup(group)">
                  删除组
                </el-button>
                <el-button type="primary" plain size="small" :icon="Plus" @click="openBatchBinding(group.id)" style="margin-left: 16px">
                  添加参数
                </el-button>
              </div>
            </div>
          </template>

          <div class="table-wrapper">
            <el-table :data="bindingsByGroupId.get(group.id)" style="width: 100%" border size="small">
              <el-table-column label="参数名称" min-width="180">
                <template #default="scope">
                  {{ parameterName(scope.row.parameterDefinitionId) }}
                </template>
              </el-table-column>
              <el-table-column prop="displayNameOverride" label="显示名覆盖" min-width="120">
                <template #default="scope">
                  <span v-if="scope.row.displayNameOverride">{{ scope.row.displayNameOverride }}</span>
                  <span v-else class="text-secondary">--</span>
                </template>
              </el-table-column>
              <el-table-column prop="unitOverride" label="单位覆盖" width="100">
                <template #default="scope">
                  <span v-if="scope.row.unitOverride">{{ scope.row.unitOverride }}</span>
                  <span v-else class="text-secondary">--</span>
                </template>
              </el-table-column>
              <el-table-column prop="decimalPlacesOverride" label="小数位覆盖" width="100" align="center">
                <template #default="scope">
                  <span v-if="scope.row.decimalPlacesOverride != null">{{ scope.row.decimalPlacesOverride }}</span>
                  <span v-else class="text-secondary">--</span>
                </template>
              </el-table-column>
              <el-table-column prop="isAutoReviewEnabled" label="自动审核" width="90" align="center">
                <template #default="scope">
                  <el-switch
                    v-model="scope.row.isAutoReviewEnabled"
                    @change="(val: boolean | string | number) => toggleAutoReview(scope.row, val as boolean)"
                  />
                </template>
              </el-table-column>
              <el-table-column prop="sortOrder" label="排序" width="80" align="right" />
              <el-table-column label="操作" width="140" fixed="right">
                <template #default="scope">
                  <el-button link type="primary" :icon="Setting" @click="editBinding(scope.row)">
                    设置
                  </el-button>
                  <el-button link type="danger" :icon="Delete" @click="removeBinding(scope.row)">
                    解绑
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>

    <el-dialog v-model="groupDialog" :title="editingGroupId ? '编辑站点参数组' : '新增站点参数组'" width="500px">
      <el-form :model="groupForm" label-width="130px">
        <el-form-item label="参数组名称" required>
          <el-input v-model="groupForm.name" />
        </el-form-item>
        <el-form-item label="上报周期（分钟）">
          <el-input-number v-model="groupForm.reportIntervalMinutes" :min="1" :max="525600" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="groupForm.sortOrder" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="groupDialog = false">
          取消
        </el-button><el-button type="primary" @click="saveGroup">
          保存
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="batchBindingDialog" title="批量添加参数" width="560px">
      <el-form :model="batchBindingForm" label-width="80px">
        <el-form-item label="选择参数">
          <el-select
            v-model="batchBindingForm.parameterDefinitionIds"
            multiple
            filterable
            style="width: 100%"
            placeholder="请选择需要绑定的全局参数（可多选）"
          >
            <el-option
              v-for="item in parameterDefinitions.filter(p => !(bindingsByGroupId.get(batchBindingForm.stationParameterGroupId) || []).some(b => b.parameterDefinitionId === p.id))"
              :key="item.id"
              :label="`${item.name}（${item.code}）`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchBindingDialog = false">
          取消
        </el-button>
        <el-button type="primary" @click="saveBatchBinding">
          确认绑定
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="bindingDialog" title="设置参数属性" width="480px">
      <el-form :model="bindingForm" label-width="120px">
        <el-form-item label="当前参数">
          <span style="font-weight: bold;">{{ parameterName(bindingForm.parameterDefinitionId) }}</span>
        </el-form-item>
        <el-form-item label="显示名称覆盖">
          <el-input v-model="bindingForm.displayNameOverride" placeholder="留空使用参数默认名称" />
        </el-form-item>
        <el-form-item label="单位覆盖">
          <el-input v-model="bindingForm.unitOverride" placeholder="留空使用参数默认单位" />
        </el-form-item>
        <el-form-item label="小数位覆盖">
          <el-input-number v-model="bindingForm.decimalPlacesOverride" :min="0" :max="10" clearable placeholder="默认" />
        </el-form-item>
        <el-form-item label="自动审核">
          <el-switch v-model="bindingForm.isAutoReviewEnabled" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="bindingForm.sortOrder" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="bindingDialog = false">
          取消
        </el-button><el-button type="primary" @click="saveBinding">
          保存
        </el-button>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped lang="scss">
@use "../styles.scss";

.group-container {
  flex: 1;
  overflow-y: auto;
  padding: 0 4px;

  :deep(.el-collapse-item__header) {
    font-size: 14px;
    padding-left: 8px;
    background-color: var(--el-fill-color-light);
  }

  :deep(.el-collapse-item__content) {
    padding-bottom: 16px;
  }
}

.group-header {
  display: flex;
  align-items: center;
  width: 100%;
  padding-right: 12px;

  .group-name {
    font-size: 15px;
    font-weight: 600;
  }

  .ml-2 {
    margin-left: 8px;
  }

  .group-interval {
    margin-left: 16px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  .group-actions {
    margin-left: auto;
    display: flex;
    align-items: center;
  }
}

.table-wrapper {
  padding: 12px 16px 0;
}

.text-secondary {
  color: var(--el-text-color-placeholder);
}
</style>
