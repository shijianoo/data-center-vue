<script setup lang="ts">
import type { ParameterCatalogGroup, ParameterDataType, ParameterDefinition, ParameterKind } from "../types"
import { Delete, Edit, Plus, Refresh, Search } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { onMounted, reactive, ref } from "vue"
import {
  createParameterCatalogGroup,
  createParameterDefinition,
  deleteParameterCatalogGroup,
  deleteParameterDefinition,
  getApiErrorMessage,
  getParameterCatalogGroups,
  getParameterDefinitions,
  updateParameterCatalogGroup,
  updateParameterDefinition
} from "../apis"

const activeTab = ref("groups")
const groups = ref<ParameterCatalogGroup[]>([])
const parameters = ref<ParameterDefinition[]>([])
const keyword = ref("")
const loading = ref(false)
const groupDialog = ref(false)
const parameterDialog = ref(false)
const editingGroupId = ref("")
const editingParameterId = ref("")

/** 参数目录表单字段。 */
const groupForm = reactive({ parentId: null as string | null, name: "", parameterKind: "Monitoring" as ParameterKind, sortOrder: 0 })
/** 参数定义表单字段。 */
const parameterForm = reactive({
  code: "",
  name: "",
  parameterKind: "Monitoring" as ParameterKind,
  catalogGroupId: "",
  dataType: "Decimal" as ParameterDataType,
  unit: "",
  decimalPlaces: 2,
  primaryMetricSuffix: "Rtd",
  sortOrder: 0,
  description: ""
})

const dataTypes: Array<{ value: ParameterDataType, label: string }> = [
  { value: "Decimal", label: "小数" },
  { value: "Integer", label: "整数" },
  { value: "Boolean", label: "布尔" },
  { value: "String", label: "文本" },
  { value: "DateTime", label: "日期时间" },
  { value: "Longitude", label: "经度" },
  { value: "Latitude", label: "纬度" },
  { value: "Enum", label: "枚举" }
]

/** 同时刷新目录和参数定义，确保下拉数据与列表一致。 */
async function loadData() {
  loading.value = true
  try {
    const [groupResponse, parameterResponse] = await Promise.all([
      getParameterCatalogGroups(),
      getParameterDefinitions({ keyword: keyword.value || undefined })
    ])
    groups.value = groupResponse.data ?? []
    parameters.value = parameterResponse.data.items ?? []
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "参数配置加载失败"))
  } finally {
    loading.value = false
  }
}

/** 打开新增或编辑目录对话框。 */
function editGroup(row?: ParameterCatalogGroup) {
  editingGroupId.value = row?.id || ""
  Object.assign(groupForm, row ? { name: row.name, parameterKind: row.parameterKind, sortOrder: row.sortOrder } : { name: "", parameterKind: "Monitoring", sortOrder: 0 })
  groupDialog.value = true
}

/** 保存目录分组。 */
async function saveGroup() {
  if (!groupForm.name.trim()) return ElMessage.warning("请输入分组名称")
  try {
    editingGroupId.value ? await updateParameterCatalogGroup(editingGroupId.value, { ...groupForm }) : await createParameterCatalogGroup({ ...groupForm })
    ElMessage.success("参数组保存成功")
    groupDialog.value = false
    await loadData()
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "参数组保存失败"))
  }
}

/** 删除没有引用的目录分组。 */
async function removeGroup(row: ParameterCatalogGroup) {
  await ElMessageBox.confirm(`确认删除参数组“${row.name}”？`, "删除确认", { type: "warning" })
  try {
    await deleteParameterCatalogGroup(row.id)
    ElMessage.success("删除成功")
    await loadData()
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "删除失败"))
  }
}

/** 打开新增或编辑参数定义对话框。 */
function editParameter(row?: ParameterDefinition) {
  editingParameterId.value = row?.id || ""
  Object.assign(parameterForm, row
    ? {
        code: row.code,
        name: row.name,
        parameterKind: row.parameterKind,
        catalogGroupId: row.catalogGroupId,
        dataType: row.dataType,
        unit: row.unit || "",
        decimalPlaces: row.decimalPlaces,
        primaryMetricSuffix: row.primaryMetricSuffix || "Rtd",
        sortOrder: row.sortOrder,
        description: row.description || ""
      }
    : { code: "", name: "", parameterKind: "Monitoring", catalogGroupId: groups.value[0]?.id || "", dataType: "Decimal", unit: "", decimalPlaces: 2, primaryMetricSuffix: "Rtd", sortOrder: 0, description: "" })
  parameterDialog.value = true
}

/** 保存参数定义。 */
async function saveParameter() {
  if (!parameterForm.code.trim() || !parameterForm.name.trim() || !parameterForm.catalogGroupId) return ElMessage.warning("请填写编码、名称并选择参数组")
  try {
    editingParameterId.value ? await updateParameterDefinition(editingParameterId.value, { ...parameterForm }) : await createParameterDefinition({ ...parameterForm })
    ElMessage.success("参数定义保存成功")
    parameterDialog.value = false
    await loadData()
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "参数定义保存失败"))
  }
}

