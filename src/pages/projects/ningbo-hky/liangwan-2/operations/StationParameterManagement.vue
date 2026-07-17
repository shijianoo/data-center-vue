<script setup lang="ts">
import type { ParameterKind, StationParameterBinding, StationParameterGroup } from "../types"
import { Delete, Edit, Plus, Refresh } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { computed, onMounted, reactive, ref, watch } from "vue"
import {
  createStationParameterBinding,
  createStationParameterGroup,
  deleteStationParameterBinding,
  deleteStationParameterGroup,
  getApiErrorMessage,
  getStationParameterBindings,
  updateStationParameterBinding,
  updateStationParameterGroup
} from "../apis"
import { useProjectOptions } from "../composables/useProjectOptions"

const { stations, parameterDefinitions, stationGroups, loadStations, loadParameterDefinitions, loadStationGroups, parameterById } = useProjectOptions()
const stationId = ref("")
const activeTab = ref("groups")
const bindings = ref<StationParameterBinding[]>([])
const loading = ref(false)
const groupDialog = ref(false)
const bindingDialog = ref(false)
const editingGroupId = ref("")
const editingBindingId = ref("")
const groupForm = reactive({ name: "", groupKind: "Monitoring" as ParameterKind, reportIntervalMinutes: 15, sortOrder: 0 })
const bindingForm = reactive({ parameterDefinitionId: "", stationParameterGroupId: "", displayNameOverride: "", unitOverride: "", decimalPlacesOverride: null as number | null, sortOrder: 0 })

const selectedStation = computed(() => stations.value.find(item => item.id === stationId.value))

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
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "站点参数配置加载失败"))
  } finally {
    loading.value = false
  }
}

/** 打开站点参数组表单。 */
function editGroup(row?: StationParameterGroup) {
  editingGroupId.value = row?.id || ""
  Object.assign(groupForm, row ? { name: row.name, groupKind: row.groupKind, reportIntervalMinutes: row.reportIntervalMinutes, sortOrder: row.sortOrder } : { name: "", groupKind: "Monitoring", reportIntervalMinutes: 15, sortOrder: 0 })
  groupDialog.value = true
}

