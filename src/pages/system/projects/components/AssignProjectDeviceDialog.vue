<script lang="ts" setup>
import type { DeviceModel } from "@/common/apis/device-models/type"
import type { Device } from "@/common/apis/devices/type"
import type { Project } from "@/common/apis/projects/type"
import { Delete, Plus, Search } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { computed, ref, watch } from "vue"
import {
  addDevicesToProject,
  getDeviceIdsFromProject,
  getDevicesFromTenant,
  removeDevicesFromProject
} from "@/common/apis/device-assignment"
import { getDeviceModelsApi } from "@/common/apis/device-models"
import { getProjectApi } from "@/common/apis/projects"

interface Props {
  projectId: string
  tenantId: string
}

const props = defineProps<Props>()
const visible = defineModel<boolean>("visible")

const loading = ref(false)
const activeTab = ref("assigned")
const searchQuery = ref("")
const allDevices = ref<Device[]>([])
const allModels = ref<DeviceModel[]>([])
const assignedDeviceIds = ref<string[]>([])
const project = ref<Project | null>(null)

// 获取数据
async function fetchData() {
  if (!props.projectId || !props.tenantId) return
  loading.value = true
  try {
    const [devicesRes, modelsRes, assignedIdsRes, projectRes] = await Promise.all([
      getDevicesFromTenant(props.tenantId),
      getDeviceModelsApi(),
      getDeviceIdsFromProject(props.projectId),
      getProjectApi(props.projectId)
    ])
    allDevices.value = devicesRes.data || []
    allModels.value = modelsRes.data || []
    assignedDeviceIds.value = assignedIdsRes.data || []
    project.value = projectRes.data || null
  } catch (error) {
    console.error("获取数据失败:", error)
    ElMessage.error("获取数据失败")
  } finally {
    loading.value = false
  }
}

// 监听弹窗显示
watch(() => visible.value, (val) => {
  if (val) {
    fetchData()
    activeTab.value = "assigned"
    searchQuery.value = ""
  }
})

// 过滤后的设备
const filteredDevices = computed(() => {
  let list = allDevices.value
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    list = list.filter(d =>
      d.serialNumber.toLowerCase().includes(query)
      || d.deviceName?.toLowerCase().includes(query)
    )
  }
  return list
})

// 已分配设备
const assignedDevices = computed(() => {
  return filteredDevices.value.filter(d => assignedDeviceIds.value.includes(d.id))
})

// 待分配设备
const availableDevices = computed(() => {
  return filteredDevices.value.filter(d => !assignedDeviceIds.value.includes(d.id))
})

// 按型号分组
function groupByModel(devices: Device[]) {
  const groups: Record<string, { model: DeviceModel | undefined, devices: Device[] }> = {}
  devices.forEach((d) => {
    if (!groups[d.deviceModelId]) {
      groups[d.deviceModelId] = {
        model: allModels.value.find(m => m.id === d.deviceModelId),
        devices: []
      }
    }
    groups[d.deviceModelId].devices.push(d)
  })
  return Object.values(groups).sort((a, b) => (a.model?.modelName || "").localeCompare(b.model?.modelName || ""))
}

const assignedGroups = computed(() => groupByModel(assignedDevices.value))
const availableGroups = computed(() => groupByModel(availableDevices.value))

// 选中的设备
const globalSelectedIds = ref(new Set<string>())

function handleSelectionChange(selection: Device[], groupDevices: Device[]) {
  // 先清除当前分组的所有设备在全局 Set 中的状态
  groupDevices.forEach(d => globalSelectedIds.value.delete(d.id))
  // 再添加当前选中的设备
  selection.forEach(d => globalSelectedIds.value.add(d.id))
}

// 分配设备
async function handleAssign(deviceOrIds: Device | string[]) {
  const ids = Array.isArray(deviceOrIds) ? deviceOrIds : [deviceOrIds.id]
  if (ids.length === 0) return

  try {
    await addDevicesToProject(props.projectId, ids)
    ElMessage.success("分配成功")
    assignedDeviceIds.value.push(...ids)
    ids.forEach(id => globalSelectedIds.value.delete(id))
  } catch (error) {
    console.error("分配失败:", error)
    ElMessage.error("分配失败")
  }
}

// 移除设备
async function handleRemove(deviceOrIds: Device | string[]) {
  const ids = Array.isArray(deviceOrIds) ? deviceOrIds : [deviceOrIds.id]
  if (ids.length === 0) return

  const message = ids.length === 1
    ? `确定要从该项目中移除设备 ${allDevices.value.find(d => d.id === ids[0])?.serialNumber} 吗？`
    : `确定要从该项目中移除选中的 ${ids.length} 个设备吗？`

  ElMessageBox.confirm(message, "提示", {
    type: "warning"
  }).then(async () => {
    try {
      await removeDevicesFromProject(props.projectId, ids)
      ElMessage.success("移除成功")
      assignedDeviceIds.value = assignedDeviceIds.value.filter(id => !ids.includes(id))
      ids.forEach(id => globalSelectedIds.value.delete(id))
    } catch (error) {
      console.error("移除失败:", error)
      ElMessage.error("移除失败")
    }
  })
}

