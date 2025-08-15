<script lang="ts" setup>
import type { FormRules } from "element-plus"
import type { User, UserForm } from "@/common/apis/users/type"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { cloneDeep } from "lodash-es"
import { createUserApi, deleteUserApi, getAllUsersApi, resetPasswordApi, updateUserApi } from "@/common/apis/users"
import AssignDeviceDialog from "./components/AssignDeviceDialog.vue"
import AssignRoleDialog from "./components/AssignRoleDialog.vue"

defineOptions({
  name: "Users"
})

const loading = ref(false)

// #region 增 + 改 表单逻辑
const defaultForm: UserForm = {
  id: undefined,
  userName: "",
  password: "",
  nickName: "",
  email: "",
  phoneNumber: "",
  description: "",
  isActive: true,
  isAdmin: false,
  extra: ""
}

const dialogVisible = ref(false)
const formRef = useTemplateRef("formRef")
const formData = ref<UserForm>(cloneDeep(defaultForm))

const formRules: FormRules<UserForm> = {
  userName: [
    { required: true, trigger: "blur", message: "请输入用户名称" },
    { min: 3, max: 20, message: "用户名长度应在3-20个字符之间", trigger: "blur" }
  ],
  password: [
    { required: true, trigger: "blur", message: "请输入用户密码" },
    { min: 6, message: "密码长度不能少于6个字符", trigger: "blur" }
  ],
  email: [
    { type: "email", message: "请输入正确的邮箱格式", trigger: "blur" }
  ],
  phoneNumber: [
    { pattern: /^1[3-9]\d{9}$/, message: "请输入正确的手机号格式", trigger: "blur" }
  ]
}
function handleCreateOrUpdate() {
  formRef.value?.validate(async (valid) => {
    if (!valid) {
      ElMessage.error("表单校验不通过")
      return
    }

    loading.value = true
    try {
      if (formData.value.id) {
        await updateUserApi(formData.value)
      } else {
        await createUserApi(formData.value)
      }
      ElMessage.success("操作成功")
      dialogVisible.value = false
    } finally {
      loading.value = false
      getUserData()
    }
  })
}
function resetForm() {
  formRef.value?.clearValidate()
  formData.value = cloneDeep(defaultForm)
}
// #endregion

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
function handleUpdate(row: User) {
  dialogVisible.value = true
  formData.value = {
    id: row.id,
    userName: row.userName,
    nickName: row.nickName,
    email: row.email,
    phoneNumber: row.phoneNumber,
    description: row.description,
    isActive: row.isActive,
    isAdmin: row.isAdmin,
    extra: row.extra
  }
}
// #endregion

// #region 查
const userData = ref<User[]>([])

function getUserData() {
  loading.value = true
  getAllUsersApi().then(({ data }) => {
    console.log("获取用户数据", data.items)
    userData.value = data.items
  }).catch(() => {
    userData.value = []
  }).finally(() => {
    loading.value = false
  })
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

function handleAssignDevice(row: User) {
  currentUserId.value = row.id
  currentUserName.value = row.userName
  assignDeviceDialogVisible.value = true
}
// #endregion

onMounted(() => {
  getUserData()
})
</script>

<template>
  <div class="app-container">
    <el-card v-loading="loading" shadow="never">
      <div class="toolbar-wrapper">
        <div>
          <el-button type="primary" :icon="CirclePlus" @click="dialogVisible = true">
            新增用户
          </el-button>
        </div>
        <div>
          <el-tooltip content="刷新当前页">
            <el-button type="primary" :icon="RefreshRight" circle @click="getUserData" />
          </el-tooltip>
        </div>
      </div>
      <div class="table-wrapper">
        <el-table :data="userData">
          <el-table-column prop="userName" label="用户名称" align="center" />
          <el-table-column prop="nickName" label="用户昵称" align="center" />
          <el-table-column prop="email" label="邮箱" align="center" />
          <el-table-column prop="phoneNumber" label="手机号" align="center" />
          <el-table-column prop="description" label="描述" align="center" />
          <el-table-column prop="isActive" label="状态" align="center">
            <template #default="scope">
              <el-tag :type="scope.row.isActive ? 'success' : 'info'">
                {{ scope.row.isActive ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="isAdmin" label="管理员" align="center">
            <template #default="scope">
              <el-tag :type="scope.row.isAdmin ? 'warning' : 'info'">
                {{ scope.row.isAdmin ? '是' : '否' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="isSystem" label="系统用户" align="center">
            <template #default="scope">
              <el-tag :type="scope.row.isSystem ? 'danger' : 'info'">
                {{ scope.row.isSystem ? '是' : '否' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column fixed="right" label="操作" width="260" align="center">
            <template #default="scope">
              <el-dropdown trigger="click">
                <el-button type="primary" text bg size="small">
                  用户管理
                  <el-icon class="el-icon--right">
                    <ArrowDown />
                  </el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="handleAssignRoles(scope.row)">
                      分配角色
                    </el-dropdown-item>
                    <el-dropdown-item @click="handleAssignDevice(scope.row)">
                      分配设备
                    </el-dropdown-item>
                    <el-dropdown-item @click="handleResetPassword(scope.row)">
                      重置密码
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <el-button type="primary" text bg size="small" @click="handleUpdate(scope.row)">
                修改
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
      :title="formData.id === undefined ? '新增用户' : '修改用户'"
      width="400px"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" label-position="left">
        <el-form-item prop="userName" label="用户名称">
          <el-input v-model="formData.userName" placeholder="请输入" />
        </el-form-item>
        <el-form-item v-if="formData.id === undefined" prop="password" label="用户密码">
          <el-input v-model="formData.password" placeholder="请输入" />
        </el-form-item>
        <el-form-item prop="nickName" label="昵称">
          <el-input v-model="formData.nickName" placeholder="请输入" />
        </el-form-item>
        <el-form-item prop="email" label="邮箱">
          <el-input v-model="formData.email" placeholder="请输入" />
        </el-form-item>
        <el-form-item prop="phoneNumber" label="手机号">
          <el-input v-model="formData.phoneNumber" placeholder="请输入" />
        </el-form-item>
        <el-form-item prop="description" label="描述">
          <el-input v-model="formData.description" placeholder="请输入" />
        </el-form-item>
        <el-form-item prop="isActive" label="状态">
          <el-switch v-model="formData.isActive" />
        </el-form-item>
        <el-form-item prop="isAdmin" label="管理员">
          <el-switch v-model="formData.isAdmin" />
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
  </div>
</template>

<style lang="scss" scoped>
.toolbar-wrapper {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}
</style>
