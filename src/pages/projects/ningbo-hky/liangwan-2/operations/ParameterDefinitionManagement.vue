<script setup lang="ts">
import type { ParameterDataType, ParameterDefinition } from "../types"
import { Delete, Edit, Plus, Refresh, Search } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { computed, onMounted, reactive, ref } from "vue"
import {
  createParameterDefinition,
  deleteParameterDefinition,
  getApiErrorMessage,
  getParameterDefinitions,
  updateParameterDefinition
} from "../apis"

const parameters = ref<ParameterDefinition[]>([])
const keyword = ref("")
const loading = ref(false)
const parameterDialog = ref(false)
const editingParameterId = ref<number | null>(null)

/** 参数定义表单字段。 */
const parameterForm = reactive({
  code: "",
  name: "",
  groupName: "",
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

/** 提取所有已存在的分组名称，用于下拉框选择。 */
const availableGroupNames = computed(() => {
  const groups = new Set<string>()
  parameters.value.forEach((p) => {
    if (p.groupName) {
      groups.add(p.groupName)
    }
  })
  return Array.from(groups).sort()
})

/** 按分组排序参数，用于表格显示。未分组的排在最后。 */
const groupedParameters = computed(() => {
  return [...parameters.value].sort((a, b) => {
    const gA = a.groupName || "未分组"
    const gB = b.groupName || "未分组"
    if (gA === "未分组" && gB !== "未分组") return 1
    if (gB === "未分组" && gA !== "未分组") return -1
    return gA.localeCompare(gB)
  })
})

/** 表格合并行方法，合并相同分组名称的行。 */
function spanMethod({ row, rowIndex, columnIndex }: any) {
  if (columnIndex === 0) {
    const currentGroup = row.groupName || "未分组"
    const previousGroup = rowIndex > 0 ? (groupedParameters.value[rowIndex - 1].groupName || "未分组") : null

    if (currentGroup !== previousGroup) {
      let rowspan = 1
      for (let i = rowIndex + 1; i < groupedParameters.value.length; i++) {
        if ((groupedParameters.value[i].groupName || "未分组") === currentGroup) {
          rowspan++
        } else {
          break
        }
      }
      return { rowspan, colspan: 1 }
    } else {
      return { rowspan: 0, colspan: 0 }
    }
  }
}

/** 刷新参数定义。 */
async function loadData() {
  loading.value = true
  try {
    const parameterResponse = await getParameterDefinitions({ keyword: keyword.value || undefined })
    parameters.value = parameterResponse.data.items ?? []
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "参数配置加载失败"))
  } finally {
    loading.value = false
  }
}

/** 打开新增或编辑参数定义对话框。 */
function editParameter(row?: ParameterDefinition) {
  editingParameterId.value = row?.id ?? null
  Object.assign(parameterForm, row
    ? {
        code: row.code,
        name: row.name,
        groupName: row.groupName || "",
        dataType: row.dataType,
        unit: row.unit || "",
        decimalPlaces: row.decimalPlaces,
        primaryMetricSuffix: row.primaryMetricSuffix || "Rtd",
        sortOrder: row.sortOrder,
        description: row.description || ""
      }
    : { code: "", name: "", parameterKind: "Monitoring", groupName: "", dataType: "Decimal", unit: "", decimalPlaces: 2, primaryMetricSuffix: "Rtd", sortOrder: 0, description: "" })
  parameterDialog.value = true
}

/** 保存参数定义。 */
async function saveParameter() {
  if (!parameterForm.code.trim() || !parameterForm.name.trim()) return ElMessage.warning("请填写编码和名称")
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

onMounted(loadData)
</script>

<template>
  <section class="lw2-content">
    <div class="lw2-page-title">
      <h2>全局参数管理</h2>
      <el-space>
        <el-input v-model="keyword" clearable placeholder="编码或名称" :prefix-icon="Search" @keyup.enter="loadData" />
        <el-button :icon="Refresh" @click="loadData">
          刷新
        </el-button>
        <el-button type="primary" :icon="Plus" @click="editParameter()">
          新增参数
        </el-button>
      </el-space>
    </div>

    <div style="flex: 1; min-height: 0;">
      <el-table v-loading="loading" :data="groupedParameters" height="100%" :span-method="spanMethod" border>
        <el-table-column label="分组名称" width="150" fixed>
          <template #default="scope">
            <span style="font-weight: bold">{{ scope.row.groupName || '未分组' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="id" label="ID" width="120" fixed />
        <el-table-column prop="code" label="参数编码" width="120" fixed />
        <el-table-column prop="name" label="参数名称" min-width="150" fixed />
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
    </div>

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
            <el-form-item label="分组名称">
              <el-select v-model="parameterForm.groupName" filterable allow-create default-first-option placeholder="请选择或输入分组" style="width: 100%" clearable>
                <el-option v-for="name in availableGroupNames" :key="name" :label="name" :value="name" />
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
