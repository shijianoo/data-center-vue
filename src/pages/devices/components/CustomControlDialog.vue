<script lang="ts" setup>
import type { FormInstance, FormRules } from "element-plus"
import type { CreateOrUpdateDeviceCommand, DeviceCommand } from "@/common/apis/device-control/type"
import type { Device } from "@/common/apis/devices/type"
import { Plus, RefreshRight } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { cloneDeep } from "lodash-es"
import { computed, ref, watch } from "vue"
import {
  cancelDeviceCommandApi,
  createDeviceCommandApi,
  deleteDeviceCommandApi,
  getDeviceCommandsApi
} from "@/common/apis/device-control"
import { formatDateTime } from "@/common/utils/datetime"
import { commandStatusText, dispatchModeText } from "@/common/utils/device-control-constants"

interface Props {
  device: Device
}

const props = defineProps<Props>()
const visible = defineModel<boolean>("visible")

const loading = ref(false)
const commandList = ref<DeviceCommand[]>([])
/** 默认仅显示未完成命令 */
const filterUnfinished = ref(true)

/** 弹出的“下发新指令”对话框 */
const sendDialogVisible = ref(false)
const activeSendTab = ref<"simple" | "full">("simple")
const submitLoading = ref(false)

// 简单下发表单数据
const simpleFormRef = ref<FormInstance | null>(null)
const simpleFormData = ref({
  command: "",
  parameter: ""
})
const simpleFormRules: FormRules = {
  command: [{ required: true, message: "请输入命令编码", trigger: "blur" }]
}

// 完整下发表单数据
const fullFormRef = ref<FormInstance | null>(null)
const defaultFullForm: Omit<CreateOrUpdateDeviceCommand, "deviceId"> = {
  command: "",
  displayName: "",
  parameter: "",
  dispatchMode: 1, // 默认 HttpResponse (1: HTTP 被动下发)
  dispatchTarget: "",
  requiresAck: false,
  requiresResponse: false,
  maxRetryCount: undefined,
  expiresAt: undefined,
  description: ""
}
const fullFormData = ref(cloneDeep(defaultFullForm))
const fullFormRules: FormRules = {
  command: [{ required: true, message: "请输入命令编码", trigger: "blur" }],
  dispatchMode: [{ required: true, message: "请选择下发方式", trigger: "change" }]
}

const displayedCommands = computed(() => {
  if (filterUnfinished.value) {
    // 状态未完成 (status >= 0 且 status < 100)
    return commandList.value.filter(cmd => cmd.status >= 0 && cmd.status < 100)
  }
  return commandList.value
})

function getStatusTagType(status: number): "success" | "info" | "warning" | "danger" | "primary" {
  if (status === 100) return "success"
  if (status === 0) return "warning"
  if (status > 0 && status < 100) return "primary"
  if (status < 0) return "danger"
  return "info"
}

async function fetchCommands() {
  if (!props.device?.id) return
  loading.value = true
  try {
    const { data } = await getDeviceCommandsApi(props.device.id)
    commandList.value = data || []
  } catch (error) {
    console.error("获取指令列表失败:", error)
    ElMessage.error("获取指令列表失败")
  } finally {
    loading.value = false
  }
}

function handleOpenSendDialog() {
  simpleFormData.value = { command: "", parameter: "" }
  fullFormData.value = cloneDeep(defaultFullForm)
  simpleFormRef.value?.clearValidate()
  fullFormRef.value?.clearValidate()
  activeSendTab.value = "simple"
  sendDialogVisible.value = true
}

