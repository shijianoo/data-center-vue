<script lang="ts" setup>
import type { DeviceCommand } from "@/common/apis/device-command/type"
import type { Device } from "@/common/apis/devices/type"
import type { DeviceFirmware } from "@/common/apis/firmwares/type"
import { createDeviceCommandApi, deleteDeviceCommandApi, getDeviceCommandsApi } from "@/common/apis/device-command"
import { getFirmwaresByDeviceApi } from "@/common/apis/firmwares"
import { formatDateTime } from "@/common/utils/datetime"

const loading = ref<boolean>(false)
const visible = defineModel<boolean>("visible") // v-model:visible
const device = defineModel<Device>("device") // v-model:device

const commandData = ref<DeviceCommand[]>([]) // 用于存储设备命令数据
const firmwareList = ref<DeviceFirmware[]>([])
const selectedFirmware = ref("")

function handleOpened() {
  fetchCommandData()
}

function handleClosed() {
  commandData.value = []
  firmwareList.value = []
  selectedFirmware.value = ""
}

function handleDialogOpen() {
  if (!device.value) {
    ElMessage.error("请先选择设备")
    visible.value = false
  }
}

async function fetchCommandData() {
  console.log("获取设备命令数据", device.value)
  loading.value = true
  try {
    const { data } = await getDeviceCommandsApi(device.value!.id)
    commandData.value = data
  } catch {
    console.error("获取设备命令失败")
  }

  try {
    const { data } = await getFirmwaresByDeviceApi(device.value!.id)
    firmwareList.value = data.items
  } catch {
    console.error("获取设备固件失败")
  }

  loading.value = false
}

function sendDeviceCommand(dcommand: string, parameter?: string) {
  return createDeviceCommandApi(device.value!.id, dcommand, parameter)
    .then(() => {
      ElMessage.success(`命令【${dcommand}${parameter ? `,${parameter}` : ""}】下发成功`)
    })
    .catch((error: any) => {
      ElMessage.error(`命令【${dcommand}${parameter ? `,${parameter}` : ""}】下发失败: ${error.message}`)
      throw error
    })
}

function handleRestart() {
  sendDeviceCommand("Restart").then(() => {
    fetchCommandData()
  }).catch((error) => {
    ElMessage.error(`命令发下发失败: ${error.message}`)
  })
}

function handleCustomCommandDialog() {
  ElMessageBox.prompt(
    "请输入命令（格式：命令 或 命令,参数）",
    "自定义命令",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      inputPattern: /^[^,]+(,[^,]+)?$/,
      inputErrorMessage: "格式错误，只能有一个逗号，参数可选",
      inputPlaceholder: "如：Restart 或 SetTemp,25"
    }
  ).then(({ value }) => {
    // 提取命令和参数
    const [cmd, param] = value.split(",")
    sendDeviceCommand(cmd, param).then(() => {
      fetchCommandData()
    }).catch(() => {})
  }).catch(() => {})
}

function handleCycleCommandDialog() {
  ElMessageBox.prompt(
    "请输入周期（单位：分钟）",
    "周期命令",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      inputType: "number",
      inputPlaceholder: "请输入数字（分钟）"
    }
  ).then(({ value }) => {
    if (Number(value) === 0) {
      ElMessage.error("周期不能为0")
      return
    }
    sendDeviceCommand("SetCycle", value).then(() => {
      fetchCommandData()
    }).catch(() => {})
  }).catch(() => {})
}

function handleUpgrade() {
  if (!selectedFirmware.value) {
    ElMessage.error("请先选择固件")
    return
  }
  sendDeviceCommand("Upgrade", selectedFirmware.value).then(() => {
    fetchCommandData()
  }).catch(() => {})
}

function handleDeleteCommand(commandId: string) {
  ElMessageBox.confirm(
    "确定要删除该命令吗？",
    "删除确认",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    }
  ).then(() => {
    deleteDeviceCommandApi(commandId)
      .then(() => {
        ElMessage.success("命令删除成功")
        fetchCommandData()
      })
      .catch((error: any) => {
        ElMessage.error(`命令删除失败: ${error.message}`)
      })
  }).catch(() => {})
}
</script>

<template>
  <div>
    <el-dialog
      width="1000px"
      v-model="visible"
      @open="handleDialogOpen"
      @opened="handleOpened"
      @closed="handleClosed"
      title="设备控制"
    >
      <div>
        <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
          <div style="flex: 1;">
            <el-button @click="handleRestart" style="margin-right: 8px;">
              重启
            </el-button>
            <el-button @click="handleCycleCommandDialog" style="margin-right: 8px;">
              周期
            </el-button>
            <el-button @click="handleCustomCommandDialog">
              自定义
            </el-button>
          </div>
          <div style="flex: 1; display: flex; align-items: center; justify-content: flex-end;">
            <el-form label-width="80px">
              <el-form-item label="固件选择" style="margin-bottom: 0;">
                <el-select v-model="selectedFirmware" placeholder="请选择固件" style="width: 160px; margin-right: 12px;">
                  <el-option
                    v-for="item in firmwareList"
                    :key="item.id"
                    :label="item.firmwareVersion"
                    :value="item.id"
                  />
                </el-select>
                <el-button @click="handleUpgrade">
                  升级
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
        <el-divider />
        <div>
          <el-table :data="commandData">
            <el-table-column prop="command" label="命令" align="center" />
            <el-table-column prop="isSentToDevice" label="状态" align="center">
              <template #default="scope">
                <el-tag v-if="scope.row.isSentToDevice === true" type="primary" effect="plain" disable-transitions>
                  已接收
                </el-tag>
                <el-tag v-else type="warning" effect="plain" disable-transitions>
                  未接收
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="parameter" label="参数" align="center" />
            <el-table-column prop="updatedAt" label="时间戳" align="center">
              <template #default="scope">
                {{ formatDateTime(scope.row.updatedAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center">
              <template #default="scope">
                <el-button type="danger" size="small" @click="handleDeleteCommand(scope.row.id)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped></style>