/** 删除未被站点绑定的参数定义。 */
async function removeParameter(row: ParameterDefinition) {
  await ElMessageBox.confirm(`确认删除参数“${row.name}（${row.code}）”？`, "删除确认", { type: "warning" })
  try {
    await deleteParameterDefinition(row.id)
    ElMessage.success("删除成功")
    await loadData()
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "删除失败"))
  }
}

/** 根据主键显示目录分组名称。 */
function groupName(id: string) {
  return groups.value.find(item => item.id === id)?.name || id
}

onMounted(loadData)
</script>

<template>
  <section class="lw2-content">
    <div class="lw2-page-title">
      <h2>全局参数管理</h2>
      <el-space>
        <el-input v-if="activeTab === 'parameters'" v-model="keyword" clearable placeholder="编码或名称" :prefix-icon="Search" @keyup.enter="loadData" />
        <el-button :icon="Refresh" @click="loadData">
          刷新
        </el-button>
        <el-button type="primary" :icon="Plus" @click="activeTab === 'groups' ? editGroup() : editParameter()">
          新增{{ activeTab === 'groups' ? '参数组' : '参数' }}
        </el-button>
      </el-space>
    </div>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="参数组" name="groups">
        <el-table v-loading="loading" :data="groups" height="100%">
          <el-table-column prop="name" label="分组名称" min-width="180" />
          <el-table-column prop="parameterKind" label="参数类型" width="130">
            <template #default="scope">
              <el-tag>{{ scope.row.parameterKind === 'Monitoring' ? '监测参数' : '系统参数' }}</el-tag>
            </template>
          </el-table-column>
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
      <el-tab-pane label="参数定义" name="parameters">
        <el-table v-loading="loading" :data="parameters" height="100%">
          <el-table-column prop="code" label="参数编码" width="120" fixed />
          <el-table-column prop="name" label="参数名称" min-width="150" fixed />
          <el-table-column label="所属参数组" min-width="150">
            <template #default="scope">
              {{ groupName(scope.row.catalogGroupId) }}
            </template>
          </el-table-column>
          <el-table-column prop="dataType" label="数据类型" width="120" />
          <el-table-column prop="unit" label="单位" width="90" />
          <el-table-column prop="decimalPlaces" label="小数位" width="90" align="right" />
          <el-table-column prop="primaryMetricSuffix" label="主值后缀" width="110" />
          <el-table-column prop="description" label="说明" min-width="180" show-overflow-tooltip />
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="scope">
              <el-button link type="primary" :icon="Edit" @click="editParameter(scope.row)">
                编辑
              </el-button><el-button link type="danger" :icon="Delete" @click="removeParameter(scope.row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="groupDialog" :title="editingGroupId ? '编辑参数组' : '新增参数组'" width="480px">
      <el-form :model="groupForm" label-width="92px">
        <el-form-item label="分组名称" required>
          <el-input v-model="groupForm.name" maxlength="100" />
        </el-form-item>
        <el-form-item label="上级分组">
          <el-select v-model="groupForm.parentId" clearable style="width: 100%">
            <el-option v-for="item in groups.filter(item => item.id !== editingGroupId)" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="参数类型">
          <el-radio-group v-model="groupForm.parameterKind">
            <el-radio value="Monitoring">
              监测参数
            </el-radio><el-radio value="System">
              系统参数
            </el-radio>
          </el-radio-group>
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

    <el-dialog v-model="parameterDialog" :title="editingParameterId ? '编辑参数' : '新增参数'" width="650px">
      <el-form :model="parameterForm" label-width="110px">
        <el-row :gutter="18">
          <el-col :span="12">
            <el-form-item label="参数编码" required>
              <el-input v-model="parameterForm.code" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="参数名称" required>
              <el-input v-model="parameterForm.name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属参数组" required>
              <el-select v-model="parameterForm.catalogGroupId" style="width: 100%">
                <el-option v-for="item in groups" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="数据类型">
              <el-select v-model="parameterForm.dataType" style="width: 100%">
                <el-option v-for="item in dataTypes" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="参数类型">
              <el-select v-model="parameterForm.parameterKind" style="width: 100%">
                <el-option label="监测参数" value="Monitoring" /><el-option label="系统参数" value="System" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单位">
              <el-input v-model="parameterForm.unit" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="小数位">
              <el-input-number v-model="parameterForm.decimalPlaces" :min="0" :max="10" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="主值后缀">
              <el-input v-model="parameterForm.primaryMetricSuffix" placeholder="Rtd" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序">
              <el-input-number v-model="parameterForm.sortOrder" :min="0" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="说明">
          <el-input v-model="parameterForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="parameterDialog = false">
          取消
        </el-button><el-button type="primary" @click="saveParameter">
          保存
        </el-button>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped lang="scss">
@use "../styles.scss";
</style>
