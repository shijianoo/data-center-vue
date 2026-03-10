<script lang="ts" setup>
import type { FormRules } from "element-plus"
import type { CreateOrUpdateDeviceCommand, DeviceCommand } from "@/common/apis/device-control/type"
import type { DeviceModelSummary } from "@/common/apis/device-models/type"
import type { DeviceSummary } from "@/common/apis/devices/type"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { cloneDeep } from "lodash-es"
import { createDeviceCommandApi, deleteDeviceCommandApi, getDeviceCommandsApi, updateDeviceCommandApi } from "@/common/apis/device-control"
import { getDeviceModelSummariesApi } from "@/common/apis/device-models"
import { getDeviceSummariesApi } from "@/common/apis/devices"
import { formatDateTime } from "@/common/utils/datetime"
import { commandStatusText, dispatchModeText } from "@/common/utils/device-control"

const models = ref<DeviceModelSummary[]>([])
const selectedModel = ref<DeviceModelSummary | undefined>(undefined)
const selectedModelId = ref<string | null>(null)

const devices = ref<DeviceSummary[]>([])
const selectedDevice = ref<DeviceSummary | undefined>(undefined)
const selectedDeviceId = ref<string | null>(null)

watch(selectedModelId, async () => {
  selectedModel.value = models.value.find(m => m.id === selectedModelId.value)
  const { data: deviceList } = await getDeviceSummariesApi(selectedModelId.value!)
  devices.value = deviceList
})

watch(selectedDeviceId, async () => {
  if (selectedDeviceId.value) {
    selectedDevice.value = devices.value.find(m => m.id === selectedDeviceId.value)
    getDeviceCommandList()
  } else {
    commandList.value = []
  }
})

// #region 增 + 改 表单逻辑
const defaultForm: CreateOrUpdateDeviceCommand = {
  id: undefined,
  deviceId: "",
  command: "",
  dispatchMode: 1,
  requiresAck: false,
  requiresResponse: false
}

const dialogVisible = ref(false)
const formRef = useTemplateRef("formRef")
const formData = ref<CreateOrUpdateDeviceCommand>(cloneDeep(defaultForm))

const formRules: FormRules = {
  deviceId: [{ required: true, trigger: "blur", message: "请输入设备" }],
  command: [{ required: true, trigger: "blur", message: "请输入命令" }]
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
        await updateDeviceCommandApi(formData.value)
      } else {
        await createDeviceCommandApi(formData.value)
      }
      ElMessage.success("操作成功")
      dialogVisible.value = false
    } finally {
      loading.value = false
      getDeviceCommandList()
    }
  })
}

function resetForm() {
  formRef.value?.clearValidate()
  formData.value = cloneDeep(defaultForm)
}
// #endregion

// #region 查询设备命令
const loading = ref(false)
const commandList = ref<DeviceCommand[]>([])

function getDeviceCommandList() {
  if (!selectedDeviceId.value) {
    ElMessage.warning("请选择设备")
    return
  }

  loading.value = true
  getDeviceCommandsApi(selectedDeviceId.value).then(({ data }) => {
    console.log("获取命令数据", data)
    commandList.value = data
  }).catch(() => {
    commandList.value = []
  }).finally(() => {
    loading.value = false
  })
}
// #endregion

function handleCreate() {
  if (!selectedModelId.value) {
    ElMessage.warning("请选择型号")
    return
  }

  if (selectedDeviceId.value) {
    formData.value.deviceId = selectedDeviceId.value
  }
  dialogVisible.value = true
}

