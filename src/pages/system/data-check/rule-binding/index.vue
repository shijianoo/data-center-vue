<script lang="ts" setup>
import type { FormRules } from "element-plus"
import type { CreateOrUpdateRuleBinding, FieldData, RuleBinding, RuleDefinition } from "@/common/apis/data-check/type"
import type { DeviceModelSummary } from "@/common/apis/device-models/type"
import type { DeviceSummary } from "@/common/apis/devices/type"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { cloneDeep } from "lodash-es"
import {
  createRuleBindingApi,
  deleteRuleBindingApi,
  executeCheckApi,
  getLatestFieldDataApi,
  getRuleBindingsApi,
  getRuleDefinitionsByModelIdApi,
  updateRuleBindingApi
} from "@/common/apis/data-check"
import { getDeviceModelSummariesApi } from "@/common/apis/device-models"
import { getDeviceSummariesApi } from "@/common/apis/devices"
import { useRuleValueFields } from "@/common/hooks/useRuleValueFields"
import { formatDateTime } from "@/common/utils/datetime"

defineOptions({
  name: "RuleBinding"
})

const loading = ref(false)

// #region 增 + 改 表单逻辑
const defaultForm: CreateOrUpdateRuleBinding = {
  id: undefined,
  ruleId: "",
  deviceModelId: "",
  deviceId: "",
  serialNumber: "",
  deviceName: "",
  intervalMinutes: 0,
  value1: "",
  value2: "",
  enabled: true,
  sortOrder: 0
}

const dialogVisible = ref(false)
const formRef = useTemplateRef("formRef")
const formData = ref<CreateOrUpdateRuleBinding>(cloneDeep(defaultForm))

const ruleDefinitions = ref<RuleDefinition[]>([])
const selectedRuleId = ref<string | undefined>(undefined)

// 设备型号列表
const deviceModels = ref<DeviceModelSummary[]>([])
const selectedDeviceModelId = ref<string | undefined>(undefined)
// 设备列表
const devices = ref<DeviceSummary[]>([])
const selectedDeviceId = ref<string | undefined>(undefined)

const formRules: FormRules = {
  ruleId: [{ required: true, trigger: "change", message: "请选择规则定义" }],
  deviceModelId: [{ required: true, trigger: "change", message: "请选择设备型号" }],
  deviceId: [{ required: true, trigger: "change", message: "请选择设备" }],
  serialNumber: [{ required: true, trigger: "change", message: "请选择设备" }]
}

function handleCreate() {
  dialogVisible.value = true
  formData.value = cloneDeep(defaultForm)
  if (selectedDeviceModelId.value) {
    formData.value.deviceModelId = selectedDeviceModelId.value
  }
  if (selectedDeviceId.value) {
    const device = devices.value.find(d => d.id === selectedDeviceId.value)
    if (device) {
      formData.value.deviceId = device.id
      formData.value.serialNumber = device.serialNumber
    }
  }
  if (selectedRuleId.value) {
    formData.value.ruleId = selectedRuleId.value
  }
}

function handleCreateOrUpdate() {
  formRef.value?.validate(async (valid: boolean) => {
    if (!valid) {
      ElMessage.error("表单校验不通过")
      return
    }
    loading.value = true
    try {
      if (formData.value.id) {
        await updateRuleBindingApi(formData.value)
      } else {
        await createRuleBindingApi(formData.value)
      }
      ElMessage.success("操作成功")
      dialogVisible.value = false
    } finally {
      loading.value = false
      getRuleBindingData()
    }
  })
}

function resetForm() {
  formRef.value?.clearValidate()
  formData.value = cloneDeep(defaultForm)
  currentValue.value = null
}
// #endregion

