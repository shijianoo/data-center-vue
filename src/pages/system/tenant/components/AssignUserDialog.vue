<script lang="ts" setup>
import type { CheckboxValueType } from "element-plus"
import type { Tenant } from "@/common/apis/tenant/type"
import type { User } from "@/common/apis/users/type"
import { assignUsersApi, getTenantApi, getTenantUserIdsApi } from "@/common/apis/tenant"
import { getAllUsersApi } from "@/common/apis/users"

interface Props {
  tenantId: string
}

const props = defineProps<Props>()
const visible = defineModel<boolean>("visible")

const loading = ref<boolean>(false)
const currentTenant = ref<Tenant | null>(null)
const allUsers = ref<User[]>([])
const selectedUserIds = ref<string[]>([])
// 搜索关键词
const searchKeyword = ref<string>("")
// 过滤后的角色列表
const filteredUsers = computed(() => {
  if (!searchKeyword.value.trim()) {
    return allUsers.value
  }

  const keyword = searchKeyword.value.toLowerCase()
  return allUsers.value.filter(user =>
    user.userName.toLowerCase().includes(keyword)
    || (user.description && user.description.toLowerCase().includes(keyword))
  )
})
// 全选状态
const isAllSelected = computed(() => {
  if (filteredUsers.value.length === 0) return false
  return filteredUsers.value.every(user => selectedUserIds.value.includes(user.id))
})

// 是否部分选中
const isIndeterminate = computed(() => {
  const selectedCount = filteredUsers.value.filter(user =>
    selectedUserIds.value.includes(user.id)
  ).length
  return selectedCount > 0 && selectedCount < filteredUsers.value.length
})

// 全选/取消全选
function handleSelectAll(checked: CheckboxValueType) {
  if (checked) {
    // 全选：将当前过滤结果中未选中的角色添加到已选列表
    const newSelectedIds = [...selectedUserIds.value]
    filteredUsers.value.forEach((user) => {
      if (!newSelectedIds.includes(user.id)) {
        newSelectedIds.push(user.id)
      }
    })
    selectedUserIds.value = newSelectedIds
  } else {
    // 取消全选：从已选列表中移除当前过滤结果中的角色
    selectedUserIds.value = selectedUserIds.value.filter(id =>
      !filteredUsers.value.some(user => user.id === id)
    )
  }
}

// 获取所有用户
async function getAllUsers() {
  loading.value = true
  try {
    const { data } = await getAllUsersApi()
    allUsers.value = data
    console.log("获取所有用户", allUsers.value)
  } catch (error) {
    console.error("获取角色列表失败:", error)
    ElMessage.error("获取角色列表失败")
  } finally {
    loading.value = false
  }
}

// 获取租户已分配的用户
async function getTenantUsers() {
  loading.value = true
  try {
    const { data } = await getTenantUserIdsApi(props.tenantId)
    selectedUserIds.value = data
    console.log("获取当前租户已有用户", selectedUserIds.value)
  } catch (error) {
    console.error("获取用户角色失败:", error)
    ElMessage.error("获取用户角色失败")
  } finally {
    loading.value = false
  }
}

// 提交分配
async function handleSubmit() {
  loading.value = true
  try {
    await assignUsersApi(props.tenantId, selectedUserIds.value)
    ElMessage.success("分配用户成功")
    visible.value = false
  } catch (error) {
    console.error("分配角色失败:", error)
    ElMessage.error("分配角色失败")
  } finally {
    loading.value = false
  }
}

// 重置表单
function resetForm() {
  selectedUserIds.value = []
  allUsers.value = []
  searchKeyword.value = ""
}

function handleDialogOpen() {
  if (!props.tenantId) {
    ElMessage.warning("请先选择租户")
    visible.value = false
  }
}

// 监听对话框打开
async function handleDialogOpened() {
  getAllUsers()
  getTenantUsers()
  const { data } = await getTenantApi(props.tenantId)
  currentTenant.value = data
}

// 监听对话框关闭
function handleDialogClose() {
  resetForm()
}
</script>

<template>
  <el-dialog
    v-model="visible"
    title="分配用户"
    width="500px"
    @open="handleDialogOpen"
    @opened="handleDialogOpened"
    @closed="handleDialogClose"
  >
    <div v-loading="loading">
      <el-alert
        type="primary"
        :closable="false"
        show-icon
      >
        <template #title>
          为租户 <strong>{{ currentTenant?.name }}</strong> 分配用户
        </template>
      </el-alert>

      <div class="user-assignment-container">
        <h4 class="section-title">
          选择角色
          <span class="user-count">(共 {{ allUsers.length }} 个用户)</span>
        </h4>

        <!-- 搜索框 -->
        <div class="search-container">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索用户名称或描述..."
            clearable
            prefix-icon="Search"
          />
        </div>

        <div v-if="allUsers.length > 0" class="user-list-container">
          <div v-if="filteredUsers.length > 0" class="user-list">
            <!-- 全选控制 -->
            <div>
              <el-checkbox
                :model-value="isAllSelected"
                :indeterminate="isIndeterminate"
                @change="handleSelectAll"
              >
                全选 ({{ filteredUsers.filter(user => selectedUserIds.includes(user.id)).length }}/{{ filteredUsers.length }})
              </el-checkbox>
            </div>

            <el-divider style="margin: 6px 0;" />

            <el-checkbox-group v-model="selectedUserIds">
              <el-checkbox
                v-for="user in filteredUsers"
                :key="user.id"
                :value="user.id"
                class="user-item"
              >
                <div>
                  <span class="user-name">{{ user.userName }}</span>
                  <span class="user-description">{{ user.description }}</span>
                </div>
              </el-checkbox>
            </el-checkbox-group>
          </div>

          <div v-else class="no-search-results">
            <el-empty description="未找到匹配的用户" />
          </div>
        </div>

        <div v-else class="no-users ">
          <el-empty description="暂无用户" />
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">
        取消
      </el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        确认分配
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.user-assignment-container {
  margin-top: 16px;
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.user-count {
  color: var(--el-text-color-secondary);
  font-size: 14px;
  font-weight: 400;
}

.search-container {
  margin-bottom: 16px;
}

.user-list-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  padding: 12px;
  background-color: var(--el-bg-color-page);
}

.user-list {
  .el-checkbox-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}

.user-item {
  display: flex;
  width: 100%;
  margin-bottom: 0;
  padding: 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  transition: all 0.2s;
  background-color: var(--el-bg-color);

  &:hover {
    border-color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .el-checkbox__input.is-checked + .el-checkbox__label {
    color: var(--el-color-primary);
  }
}

.user-name {
  margin-left: 10px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.user-description {
  font-size: 12px;
  margin-left: 10px;
  color: var(--el-text-color-regular);
}

.no-search-results {
  padding: 20px 0;
}

.no-users {
  padding: 20px 0;
}
</style>
