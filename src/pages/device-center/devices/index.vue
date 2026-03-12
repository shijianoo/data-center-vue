<script lang="ts" setup>
import type { DeviceModelSummary } from "@/common/apis/device-models/type"
import type { Device } from "@/common/apis/devices/type"
import { ArrowDown, CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { getDeviceModelSummariesApi } from "@/common/apis/device-models"
import { deleteDeviceApi, getDevicesApi } from "@/common/apis/devices"
import { useDeviceModels } from "@/common/hooks/useDeviceModels"
import DeviceEditDialog from "./components/DeviceEditDialog.vue"
import DeviceExtraDialog from "./components/DeviceExtraDialog.vue"

defineOptions({
  name: "Devices"
})

const loading = ref<boolean>(false)
const { deviceModels, fetchDeviceModels } = useDeviceModels()
const deviceModelSummaryList = ref<DeviceModelSummary[]>([])
const modelOptions = computed(() =>
  deviceModels.value.map(m => ({
    label: m.modelName ? `${m.modelNumber}-${m.modelName}(${m.deviceCount})` : `${m.modelNumber}(${m.deviceCount})`,
    value: m.id
  }))
)

const searchData = ref({
  modelId: ""
})
const devices = ref<Device[]>([])

const editDialogVisible = ref<boolean>(false)
const extraDialogVisible = ref<boolean>(false)
const currentDeviceId = ref<string | undefined>(undefined)

function handleCreate() {
  if (!searchData.value.modelId) {
    ElMessage.warning("请先选择设备型号")
    return
  }
  currentDeviceId.value = undefined
  editDialogVisible.value = true
}

function handleUpdate(row: Device) {
  currentDeviceId.value = row.id
  editDialogVisible.value = true
}

function handleUpdateExtra(row: Device) {
  currentDeviceId.value = row.id
  extraDialogVisible.value = true
}

function handleCopyId(id: string) {
  navigator.clipboard.writeText(id).then(() => {
    ElMessage.success(`设备ID已复制: ${id}`)
  }).catch(() => {
    const textArea = document.createElement("textarea")
    textArea.value = id
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand("copy")
    document.body.removeChild(textArea)
    ElMessage.success(`设备ID已复制: ${id}`)
  })
}

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
  }
)

onMounted(async () => {
  fetchDeviceModels()
  const { data } = await getDeviceModelSummariesApi()
  deviceModelSummaryList.value = data
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
            <el-table-column type="expand">
              <template #default="scope">
                <div style="padding: 0 30px;">
                  <el-descriptions size="small" title="详细信息" :column="3" border>
                    <el-descriptions-item label="固件版本">
                      {{ scope.row.firmwareVersion || '-' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="硬件版本">
                      {{ scope.row.hardwareVersion || '-' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="在离线状态">
                      <el-tag v-if="scope.row.isOnline" type="success" effect="dark" size="small">
                        在线
                      </el-tag>
                      <el-tag v-else type="danger" effect="plain" size="small">
                        离线
                      </el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="采集间隔(s)">
                      {{ scope.row.samplingInterval }}
                    </el-descriptions-item>
                    <el-descriptions-item label="上传间隔(s)">
                      {{ scope.row.uploadInterval }}
                    </el-descriptions-item>
                    <el-descriptions-item label="启用状态">
                      <el-tag v-if="scope.row.isActive" type="success" effect="plain" size="small">
                        启用
                      </el-tag>
                      <el-tag v-else type="danger" effect="dark" size="small">
                        禁用
                      </el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="最后上传时间" :span="1">
                      {{ scope.row.lastUploadTime || '-' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="备注" :span="2">
                      {{ scope.row.description || '-' }}
                    </el-descriptions-item>
                  </el-descriptions>
                </div>
              </template>
            </el-table-column>

            <el-table-column prop="serialNumber" label="序列号" align="left" min-width="140" show-overflow-tooltip />
            <el-table-column prop="deviceCode" label="内部编号" align="center" width="120" />
            <el-table-column prop="deviceName" label="设备名称" align="left" min-width="140" show-overflow-tooltip />
            <el-table-column prop="displayName" label="显示名称" align="left" min-width="140" show-overflow-tooltip />
            <el-table-column prop="status" label="运行状态" align="center" width="100">
              <template #default="scope">
                <el-tag v-if="scope.row.status === 1" type="success">
                  正常
                </el-tag>
                <el-tag v-else-if="scope.row.status === 2" type="warning">
                  异常
                </el-tag>
                <el-tag v-else type="info">
                  未知
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column fixed="right" label="操作" width="160" align="center">
              <template #default="scope">
                <el-button type="primary" link size="small" @click="handleUpdate(scope.row)">
                  修改
                </el-button>
                <el-button type="danger" link size="small" @click="handleDelete(scope.row)">
                  删除
                </el-button>
                <el-dropdown trigger="click" style="margin-left: 12px; vertical-align: middle;">
                  <el-button type="primary" link size="small">
                    更多
                    <el-icon class="el-icon--right">
                      <ArrowDown />
                    </el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item @click="handleUpdateExtra(scope.row)">
                        扩展配置
                      </el-dropdown-item>
                      <el-dropdown-item divided @click="handleCopyId(scope.row.id)">
                        复制ID
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>
    </el-card>

    <DeviceEditDialog
      v-model:visible="editDialogVisible"
      :device-id="currentDeviceId"
      :device-model-id="searchData.modelId"
      :models="deviceModelSummaryList"
      @success="fetchDevices"
    />

    <DeviceExtraDialog
      v-model:visible="extraDialogVisible"
      :device-id="currentDeviceId"
      @success="fetchDevices"
    />
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