async function handleSendSubmit() {
  if (activeSendTab.value === "simple") {
    if (!simpleFormRef.value) return
    const valid = await simpleFormRef.value.validate().catch(() => false)
    if (!valid) return

    const payload: CreateOrUpdateDeviceCommand = {
      deviceId: props.device.id,
      command: simpleFormData.value.command.trim(),
      parameter: simpleFormData.value.parameter.trim() || undefined,
      dispatchMode: 1, // 默认 HttpResponse
      requiresAck: false,
      requiresResponse: false
    }

    submitLoading.value = true
    try {
      await createDeviceCommandApi(payload)
      ElMessage.success("简单下发指令成功")
      sendDialogVisible.value = false
      fetchCommands()
    } catch (error) {
      console.error("简单下发指令失败:", error)
      ElMessage.error("简单下发指令失败")
    } finally {
      submitLoading.value = false
    }
  } else {
    if (!fullFormRef.value) return
    const valid = await fullFormRef.value.validate().catch(() => false)
    if (!valid) return

    const payload: CreateOrUpdateDeviceCommand = {
      deviceId: props.device.id,
      command: fullFormData.value.command.trim(),
      displayName: fullFormData.value.displayName?.trim() || undefined,
      parameter: fullFormData.value.parameter?.trim() || undefined,
      dispatchMode: fullFormData.value.dispatchMode,
      dispatchTarget: fullFormData.value.dispatchTarget?.trim() || undefined,
      requiresAck: fullFormData.value.requiresAck,
      requiresResponse: fullFormData.value.requiresResponse,
      maxRetryCount: fullFormData.value.maxRetryCount,
      expiresAt: fullFormData.value.expiresAt,
      description: fullFormData.value.description?.trim() || undefined
    }

    submitLoading.value = true
    try {
      await createDeviceCommandApi(payload)
      ElMessage.success("完整下发指令成功")
      sendDialogVisible.value = false
      fetchCommands()
    } catch (error) {
      console.error("完整下发指令失败:", error)
      ElMessage.error("完整下发指令失败")
    } finally {
      submitLoading.value = false
    }
  }
}

function handleCancel(row: DeviceCommand) {
  ElMessageBox.confirm(`确认取消下发指令 "${row.displayName || row.command}"？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    try {
      await cancelDeviceCommandApi(row.id)
      ElMessage.success("取消成功")
      fetchCommands()
    } catch (error) {
      console.error("取消失败:", error)
      ElMessage.error("取消失败")
    }
  })
}

function handleDelete(row: DeviceCommand) {
  ElMessageBox.confirm(`确认删除指令 "${row.displayName || row.command}"？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    try {
      await deleteDeviceCommandApi(row.id)
      ElMessage.success("删除成功")
      fetchCommands()
    } catch (error) {
      console.error("删除失败:", error)
      ElMessage.error("删除失败")
    }
  })
}

watch(visible, (val) => {
  if (val) {
    filterUnfinished.value = true
    fetchCommands()
  }
})
</script>

