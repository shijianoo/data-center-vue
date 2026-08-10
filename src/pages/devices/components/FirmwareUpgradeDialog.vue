<script setup lang="ts">
import type { Device, DeviceUpgrade } from "@/common/apis/devices/type"
import type { DeviceFirmware } from "@/common/apis/firmwares/type"
import { Refresh, Upload } from "@element-plus/icons-vue"
import { createDeviceCommandApi, deleteDeviceCommandApi } from "@/common/apis/device-control"
import { getDeviceByIdApi } from "@/common/apis/devices"
import { getFirmwaresByDeviceApi } from "@/common/apis/firmwares"
import { upgradeStatusText } from "@/common/utils/device-control-constants"

interface Props {
  deviceId: string
}

const props = defineProps<Props>()
const visible = defineModel<boolean>("visible", { default: false })

const loading = ref(false)
const deviceData = ref<Device | null>(null)
const firmwareList = ref<DeviceFirmware[]>([])
const upgradeTasks = ref<DeviceUpgrade[]>([])

// 格式化文件大小
function formatFileSize(bytes?: number): string {
  if (!bytes) return "-"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

// 获取固件列表及设备最新升级任务
async function fetchData() {
  if (!props.deviceId) return
  loading.value = true
  try {
    const [firmwareRes, deviceRes] = await Promise.all([
      getFirmwaresByDeviceApi(props.deviceId),
      getDeviceByIdApi(props.deviceId, true)
    ])
    firmwareList.value = firmwareRes.data || []
    deviceData.value = deviceRes.data || null
    upgradeTasks.value = deviceRes.data?.upgradeTasks || []
  } catch (error) {
    console.error("获取固件升级数据失败:", error)
    ElMessage.error("获取固件升级数据失败")
  } finally {
    loading.value = false
  }
}

// 获取针对特定固件的进行中升级任务 (status >= 0 && status < 100)
function getActiveTaskForFirmware(firmwareId: string): DeviceUpgrade | undefined {
  return upgradeTasks.value.find(
    task => task.firmwareId === firmwareId && task.status >= 0 && task.status < 100
  )
}

// 获取设备的任意进行中升级任务
const currentActiveTask = computed(() => {
  return upgradeTasks.value.find(task => task.status >= 0 && task.status < 100)
})

// 获取升级状态 Tag 类型
function getTagType(status: number): "warning" | "primary" | "success" | "danger" | "info" {
  if (status === 0) return "warning"
  if (status > 0 && status < 100) return "primary"
  if (status === 100) return "success"
  if (status < 0) return "danger"
  return "info"
}

// 下发升级命令
async function handleUpgrade(firmware: DeviceFirmware) {
  try {
    await ElMessageBox.confirm(
      `确定要将设备升级至固件版本【${firmware.firmwareVersion}】吗？`,
      "确认固件升级",
      {
        confirmButtonText: "确定升级",
        cancelButtonText: "取消",
        type: "warning"
      }
    )

    loading.value = true
    await createDeviceCommandApi({
      deviceId: props.deviceId,
      command: "Upgrade",
      parameter: firmware.id,
      dispatchMode: 1,
      requiresAck: false,
      requiresResponse: false
    })

    ElMessage.success(`升级命令已下发，目标版本：${firmware.firmwareVersion}`)
    await fetchData()
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(`下发升级命令失败: ${error?.message || error}`)
    }
  } finally {
    loading.value = false
  }
}

// 取消升级任务 (仅在 status === 0 即 Pending 时允许取消)
async function handleCancelUpgrade(task: DeviceUpgrade) {
  try {
    await ElMessageBox.confirm(
      `确定要取消当前版本的升级任务吗？`,
      "取消升级",
      {
        confirmButtonText: "确定取消",
        cancelButtonText: "暂不取消",
        type: "warning"
      }
    )

    loading.value = true
    await deleteDeviceCommandApi(task.commandId)
    ElMessage.success("升级任务已成功取消")
    await fetchData()
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(`取消升级任务失败: ${error?.message || error}`)
    }
  } finally {
    loading.value = false
  }
}

