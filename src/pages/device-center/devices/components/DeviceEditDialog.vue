<script lang="ts" setup>
import type { FormInstance, FormRules } from "element-plus"
import type { DeviceModelSummary } from "@/common/apis/device-models/type"
import type { CreateOrUpdateDeviceDto } from "@/common/apis/devices/type"
import { ElMessage } from "element-plus"
import { cloneDeep } from "lodash-es"
import { ref } from "vue"
import { createDeviceApi, getDeviceByIdApi, updateDeviceApi } from "@/common/apis/devices"

interface Props {
  deviceId?: string
  deviceModelId?: string
  models?: DeviceModelSummary[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: "success"): void
}>()

const visible = defineModel<boolean>("visible")
const loading = ref<boolean>(false)
const submitLoading = ref<boolean>(false)

// #region 表单相关
const defaultForm: CreateOrUpdateDeviceDto = {
  id: undefined,
  deviceModelId: "",
  serialNumber: "",
  isActive: true
}

const formRef = ref<FormInstance | null>(null)
const formData = ref<CreateOrUpdateDeviceDto>(cloneDeep(defaultForm))

const formRules: FormRules<CreateOrUpdateDeviceDto> = {
  deviceModelId: [{ required: true, trigger: "change", message: "请选择设备型号" }],
  serialNumber: [{ required: true, trigger: "blur", message: "请输入序列号" }]
}

function resetForm() {
  formRef.value?.clearValidate()
  formData.value = cloneDeep(defaultForm)
}

async function opened() {
  if (props.deviceId) {
    loading.value = true
    try {
      const { data } = await getDeviceByIdApi(props.deviceId)
      if (data) {
        formData.value = {
          id: data.id,
          deviceModelId: data.deviceModelId,
          serialNumber: data.serialNumber,
          deviceName: data.deviceName,
          firmwareVersion: data.firmwareVersion,
          hardwareVersion: data.hardwareVersion,
          samplingInterval: data.samplingInterval,
          uploadInterval: data.uploadInterval,
          description: data.description,
          isActive: data.isActive
        }
      }
    } catch (error) {
      console.error("获取设备详情失败:", error)
      ElMessage.error("获取详情失败")
    } finally {
      loading.value = false
    }
  } else {
    formData.value = cloneDeep(defaultForm)
    if (props.deviceModelId) {
      formData.value.deviceModelId = props.deviceModelId
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
      await updateDeviceApi(formData.value)
      ElMessage.success("修改成功")
    } else {
      await createDeviceApi(formData.value)
      ElMessage.success("注册成功")
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
    :title="formData.id === undefined ? '注册设备' : '修改设备'"
    @closed="resetForm"
    @opened="opened"
    width="650px"
    destroy-on-close
  >
    <div v-loading="loading">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-tabs type="border-card">
          <el-tab-pane label="基础信息">
            <el-form-item prop="deviceModelId" label="设备型号">
              <el-select v-model="formData.deviceModelId" placeholder="请选择设备型号" style="width: 100%;" filterable>
                <el-option
                  v-for="item in props.models"
                  :key="item.id"
                  :label="item.modelName ? `${item.modelNumber}-${item.modelName}` : item.modelNumber"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item prop="serialNumber" label="序列号">
              <el-input v-model="formData.serialNumber" placeholder="请输入序列号" />
            </el-form-item>
            <el-form-item prop="deviceName" label="设备名称">
              <el-input v-model="formData.deviceName" placeholder="请输入设备名称" />
            </el-form-item>
          </el-tab-pane>

          <el-tab-pane label="配置信息">
            <el-form-item prop="firmwareVersion" label="固件版本">
              <el-input v-model="formData.firmwareVersion" placeholder="请输入固件版本" />
            </el-form-item>
            <el-form-item prop="hardwareVersion" label="硬件版本">
              <el-input v-model="formData.hardwareVersion" placeholder="请输入硬件版本" />
            </el-form-item>
            <el-form-item prop="samplingInterval" label="采集间隔">
              <el-input-number v-model="formData.samplingInterval" :min="1" placeholder="分钟" />
            </el-form-item>
            <el-form-item prop="uploadInterval" label="上传间隔">
              <el-input-number v-model="formData.uploadInterval" :min="1" placeholder="分钟" />
            </el-form-item>
            <el-form-item prop="isActive" label="是否启用">
              <el-radio-group v-model="formData.isActive">
                <el-radio :label="true">
                  启用
                </el-radio>
                <el-radio :label="false">
                  禁用
                </el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item prop="description" label="设备描述">
              <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入设备描述" />
            </el-form-item>
          </el-tab-pane>
        </el-tabs>
      </el-form>
    </div>
    <template #footer>
      <el-button @click="visible = false">
        取消
      </el-button>
      <el-button type="primary" @click="handleCreateOrUpdate" :loading="submitLoading">
        确认
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>

</style>
