<script lang="ts" setup>
import type { Role } from "@/common/apis/roles/type"
import { ElMessage } from "element-plus"
import { ref } from "vue"
import { getAllRolesApi } from "@/common/apis/roles"
import { assignRolesApi, getUserRoleIdsApi } from "@/common/apis/users"

interface Props {
  userId: string
  userName: string
}

const props = defineProps<Props>()
const visible = defineModel<boolean>("visible")

const loading = ref<boolean>(false)
const submitLoading = ref<boolean>(false)
const allRoles = ref<Role[]>([])
const selectedRoleIds = ref<string[]>([])

// 获取所有角色
async function getAllRoles() {
  loading.value = true
  try {
    const { data } = await getAllRolesApi()
    allRoles.value = data.items || []
    console.log("获取所有角色", allRoles.value)
  } catch (error) {
    console.error("获取角色列表失败:", error)
    ElMessage.error("获取角色列表失败")
  } finally {
    loading.value = false
  }
}

// 获取用户已分配的角色
async function getUserRoles() {
  loading.value = true
  try {
    const { data } = await getUserRoleIdsApi(props.userId)
    selectedRoleIds.value = data
    console.log("获取当前用户已有角色", selectedRoleIds.value)
  } catch (error) {
    console.error("获取用户角色失败:", error)
    ElMessage.error("获取用户角色失败")
  } finally {
    loading.value = false
  }
}

// 提交分配
async function handleSubmit() {
  submitLoading.value = true
  try {
    await assignRolesApi(props.userId, selectedRoleIds.value)
    ElMessage.success("分配角色成功")
    visible.value = false
  } catch (error) {
    console.error("分配角色失败:", error)
    ElMessage.error("分配角色失败")
  } finally {
    submitLoading.value = false
  }
}

// 重置表单
function resetForm() {
  selectedRoleIds.value = []
  allRoles.value = []
}

// 监听对话框打开
function handleDialogOpen() {
  if (props.userId) {
    getAllRoles()
    getUserRoles()
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
    title="分配角色"
    width="500px"
    @opened="handleDialogOpen"
    @closed="handleDialogClose"
  >
    <div>
      <el-alert
        type="primary"
        :closable="false"
        show-icon
      >
        <template #title>
          为用户 <strong>{{ userName }}</strong> 分配角色
        </template>
      </el-alert>
      <el-checkbox-group v-loading="loading" v-model="selectedRoleIds">
        <el-checkbox
          v-for="role in allRoles"
          :key="role.id"
          :value="role.id"
          class="role-item"
        >
          <div>
            <span class="role-name">{{ role.name }}</span>
            <span class="role-description">{{ role.description }}</span>
          </div>
        </el-checkbox>
      </el-checkbox-group>
    </div>

    <template #footer>
      <el-button @click="visible = false">
        取消
      </el-button>
      <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
        确认分配
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.el-checkbox-group {
  margin-top: 20px;
}

.role-item {
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

.role-name {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.role-description {
  font-size: 12px;
  margin-left: 10px;
  color: var(--el-text-color-regular);
}
</style>
