<script lang="ts" setup>
import type { DeviceCommand } from "@/common/apis/device-control/type"
import type { Device } from "@/common/apis/devices/type"
import type { DeviceFirmware } from "@/common/apis/firmwares/type"
import { createDeviceCommandApi, deleteDeviceCommandApi, getDeviceCommandsApi } from "@/common/apis/device-control"
import { getDeviceByIdApi } from "@/common/apis/devices"
import { getFirmwaresByDeviceApi } from "@/common/apis/firmwares"
import { formatDateTime } from "@/common/utils/datetime"
import { commandStatusText, upgradeStatusText } from "@/common/utils/device-control"

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
    ElMessage.warning("请先选择设备")
    visible.value = false
  }
}

async function fetchCommandData() {
  loading.value = true
  try {
    const { data } = await getDeviceCommandsApi(device.value!.id)
    commandData.value = data
  } catch {
    console.error("获取设备命令失败")
  }

  try {
    const { data } = await getFirmwaresByDeviceApi(device.value!.id)
    firmwareList.value = data
  } catch {
    console.error("获取设备固件失败")
  }

  loading.value = false
}

async function sendDeviceCommand(dcommand: string, parameter?: string) {
  try {
    await createDeviceCommandApi({
      deviceId: device.value!.id,
      command: dcommand,
      parameter,
      dispatchMode: 1,
      requiresAck: false,
      requiresResponse: false
    })
    ElMessage.success(`命令【${dcommand}${parameter ? `,${parameter}` : ""}】下发成功`)
  } catch (error) {
    ElMessage.error(`命令【${dcommand}${parameter ? `,${parameter}` : ""}】下发失败: ${error}`)
  }
}

async function handleRestart() {
  await sendDeviceCommand("Reset")
  fetchCommandData()
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
  ).then(async ({ value }) => {
    // 提取命令和参数
    const [cmd, param] = value.split(",")
    await sendDeviceCommand(cmd, param)
    fetchCommandData()
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
  ).then(async ({ value }) => {
    if (Number(value) === 0) {
      ElMessage.error("周期不能为0")
      return
    }
    await sendDeviceCommand("Setuploadcycle", `${value},m`)
    fetchCommandData()
  }).catch(() => {})
}

async function handleUpgrade() {
  if (!selectedFirmware.value) {
    ElMessage.error("请先选择固件")
    return
  }

  await sendDeviceCommand("Upgrade", selectedFirmware.value)
  fetchCommandData()
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

const upgradeStatusDialog = ref(false)
const upgradeStatusList = ref<any[]>([])
async function upgradeStatusDialogOpened() {
  upgradeStatusList.value = []
  const { data } = await getDeviceByIdApi(device.value?.id, true)
  console.log("设备升级状态", data)
  upgradeStatusList.value = data.upgradeTasks!
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
      :title="`设备控制 - ${device?.serialNumber}`"
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
                <el-button @click="upgradeStatusDialog = true">
                  升级状态
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
        <el-divider />
        <div>
          <el-table :data="commandData" v-loading="loading">
            <el-table-column prop="command" label="命令" align="center" />
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag size="small">
                  {{ commandStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="parameter" label="参数" align="center" />
            <el-table-column prop="updatedAt" label="更新时间" align="center">
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
    <el-dialog @closed="upgradeStatusDialog = false" @opened="upgradeStatusDialogOpened" v-model="upgradeStatusDialog" title="升级状态" width="30%">
      <div>
        <el-table width="100%" :data="upgradeStatusList">
          <el-table-column prop="targetFirmwareVersion" label="目标固件版本" align="center" />
          <el-table-column prop="status" label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag size="small">
                {{ upgradeStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="extra.downloadCount" label="下载次数" align="center" />
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped></style>
