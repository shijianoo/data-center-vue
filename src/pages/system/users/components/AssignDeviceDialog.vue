<script lang="ts" setup>
import { ElMessage } from "element-plus"
import { computed, ref, watch } from "vue"
import { assignDevicesApi, getAccessibleDevices } from "@/common/apis/device-access"
import { useDeviceModels } from "@/common/hooks/useDeviceModels"

interface Props {
  userId: string
  userName: string
}

const props = defineProps<Props>()
const visible = defineModel<boolean>("visible")

const loading = ref(false)
const { deviceModels, fetchDeviceModels } = useDeviceModels()

// 当前选择的设备型号
const selectedModelId = ref<string>("")

// 型号选项
const modelOptions = computed(() =>
  deviceModels.value.map(m => ({
    label: m.modelName ? `${m.modelNumber} - ${m.modelName}` : m.modelNumber,
    value: m.id
  }))
)

// 当前型号的设备列表
const currentModelDevices = computed(() => {
  const model = deviceModels.value.find(m => m.id === selectedModelId.value)
  console.log("当前型号的所有设备", model?.devices)
  return model?.devices || []
})

// 已选择的设备ID列表
const selectedDeviceIds = ref<string[]>([])

// 获取用户在当前型号下已分配的设备
async function getUserDevicesForModel() {
  loading.value = true
  try {
    const { data } = await getAccessibleDevices(props.userId, selectedModelId.value)
    selectedDeviceIds.value = data.map(device => device.id)
    console.log("当前用户当前型号的设备列表", data)
  } catch (error) {
    console.error("获取用户设备失败:", error)
    ElMessage.error("获取用户设备失败")
    selectedDeviceIds.value = []
  } finally {
    loading.value = false
  }
}

// 监听型号选择变化
watch(selectedModelId, () => {
  selectedDeviceIds.value = []
  if (selectedModelId.value) {
    getUserDevicesForModel()
  }
})

// 提交设备分配
async function handleSubmit() {
  if (!props.userId || !selectedModelId.value) {
    ElMessage.error("请选择设备型号")
    return
  }

  loading.value = true
  try {
    await assignDevicesApi(props.userId, {
      deviceModelId: selectedModelId.value,
      deviceIds: selectedDeviceIds.value
    })

    ElMessage.success("设备分配成功")
    visible.value = false
  } catch (error) {
    console.error("设备分配失败:", error)
    ElMessage.error("设备分配失败")
  } finally {
    loading.value = false
  }
}

// 重置表单
function resetForm() {
  selectedModelId.value = ""
  selectedDeviceIds.value = []
}

// 监听对话框打开
function handleDialogOpen() {
  if (props.userId) {
    fetchDeviceModels()
  }
}

// 监听对话框关闭
function handleDialogClose() {
  resetForm()
}
</script>

<template>
  <el-dialog
    v-model="visible"
    title="分配设备"
    width="600px"
    @open="handleDialogOpen"
    @closed="handleDialogClose"
  >
    <div v-loading="loading">
      <el-alert
        type="primary"
        :closable="false"
        show-icon
      >
        <template #title>
          为用户 <strong>{{ userName }}</strong> 分配设备
        </template>
      </el-alert>
      <div class="device-assignment-container">
        <!-- 选择设备型号 -->
        <div class="model-selection">
          <h4 class="section-title">
            选择设备型号
          </h4>
          <el-select
            v-model="selectedModelId"
            placeholder="请选择设备型号"
            style="width: 100%"
            clearable
          >
            <el-option
              v-for="option in modelOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </div>

        <!-- 设备列表 -->
        <div v-if="selectedModelId" class="device-selection">
          <h4 class="section-title">
            选择设备
            <span class="device-count">(共 {{ currentModelDevices.length }} 台设备)</span>
          </h4>

          <div v-if="currentModelDevices.length > 0">
            <el-checkbox-group v-model="selectedDeviceIds">
              <el-checkbox
                v-for="device in currentModelDevices"
                :key="device.id"
                :value="device.id"
                class="device-item"
              >
                <div class="device-info">
                  <span class="device-serial">{{ device.serialNumber }}</span>
                  <span class="device-description">{{ device.description }}</span>
                </div>
              </el-checkbox>
            </el-checkbox-group>
          </div>

          <div v-else class="no-devices">
            <el-empty description="该型号下暂无设备" />
          </div>
        </div>

        <div v-else-if="selectedModelId === ''" class="select-model-tip">
          <el-empty description="请先选择设备型号" />
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">
        取消
      </el-button>
      <el-button
        type="primary"
        :loading="loading"
        :disabled="!selectedModelId"
        @click="handleSubmit"
      >
        确认分配
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.device-assignment-container {
  margin-top: 16px;
}

.model-selection {
  margin-bottom: 24px;
}

.device-selection {
  margin-top: 24px;
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.device-count {
  color: var(--el-text-color-secondary);
  font-size: 14px;
  font-weight: 400;
}

.device-item {
  display: flex;
  align-items: flex-start;
  width: 100%;
  margin-bottom: 12px;
  padding: 8px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    border-color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);
  }

  &:last-child {
    margin-bottom: 0;
  }
}

.device-serial {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.device-description {
  font-size: 12px;
  margin-left: 10px;
  color: var(--el-text-color-regular);
}
</style>