// #region 删除
function handleDelete(row: RuleBinding) {
  ElMessageBox.confirm(`正在删除规则绑定：${row.deviceName || row.serialNumber}，确认删除？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    await deleteRuleBindingApi(row.id)
    getRuleBindingData()
    ElMessage.success("删除成功")
  })
}
// #endregion

// #region 编辑
function handleUpdate(row: RuleBinding) {
  dialogVisible.value = true
  formData.value = {
    id: row.id,
    ruleId: row.ruleId,
    deviceModelId: row.deviceModelId,
    deviceId: row.deviceId,
    serialNumber: row.serialNumber,
    deviceName: row.deviceName,
    intervalMinutes: row.intervalMinutes,
    value1: row.value1,
    value2: row.value2,
    enabled: row.enabled,
    description: row.description,
    sortOrder: row.sortOrder
  }
}
// #endregion

// #region 当前选择设备的规则绑定列表
const ruleBindingData = ref<RuleBinding[]>([])

function getRuleBindingData() {
  ruleBindingData.value = []
  if (selectedDeviceModelId.value && selectedDeviceId.value) {
    loading.value = true
    getRuleBindingsApi(selectedDeviceModelId.value, selectedDeviceId.value, selectedRuleId.value).then(({ data }) => {
      console.log("获取规则绑定数据", data)
      ruleBindingData.value = data
    }).catch(() => {
      ruleBindingData.value = []
    }).finally(() => {
      loading.value = false
    })
  }
}
watch([selectedDeviceModelId, selectedDeviceId, selectedRuleId], () => {
  getRuleBindingData()
})
// #endregion

// #region 获取规则定义列表
async function getRuleDefinitions() {
  ruleDefinitions.value = []
  selectedRuleId.value = undefined
  if (selectedDeviceModelId.value) {
    getRuleDefinitionsByModelIdApi(selectedDeviceModelId.value).then(({ data }) => {
      console.log("获取规则定义数据", data)
      ruleDefinitions.value = data
    }).catch(() => {
      ruleDefinitions.value = []
    }).finally(() => {
      loading.value = false
    })
  }
}
watch([selectedDeviceModelId], () => {
  getRuleDefinitions()
})
// #endregion

// #region 获取设备型号列表
function getDeviceModels() {
  getDeviceModelSummariesApi().then(({ data }) => {
    deviceModels.value = data
    console.log("获取设备型号列表", data)
  }).catch(() => {
    deviceModels.value = []
    console.log("获取设备型号列表失败")
  })
}
// #endregion

// #region 获取设备列表
function getDevices() {
  devices.value = []
  selectedDeviceId.value = undefined
  if (selectedDeviceModelId.value) {
    getDeviceSummariesApi(selectedDeviceModelId.value).then(({ data }) => {
      devices.value = data
      console.log("获取设备列表", data)
    }).catch(() => {
      devices.value = []
      console.log("获取设备列表失败")
    })
  }
}
watch(selectedDeviceModelId, () => {
  getDevices()
})
// #endregion

// #region Value1/Value2 动态处理逻辑
// 获取当前选中的规则定义
const currentRuleDefinition = computed(() => {
  return ruleDefinitions.value.find(r => r.id === formData.value.ruleId)
})

// 使用规则值字段 Hook
const {
  showValue2,
  value1Label,
  value2Label,
  value1Placeholder,
  value2Placeholder
} = useRuleValueFields(() => ({
  ruleType: currentRuleDefinition.value?.ruleType || 0,
  operator: currentRuleDefinition.value?.operator || 0,
  defaultValue1: currentRuleDefinition.value?.value1,
  defaultValue2: currentRuleDefinition.value?.value2,
  isBinding: true
}))

// #endregion

onMounted(() => {
  getDeviceModels()
})

function dialogDeviceSehectedChanged(id: string) {
  const device = devices.value.find(d => d.id === id)
  formData.value.serialNumber = device?.serialNumber || ""
  formData.value.deviceName = device?.displayName || device?.deviceName || ""
  selectedDeviceId.value = id
}

const currentValue = ref<FieldData | null>(null)
const currentValueLoading = ref(false)
async function getCurrentValue() {
  const sn = devices.value.find(d => d.id === formData.value.deviceId)?.serialNumber
  if (!sn) {
    ElMessage.error("请先选择设备")
    return
  }
  const rule = ruleDefinitions.value.find(d => d.id === formData.value.ruleId)
  if (!rule) {
    ElMessage.error("请先选择规则定义")
    return
  }
  try {
    currentValueLoading.value = true
    const { data } = await getLatestFieldDataApi(sn, rule.dataPointId ?? "")
    currentValue.value = data
  } catch {
    currentValue.value = null
  } finally {
    currentValueLoading.value = false
  }
}

async function handleCheck(row: RuleBinding) {
  try {
    const { data } = await executeCheckApi(row.id)
    if (!data.isAlarm) {
      ElMessage.success(data.message)
    } else {
      ElMessage.warning(data.message)
    }
  } catch {}
}
</script>

<template>
  <div class="app-container">
    <el-card v-loading="loading" shadow="never">
      <div class="toolbar-wrapper">
        <div style="display: flex; align-items: center; gap: 20px">
          <el-button type="primary" :icon="CirclePlus" @click="handleCreate">
            新增规则绑定
          </el-button>
          <el-select v-model="selectedDeviceModelId" placeholder="请选择型号" clearable style="min-width:200px">
            <el-option
              v-for="model in deviceModels"
              :key="model.id"
              :label="`${model.modelNumber} -- ${model.modelName}`"
              :value="model.id"
            />
          </el-select>
          <el-select v-model="selectedDeviceId" placeholder="请选择设备" style="min-width:200px">
            <el-option
              v-for="device in devices"
              :key="device.id"
              :label="`${device.serialNumber} -- ${device.deviceName}`"
              :value="device.id"
            />
          </el-select>
          <!-- <el-select v-model="selectedRuleId" placeholder="请选择规则" clearable style="min-width:200px">
            <el-option
              v-for="rule in ruleDefinitions"
              :key="rule.id"
              :label="rule.name"
              :value="rule.id"
            />
          </el-select> -->
        </div>
        <div>
          <el-tooltip content="刷新当前页">
            <el-button type="primary" :icon="RefreshRight" circle @click="getRuleBindingData" />
          </el-tooltip>
        </div>
      </div>
      <div class="table-wrapper">
        <el-table :data="ruleBindingData">
          <el-table-column prop="ruleName" label="规则名称" align="left" />
          <el-table-column prop="description" label="描述" align="left" />
          <el-table-column prop="defaultValue1" label="默认值1" width="140" align="center" />
          <el-table-column prop="defaultValue2" label="默认值2" width="140" align="center" />
          <el-table-column prop="value1" label="自定义值1" width="140" align="center" />
          <el-table-column prop="value2" label="自定义值2" width="140" align="center" />
          <el-table-column prop="intervalMinutes" label="检查周期" width="100" align="center" />
          <el-table-column prop="nextCheckTime" label="下次检查时间" width="160" align="center" />
          <el-table-column prop="sortOrder" label="排序" width="60" align="center" />
          <el-table-column prop="enabled" label="状态" align="center" width="80px">
            <template #default="scope">
              <el-tag :type="scope.row.enabled ? 'success' : 'info'">
                {{ scope.row.enabled ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column fixed="right" label="操作" width="200" align="center">
            <template #default="scope">
              <el-button type="primary" text bg size="small" @click="handleUpdate(scope.row)">
                修改
              </el-button>
              <el-button type="primary" text bg size="small" @click="handleCheck(scope.row)">
                检查
              </el-button>
              <el-button type="danger" text bg size="small" @click="handleDelete(scope.row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- 新增/修改 -->
    <el-dialog
      v-model="dialogVisible"
      :title="formData.id === undefined ? '新增规则绑定' : '修改规则绑定'"
      width="500px"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px" label-position="left">
        <el-form-item prop="deviceModelId" label="设备型号">
          <el-select @change="val => selectedDeviceModelId = val" v-model="formData.deviceModelId" placeholder="请选择设备型号" style="width: 100%">
            <el-option
              v-for="model in deviceModels"
              :key="model.id"
              :label="`${model.modelName} (${model.modelNumber})`"
              :value="model.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="serialNumber" label="设备">
          <el-select
            @change="val => dialogDeviceSehectedChanged(val)"
            v-model="formData.deviceId"
            placeholder="请先选择设备型号，再选择设备"
            style="width: 100%"
          >
            <el-option
              v-for="device in devices"
              :key="device.id"
              :label="device.serialNumber"
              :value="device.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="deviceName" label="设备名称">
          <el-input v-model="formData.deviceName" placeholder="请输入设备名称" />
        </el-form-item>
        <el-form-item prop="ruleId" label="规则定义">
          <el-select v-model="formData.ruleId" placeholder="请选择规则定义" style="width: 100%">
            <el-option
              v-for="rule in ruleDefinitions"
              :key="rule.id"
              :label="rule.name"
              :value="rule.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="当前值">
          <el-button v-loading="currentValueLoading" @click="getCurrentValue">
            获取当前值
          </el-button>
          <div style="margin-left: 10px">
            <span v-if="currentValue">
              {{ currentValue.value }} ({{ formatDateTime(currentValue.time) }})
            </span>
          </div>
        </el-form-item>
        <el-form-item prop="value1" :label="value1Label">
          <el-input v-model="formData.value1" :placeholder="value1Placeholder" />
        </el-form-item>
        <el-form-item v-if="showValue2" prop="value2" :label="value2Label">
          <el-input v-model="formData.value2" :placeholder="value2Placeholder" />
        </el-form-item>
        <el-form-item prop="intervalMinutes" label="检查间隔(分钟)">
          <el-input v-model="formData.intervalMinutes" placeholder="请输入检查间隔(分钟)" />
        </el-form-item>
        <el-form-item prop="enabled" label="启用状态">
          <el-switch v-model="formData.enabled" />
        </el-form-item>
        <el-form-item prop="sortOrder" label="排序">
          <el-input-number v-model="formData.sortOrder" :min="0" />
        </el-form-item>
        <el-form-item prop="description" label="描述">
          <el-input type="textarea" v-model="formData.description" placeholder="请输入描述（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" :loading="loading" @click="handleCreateOrUpdate">
          确认
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.toolbar-wrapper {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}
</style>
