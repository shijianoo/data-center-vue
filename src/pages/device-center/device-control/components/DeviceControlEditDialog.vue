<script lang="ts" setup>
import type { FormInstance, FormRules } from "element-plus"
import type { CreateOrUpdateDeviceCommand, DeviceCommand } from "@/common/apis/device-control/type"
import type { DeviceSummary } from "@/common/apis/devices/type"
import { ElMessage } from "element-plus"
import { cloneDeep } from "lodash-es"
import { ref } from "vue"
import { createDeviceCommandApi, updateDeviceCommandApi } from "@/common/apis/device-control"

interface Props {
  deviceId?: string
  commandData?: DeviceCommand
  deviceList?: DeviceSummary[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: "success"): void
}>()

const visible = defineModel<boolean>("visible")
const submitLoading = ref<boolean>(false)

// #region 表单相关
const defaultForm: CreateOrUpdateDeviceCommand = {
  id: undefined,
  deviceId: "",
  command: "",
  dispatchMode: 1,
  requiresAck: false,
  requiresResponse: false
}

const formRef = ref<FormInstance | null>(null)
const formData = ref<CreateOrUpdateDeviceCommand>(cloneDeep(defaultForm))

const formRules: FormRules = {
  deviceId: [{ required: true, trigger: "blur", message: "请输入设备" }],
  command: [{ required: true, trigger: "blur", message: "请输入命令" }]
}

function resetForm() {
  formRef.value?.clearValidate()
  formData.value = cloneDeep(defaultForm)
}

function opened() {
  if (props.commandData?.id) {
    formData.value = {
      id: props.commandData.id,
      deviceId: props.commandData.deviceId,
      displayName: props.commandData.displayName,
      command: props.commandData.command,
      parameter: props.commandData.parameter,
      dispatchMode: props.commandData.dispatchMode,
      dispatchTarget: props.commandData.dispatchTarget,
      requiresAck: props.commandData.requiresAck,
      requiresResponse: props.commandData.requiresResponse,
      expiresAt: props.commandData.expiresAt,
      maxRetryCount: props.commandData.maxRetryCount,
      description: props.commandData.description
    }
  } else {
    formData.value = cloneDeep(defaultForm)
    if (props.deviceId) {
      formData.value.deviceId = props.deviceId
    }
  }
}

async function handleCreateOrUpdate() {
  if (!formRef.value) return

  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) {
    ElMessage.error("表单校验不通过")
    return
  }

  submitLoading.value = true
  try {
    if (formData.value.id) {
      await updateDeviceCommandApi(formData.value)
      ElMessage.success("修改成功")
    } else {
      await createDeviceCommandApi(formData.value)
      ElMessage.success("下发命令成功")
    }
    visible.value = false
    emit("success")
  } catch (error) {
    console.error("操作失败:", error)
    ElMessage.error("操作失败")
  } finally {
    submitLoading.value = false
  }
}
// #endregion
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="formData.id === undefined ? '下发命令' : '修改命令'"
    @closed="resetForm"
    @opened="opened"
    width="650px"
    destroy-on-close
  >
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="110px">
      <el-tabs type="border-card">
        <el-tab-pane label="基础配置">
          <el-form-item prop="deviceId" label="目标设备">
            <el-select disabled v-model="formData.deviceId" style="width: 100%">
              <el-option
                v-for="device in deviceList"
                :key="device.id"
                :label="device.deviceName ? `${device.serialNumber}-${device.deviceName}` : device.serialNumber"
                :value="device.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item prop="command" label="命令编码">
            <el-input v-model="formData.command" placeholder="请输入命令编码" />
          </el-form-item>
          <el-form-item prop="displayName" label="命令名称">
            <el-input v-model="formData.displayName" placeholder="请输入命令名称（可选）" />
          </el-form-item>
          <el-form-item prop="parameter" label="命令参数">
            <el-input v-model="formData.parameter" placeholder="请输入命令参数（可选）" />
          </el-form-item>
          <el-form-item prop="description" label="描述">
            <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入描述（可选）" />
          </el-form-item>
        </el-tab-pane>

        <el-tab-pane label="下发配置">
          <el-form-item prop="dispatchMode" label="下发方式">
            <el-select v-model="formData.dispatchMode" placeholder="请选择下发方式" style="width: 100%">
              <el-option label="HTTP 被动下发" :value="1" />
              <el-option label="HTTP 主动拉取" :value="2" />
              <el-option label="MQTT 主动推送" :value="3" />
            </el-select>
          </el-form-item>
          <el-form-item prop="dispatchTarget" label="下发目标">
            <el-input v-model="formData.dispatchTarget" placeholder="请输入下发目标（如Topic等）" />
          </el-form-item>
          <el-row>
            <el-col :span="12">
              <el-form-item prop="requiresAck" label="需要设备确认">
                <el-switch v-model="formData.requiresAck" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item prop="requiresResponse" label="需要设备响应">
                <el-switch v-model="formData.requiresResponse" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item prop="maxRetryCount" label="最大重试次数">
            <el-input-number v-model="formData.maxRetryCount" :min="0" :max="10" />
          </el-form-item>
          <el-form-item prop="expiresAt" label="过期时间">
            <el-date-picker
              v-model="formData.expiresAt"
              type="datetime"
              placeholder="选择过期时间"
              style="width: 100%"
            />
          </el-form-item>
        </el-tab-pane>
      </el-tabs>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">
        取消
      </el-button>
      <el-button type="primary" :loading="submitLoading" @click="handleCreateOrUpdate">
        确认
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>

</style>
