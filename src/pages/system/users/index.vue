<script lang="ts" setup>
import type { TenantSummary } from "@/common/apis/tenant/type"
import type { User } from "@/common/apis/users/type"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { onMounted, ref, watch } from "vue"
import { getTenantSummaryListApi } from "@/common/apis/tenant"
import { deleteUserApi, getAllUsersApi, resetPasswordApi } from "@/common/apis/users"
import AssignDeviceDialog from "./components/AssignDeviceDialog.vue"
import AssignRoleDialog from "./components/AssignRoleDialog.vue"
import UserEditDialog from "./components/UserEditDialog.vue"
import UserExtraDialog from "./components/UserExtraDialog.vue"

defineOptions({
  name: "Users"
})

const currentSelectedTenantId = ref("")
const loading = ref(false)
const tenantList = ref<TenantSummary[]>([])

async function getTenantList() {
  loading.value = true
  try {
    const { data } = await getTenantSummaryListApi()
    tenantList.value = data || []
  } catch (error) {
    console.error("获取租户列表失败:", error)
    tenantList.value = []
    ElMessage.error("获取租户数据失败")
  } finally {
    loading.value = false
  }
}

const editDialogVisible = ref(false)
const currentEditId = ref<string | undefined>(undefined)

// #region 删除
function handleDelete(row: User) {
  ElMessageBox.confirm(`正在删除用户：${row.userName}，确认删除？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    await deleteUserApi(row.id)
    getUserData()
    ElMessage.success("删除成功")
  })
}
// #endregion

// #region 编辑
function handleCreate() {
  currentEditId.value = undefined
  editDialogVisible.value = true
}

function handleUpdate(row: User) {
  currentEditId.value = row.id
  editDialogVisible.value = true
}
// #endregion

// #region 查
const userData = ref<User[]>([])

function getUserData() {
  loading.value = true
  getAllUsersApi(currentSelectedTenantId.value).then(({ data }) => {
    console.log("获取用户数据", data)
    userData.value = data
  }).catch(() => {
    userData.value = []
  }).finally(() => {
    loading.value = false
  })
}
// #endregion

// #region 扩展信息
const userExtraDialogVisible = ref(false)

function handleExtra(row: User) {
  currentUserId.value = row.id
  userExtraDialogVisible.value = true
}
// #endregion

// #region 重置密码
function handleResetPassword(row: User) {
  ElMessageBox.confirm(`确定要重置用户 ${row.userName} 的密码吗？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    loading.value = true
    try {
      await resetPasswordApi(row.id, "123456") // 假设新密码为123456
      ElMessage.success("密码重置成功")
    } catch (error) {
      console.error(error)
      ElMessage.error("密码重置失败")
    } finally {
      loading.value = false
    }
  })
}
// #endregion

// #region 分配角色和设备
const assignRoleDialogVisible = ref(false)
const assignDeviceDialogVisible = ref(false)
const currentUserId = ref<string>("")
const currentUserName = ref<string>("")

function handleAssignRoles(row: User) {
  currentUserId.value = row.id
  currentUserName.value = row.userName
  assignRoleDialogVisible.value = true
}

// function handleAssignDevice(row: User) {
//   currentUserId.value = row.id
//   currentUserName.value = row.userName
//   assignDeviceDialogVisible.value = true
// }
// #endregion

onMounted(() => {
  getUserData()
  getTenantList()
})

watch(() => currentSelectedTenantId.value, () => {
  getUserData()
})
</script>

