<script lang="ts" setup>
import type { DeviceCommand } from "@/common/apis/device-control/type"
import type { DeviceModelSummary } from "@/common/apis/device-models/type"
import type { DeviceSummary } from "@/common/apis/devices/type"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { onMounted, ref, watch } from "vue"
import { deleteDeviceCommandApi, getDeviceCommandsApi } from "@/common/apis/device-control"
import { getDeviceModelSummariesApi } from "@/common/apis/device-models"
import { getDeviceSummariesApi } from "@/common/apis/devices"
import { formatDateTime } from "@/common/utils/datetime"
import { commandStatusText, dispatchModeText } from "@/common/utils/device-control-constants"
import DeviceControlEditDialog from "./components/DeviceControlEditDialog.vue"

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

const dialogVisible = ref(false)
const currentCommandData = ref<DeviceCommand | undefined>(undefined)

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

  if (!selectedDeviceId.value) {
    ElMessage.warning("请选择设备")
    return
  }

  currentCommandData.value = undefined
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
  currentCommandData.value = row
  dialogVisible.value = true
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
    <el-card v-loading="loading" shadow="never">
      <div class="toolbar-wrapper">
        <div class="toolbar-left">
          <el-form :inline="true" @submit.prevent>
            <el-form-item label="型号" style="margin-bottom: 0;">
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

            <el-form-item label="设备" style="margin-bottom: 0;">
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

            <el-form-item style="margin-bottom: 0;">
              <el-button type="primary" :icon="CirclePlus" @click="handleCreate">
                下发命令
              </el-button>
            </el-form-item>
          </el-form>
        </div>
        <div class="toolbar-right">
          <el-tooltip content="刷新当前页">
            <el-button type="primary" :icon="RefreshRight" circle @click="getDeviceCommandList" />
          </el-tooltip>
        </div>
      </div>
      <div class="table-wrapper">
        <el-table :data="commandList">
          <el-table-column type="expand">
            <template #default="scope">
              <div style="padding: 0 30px;">
                <!-- 基础配置信息 -->
                <el-descriptions size="small" title="基础扩展信息" :column="3" border style="margin-bottom: 20px;">
                  <el-descriptions-item label="事务ID(Correlation)">
                    {{ scope.row.correlationId || '-' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="过期时间">
                    {{ scope.row.expiresAt ? formatDateTime(scope.row.expiresAt) : '-' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="最大重试次数">
                    {{ scope.row.maxRetryCount ?? '-' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="需要确认">
                    <el-tag :type="scope.row.requiresAck ? 'success' : 'info'" size="small">
                      {{ scope.row.requiresAck ? '是' : '否' }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="需要响应">
                    <el-tag :type="scope.row.requiresResponse ? 'success' : 'info'" size="small">
                      {{ scope.row.requiresResponse ? '是' : '否' }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="创建时间">
                    {{ scope.row.createdAt ? formatDateTime(scope.row.createdAt) : '-' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="描述" :span="3">
                    {{ scope.row.description || '-' }}
                  </el-descriptions-item>
                </el-descriptions>

                <!-- 追踪与状态信息 -->
                <el-descriptions size="small" title="执行与状态追踪" :column="3" border>
                  <el-descriptions-item label="完成时间">
                    {{ scope.row.completedTime ? formatDateTime(scope.row.completedTime) : '-' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="确认时间(Ack)">
                    {{ scope.row.extra?.ackTime ? formatDateTime(scope.row.extra.ackTime) : '-' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="响应时间">
                    {{ scope.row.extra?.responseTime ? formatDateTime(scope.row.extra.responseTime) : '-' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="失败时间">
                    {{ scope.row.extra?.failedTime ? formatDateTime(scope.row.extra.failedTime) : '-' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="取消时间">
                    {{ scope.row.extra?.canceledTime ? formatDateTime(scope.row.extra.canceledTime) : '-' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="过期时间(执行)">
                    {{ scope.row.extra?.expiredTime ? formatDateTime(scope.row.extra.expiredTime) : '-' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="实际重试次数">
                    {{ scope.row.extra?.retryCount || '0' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="失败原因" :span="2">
                    <span style="color: #F56C6C;">{{ scope.row.extra?.failureReason || '-' }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="命令响应内容" :span="3">
                    {{ scope.row.extra?.response || '-' }}
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </template>
          </el-table-column>

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

          <el-table-column prop="parameter" label="参数" align="left" show-overflow-tooltip />

          <el-table-column prop="dispatchMode" width="130" label="下发模式" align="left">
            <template #default="{ row }">
              <span>{{ dispatchModeText(row.dispatchMode) }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="sentTime" label="发送时间" align="center" width="180">
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
      </div>
    </el-card>

    <DeviceControlEditDialog
      v-model:visible="dialogVisible"
      :device-id="selectedDeviceId || undefined"
      :command-data="currentCommandData"
      :device-list="devices"
      @success="getDeviceCommandList"
    />
  </div>
</template>

<style lang="scss" scoped>
.toolbar-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.toolbar-left {
  display: flex;
  align-items: center;
}

.table-wrapper {
  margin-bottom: 20px;
}
</style>
