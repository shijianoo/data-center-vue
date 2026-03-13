<script lang="ts" setup>
import type { DeviceCommand } from "@/common/apis/device-control/type"
import type { Device } from "@/common/apis/devices/type"
import { createDeviceCommandApi, deleteDeviceCommandApi, getDeviceUnfinishedCommandApi } from "@/common/apis/device-control"
import { commandStatusText } from "@/common/utils/device-control-constants"

interface Props {
  device: Device
  command: string
  commandName?: string
  btnIcon?: string
  btnColor?: string
  paramType?: "numeric" | "text"
  unit?: string
  dispatchMode?: number
}

const props = withDefaults(defineProps<Props>(), {
  btnIcon: "fas fa-cog",
  btnColor: "var(--primary)",
  commandName: "命令",
  paramType: "numeric",
  unit: "",
  dispatchMode: 1
})

const inputParameter = ref<string | number>("")
const loading = ref(false)
const pendingCommand = ref<DeviceCommand | null>(null)
const showConfirmPanel = ref(false)

function requestCommand() {
  if (pendingCommand.value || loading.value) return
  showConfirmPanel.value = true
}

function cancelConfirm() {
  showConfirmPanel.value = false
  inputParameter.value = ""
}

function confirmCommand() {
  if (!inputParameter.value && inputParameter.value !== 0) return
  showConfirmPanel.value = false
  setTimeout(() => {
    handleCommand()
  }, 300)
}

// 检查是否有未完成的命令
async function checkUnfinishedCommand() {
  try {
    loading.value = true
    const { data } = await getDeviceUnfinishedCommandApi(
      props.device.id,
      props.dispatchMode,
      props.command
    )
    pendingCommand.value = data
    if (pendingCommand.value !== null) {
      console.log(`当前设备存在未完成的命令`, props.command)
    }
  } catch (error) {
    console.log("查询命令状态失败", error)
  } finally {
    loading.value = false
  }
}

// 监控设备变化，查询未完成的命令
watch(
  () => props.device.id,
  (newId) => {
    if (newId && props.command) {
      checkUnfinishedCommand()
    }
  },
  { immediate: true }
)

async function handleCommand() {
  await checkUnfinishedCommand()
  if (pendingCommand.value) {
    return
  }

  const { data } = await createDeviceCommandApi({
    deviceId: props.device.id,
    command: props.command,
    parameter: inputParameter.value.toString(),
    dispatchMode: props.dispatchMode,
    requiresAck: false,
    requiresResponse: false
  })
  console.log("命令创建成功", data)
  pendingCommand.value = data
}

async function handleCancel() {
  if (!pendingCommand.value) return

  try {
    loading.value = true
    await deleteDeviceCommandApi(pendingCommand.value.id)
    await checkUnfinishedCommand()
    console.log("命令已取消")
  } catch (error) {
    console.error("取消命令失败", error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div v-loading="loading" class="ctrl-wrapper" :class="{ 'is-disabled': pendingCommand }">
    <div class="main-btn" @click="requestCommand">
      <i :class="btnIcon" :style="{ color: btnColor }" />
      <span>{{ props.commandName }}</span>
    </div>

    <!-- 确认/输入面板 -->
    <div class="confirm-panel" :class="{ 'is-show': showConfirmPanel }">
      <div class="confirm-input">
        <el-input
          v-model="inputParameter"
          size="small"
        >
          <template v-if="props.unit" #append>
            {{ props.unit }}
          </template>
        </el-input>
      </div>
      <div class="confirm-actions">
        <el-button size="small" type="info" link @click.stop="cancelConfirm">
          取消
        </el-button>
        <el-button
          size="small"
          type="primary"
          link
          :disabled="!inputParameter && inputParameter !== 0"
          @click.stop="confirmCommand"
        >
          确定
        </el-button>
      </div>
    </div>

    <div v-if="pendingCommand" class="unfinished-bar">
      <div class="status-indicator">
        <div class="status-dot" />
        <span class="status-text">
          {{ commandStatusText(pendingCommand.status) }}
          <span v-if="pendingCommand.parameter" class="pending-param">
            ({{ pendingCommand.parameter }}{{ props.unit }})
          </span>
        </span>
      </div>

      <div v-if="pendingCommand.status === 0" class="actions">
        <el-button size="small" type="danger" link @click="handleCancel">
          取消
        </el-button>
      </div>
      <div v-else class="actions">
        <span class="readonly-text">等待结果</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.ctrl-wrapper {
  position: relative;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: white;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;

  &:not(.is-disabled):hover {
    border-color: var(--primary);
    box-shadow: 0 4px 10px rgba(37, 99, 235, 0.1);
  }

  &.is-disabled {
    .main-btn {
      cursor: not-allowed;
      opacity: 0.6;
      background-color: #f8fafc;
      i,
      span {
        color: #94a3b8 !important;
      }
    }
  }
}

.main-btn {
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  flex: 1;
  font-size: 20px;
  span {
    font-size: 13px;
    font-weight: 500;
  }
}

.unfinished-bar {
  border-top: 1px dashed var(--border);
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
  min-height: 40px;

  .status-indicator {
    display: flex;
    align-items: center;
    gap: 6px;

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--warning);
    }

    .status-text {
      font-size: 13px;
      color: #475569;
      font-weight: 500;

      .pending-param {
        color: var(--primary, #2563eb);
        margin-left: 2px;
      }
    }
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 0;

    .readonly-text {
      font-size: 12px;
      color: #94a3b8;
    }
  }
}

.confirm-panel {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: white;
  border-radius: 8px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  transform: translateY(-100%);
  transition:
    transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.3s ease;
  opacity: 0;

  &.is-show {
    transform: translateY(0);
    opacity: 1;
  }

  .confirm-input {
    flex: 1;
    display: flex;
    align-items: center;
    width: 100%;
    padding: 0 16px;
    box-sizing: border-box;

    :deep(.el-input-group__append) {
      padding: 0 10px;
    }
  }

  .confirm-actions {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 32px;
    width: 100%;
    height: 30px;
    flex-shrink: 0;
  }
}
</style>