<template>
  <div class="app-container">
    <el-card v-loading="loading" shadow="never">
      <div class="toolbar-wrapper">
        <div>
          <el-button type="primary" :icon="CirclePlus" @click="handleCreate">
            新增用户
          </el-button>
          <el-select :style="{ marginLeft: '10px' }" clearable v-model="currentSelectedTenantId" placeholder="请选择租户" style="width: 200px;">
            <el-option v-for="tenant in tenantList" :key="tenant.id" :label="tenant.name" :value="tenant.id" />
          </el-select>
        </div>
        <div>
          <el-tooltip content="刷新当前页">
            <el-button type="primary" :icon="RefreshRight" circle @click="getUserData" />
          </el-tooltip>
        </div>
      </div>
      <div class="table-wrapper">
        <el-table :data="userData">
          <el-table-column type="expand">
            <template #default="scope">
              <div style="padding: 0 30px;">
                <el-descriptions size="small" title="用户详细信息" :column="3" border>
                  <el-descriptions-item label="邮箱">
                    {{ scope.row.email || '-' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="邮箱验证时间">
                    {{ scope.row.emailVerifiedAt || '未验证' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="手机号">
                    {{ scope.row.phone || '-' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="手机验证时间">
                    {{ scope.row.phoneVerifiedAt || '未验证' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="创建时间">
                    {{ scope.row.createdAt || '-' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="排序">
                    {{ scope.row.sortOrder }}
                  </el-descriptions-item>
                  <el-descriptions-item label="系统用户">
                    <el-tag v-if="scope.row.isSystem" type="warning" effect="dark" size="small">
                      是
                    </el-tag>
                    <el-tag v-else type="success" effect="plain" size="small">
                      否
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="描述" :span="2">
                    {{ scope.row.description || '-' }}
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="userName" label="用户名称" align="left" min-width="120" show-overflow-tooltip />
          <el-table-column prop="nickName" label="用户昵称" align="left" min-width="120" show-overflow-tooltip />
          <el-table-column prop="realName" label="真实姓名" align="left" min-width="120" show-overflow-tooltip />
          <el-table-column prop="phone" label="手机号" align="center" width="120" show-overflow-tooltip />
          <el-table-column prop="email" label="邮箱" align="left" min-width="140" show-overflow-tooltip />
          <el-table-column prop="isActive" label="状态" align="center" width="80">
            <template #default="scope">
              <el-tag v-if="scope.row.isActive" type="success" effect="plain">
                启用
              </el-tag>
              <el-tag v-else type="danger" effect="dark">
                禁用
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="isSuperAdmin" label="超级管理员" align="center" width="100px">
            <template #default="scope">
              <el-tag :type="scope.row.isSuperAdmin ? 'warning' : 'info'">
                {{ scope.row.isSuperAdmin ? '是' : '否' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column fixed="right" label="操作" width="160" align="center">
            <template #default="scope">
              <el-button type="primary" link size="small" @click="handleUpdate(scope.row)">
                修改
              </el-button>
              <el-button type="danger" link size="small" @click="handleDelete(scope.row)" :disabled="scope.row.isSystem">
                删除
              </el-button>
              <el-dropdown trigger="click" style="margin-left: 12px; vertical-align: middle;">
                <el-button type="primary" link size="small">
                  更多
                  <el-icon class="el-icon--right">
                    <ArrowDown />
                  </el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="handleExtra(scope.row)">
                      扩展信息
                    </el-dropdown-item>
                    <el-dropdown-item divided @click="handleAssignRoles(scope.row)">
                      分配角色
                    </el-dropdown-item>
                    <!-- <el-dropdown-item @click="handleAssignDevice(scope.row)">
                      分配设备
                    </el-dropdown-item> -->
                    <el-dropdown-item divided @click="handleResetPassword(scope.row)">
                      重置密码
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <UserEditDialog v-model:visible="editDialogVisible" :user-id="currentEditId" @success="getUserData" />

    <!-- 分配角色对话框 -->
    <AssignRoleDialog
      v-if="currentUserId"
      v-model:visible="assignRoleDialogVisible"
      :user-id="currentUserId"
      :user-name="currentUserName"
    />

    <!-- 分配设备对话框 -->
    <AssignDeviceDialog
      v-model:visible="assignDeviceDialogVisible"
      :user-id="currentUserId"
      :user-name="currentUserName"
    />

    <!-- 用户扩展信息对话框 -->
    <UserExtraDialog
      v-model:visible="userExtraDialogVisible"
      :user-id="currentUserId"
    />
  </div>
</template>

<style lang="scss" scoped>
.toolbar-wrapper {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}
</style>