<template>
  <el-dialog
    v-model="visible"
    title="自定义指令控制"
    width="960px"
    destroy-on-close
    append-to-body
  >
    <div class="custom-dialog-body" v-loading="loading">
      <div class="toolbar-wrapper">
        <div class="toolbar-left">
          <el-radio-group v-model="filterUnfinished" size="default">
            <el-radio-button :value="true">
              未完成指令
            </el-radio-button>
            <el-radio-button :value="false">
              全部指令
            </el-radio-button>
          </el-radio-group>
        </div>
        <div class="toolbar-right">
          <el-button type="primary" :icon="Plus" @click="handleOpenSendDialog">
            下发新指令
          </el-button>
          <el-tooltip content="刷新列表">
            <el-button :icon="RefreshRight" circle @click="fetchCommands" />
          </el-tooltip>
        </div>
      </div>

      <el-table :data="displayedCommands" style="width: 100%">
        <el-table-column type="expand">
          <template #default="scope">
            <div style="padding: 12px 24px;">
              <el-descriptions size="small" title="详细信息" :column="3" border>
                <el-descriptions-item label="事务ID">
                  {{ scope.row.correlationId || '-' }}
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
                <el-descriptions-item label="最大重试">
                  {{ scope.row.maxRetryCount ?? '-' }}
                </el-descriptions-item>
                <el-descriptions-item label="下发目标">
                  {{ scope.row.dispatchTarget || '-' }}
                </el-descriptions-item>
                <el-descriptions-item label="描述" :span="3">
                  {{ scope.row.description || '-' }}
                </el-descriptions-item>
                <el-descriptions-item label="完成时间">
                  {{ scope.row.completedTime ? formatDateTime(scope.row.completedTime) : '-' }}
                </el-descriptions-item>
                <el-descriptions-item label="响应内容" :span="2">
                  {{ scope.row.extra?.response || '-' }}
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="指令" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.displayName">
              <strong>{{ row.displayName }}</strong> ({{ row.command }})
            </span>
            <span v-else>
              <strong>{{ row.command }}</strong>
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="parameter" label="参数" min-width="120" show-overflow-tooltip />

        <el-table-column prop="dispatchMode" label="下发模式" width="140" align="center">
          <template #default="{ row }">
            <el-tag type="info" size="small">
              {{ dispatchModeText(row.dispatchMode) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ commandStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" label="创建时间" width="170" align="center">
          <template #default="{ row }">
            {{ row.createdAt ? formatDateTime(row.createdAt) : '-' }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="150" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status >= 0 && row.status < 100"
              type="warning"
              text
              bg
              size="small"
              :disabled="row.command === 'Upgrade' && row.status !== 100"
              @click="handleCancel(row)"
            >
              取消
            </el-button>
            <el-button
              type="danger"
              text
              bg
              size="small"
              :disabled="row.command === 'Upgrade' && row.status !== 100"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <template #footer>
      <el-button @click="visible = false">
        关闭
      </el-button>
    </template>

    <!-- 下发新指令子对话框 -->
    <el-dialog
      v-model="sendDialogVisible"
      title="下发新指令"
      width="600px"
      append-to-body
      destroy-on-close
    >
      <el-tabs v-model="activeSendTab" type="card">
        <!-- 简单下发 -->
        <el-tab-pane label="简单下发" name="simple">
          <el-alert
            title="使用 HTTP 被动下发 (HttpResponse)，确认和响应默认为否。"
            type="info"
            :closable="false"
            show-icon
            style="margin-bottom: 16px;"
          />
          <el-form
            ref="simpleFormRef"
            :model="simpleFormData"
            :rules="simpleFormRules"
            label-width="100px"
          >
            <el-form-item label="命令编码" prop="command">
              <el-input v-model="simpleFormData.command" placeholder="请输入命令编码 (例: Reset)" />
            </el-form-item>
            <el-form-item label="命令参数" prop="parameter">
              <el-input v-model="simpleFormData.parameter" placeholder="请输入命令参数 (可选)" />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 完整下发 -->
        <el-tab-pane label="完整下发" name="full" disabled>
          <el-form
            ref="fullFormRef"
            :model="fullFormData"
            :rules="fullFormRules"
            label-width="110px"
          >
            <el-form-item label="命令编码" prop="command">
              <el-input v-model="fullFormData.command" placeholder="请输入命令编码" />
            </el-form-item>
            <el-form-item label="命令名称" prop="displayName">
              <el-input v-model="fullFormData.displayName" placeholder="请输入命令名称 (可选)" />
            </el-form-item>
            <el-form-item label="命令参数" prop="parameter">
              <el-input v-model="fullFormData.parameter" placeholder="请输入命令参数 (可选)" />
            </el-form-item>
            <el-form-item label="下发方式" prop="dispatchMode">
              <el-select v-model="fullFormData.dispatchMode" placeholder="请选择下发方式" style="width: 100%">
                <el-option label="HTTP 被动下发 (HttpResponse)" :value="1" />
                <el-option label="HTTP 主动拉取 (HttpPull)" :value="2" disabled />
                <el-option label="MQTT 主动推送 (MqttPush)" :value="3" disabled />
              </el-select>
            </el-form-item>
            <el-form-item v-if="fullFormData.dispatchMode === 3" label="下发目标" prop="dispatchTarget">
              <el-input v-model="fullFormData.dispatchTarget" placeholder="请输入下发目标 (如 Topic 等，可选)" />
            </el-form-item>
            <el-row>
              <el-col :span="12">
                <el-form-item label="需要确认" prop="requiresAck">
                  <el-switch v-model="fullFormData.requiresAck" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="需要响应" prop="requiresResponse">
                  <el-switch v-model="fullFormData.requiresResponse" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="最大重试次数" prop="maxRetryCount">
              <el-input-number v-model="fullFormData.maxRetryCount" :min="0" :max="10" />
            </el-form-item>
            <el-form-item label="过期时间" prop="expiresAt">
              <el-date-picker
                v-model="fullFormData.expiresAt"
                type="datetime"
                value-format="YYYY-MM-DDTHH:mm:ss"
                placeholder="选择过期时间 (可选)"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="描述" prop="description">
              <el-input v-model="fullFormData.description" type="textarea" :rows="2" placeholder="请输入描述 (可选)" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <el-button @click="sendDialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSendSubmit">
          确认下发
        </el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<style lang="scss" scoped>
.custom-dialog-body {
  min-height: 300px;
}

.toolbar-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
