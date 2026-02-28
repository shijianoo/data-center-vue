<script lang="ts" setup>
import type { FormRules } from "element-plus"
import type { CreateOrUpdateDataPoint, DataPoint, DataSource } from "@/common/apis/data-check/type"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { cloneDeep } from "lodash-es"
import {
  createDataPointApi,
  deleteDataPointApi,
  getDataPointsApi,
  getDataSourcesApi,
  updateDataPointApi
} from "@/common/apis/data-check"

defineOptions({
  name: "DataPoint"
})

const loading = ref(false)

// #region 增 + 改 表单逻辑
const defaultForm: CreateOrUpdateDataPoint = {
  id: undefined,
  dataSourceId: "",
  dataMapping: "",
  dataName: "",
  sortOrder: 0
}

const dialogVisible = ref(false)
const formRef = useTemplateRef("formRef")
const formData = ref<CreateOrUpdateDataPoint>(cloneDeep(defaultForm))

// 数据源列表
const dataSources = ref<DataSource[]>([])
const selectedDataSourceId = ref<string | undefined>(undefined)

const formRules: FormRules = {
  dataSourceId: [{ required: true, trigger: "change", message: "请选择数据源" }],
  dataMapping: [{ required: true, trigger: "blur", message: "请输入数据映射" }],
  dataName: [{ required: true, trigger: "blur", message: "请输入数据点名称" }]
}

function handleCreate() {
  dialogVisible.value = true
  formData.value = cloneDeep(defaultForm)
  if (selectedDataSourceId.value) {
    formData.value.dataSourceId = selectedDataSourceId.value
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
      if (formData.value.id) {
        await updateDataPointApi(formData.value)
      } else {
        await createDataPointApi(formData.value)
      }
      ElMessage.success("操作成功")
      dialogVisible.value = false
    } finally {
      loading.value = false
      getDataPointData()
    }
  })
}

function resetForm() {
  formRef.value?.clearValidate()
  formData.value = cloneDeep(defaultForm)
}
// #endregion

// #region 删除
function handleDelete(row: DataPoint) {
  ElMessageBox.confirm(`正在删除数据点：${row.dataName}，确认删除？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    await deleteDataPointApi(row.id)
    getDataPointData()
    ElMessage.success("删除成功")
  })
}
// #endregion

// #region 编辑
function handleUpdate(row: DataPoint) {
  dialogVisible.value = true
  formData.value = {
    id: row.id,
    dataSourceId: row.dataSourceId,
    dataMapping: row.dataMapping,
    dataName: row.dataName,
    unit: row.unit,
    description: row.description,
    sortOrder: row.sortOrder
  }
}
// #endregion

// #region 查
const dataPointData = ref<DataPoint[]>([])

function getDataPointData() {
  if (!selectedDataSourceId.value) {
    dataPointData.value = []
    ElMessage.warning("请先选择数据源")
    return
  }
  loading.value = true
  getDataPointsApi(selectedDataSourceId.value).then(({ data }) => {
    console.log("获取数据点数据", data)
    dataPointData.value = data
    ElMessage.success("获取数据点成功")
  }).catch(() => {
    dataPointData.value = []
    ElMessage.error("获取数据点失败")
  }).finally(() => {
    loading.value = false
  })
}

watch(selectedDataSourceId, () => {
  getDataPointData()
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

onMounted(() => {
  getDataPointData()
  getDataSources()
})
</script>

<template>
  <div class="app-container">
    <el-card v-loading="loading" shadow="never">
      <div class="toolbar-wrapper">
        <div style="display: flex; align-items: center">
          <el-button type="primary" :icon="CirclePlus" @click="handleCreate">
            新增数据点
          </el-button>
          <el-select v-model="selectedDataSourceId" clearable placeholder="筛选数据源" style="margin-left: 20px; min-width:300px">
            <el-option
              v-for="source in dataSources"
              :key="source.id"
              :label="source.sourceName"
              :value="source.id"
            />
          </el-select>
        </div>
        <div>
          <el-tooltip content="刷新当前页">
            <el-button type="primary" :icon="RefreshRight" circle @click="getDataPointData" />
          </el-tooltip>
        </div>
      </div>
      <div class="table-wrapper">
        <el-table :data="dataPointData">
          <el-table-column prop="dataName" label="数据点名称" align="left" />
          <el-table-column prop="dataMapping" label="字段映射" align="left" />
          <el-table-column prop="description" label="描述" align="left" />
          <el-table-column prop="unit" label="单位" width="100" align="center" />
          <el-table-column prop="ruleCount" label="规则数量" width="100" align="center" />
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
      :title="formData.id === undefined ? '新增数据点' : '修改数据点'"
      width="500px"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px" label-position="left">
        <el-form-item prop="dataSourceId" label="数据源">
          <el-select v-model="formData.dataSourceId" placeholder="请选择数据源" style="width: 100%">
            <el-option
              v-for="source in dataSources"
              :key="source.id"
              :label="`${source.sourceName} (${source.modelName})`"
              :value="source.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="dataName" label="数据点名称">
          <el-input v-model="formData.dataName" placeholder="请输入数据点名称" />
        </el-form-item>
        <el-form-item prop="dataMapping" label="数据映射">
          <el-input v-model="formData.dataMapping" placeholder="请输入数据映射" />
        </el-form-item>
        <el-form-item prop="unit" label="单位">
          <el-input v-model="formData.unit" placeholder="请输入单位（可选）" />
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