/** 保存站点参数组。 */
async function saveGroup() {
  if (!selectedStation.value || !groupForm.name.trim()) return ElMessage.warning("请选择站点并填写组名")
  try {
    editingGroupId.value ? await updateStationParameterGroup(selectedStation.value.mn, editingGroupId.value, { ...groupForm }) : await createStationParameterGroup(selectedStation.value.mn, { ...groupForm })
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

/** 打开参数绑定表单。 */
function editBinding(row?: StationParameterBinding) {
  editingBindingId.value = row?.id || ""
  Object.assign(bindingForm, row
    ? {
        parameterDefinitionId: row.parameterDefinitionId,
        stationParameterGroupId: row.stationParameterGroupId,
        displayNameOverride: row.displayNameOverride || "",
        unitOverride: row.unitOverride || "",
        decimalPlacesOverride: row.decimalPlacesOverride ?? null,
        sortOrder: row.sortOrder
      }
    : { parameterDefinitionId: "", stationParameterGroupId: stationGroups.value[0]?.id || "", displayNameOverride: "", unitOverride: "", decimalPlacesOverride: null, sortOrder: 0 })
  bindingDialog.value = true
}

/** 保存参数绑定及站点级显示覆盖。 */
async function saveBinding() {
  if (!selectedStation.value || !bindingForm.parameterDefinitionId || !bindingForm.stationParameterGroupId) return ElMessage.warning("请选择参数和站点参数组")
  const payload = {
    ...bindingForm,
    displayNameOverride: bindingForm.displayNameOverride || null,
    unitOverride: bindingForm.unitOverride || null
  }
  try {
    editingBindingId.value ? await updateStationParameterBinding(selectedStation.value.mn, editingBindingId.value, payload) : await createStationParameterBinding(selectedStation.value.mn, payload)
    ElMessage.success("参数绑定保存成功")
    bindingDialog.value = false
    await loadStationConfig()
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "参数绑定保存失败"))
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

function parameterName(id: string) {
  const item = parameterById.value.get(id)
  return item ? `${item.name}（${item.code}）` : id
}
function groupName(id: string) {
  return stationGroups.value.find(item => item.id === id)?.name || id
}

onMounted(async () => {
  const [list] = await Promise.all([loadStations(), loadParameterDefinitions()])
  if (list[0]) stationId.value = list[0].id
})
</script>

<template>
  <section class="lw2-content">
    <div class="lw2-page-title">
      <h2>站点参数组与参数绑定</h2>
      <el-space>
        <el-select v-model="stationId" filterable placeholder="请选择站点" style="width: 230px">
          <el-option v-for="station in stations" :key="station.id" :label="`${station.name}（${station.mn}）`" :value="station.id" />
        </el-select>
        <el-button :icon="Refresh" @click="loadStationConfig">
          刷新
        </el-button>
        <el-button type="primary" :icon="Plus" :disabled="!stationId" @click="activeTab === 'groups' ? editGroup() : editBinding()">
          新增{{ activeTab === 'groups' ? '参数组' : '绑定' }}
        </el-button>
      </el-space>
    </div>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="站点参数组" name="groups">
        <el-table v-loading="loading" :data="stationGroups" height="100%">
          <el-table-column prop="name" label="参数组名称" min-width="180" />
          <el-table-column prop="groupKind" label="组类型" width="130">
            <template #default="scope">
              {{ scope.row.groupKind === 'Monitoring' ? '监测参数' : '系统参数' }}
            </template>
          </el-table-column>
          <el-table-column prop="reportIntervalMinutes" label="上报周期（分钟）" min-width="150" align="right" />
          <el-table-column prop="sortOrder" label="排序" width="90" align="right" />
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="scope">
              <el-button link type="primary" :icon="Edit" @click="editGroup(scope.row)">
                编辑
              </el-button><el-button link type="danger" :icon="Delete" @click="removeGroup(scope.row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="参数绑定" name="bindings">
        <el-table v-loading="loading" :data="bindings" height="100%">
          <el-table-column label="参数" min-width="200">
            <template #default="scope">
              {{ parameterName(scope.row.parameterDefinitionId) }}
            </template>
          </el-table-column>
          <el-table-column label="站点参数组" min-width="150">
            <template #default="scope">
              {{ groupName(scope.row.stationParameterGroupId) }}
            </template>
          </el-table-column>
          <el-table-column prop="displayNameOverride" label="显示名覆盖" min-width="140">
            <template #default="scope">
              {{ scope.row.displayNameOverride || '使用默认值' }}
            </template>
          </el-table-column>
          <el-table-column prop="unitOverride" label="单位覆盖" min-width="110">
            <template #default="scope">
              {{ scope.row.unitOverride || '使用默认值' }}
            </template>
          </el-table-column>
          <el-table-column prop="decimalPlacesOverride" label="小数位覆盖" width="120">
            <template #default="scope">
              {{ scope.row.decimalPlacesOverride ?? '默认' }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="scope">
              <el-button link type="primary" :icon="Edit" @click="editBinding(scope.row)">
                编辑
              </el-button><el-button link type="danger" :icon="Delete" @click="removeBinding(scope.row)">
                解绑
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="groupDialog" :title="editingGroupId ? '编辑站点参数组' : '新增站点参数组'" width="500px">
      <el-form :model="groupForm" label-width="130px">
        <el-form-item label="参数组名称" required>
          <el-input v-model="groupForm.name" />
        </el-form-item>
        <el-form-item label="参数组类型">
          <el-radio-group v-model="groupForm.groupKind">
            <el-radio value="Monitoring">
              监测参数
            </el-radio><el-radio value="System">
              系统参数
            </el-radio>
          </el-radio-group>
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

    <el-dialog v-model="bindingDialog" :title="editingBindingId ? '编辑参数绑定' : '新增参数绑定'" width="560px">
      <el-form :model="bindingForm" label-width="130px">
        <el-form-item label="参数定义" required>
          <el-select v-model="bindingForm.parameterDefinitionId" filterable style="width: 100%">
            <el-option v-for="item in parameterDefinitions" :key="item.id" :label="`${item.name}（${item.code}）`" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="站点参数组" required>
          <el-select v-model="bindingForm.stationParameterGroupId" style="width: 100%">
            <el-option v-for="item in stationGroups" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="显示名称覆盖">
          <el-input v-model="bindingForm.displayNameOverride" placeholder="留空使用参数默认名称" />
        </el-form-item>
        <el-form-item label="单位覆盖">
          <el-input v-model="bindingForm.unitOverride" placeholder="留空使用参数默认单位" />
        </el-form-item>
        <el-form-item label="小数位覆盖">
          <el-input-number v-model="bindingForm.decimalPlacesOverride" :min="0" :max="10" clearable />
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
</style>
