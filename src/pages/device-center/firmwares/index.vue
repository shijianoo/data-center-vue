<script lang="ts" setup>
import type { DeviceModel } from "@/common/apis/device-models/type"
import type { DeviceFirmware } from "@/common/apis/firmwares/type"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { computed, onMounted, ref, watch } from "vue"
import { getDeviceModelsApi } from "@/common/apis/device-models"
import { deleteFirmwaresApi, getFirmwaresByModelApi } from "@/common/apis/firmwares"
import FirmwareEditDialog from "./components/FirmwareEditDialog.vue"

defineOptions({
  name: "Firmwares"
})
const loading = ref<boolean>(false)
const deviceModels = ref<DeviceModel[]>([])
const modelOptions = computed(() =>
  deviceModels.value.map(m => ({
    label: m.modelName ? `${m.modelNumber}-${m.modelName}` : `${m.modelNumber}`,
    value: m.id
  }))
)
const searchData = ref({
  modelId: ""
})
const firmwares = ref<DeviceFirmware[]>([])

const dialogVisible = ref(false)
const currentFirmware = ref<DeviceFirmware | undefined>(undefined)

function handleCreate() {
  if (!searchData.value.modelId) {
    ElMessage.warning("请先选择设备型号在上传")
  }
  currentFirmware.value = undefined
  dialogVisible.value = true
}

function handleUpdate(row: DeviceFirmware) {
  currentFirmware.value = row
  dialogVisible.value = true
}

// #region 删除
async function handleDelete(device: DeviceFirmware) {
  const firmwareVersion = device.firmwareVersion || "未知版本"
  ElMessageBox.confirm(`正在删除固件：${firmwareVersion}，确认删除？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    await deleteFirmwaresApi(device.id)
    await fetchFirmwares()
    ElMessage.success("删除成功")
  })
}
// #endregion

// #region 查询
async function fetchDeviceModels() {
  loading.value = true
  try {
    const { data } = await getDeviceModelsApi()
    deviceModels.value = data
  } catch {
    ElMessage.error("查询失败")
  } finally {
    loading.value = false
  }
}

async function fetchFirmwares() {
  loading.value = true
  try {
    if (!searchData.value.modelId) {
      ElMessage.warning("请先选择设备型号")
      firmwares.value = []
      return
    }
    const { data } = await getFirmwaresByModelApi(searchData.value.modelId)
    firmwares.value = data
    console.log("获取固件列表成功:", firmwares.value)
  } catch (error) {
    console.error("获取固件列表失败:", error)
    firmwares.value = []
    ElMessage.error("查询失败")
  } finally {
    loading.value = false
  }
}

watch(
  () => searchData.value.modelId,
  async (modelId) => {
    if (modelId) {
      await fetchFirmwares()
    }
  },
  { immediate: true }
)

onMounted(async () => {
  await fetchDeviceModels()
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
          <el-button type="primary" @click="fetchFirmwares">
            查询
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-loading="loading" shadow="never">
      <div class="toolbar-wrapper">
        <div>
          <el-button type="primary" :icon="CirclePlus" @click="handleCreate">
            上传固件
          </el-button>
        </div>
        <div>
          <el-tooltip content="刷新当前页">
            <el-button type="primary" :icon="RefreshRight" circle @click="fetchFirmwares" />
          </el-tooltip>
        </div>
      </div>
      <div class="table-wrapper">
        <el-card shadow="never">
          <el-table :data="firmwares" v-loading="loading">
            <el-table-column type="expand">
              <template #default="scope">
                <div style="padding: 0 30px;">
                  <el-descriptions size="small" title="详细信息" :column="3" border>
                    <el-descriptions-item label="MD5校验码">
                      {{ scope.row.mD5 || '-' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="文件大小 (Bytes)">
                      {{ scope.row.fileSize }}
                    </el-descriptions-item>
                    <el-descriptions-item label="排序值">
                      {{ scope.row.sortOrder }}
                    </el-descriptions-item>
                    <el-descriptions-item label="描述备注" :span="3">
                      <div v-if="scope.row.description && typeof scope.row.description === 'string'">
                        <div v-for="(item, index) in scope.row.description.split(';').filter(Boolean)" :key="index" style="margin-bottom: 4px;">
                          • {{ item }}
                        </div>
                      </div>
                      <span v-else>-</span>
                    </el-descriptions-item>
                  </el-descriptions>
                </div>
              </template>
            </el-table-column>

            <el-table-column prop="firmwareVersion" label="固件版本" align="center" width="180" />

            <el-table-column prop="supportedHardwareVersions" label="支持硬件版本" align="center">
              <template #default="scope">
                <div v-if="scope.row.supportedHardwareVersions">
                  <el-tag
                    v-for="(version, index) in (typeof scope.row.supportedHardwareVersions === 'string' ? scope.row.supportedHardwareVersions.split(';').filter(Boolean) : scope.row.supportedHardwareVersions)"
                    :key="index"
                    size="small"
                    style="margin-right: 4px; margin-bottom: 4px;"
                  >
                    {{ version }}
                  </el-tag>
                </div>
                <span v-else>-</span>
              </template>
            </el-table-column>

            <el-table-column prop="isActive" label="状态" align="center" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.isActive ? 'success' : 'danger'">
                  {{ scope.row.isActive ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column fixed="right" label="操作" width="160" align="center">
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

    <FirmwareEditDialog
      v-model:visible="dialogVisible"
      :firmware-data="currentFirmware"
      :device-model-id="searchData.modelId"
      :model-options="modelOptions"
      @success="fetchFirmwares"
    />
  </div>
</template>

<style lang="scss" scoped>
.search-wrapper {
  margin-bottom: 20px;
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
