<script lang="ts" setup>
import type { FormRules } from "element-plus"
import type { CreateOrUpdateDataSource, DataSource } from "@/common/apis/data-check/type"
import type { DeviceModelSummary } from "@/common/apis/device-models/type"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { cloneDeep } from "lodash-es"
import {
  createDataSourceApi,
  deleteDataSourceApi,
  getDataSourcesApi,
  updateDataSourceApi
} from "@/common/apis/data-check"
import { getDeviceModelSummariesApi } from "@/common/apis/device-models"

defineOptions({
  name: "DataSource"
})

const loading = ref(false)

// #region 增 + 改 表单逻辑
const defaultForm: CreateOrUpdateDataSource = {
  id: undefined,
  deviceModelId: "",
  sourceName: "",
  sourceType: 1,
  resourceName: "",
  intervalMinutes: 5,
  sortOrder: 0
}

// 数据源类型选项
const sourceTypeOptions = [
  { label: "InfluxDB", value: 1 }
]

const dialogVisible = ref(false)
const formRef = useTemplateRef("formRef")
const formData = ref<CreateOrUpdateDataSource>(cloneDeep(defaultForm))

// 设备型号列表
const deviceModels = ref<DeviceModelSummary[]>([])

const formRules: FormRules = {
  deviceModelId: [{ required: true, trigger: "change", message: "请选择设备型号" }],
  sourceName: [{ required: true, trigger: "blur", message: "请输入数据源名称" }],
  sourceType: [{ required: true, trigger: "change", message: "请选择数据源类型" }],
  resourceName: [{ required: true, trigger: "blur", message: "请输入资源名称" }],
  intervalMinutes: [{ required: true, trigger: "blur", message: "请输入检查间隔（分钟）" }]
}

function handleCreateOrUpdate() {
  formRef.value?.validate(async (valid: boolean) => {
    if (!valid) {
      ElMessage.error("表单校验不通过")
      return
    }
    loading.value = true
    try {
      if (formData.value.id) {
        await updateDataSourceApi(formData.value)
      } else {
        await createDataSourceApi(formData.value)
      }
      ElMessage.success("操作成功")
      dialogVisible.value = false
    } finally {
      loading.value = false
      getDataSourceData()
    }
  })
}

function resetForm() {
  formRef.value?.clearValidate()
  formData.value = cloneDeep(defaultForm)
}
// #endregion

// #region 删除
function handleDelete(row: DataSource) {
  ElMessageBox.confirm(`正在删除数据源：${row.sourceName}，确认删除？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    await deleteDataSourceApi(row.id)
    getDataSourceData()
    ElMessage.success("删除成功")
  })
}
// #endregion

// #region 编辑
function handleUpdate(row: DataSource) {
  dialogVisible.value = true
  formData.value = {
    id: row.id,
    deviceModelId: row.deviceModelId,
    modelName: row.modelName,
    sourceName: row.sourceName,
    sourceType: row.sourceType,
    resourceName: row.resourceName,
    intervalMinutes: row.intervalMinutes,
    description: row.description,
    sortOrder: row.sortOrder
  }
}
// #endregion

// #region 查
const dataSourceData = ref<DataSource[]>([])

function getDataSourceData() {
  loading.value = true
  getDataSourcesApi().then(({ data }) => {
    console.log("获取数据源数据", data)
    dataSourceData.value = data
  }).catch(() => {
    console.log("获取数据源数据失败")
    dataSourceData.value = []
  }).finally(() => {
    loading.value = false
  })
}
// #endregion

// #region 获取设备型号列表
function getDeviceModels() {
  getDeviceModelSummariesApi().then(({ data }) => {
    deviceModels.value = data
  }).catch(() => {
    deviceModels.value = []
  })
}
// #endregion

function handleDeviceModelChange() {
  const selectedModel = deviceModels.value.find(model => model.id === formData.value.deviceModelId)
  formData.value.modelName = selectedModel ? `${selectedModel.modelName} - ${selectedModel.modelNumber}` : ""
}

onMounted(() => {
  getDataSourceData()
  getDeviceModels()
})
</script>

<template>
  <div class="app-container">
    <el-card v-loading="loading" shadow="never">
      <div class="toolbar-wrapper">
        <div>
          <el-button type="primary" :icon="CirclePlus" @click="dialogVisible = true">
            新增数据源
          </el-button>
        </div>
        <div>
          <el-tooltip content="刷新当前页">
            <el-button type="primary" :icon="RefreshRight" circle @click="getDataSourceData" />
          </el-tooltip>
        </div>
      </div>
      <div class="table-wrapper">
        <el-table :data="dataSourceData">
          <el-table-column prop="modelName" label="型号名称" align="left" />
          <el-table-column prop="sourceName" label="数据源名称" align="left" />
          <el-table-column prop="sourceType" label="数据源类型" align="left">
            <template #default="scope">
              <el-tag :type="scope.row.sourceType === 0 ? 'primary' : scope.row.sourceType === 1 ? 'success' : 'warning'">
                {{ sourceTypeOptions.find(opt => opt.value === scope.row.sourceType)?.label || '未知' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="resourceName" label="资源名称" align="left" />
          <el-table-column prop="intervalMinutes" label="默认检查周期" width="120" align="center" />
          <el-table-column prop="dataPoints" label="定义的数据点数量" width="140" align="center">
            <template #default="scope">
              {{ scope.row.dataPoints.length }}
            </template>
          </el-table-column>
          <el-table-column prop="sortOrder" label="排序" width="60" align="center" />
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
      :title="formData.id === undefined ? '新增数据源' : '修改数据源'"
      width="500px"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px" label-position="left">
        <el-form-item prop="deviceModelId" label="设备型号">
          <el-select @change="handleDeviceModelChange" v-model="formData.deviceModelId" placeholder="请选择设备型号" style="width: 100%">
            <el-option
              v-for="model in deviceModels"
              :key="model.id"
              :label="`${model.modelName} (${model.modelNumber})`"
              :value="model.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="modelName" label="型号名称">
          <el-input v-model="formData.modelName" placeholder="请输入型号名称" />
        </el-form-item>
        <el-form-item prop="sourceName" label="数据源名称">
          <el-input v-model="formData.sourceName" placeholder="请输入数据源名称" />
        </el-form-item>
        <el-form-item prop="sourceType" label="数据源类型">
          <el-select v-model="formData.sourceType" placeholder="请选择数据源类型" style="width: 100%">
            <el-option
              v-for="option in sourceTypeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="resourceName" label="资源名称">
          <el-input v-model="formData.resourceName" placeholder="请输入资源名称" />
        </el-form-item>
        <el-form-item prop="intervalMinutes" label="检查间隔(分钟)">
          <el-input v-model="formData.intervalMinutes" placeholder="请输入检查间隔(分钟)" />
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
