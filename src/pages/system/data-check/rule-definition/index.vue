<script lang="ts" setup>
import type { FormRules } from "element-plus"
import type { CreateOrUpdateRuleDefinition, DataPoint, DataSource, RuleDefinition } from "@/common/apis/data-check/type"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { cloneDeep } from "lodash-es"
import {
  createRuleDefinitionApi,
  deleteRuleDefinitionApi,
  getDataPointsApi,
  getDataSourcesApi,
  getRuleDefinitionsApi,
  updateRuleDefinitionApi
} from "@/common/apis/data-check"
import { useRuleValueFields } from "@/common/hooks/useRuleValueFields"

defineOptions({
  name: "RuleDefinition"
})

const loading = ref(false)

// #region 增 + 改 表单逻辑
const defaultForm: CreateOrUpdateRuleDefinition = {
  id: undefined,
  dataSourceId: "",
  name: "",
  ruleType: 3,
  operator: 1,
  intervalMinutes: 0,
  enabled: true,
  sortOrder: 0
}

const dialogVisible = ref(false)
const formRef = useTemplateRef("formRef")
const formData = ref<CreateOrUpdateRuleDefinition>(cloneDeep(defaultForm))

// 数据源列表
const dataSources = ref<DataSource[]>([])
const selectedDataSourceId = ref<string | undefined>(undefined)

// 数据点列表
const dataPoints = ref<DataPoint[]>([])
const selectedDataPointId = ref<string | undefined>(undefined)

const formRules: FormRules = {
  name: [{ required: true, trigger: "blur", message: "请输入规则名称" }],
  ruleType: [{ required: true, trigger: "change", message: "请选择规则类型" }],
  operator: [{ required: true, trigger: "change", message: "请选择运算符" }],
  dataPointId: [{ required: true, trigger: "change", message: "请选择数据点" }]
}

function handleCreate() {
  dialogVisible.value = true
  formData.value = cloneDeep(defaultForm)
  if (selectedDataSourceId.value) {
    formData.value.dataSourceId = selectedDataSourceId.value
  }
  if (selectedDataPointId.value) {
    formData.value.dataPointId = selectedDataPointId.value
  }
}

function handleCreateOrUpdate() {
  formRef.value?.validate(async (valid: boolean) => {
    if (!valid) {
      ElMessage.error("表单校验不通过")
      return
    }
    loading.value = true
    try {
      if (formData.value.ruleType === 1) {
        formData.value.dataPointId = undefined
      }
      if (formData.value.id) {
        await updateRuleDefinitionApi(formData.value)
      } else {
        await createRuleDefinitionApi(formData.value)
      }
      ElMessage.success("操作成功")
      dialogVisible.value = false
    } finally {
      loading.value = false
      getRuleDefinitionData()
    }
  })
}

function resetForm() {
  formRef.value?.clearValidate()
  formData.value = cloneDeep(defaultForm)
}
// #endregion

