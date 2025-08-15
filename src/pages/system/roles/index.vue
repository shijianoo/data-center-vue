<script lang="ts" setup>
import type { FormRules } from "element-plus"
import type { Role, RoleForm } from "@/common/apis/roles/type"
import { ArrowDown, CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { cloneDeep } from "lodash-es"
import { createRoleApi, deleteRoleApi, getAllRolesApi, updateRoleApi } from "@/common/apis/roles"
import AssignMenusDialog from "./components/AssignMenusDialog.vue"
import AssignPermissionsDialog from "./components/AssignPermissionsDialog.vue"

defineOptions({
  name: "Roles"
})

const loading = ref(false)

// #region 增 + 改 表单逻辑
const defaultForm: RoleForm = {
  id: undefined,
  name: "",
  code: "",
  level: 0,
  dataScope: "",
  description: "",
  isSystem: false,
  isActive: true,
  order: 0,
  extra: ""
}

const dialogVisible = ref(false)
const formRef = useTemplateRef("formRef")
const formData = ref<RoleForm>(cloneDeep(defaultForm))

const formRules: FormRules = {
  name: [{ required: true, trigger: "blur", message: "请输入角色名称" }],
  code: [{ required: true, trigger: "blur", message: "请输入角色代码" }]
}
function handleCreateOrUpdate() {
  formRef.value?.validate(async (valid: boolean) => {
    if (!valid) {
      ElMessage.error("表单校验不通过")
      return
    }
    loading.value = true
    try {
      if (formData.value.id) {
        await updateRoleApi(formData.value)
      } else {
        await createRoleApi(formData.value)
      }
      ElMessage.success("操作成功")
      dialogVisible.value = false
    } finally {
      loading.value = false
      getRoleData()
    }
  })
}
function resetForm() {
  formRef.value?.clearValidate()
  formData.value = cloneDeep(defaultForm)
}
// #endregion

// #region 删除
function handleDelete(row: Role) {
  ElMessageBox.confirm(`正在删除角色：${row.name}，确认删除？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    await deleteRoleApi(row.id)
    getRoleData()
    ElMessage.success("删除成功")
  })
}
// #endregion

// #region 编辑
function handleUpdate(row: Role) {
  dialogVisible.value = true
  formData.value = {
    id: row.id,
    name: row.name,
    code: row.code,
    level: row.level,
    dataScope: row.dataScope,
    description: row.description,
    isSystem: row.isSystem,
    isActive: row.isActive,
    order: row.order,
    extra: row.extra
  }
}
// #endregion

// #region 查
const roleData = ref<Role[]>([])

function getRoleData() {
  loading.value = true
  getAllRolesApi().then(({ data }) => {
    console.log("获取角色数据", data.items)
    roleData.value = data.items
  }).catch(() => {
    roleData.value = []
  }).finally(() => {
    loading.value = false
  })
}
// #endregion

// #region 菜单分配
const menuDialogVisible = ref(false)
const currentMenuRole = ref<Role | null>(null)

// 打开菜单分配对话框
function handleAssignMenus(row: Role) {
  currentMenuRole.value = row
  menuDialogVisible.value = true
}

// #endregion

// #region 权限分配
const permissionDialogVisible = ref(false)
const currentPermissionRole = ref<Role | null>(null)

// 打开权限分配对话框
function handleAssignPermissions(row: Role) {
  currentPermissionRole.value = row
  permissionDialogVisible.value = true
}
// #endregion

onMounted(() => {
  getRoleData()
})
</script>

<template>
  <div class="app-container">
    <el-card v-loading="loading" shadow="never">
      <div class="toolbar-wrapper">
        <div>
          <el-button type="primary" :icon="CirclePlus" @click="dialogVisible = true">
            新增角色
          </el-button>
        </div>
        <div>
          <el-tooltip content="刷新当前页">
            <el-button type="primary" :icon="RefreshRight" circle @click="getRoleData" />
          </el-tooltip>
        </div>
      </div>
      <div class="table-wrapper">
        <el-table :data="roleData">
          <el-table-column prop="name" label="角色名称" align="center" />
          <el-table-column prop="code" label="角色代码" align="center" />
          <el-table-column prop="level" label="级别" align="center" />
          <el-table-column prop="dataScope" label="数据范围" align="center" />
          <el-table-column prop="description" label="描述" align="center" />
          <el-table-column prop="isActive" label="状态" align="center">
            <template #default="scope">
              <el-tag :type="scope.row.isActive ? 'success' : 'info'">
                {{ scope.row.isActive ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="isSystem" label="系统内置" align="center">
            <template #default="scope">
              <el-tag :type="scope.row.isSystem ? 'danger' : 'info'">
                {{ scope.row.isSystem ? '是' : '否' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="order" label="排序" align="center" />
          <el-table-column fixed="right" label="操作" width="260" align="center">
            <template #default="scope">
              <el-dropdown>
                <el-button type="primary" text bg size="small">
                  权限管理
                  <el-icon class="el-icon--right">
                    <ArrowDown />
                  </el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="handleAssignMenus(scope.row)">
                      分配菜单
                    </el-dropdown-item>
                    <el-dropdown-item @click="handleAssignPermissions(scope.row)">
                      分配权限
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
      :title="formData.id === undefined ? '新增角色' : '修改角色'"
      width="400px"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" label-position="left">
        <el-form-item prop="name" label="角色名称">
          <el-input v-model="formData.name" placeholder="请输入" />
        </el-form-item>
        <el-form-item prop="code" label="角色代码">
          <el-input v-model="formData.code" placeholder="请输入" />
        </el-form-item>
        <el-form-item prop="level" label="级别">
          <el-input-number v-model="formData.level" :min="0" />
        </el-form-item>
        <el-form-item prop="dataScope" label="数据范围">
          <el-input v-model="formData.dataScope" placeholder="请输入" />
        </el-form-item>
        <el-form-item prop="description" label="描述">
          <el-input v-model="formData.description" placeholder="请输入" />
        </el-form-item>
        <el-form-item prop="isActive" label="状态">
          <el-switch v-model="formData.isActive" />
        </el-form-item>
        <el-form-item prop="order" label="排序">
          <el-input-number v-model="formData.order" :min="0" />
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

    <!-- 菜单权限分配对话框 -->
    <AssignMenusDialog
      v-model:visible="menuDialogVisible"
      :role-id="currentMenuRole?.id"
      :role-name="currentMenuRole?.name"
    />

    <!-- 权限分配对话框 -->
    <AssignPermissionsDialog
      v-model:visible="permissionDialogVisible"
      :role-id="currentPermissionRole?.id"
      :role-name="currentPermissionRole?.name"
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