// #region 删除
function handleDelete(row: DeviceCommand) {
  ElMessageBox.confirm(`正在删除设备指令：${row.command}，确认删除？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    await deleteDeviceCommandApi(row.id)
    getDeviceCommandList()
    ElMessage.success("删除成功")
  })
}
// #endregion

// #region 编辑
function handleUpdate(row: DeviceCommand) {
  dialogVisible.value = true
  formData.value = {
    id: row.id,
    deviceId: row.deviceId,
    displayName: row.displayName,
    command: row.command,
    parameter: row.parameter,
    dispatchMode: row.dispatchMode,
    dispatchTarget: row.dispatchTarget,
    requiresAck: row.requiresAck,
    requiresResponse: row.requiresResponse,
    expiredTime: row.expiredTime,
    maxRetryCount: row.maxRetryCount,
    description: row.description
  }
}
// #endregion

onMounted(async () => {
  const { data: modelList } = await getDeviceModelSummariesApi()
  models.value = modelList
  console.log("获取型号数据", modelList)
})
</script>

<template>
  <div class="app-container">
    <el-card shadow="never" class="search-wrapper">
      <el-form :inline="true">
        <el-form-item label="型号">
          <el-select
            v-model="selectedModelId"
            placeholder="请选择型号"
            clearable
            filterable
            style="min-width: 240px"
          >
            <el-option
              v-for="item in models"
              :key="item.id"
              :label="`${item.modelName}-${item.modelNumber}`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="设备">
          <el-select
            v-model="selectedDeviceId"
            placeholder="请选择设备"
            clearable
            filterable
            style="min-width: 240px"
          >
            <el-option
              v-for="item in devices"
              :key="item.id"
              :label="`${item.serialNumber}-${item.deviceName}`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-loading="loading" shadow="never">
      <div class="toolbar-wrapper">
        <div>
          <el-button type="primary" :icon="CirclePlus" @click="handleCreate">
            下发命令
          </el-button>
        </div>
        <div>
          <el-tooltip content="刷新当前页">
            <el-button type="primary" :icon="RefreshRight" circle @click="getDeviceCommandList" />
          </el-tooltip>
        </div>
      </div>
      <div class="table-wrapper">
        <el-card shadow="never">
          <el-table :data="commandList">
            <el-table-column label="指令" align="left">
              <template #default="{ row }">
                <span v-if="row.displayName">
                  {{ `${row.displayName} (${row.command})` }}
                </span>
                <span v-else>
                  {{ row.command }}
                </span>
              </template>
            </el-table-column>

            <el-table-column prop="parameter" label="参数" align="left" />

            <el-table-column prop="dispatchMode" width="130" label="下发模式" align="left">
              <template #default="{ row }">
                <span>{{ dispatchModeText(row.dispatchMode) }}</span>
              </template>
            </el-table-column>

            <el-table-column prop="sentTime" label="发送时间" align="center">
              <template #default="{ row }">
                {{ row.sentTime ? formatDateTime(row.sentTime) : '-' }}
              </template>
            </el-table-column>

            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag size="small">
                  {{ commandStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="requiresAck" label="需要确认" width="80" align="center">
              <template #default="{ row }">
                <el-tag type="success" v-if="row.requiresAck">
                  是
                </el-tag>
                <el-tag type="info" v-else>
                  否
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="requiresResponse" label="需要响应" width="80" align="center">
              <template #default="{ row }">
                <el-tag type="success" v-if="row.requiresResponse">
                  是
                </el-tag>
                <el-tag type="info" v-else>
                  否
                </el-tag>
              </template>
            </el-table-column>
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

    <el-dialog
      v-model="dialogVisible"
      :title="formData.id === undefined ? '下发命令' : '修改命令'"
      width="600px"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" label-position="left">
        <el-form-item prop="deviceId" label="目标设备">
          <el-select :disabled="formData.id !== undefined" v-model="formData.deviceId" placeholder="请选择目标设备" style="width: 100%">
            <el-option
              v-for="device in devices"
              :key="device.id"
              :label="device.serialNumber"
              :value="device.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="command" label="命令编码">
          <el-input v-model="formData.command" placeholder="请输入命令编码" />
        </el-form-item>
        <el-form-item prop="parameter" label="命令参数">
          <el-input v-model="formData.parameter" placeholder="请输入命令参数" />
        </el-form-item>
        <el-form-item prop="displayName" label="命令名称">
          <el-input v-model="formData.displayName" placeholder="请输入命令名称" />
        </el-form-item>
        <el-form-item prop="dispatchMode" label="下发方式">
          <el-select v-model="formData.dispatchMode" placeholder="请选择下发方式" style="width: 100%">
            <el-option label="HTTP 被动下发" :value="1" />
            <el-option label="HTTP 主动拉取" :value="2" />
            <el-option label="MQTT 主动推送" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item prop="dispatchTarget" label="下发目标">
          <el-input v-model="formData.dispatchTarget" placeholder="请输入下发目标" />
        </el-form-item>
        <el-form-item prop="requiresAck" label="是否要确认">
          <el-switch v-model="formData.requiresAck" />
        </el-form-item>
        <el-form-item prop="requiresResponse" label="是否要响应">
          <el-switch v-model="formData.requiresResponse" />
        </el-form-item>
        <el-form-item prop="expiredTime" label="过期时间">
          <el-date-picker
            v-model="formData.expiredTime"
            type="date"
            aria-label="选择过期时间"
            placeholder="选择过期时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item prop="sortOrder" label="最大重试次数">
          <el-input-number v-model="formData.maxRetryCount" :min="0" />
        </el-form-item>
        <!-- <el-form-item prop="isActive" label="启用状态">
          <el-switch v-model="formData.isActive" />
        </el-form-item>
        <el-form-item prop="sortOrder" label="排序">
          <el-input-number v-model="formData.sortOrder" :min="0" />
        </el-form-item> -->
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
