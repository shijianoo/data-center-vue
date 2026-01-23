<script lang="ts" setup>
import type { ProjectExtra } from "@/common/apis/projects/type"
import { ElMessage } from "element-plus"
import { getProjectApi, updateProjectExtraApi } from "@/common/apis/projects"

interface Props {
  projectId: string
}
const props = defineProps<Props>()
const visible = defineModel<boolean>("visible")

const loading = ref(false)
const submitLoading = ref(false)
const formData = ref<ProjectExtra>({
})

async function fetchProjectExtra() {
  if (!props.projectId) return
  loading.value = true
  try {
    const { data } = await getProjectApi(props.projectId)
    if (data && data.extra) {
      formData.value = {
        uiProfile: data.extra.uiProfile,
        ownerUser: data.extra.ownerUser,
        tags: data.extra.tags
      }
    } else {
      formData.value = {}
    }
  } catch (error) {
    console.error("获取项目扩展信息失败:", error)
    ElMessage.error("获取项目扩展信息失败")
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  if (!props.projectId) return
  submitLoading.value = true
  try {
    await updateProjectExtraApi(props.projectId, formData.value)
    ElMessage.success("修改扩展信息成功")
    visible.value = false
  } catch (error) {
    console.error("修改项目扩展信息失败:", error)
    ElMessage.error("修改项目扩展信息失败")
  } finally {
    submitLoading.value = false
  }
}

function open() {
  if (!props.projectId) {
    ElMessage.warning("请选择一个项目")
    visible.value = false
  }
}

function opened() {
  fetchProjectExtra()
}

function closed() {
  formData.value = {}
}
</script>

<template>
  <el-dialog
    @open="open"
    @opened="opened"
    @closed="closed"
    v-model="visible"
    title="修改项目扩展信息"
    width="500px"
    destroy-on-close
  >
    <div v-loading="loading">
      <el-form :model="formData" label-width="100px">
        <el-form-item label="UI 配置">
          <el-input v-model="formData.uiProfile" placeholder="请输入 UI 配置" />
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="formData.ownerUser" placeholder="请输入负责人用户名" />
        </el-form-item>
        <el-form-item label="标签">
          <el-input-tag
            v-model="formData.tags"
            placeholder="请输入标签"
            aria-label="请输入标签"
          />
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <el-button @click="visible = false">
        取消
      </el-button>
      <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
        确认
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.tag-item {
  margin-bottom: 4px;
}
.tag-input {
  width: 100px;
  margin-bottom: 4px;
}
</style>
