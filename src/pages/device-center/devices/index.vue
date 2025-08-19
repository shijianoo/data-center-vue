<script lang="ts" setup>
import type { FormRules } from "element-plus"
import type { CreateOrUpdateDeviceDto, Device } from "@/common/apis/devices/type"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { cloneDeep } from "lodash-es"
import { createDeviceApi, deleteDeviceApi, getDevicesApi, updateDeviceApi } from "@/common/apis/devices"
import { useDeviceModels } from "@/common/hooks/useDeviceModels"

defineOptions({
  name: "Devices"
})

const loading = ref<boolean>(false)
const { deviceModels, fetchDeviceModels } = useDeviceModels()
const modelOptions = computed(() =>
  deviceModels.value.map(m => ({
    label: m.modelName ? `${m.modelNumber}-${m.modelName}(${m.devices.length})` : `${m.modelNumber}(${m.devices.length})`,
    value: m.id
  }))
)

const searchData = ref({
  modelId: ""
})
const devices = ref<Device[]>([])

// #region 增 + 改 表单逻辑
const defaultForm: CreateOrUpdateDeviceDto = {
  id: undefined,
  deviceModelId: "",
  serialNumber: "",
  deviceName: "",
  description: ""
}

const dialogVisible = ref(false)
const formRef = useTemplateRef("formRef")
const formData = ref<CreateOrUpdateDeviceDto>(cloneDeep(defaultForm))

const formRules: FormRules<CreateOrUpdateDeviceDto> = {
  serialNumber: [{ required: true, trigger: "blur", message: "请输入设备型号" }]
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
        await updateDeviceApi(formData.value)
      } else {
        await createDeviceApi(formData.value)
      }
      ElMessage.success("操作成功")
      dialogVisible.value = false
    } finally {
      fetchDevices()
      loading.value = false
    }
  })
}
function resetForm() {
  formRef.value?.clearValidate()
  formData.value = cloneDeep(defaultForm)
}

function handleCreate() {
  if (searchData.value.modelId) {
    formData.value.deviceModelId = searchData.value.modelId
  } else {
    ElMessage.warning("请先选择设备型号")
    return
  }
  dialogVisible.value = true
}
// #endregion

// #region 编辑
function handleUpdate(row: Device) {
  dialogVisible.value = true
  formData.value = {
    id: row.id,
    deviceModelId: row.deviceModelId,
    serialNumber: row.serialNumber,
    deviceName: row.deviceName || "",
    description: row.description || ""
  }
}
// #endregion

// #region 删除
async function handleDelete(device: Device) {
  ElMessageBox.confirm(`正在删除设备：${device.serialNumber}，确认删除？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    await deleteDeviceApi(device.id)
    fetchDevices()
    ElMessage.success("删除成功")
  })
}
// #endregion

// #region 查询
async function fetchDevices() {
  if (!searchData.value.modelId) {
    ElMessage.warning("请先选择设备型号")
    return
  }
  loading.value = true
  try {
    const { data } = await getDevicesApi(searchData.value.modelId)
    devices.value = data
    return data
  } catch {
    ElMessage.error("获取设备列表失败")
    devices.value = []
    return []
  } finally {
    loading.value = false
  }
}

watch(
  () => searchData.value.modelId,
  async () => {
    await fetchDevices()
  },
  { immediate: true }
)

onMounted(() => {
  fetchDeviceModels()
})
// #endregion
</script>

<template>
  <div class="app-container">
    <el-card shadow="never" class="search-wrapper">
      <el-form :inline="true" :model="searchData">
        <el-form-item label="设备型号">
          <el-select
            v-model="searchData.modelId"
            placeholder="请选择设备型号"
            clearable
            filterable
            style="min-width: 240px"
          >
            <el-option
              v-for="item in modelOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary">
            查询
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-loading="loading" shadow="never">
      <div class="toolbar-wrapper">
        <div>
          <el-button type="primary" :icon="CirclePlus" @click="handleCreate">
            注册设备
          </el-button>
        </div>
        <div>
          <el-tooltip content="刷新当前页">
            <el-button type="primary" :icon="RefreshRight" circle @click="fetchDevices" />
          </el-tooltip>
        </div>
      </div>
      <div class="table-wrapper">
        <el-card shadow="never">
          <el-table :data="devices">
            <el-table-column prop="serialNumber" label="设备编号" align="center" />
            <el-table-column prop="deviceName" label="设备名称" align="center" />
            <el-table-column prop="description" label="备注" align="center" />
            <el-table-column fixed="right" label="操作" width="200" align="center">
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
        </el-card>
      </div>
    </el-card>

    <!-- 新增/修改 -->
    <el-dialog
      v-model="dialogVisible"
      :title="formData.id === undefined ? '注册设备' : '修改设备'"
      width="30%"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" label-position="left">
        <el-form-item prop="serialNumber" label="序列号">
          <el-input v-model="formData.serialNumber" placeholder="请输入" />
        </el-form-item>
        <el-form-item prop="deviceName" label="设备名称">
          <el-input v-model="formData.deviceName" placeholder="请输入" />
        </el-form-item>
        <el-form-item prop="description" label="设备描述">
          <el-input v-model="formData.description" placeholder="请输入" />
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
.search-wrapper {
  margin-bottom: 5px;
  :deep(.el-card__body) {
    padding-bottom: 2px;
  }
}

.toolbar-wrapper {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.table-wrapper {
  margin-bottom: 20px;
}
</style>