// #region 删除
function handleDelete(row: RuleDefinition) {
  ElMessageBox.confirm(`正在删除规则定义：${row.name}，确认删除？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    await deleteRuleDefinitionApi(row.id)
    getRuleDefinitionData()
    ElMessage.success("删除成功")
  })
}
// #endregion

// #region 编辑
function handleUpdate(row: RuleDefinition) {
  dialogVisible.value = true
  formData.value = {
    id: row.id,
    tenantId: row.tenantId,
    dataSourceId: row.dataSourceId,
    dataPointId: row.dataPointId,
    name: row.name,
    ruleType: row.ruleType,
    operator: row.operator,
    intervalMinutes: row.intervalMinutes,
    value1: row.value1,
    value2: row.value2,
    enabled: row.enabled,
    description: row.description,
    sortOrder: row.sortOrder
  }
}
// #endregion

// #region 查
const ruleDefinitionData = ref<RuleDefinition[]>([])

function getRuleDefinitionData() {
  if (!selectedDataSourceId.value) {
    ElMessage.warning("请先选择数据源")
    ruleDefinitionData.value = []
    return
  }
  loading.value = true
  getRuleDefinitionsApi(selectedDataSourceId.value, selectedDataPointId.value).then(({ data }) => {
    console.log("获取规则定义数据", data)
    ruleDefinitionData.value = data
  }).catch(() => {
    ruleDefinitionData.value = []
  }).finally(() => {
    loading.value = false
  })
}
watch([selectedDataSourceId, selectedDataPointId], () => {
  getRuleDefinitionData()
})
// #endregion

// #region 获取数据源列表
function getDataSources() {
  getDataSourcesApi().then(({ data }) => {
    dataSources.value = data
  }).catch(() => {
    dataSources.value = []
  })
}
// #endregion

// #region 获取数据点列表
function getDataPoints() {
  selectedDataPointId.value = undefined
  dataPoints.value = []
  if (!selectedDataSourceId.value) {
    return
  }
  getDataPointsApi(selectedDataSourceId.value).then(({ data }) => {
    dataPoints.value = data
  }).catch(() => {
    dataPoints.value = []
  })
}

watch(selectedDataSourceId, () => {
  getDataPoints()
})

// #endregion

// 规则类型选项
const ruleTypeOptions = [
  { label: "心跳规则", value: 1 },
  { label: "位置规则", value: 2 },
  { label: "数值规则", value: 3 }
]

// 运算符选项
const operatorOptions = [
  { label: "> 大于", value: 1 },
  { label: "≥ 大于等于", value: 2 },
  { label: "< 小于", value: 3 },
  { label: "≤ 小于等于", value: 4 },
  { label: "= 等于", value: 5 },
  { label: "≠ 不等于", value: 6 },
  { label: "[] 在区间内", value: 7 },
  { label: "() 在区间外", value: 8 },
  { label: "∈ 在集合内", value: 9 },
  { label: "∉ 在集合外", value: 10 }
]

// 使用规则值字段 Hook
const {
  showOperator,
  showValue2,
  value1Label,
  value2Label,
  value1Placeholder,
  value2Placeholder
} = useRuleValueFields(() => ({
  ruleType: formData.value.ruleType,
  operator: formData.value.operator
}))

onMounted(() => {
  getDataSources()
})

function dialogDataPointIdSehectedChanged(id: string) {
  selectedDataPointId.value = id
  if (formData.value.id === undefined) {
    const dataName = dataPoints.value.find(dp => dp.id === id)?.dataName
    if (dataName) {
      formData.value.name = `检查${dataName}`
    }
  }
}

function dialogRuleTypeSelectedChanged(ruleType: number) {
  if (ruleType === 1) {
    formData.value.dataPointId = undefined
  }
}
</script>

<template>
  <div class="app-container">
    <el-card v-loading="loading" shadow="never">
      <div class="toolbar-wrapper">
        <div style="display: flex; align-items: center">
          <el-button type="primary" :icon="CirclePlus" @click="handleCreate">
            新增规则定义
          </el-button>
          <el-select v-model="selectedDataSourceId" clearable placeholder="筛选数据源" style="margin-left: 20px; min-width:300px">
            <el-option
              v-for="source in dataSources"
              :key="source.id"
              :label="source.sourceName"
              :value="source.id"
            />
          </el-select>
          <el-select v-model="selectedDataPointId" clearable :disabled="!selectedDataSourceId" placeholder="请选择数据点" style="margin-left: 20px; min-width:300px">
            <el-option
              v-for="point in dataPoints"
              :key="point.id"
              :label="point.dataName"
              :value="point.id"
            />
          </el-select>
        </div>
        <div>
          <el-tooltip content="刷新当前页">
            <el-button type="primary" :icon="RefreshRight" circle @click="getRuleDefinitionData" />
          </el-tooltip>
        </div>
      </div>
      <div class="table-wrapper">
        <el-table :data="ruleDefinitionData">
          <el-table-column prop="name" label="规则名称" align="left" />
          <el-table-column prop="dataPointName" label="数据点" align="left" />
          <el-table-column prop="ruleType" label="规则类型" width="100" align="center">
            <template #default="scope">
              <el-tag :type="scope.row.ruleType === 0 ? 'warning' : scope.row.ruleType === 1 ? 'danger' : 'info'">
                {{ ruleTypeOptions.find(opt => opt.value === scope.row.ruleType)?.label || '未知' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="value1" label="默认值1" width="140" align="center" />
          <el-table-column prop="value2" label="默认值2" width="140" align="center" />
          <el-table-column prop="intervalMinutes" label="检查周期" width="100" align="center" />
          <el-table-column prop="bindingCount" label="绑定数量" width="100" align="center" />
          <el-table-column prop="sortOrder" label="排序" width="60" align="center" />
          <el-table-column prop="enabled" label="状态" align="center" width="80px">
            <template #default="scope">
              <el-tag :type="scope.row.enabled ? 'success' : 'info'">
                {{ scope.row.enabled ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column fixed="right" label="操作" width="160" align="center">
            <template #default="scope">
              <el-button type="primary" text bg size="small" @click="handleUpdate(scope.row)">
                修改
              </el-button>
              <el-button type="danger" text bg size="small" @click="handleDelete(scope.row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- 新增/修改 -->
    <el-dialog
      v-model="dialogVisible"
      :title="formData.id === undefined ? '新增规则定义' : '修改规则定义'"
      width="500px"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px" label-position="left">
        <el-form-item prop="name" label="规则名称">
          <el-input v-model="formData.name" placeholder="请输入规则名称" />
        </el-form-item>
        <el-form-item label="数据源">
          <el-select @change="val => selectedDataSourceId = val" v-model="formData.dataSourceId" placeholder="请选择数据源" style="width: 100%">
            <el-option
              v-for="source in dataSources"
              :key="source.id"
              :label="source.modelName"
              :value="source.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="ruleType" label="规则类型">
          <el-select @change="val => dialogRuleTypeSelectedChanged(val)" v-model="formData.ruleType" placeholder="请选择规则类型" style="width: 100%">
            <el-option
              v-for="option in ruleTypeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="formData.ruleType !== 1" prop="dataPointId" label="数据点">
          <el-select @change="val => dialogDataPointIdSehectedChanged(val)" :disabled="!formData.dataSourceId" v-model="formData.dataPointId" placeholder="请选择数据点" style="width: 100%">
            <el-option
              v-for="point in dataPoints"
              :key="point.id"
              :label="`${point.dataName} (${point.dataMapping})`"
              :value="point.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="showOperator" prop="operator" label="运算符">
          <el-select v-model="formData.operator" placeholder="请选择运算符" style="width: 100%">
            <el-option
              v-for="option in operatorOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="value1" :label="value1Label">
          <el-input v-model="formData.value1" :placeholder="value1Placeholder" />
        </el-form-item>
        <el-form-item v-if="showValue2" prop="value2" :label="value2Label">
          <el-input v-model="formData.value2" :placeholder="value2Placeholder" />
        </el-form-item>
        <el-form-item prop="intervalMinutes" label="检查间隔(分钟)">
          <el-input v-model="formData.intervalMinutes" placeholder="请输入检查间隔(分钟)" />
        </el-form-item>
        <el-form-item prop="enabled" label="启用状态">
          <el-switch v-model="formData.enabled" />
        </el-form-item>
        <el-form-item prop="sortOrder" label="排序">
          <el-input-number v-model="formData.sortOrder" :min="0" />
        </el-form-item>
        <el-form-item prop="description" label="描述">
          <el-input type="textarea" v-model="formData.description" placeholder="请输入描述（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" :loading="loading" @click="handleCreateOrUpdate">
          确认
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.toolbar-wrapper {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}
</style>