const activeNames = ref<string[]>([])
watch([assignedGroups, availableGroups], () => {
  // 默认展开所有分组
  const allGroupIds = [...assignedGroups.value, ...availableGroups.value].map(g => g.model?.id).filter(Boolean) as string[]
  activeNames.value = [...new Set(allGroupIds)]
}, { immediate: true })

// 清空选中
watch(activeTab, () => {
  globalSelectedIds.value.clear()
})
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="`为 ${project?.name} 分配设备`"
    width="800px"
    destroy-on-close
  >
    <div v-loading="loading" class="dialog-content">
      <div class="header-actions">
        <el-input
          v-model="searchQuery"
          placeholder="搜索设备名称或序列号"
          :prefix-icon="Search"
          clearable
          class="search-input"
        />
        <div class="batch-btns">
          <el-button
            v-if="activeTab === 'assigned' && assignedGroups.length > 0"
            type="danger"
            :disabled="globalSelectedIds.size === 0"
            @click="handleRemove([...globalSelectedIds])"
          >
            批量移除 ({{ globalSelectedIds.size }})
          </el-button>
          <el-button
            v-if="activeTab === 'available' && availableGroups.length > 0"
            type="primary"
            :disabled="globalSelectedIds.size === 0"
            @click="handleAssign([...globalSelectedIds])"
          >
            批量分配 ({{ globalSelectedIds.size }})
          </el-button>
        </div>
      </div>

      <el-tabs class="h-full" v-model="activeTab">
        <el-tab-pane label="已分配设备" name="assigned">
          <div v-if="assignedGroups.length === 0" class="empty-tip">
            暂无已分配设备
          </div>
          <el-collapse v-model="activeNames" expand-icon-position="left">
            <el-collapse-item
              v-for="group in assignedGroups"
              :key="group.model?.id"
              :name="group.model?.id"
            >
              <template #title>
                <div class="group-title">
                  <span class="model-name">{{ group.model?.modelName || '未知型号' }}</span>
                  <el-tag size="small" type="info" effect="plain">
                    {{ group.devices.length }}
                  </el-tag>
                </div>
              </template>
              <el-table
                :data="group.devices"
                size="small"
                border
                stripe
                @selection-change="(val) => handleSelectionChange(val, group.devices)"
              >
                <el-table-column type="selection" width="55" align="center" />
                <el-table-column prop="serialNumber" label="序列号" width="180" />
                <el-table-column prop="deviceName" label="设备名称" />
                <el-table-column prop="description" label="设备描述" />
                <el-table-column label="操作" width="100" align="center">
                  <template #default="{ row }">
                    <el-button
                      type="danger"
                      size="small"
                      link
                      :icon="Delete"
                      @click="handleRemove(row)"
                    >
                      移除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-collapse-item>
          </el-collapse>
        </el-tab-pane>

        <el-tab-pane label="待分配设备" name="available">
          <div v-if="availableGroups.length === 0" class="empty-tip">
            暂无待分配设备
          </div>
          <el-collapse v-model="activeNames" expand-icon-position="left">
            <el-collapse-item
              v-for="group in availableGroups"
              :key="group.model?.id"
              :name="group.model?.id"
            >
              <template #title>
                <div class="group-title">
                  <span class="model-name">{{ group.model?.modelName || '未知型号' }}</span>
                  <el-tag size="small" type="info" effect="plain">
                    {{ group.devices.length }}
                  </el-tag>
                </div>
              </template>
              <el-table
                :data="group.devices"
                size="small"
                border
                stripe
                @selection-change="(val) => handleSelectionChange(val, group.devices)"
              >
                <el-table-column type="selection" width="55" align="center" />
                <el-table-column prop="serialNumber" label="序列号" width="180" />
                <el-table-column prop="deviceName" label="设备名称" />
                <el-table-column prop="description" label="设备描述" />
                <el-table-column label="操作" width="100" align="center">
                  <template #default="{ row }">
                    <el-button
                      type="primary"
                      size="small"
                      link
                      :icon="Plus"
                      @click="handleAssign(row)"
                    >
                      分配
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-collapse-item>
          </el-collapse>
        </el-tab-pane>
      </el-tabs>
    </div>
    <template #footer>
      <el-button @click="visible = false">
        关闭
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.dialog-content {
  display: flex;
  flex-direction: column;
  height: 600px;
  overflow: hidden;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;

  .search-input {
    flex: 1;
  }

  .batch-btns {
    flex-shrink: 0;
  }
}

.empty-tip {
  text-align: center;
  color: #909399;
  padding: 40px 0;
}

.group-title {
  display: flex;
  align-items: center;
  gap: 10px;

  .model-name {
    font-weight: bold;
    font-size: 14px;
  }
}

.h-full {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;

  :deep(.el-tabs__header) {
    margin: 0 0 0px !important;
  }

  :deep(.el-tabs__nav-wrap::after) {
    height: 0 !important; /* 移除分割线 */
  }

  :deep(.el-tabs__item) {
    padding: 0 5px !important;
    height: 30px !important;
  }

  :deep(.el-tabs__content) {
    flex: 1;
    overflow-y: auto;
    padding-right: 10px; /* 为滚动条留出空间 */
  }
}
</style>