function handleOpened() {
  fetchData()
}
</script>

<template>
  <el-dialog
    v-model="visible"
    title="设备固件升级"
    width="850px"
    destroy-on-close
    align-center
    @opened="handleOpened"
  >
    <div v-if="deviceData" class="dialog-header-info">
      <div class="device-meta font-medium">
        <span>当前设备: <strong>{{ deviceData.serialNumber }} ({{ deviceData.displayName || deviceData.deviceName }})</strong></span>
        <el-tag size="small" type="info" class="ml-3">
          当前固件版本: {{ deviceData.firmwareVersion || "未知" }}
        </el-tag>
      </div>
      <el-button :icon="Refresh" circle size="small" :loading="loading" title="刷新状态" @click="fetchData" />
    </div>

    <div v-if="currentActiveTask" class="active-task-banner">
      <i class="fas fa-spinner fa-spin icon-spin" />
      <span class="banner-content">
        <span>设备存在升级任务 [目标版本: <strong>{{ currentActiveTask.targetFirmwareVersion }}</strong>]，状态:</span>
        <el-tag :type="getTagType(currentActiveTask.status)" size="small">
          {{ upgradeStatusText(currentActiveTask.status) }}
        </el-tag>
      </span>
      <el-button
        v-if="currentActiveTask.status === 0"
        type="danger"
        link
        size="small"
        class="ml-auto"
        @click="handleCancelUpgrade(currentActiveTask)"
      >
        取消升级
      </el-button>
    </div>

    <el-table v-loading="loading" :data="firmwareList" style="width: 100%; margin-top: 15px;">
      <el-table-column prop="firmwareVersion" label="固件版本" min-width="130">
        <template #default="{ row }">
          <div class="version-cell">
            <span class="version-text">{{ row.firmwareVersion }}</span>
            <el-tag v-if="deviceData && row.firmwareVersion === deviceData.firmwareVersion" size="small" type="success" effect="plain">
              当前版本
            </el-tag>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="支持硬件版本" min-width="140">
        <template #default="{ row }">
          <template v-if="row.supportedHardwareVersions && row.supportedHardwareVersions.length">
            <el-tag size="small" type="info" class="mr-1 mb-1">
              {{ row.supportedHardwareVersions }}
            </el-tag>
          </template>
          <span v-else class="text-gray-400">通用</span>
        </template>
      </el-table-column>

      <el-table-column label="文件大小" width="100" align="center">
        <template #default="{ row }">
          {{ formatFileSize(row.fileSize) }}
        </template>
      </el-table-column>

      <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />

      <el-table-column label="操作" width="150" align="center" fixed="right">
        <template #default="{ row }">
          <template v-if="getActiveTaskForFirmware(row.id)">
            <div class="action-status-group">
              <el-tag :type="getTagType(getActiveTaskForFirmware(row.id)!.status)" size="small">
                {{ upgradeStatusText(getActiveTaskForFirmware(row.id)!.status) }}
              </el-tag>

              <!-- 只有 Pending(0) 状态才允许取消升级 -->
              <el-button
                v-if="getActiveTaskForFirmware(row.id)!.status === 0"
                type="danger"
                size="small"
                link
                @click="handleCancelUpgrade(getActiveTaskForFirmware(row.id)!)"
              >
                取消
              </el-button>
            </div>
          </template>

          <template v-else>
            <el-button
              type="primary"
              size="small"
              :icon="Upload"
              :disabled="(deviceData ? row.firmwareVersion === deviceData.firmwareVersion : false) || !!currentActiveTask"
              @click="handleUpgrade(row)"
            >
              升级
            </el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">
          关闭
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.dialog-header-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border, #e2e8f0);

  .device-meta {
    font-size: 14px;
    color: var(--text-main, #334155);
  }
}

.active-task-banner {
  margin-top: 12px;
  padding: 10px 16px;
  background-color: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #0369a1;

  .icon-spin {
    color: var(--primary, #0284c7);
  }

  .banner-content {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
}

.version-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  .version-text {
    font-weight: 600;
  }
}

.action-status-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
</style>
