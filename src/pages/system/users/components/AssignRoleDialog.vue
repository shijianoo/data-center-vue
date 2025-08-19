<script lang="ts" setup>
import type { CheckboxValueType } from "element-plus"
import type { Role } from "@/common/apis/roles/type"
import { ElMessage } from "element-plus"
import { computed, ref } from "vue"
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

// 搜索关键词
const searchKeyword = ref<string>("")

// 过滤后的角色列表
const filteredRoles = computed(() => {
  if (!searchKeyword.value.trim()) {
    return allRoles.value
  }

  const keyword = searchKeyword.value.toLowerCase()
  return allRoles.value.filter(role =>
    role.name.toLowerCase().includes(keyword)
    || (role.description && role.description.toLowerCase().includes(keyword))
  )
})

// 全选状态
const isAllSelected = computed(() => {
  if (filteredRoles.value.length === 0) return false
  return filteredRoles.value.every(role => selectedRoleIds.value.includes(role.id))
})

// 是否部分选中
const isIndeterminate = computed(() => {
  const selectedCount = filteredRoles.value.filter(role =>
    selectedRoleIds.value.includes(role.id)
  ).length
  return selectedCount > 0 && selectedCount < filteredRoles.value.length
})

// 全选/取消全选
function handleSelectAll(checked: CheckboxValueType) {
  if (checked) {
    // 全选：将当前过滤结果中未选中的角色添加到已选列表
    const newSelectedIds = [...selectedRoleIds.value]
    filteredRoles.value.forEach((role) => {
      if (!newSelectedIds.includes(role.id)) {
        newSelectedIds.push(role.id)
      }
    })
    selectedRoleIds.value = newSelectedIds
  } else {
    // 取消全选：从已选列表中移除当前过滤结果中的角色
    selectedRoleIds.value = selectedRoleIds.value.filter(id =>
      !filteredRoles.value.some(role => role.id === id)
    )
  }
}

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
  searchKeyword.value = ""
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
    <div v-loading="loading">
      <el-alert
        type="primary"
        :closable="false"
        show-icon
      >
        <template #title>
          为用户 <strong>{{ userName }}</strong> 分配角色
        </template>
      </el-alert>

      <div class="role-assignment-container">
        <h4 class="section-title">
          选择角色
          <span class="role-count">(共 {{ allRoles.length }} 个角色)</span>
        </h4>

        <!-- 搜索框 -->
        <div class="search-container">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索角色名称或描述..."
            clearable
            prefix-icon="Search"
          />
        </div>

        <div v-if="allRoles.length > 0" class="role-list-container">
          <div v-if="filteredRoles.length > 0" class="role-list">
            <!-- 全选控制 -->
            <div>
              <el-checkbox
                :model-value="isAllSelected"
                :indeterminate="isIndeterminate"
                @change="handleSelectAll"
              >
                全选 ({{ filteredRoles.filter(role => selectedRoleIds.includes(role.id)).length }}/{{ filteredRoles.length }})
              </el-checkbox>
            </div>

            <el-divider style="margin: 6px 0;" />

            <el-checkbox-group v-model="selectedRoleIds">
              <el-checkbox
                v-for="role in filteredRoles"
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

          <div v-else class="no-search-results">
            <el-empty description="未找到匹配的角色" />
          </div>
        </div>

        <div v-else class="no-roles">
          <el-empty description="暂无角色" />
        </div>
      </div>
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
.role-assignment-container {
  margin-top: 16px;
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.role-count {
  color: var(--el-text-color-secondary);
  font-size: 14px;
  font-weight: 400;
}

.search-container {
  margin-bottom: 16px;
}

.role-list-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  padding: 12px;
  background-color: var(--el-bg-color-page);
}

.role-list {
  .el-checkbox-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}

.role-item {
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

.role-name {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.role-description {
  font-size: 12px;
  margin-left: 10px;
  color: var(--el-text-color-regular);
}

.no-search-results {
  padding: 20px 0;
}

.no-roles {
  padding: 20px 0;
}
</style>
