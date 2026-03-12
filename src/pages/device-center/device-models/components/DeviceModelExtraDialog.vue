<script lang="ts" setup>
import type { DeviceModelExtra } from "@/common/apis/device-models/type"
import { ElMessage } from "element-plus"
import { cloneDeep } from "lodash-es"
import { ref } from "vue"
import { getDeviceModelByIdApi, updateDeviceModelExtraApi } from "@/common/apis/device-models"

interface Props {
  modelId?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: "success"): void
}>()
const visible = defineModel<boolean>("visible")

const defaultForm: DeviceModelExtra = {
  id: undefined
}

const loading = ref(false)
const formData = ref<DeviceModelExtra>(cloneDeep(defaultForm))
const inputTag = ref("")

async function loadData() {
  if (!props.modelId) return
  loading.value = true
  try {
    const { data } = await getDeviceModelByIdApi(props.modelId)
    // 假设 api 返回数据中会有 extra 字段，如果没有则回退空对象
    const extraData = (data as any).extra || {}
    formData.value = Object.assign(cloneDeep(defaultForm), extraData)
    // 防止 null array error
    if (!formData.value.tags) {
      formData.value.tags = []
    }
  } catch (error) {
    console.error("获取扩展信息失败", error)
    ElMessage.error("获取扩展信息失败")
  } finally {
    loading.value = false
  }
}

function handleDialogOpen() {
  if (!props.modelId) {
    visible.value = false
    ElMessage.warning("请先选择设备型号")
  }
}

function handleClosed() {
  formData.value = cloneDeep(defaultForm)
  inputTag.value = ""
}

async function handleSubmit() {
  if (!props.modelId) return
  loading.value = true
  try {
    const submitData: DeviceModelExtra = {
      ...formData.value,
      id: props.modelId
    }
    await updateDeviceModelExtraApi(submitData)
    ElMessage.success("扩展信息保存成功")
    visible.value = false
    emit("success")
  } catch (error) {
    console.error(error)
    ElMessage.error("保存失败")
  } finally {
    loading.value = false
  }
}

function handleAddTag() {
  const val = inputTag.value.trim()
  if (val && !formData.value.tags?.includes(val)) {
    formData.value.tags?.push(val)
  }
  inputTag.value = ""
}

function handleRemoveTag(tag: string) {
  if (formData.value.tags) {
    formData.value.tags = formData.value.tags.filter(t => t !== tag)
  }
}
</script>

<template>
  <el-dialog
    v-model="visible"
    title="型号扩展信息"
    @open="handleDialogOpen"
    @opened="loadData"
    @closed="handleClosed"
    width="550px"
    destroy-on-close
  >
    <div v-loading="loading">
      <el-form :model="formData" label-width="100px">
        <el-tabs type="border-card">
          <el-tab-pane label="基础配置">
            <el-form-item prop="tags" label="型号标签">
              <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;">
                <el-tag
                  v-for="tag in formData.tags"
                  :key="tag"
                  closable
                  @close="handleRemoveTag(tag)"
                >
                  {{ tag }}
                </el-tag>
              </div>
              <div style="display: flex; gap: 10px; width: 100%;">
                <el-input
                  v-model="inputTag"
                  placeholder="输入新标签"
                  @keyup.enter="handleAddTag"
                  maxlength="20"
                />
                <el-button @click="handleAddTag">
                  添加
                </el-button>
              </div>
            </el-form-item>
          </el-tab-pane>
          <el-tab-pane label="详细内容">
            <el-form-item prop="richText" label="富文本说明">
              <el-input
                v-model="formData.richText"
                type="textarea"
                :rows="6"
                placeholder="请输入相关的富文本说明等..."
              />
            </el-form-item>
          </el-tab-pane>
        </el-tabs>
      </el-form>
    </div>
    <template #footer>
      <el-button :loading="loading" @click="visible = false">
        取消
      </el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        确认
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped></style>
