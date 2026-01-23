<script setup lang="ts">
import type { Device, UpdateDeviceProfileDto } from "@/common/apis/devices/type"
import { updateDeviceProfileApi } from "@/common/apis/devices"

const props = defineProps<{
  device: Device | null
}>()

const emit = defineEmits<{
  (e: "success"): void
}>()

const visible = defineModel<boolean>("visible")
const loading = ref(false)

const formData = ref<UpdateDeviceProfileDto>({
})

watch(() => visible.value, (val) => {
  if (val && props.device) {
    formData.value = {
      displayName: props.device.displayName,
      deviceName: props.device.deviceName,
      description: props.device.description
    }
  }
})

function handleClose() {
  visible.value = false
}

async function handleSubmit() {
  loading.value = true
  try {
    await updateDeviceProfileApi(props.device!.id, formData.value)
    ElMessage.success("更新成功")
    emit("success")
    handleClose()
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <el-dialog
    v-model="visible"
    title="配置设备信息"
    width="500px"
    append-to-body
    @close="handleClose"
  >
    <el-form
      :model="formData"
      label-width="100px"
    >
      <el-form-item label="显示名称">
        <el-input v-model="formData.displayName" placeholder="请输入显示名称" />
      </el-form-item>
      <el-form-item label="设备名称" prop="deviceName">
        <el-input v-model="formData.deviceName" placeholder="请输入设备名称" />
      </el-form-item>
      <el-form-item label="描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="请输入描述信息"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">
          取消
        </el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          保存
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
