<script lang="ts" setup>
import type { FormRules } from "element-plus"
import type { CreateOrUpdateDeviceModelDto, DeviceModel } from "@/common/apis/device-models/type"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { cloneDeep } from "lodash-es"
import { createDeviceModelApi, deleteDeviceModelsApi, updateDeviceModelApi } from "@/common/apis/device-models"
import { useDeviceModels } from "@/common/hooks/useDeviceModels"

defineOptions({
  name: "设备型号"
})
const loading = ref<boolean>(false)
const { deviceModels, fetchDeviceModels } = useDeviceModels()

// #region 增 + 改 表单逻辑
const defaultForm: CreateOrUpdateDeviceModelDto = {
  id: undefined,
  modelNumber: "",
  modelName: "",
  description: ""
}

const dialogVisible = ref(false)
const formRef = useTemplateRef("formRef")
const formData = ref<CreateOrUpdateDeviceModelDto>(cloneDeep(defaultForm))

const formRules: FormRules<CreateOrUpdateDeviceModelDto> = {
  modelNumber: [{ required: true, trigger: "blur", message: "请输入设备型号" }],
  modelName: [{ required: true, trigger: "blur", message: "请输入设备名称" }]
}
function handleCreateOrUpdate() {
  formRef.value?.validate(async (valid) => {
    if (!valid) {
      ElMessage.error("表单校验不通过")
      return
    }

    loading.value = true
    try {
      if (formData.value.id) {
        await updateDeviceModelApi(formData.value)
      } else {
        await createDeviceModelApi(formData.value)
      }
      ElMessage.success("操作成功")
      dialogVisible.value = false
    } finally {
      loading.value = false
    }
  })
}
function resetForm() {
  formRef.value?.clearValidate()
  formData.value = cloneDeep(defaultForm)
}
// #endregion

// #region 删除
function handleDelete(row: DeviceModel) {
  ElMessageBox.confirm(`正在删除型号：${row.modelNumber}，确认删除？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    await deleteDeviceModelsApi(row.id)
    ElMessage.success("删除成功")
    await fetchDeviceModels()
  })
}
// #endregion

// #region 编辑
function handleUpdate(row: DeviceModel) {
  dialogVisible.value = true
  formData.value = {
    id: row.id,
    modelNumber: row.modelNumber,
    modelName: row.modelName,
    description: row.description || ""
  }
}
// #endregion

// #region 复制ID
function handleCopyId(id: string) {
  navigator.clipboard.writeText(id).then(() => {
    ElMessage.success(`设备型号ID已复制: ${id}`)
  }).catch(() => {
    // 降级方案：使用传统方法复制
    const textArea = document.createElement("textarea")
    textArea.value = id
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand("copy")
    document.body.removeChild(textArea)
    ElMessage.success(`设备型号ID已复制: ${id}`)
  })
}
// #endregion

// #region 查询
onMounted(() => {
  fetchDeviceModels()
})
// #endregion
</script>

<template>
  <div class="app-container">
    <el-card v-loading="loading" shadow="never">
      <div class="toolbar-wrapper">
        <div>
          <el-button type="primary" :icon="CirclePlus" @click="dialogVisible = true">
            新增型号
          </el-button>
        </div>
        <div>
          <el-tooltip content="刷新当前页">
            <el-button type="primary" :icon="RefreshRight" circle @click="fetchDeviceModels" />
          </el-tooltip>
        </div>
      </div>
      <div class="table-wrapper">
        <el-table :data="deviceModels">
          <el-table-column prop="modelNumber" label="设备型号" align="center" />
          <el-table-column prop="modelName" label="设备名称" align="center" />
          <el-table-column prop="description" label="设备描述" align="center" />
          <el-table-column prop="devices.length" label="设备数量" align="center" />
          <el-table-column prop="bucketMap.bucketName" label="BucketName" align="center" />
          <el-table-column fixed="right" label="操作" width="200" align="center">
            <template #default="scope">
              <el-button type="primary" text bg size="small" @click="handleUpdate(scope.row)">
                修改
              </el-button>
              <el-button type="danger" text bg size="small" @click="handleDelete(scope.row)">
                删除
              </el-button>
              <el-button type="info" text bg size="small" @click="handleCopyId(scope.row.id)">
                复制ID
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
    <!-- 新增/修改 -->
    <el-dialog
      v-model="dialogVisible"
      :title="formData.id === undefined ? '新增型号' : '修改型号'"
      width="30%"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" label-position="left">
        <el-form-item prop="modelNumber" label="设备型号">
          <el-input v-model="formData.modelNumber" placeholder="请输入" />
        </el-form-item>
        <el-form-item prop="modelName" label="设备名称">
          <el-input v-model="formData.modelName" placeholder="请输入" />
        </el-form-item>
        <el-form-item prop="description" label="设备描述">
          <el-input v-model="formData.description" placeholder="请输入" />
        </el-form-item>
        <el-form-item v-if="formData.id === undefined" prop="bucketName" label="BucketName">
          <el-input v-model="formData.bucketName" placeholder="请输入" />
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
