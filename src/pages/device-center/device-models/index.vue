<script lang="ts" setup>
import type { DeviceModel } from "@/common/apis/device-models/type"
import { ArrowDown, CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { deleteDeviceModelsApi } from "@/common/apis/device-models"
import { useDeviceModels } from "@/common/hooks/useDeviceModels"
import { getModelCategoryLabel, getModelStatusLabel } from "@/common/utils/device-model-constants"
import DeviceModelEditDialog from "./components/DeviceModelEditDialog.vue"
import DeviceModelExtraDialog from "./components/DeviceModelExtraDialog.vue"

defineOptions({
  name: "DeviceModels"
})
const loading = ref<boolean>(false)
const { deviceModels, fetchDeviceModels } = useDeviceModels()

const editDialogVisible = ref<boolean>(false)
const extraDialogVisible = ref<boolean>(false)
const currentModelId = ref<string | undefined>(undefined)

function handleCreate() {
  currentModelId.value = undefined
  editDialogVisible.value = true
}

function handleUpdate(row: DeviceModel) {
  currentModelId.value = row.id
  editDialogVisible.value = true
}

function handleUpdateExtra(row: DeviceModel) {
  currentModelId.value = row.id
  extraDialogVisible.value = true
}

// #region 删除
function handleDelete(row: DeviceModel) {
  ElMessageBox.confirm(`正在删除型号：${row.modelNumber}，确认删除？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    await deleteDeviceModelsApi(row.id)
    ElMessage.success("删除成功")
    await fetchDeviceModels()
  })
}
// #endregion

// #region 复制ID
function handleCopyId(id: string) {
  navigator.clipboard.writeText(id).then(() => {
    ElMessage.success(`设备型号ID已复制: ${id}`)
  }).catch(() => {
    // 降级方案：使用传统方法复制
    const textArea = document.createElement("textarea")
    textArea.value = id
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand("copy")
    document.body.removeChild(textArea)
    ElMessage.success(`设备型号ID已复制: ${id}`)
  })
}
// #endregion

// #region 查询
onMounted(() => {
  fetchDeviceModels()
})
// #endregion
</script>

<template>
  <div class="app-container">
    <el-card v-loading="loading" shadow="never">
      <div class="toolbar-wrapper">
        <div class="toolbar-left">
          <el-button type="primary" :icon="CirclePlus" @click="handleCreate">
            新增型号
          </el-button>
        </div>
        <div class="toolbar-right">
          <el-tooltip content="刷新当前页">
            <el-button type="primary" :icon="RefreshRight" circle @click="fetchDeviceModels" />
          </el-tooltip>
        </div>
      </div>
      <div class="table-wrapper">
        <el-table :data="deviceModels">
          <el-table-column type="expand">
            <template #default="scope">
              <div style="padding: 0 30px;">
                <el-descriptions size="small" title="型号详细信息" :column="3" border>
                  <el-descriptions-item label="产品编码">
                    {{ scope.row.productCode || '-' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="显示名称">
                    {{ scope.row.displayName || '-' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="生产厂家">
                    {{ scope.row.manufacturer || '-' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="型号状态">
                    {{ getModelStatusLabel(scope.row.status) }}
                  </el-descriptions-item>
                  <el-descriptions-item label="设备分类">
                    {{ getModelCategoryLabel(scope.row.category) }}
                  </el-descriptions-item>
                  <el-descriptions-item label="排序">
                    {{ scope.row.sortOrder }}
                  </el-descriptions-item>
                  <el-descriptions-item label="设备描述" :span="3">
                    {{ scope.row.description || '-' }}
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="modelNumber" label="设备型号" align="left" min-width="140" show-overflow-tooltip />
          <el-table-column prop="modelName" label="设备名称" align="left" min-width="140" show-overflow-tooltip />
          <el-table-column prop="isActive" label="启用状态" align="center" width="100">
            <template #default="scope">
              <el-tag v-if="scope.row.isActive" type="success" effect="plain">
                启用
              </el-tag>
              <el-tag v-else type="danger" effect="dark">
                禁用
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="deviceCount" label="设备数量" align="center" width="100" />

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
      </div>
    </el-card>
    <DeviceModelEditDialog
      v-model:visible="editDialogVisible"
      :model-id="currentModelId"
      @success="fetchDeviceModels"
    />

    <DeviceModelExtraDialog
      v-model:visible="extraDialogVisible"
      :model-id="currentModelId"
      @success="fetchDeviceModels"
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
</style>
