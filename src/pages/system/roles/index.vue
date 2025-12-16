<script lang="ts" setup>
import type { FormRules } from "element-plus"
import type { Role, RoleForm } from "@/common/apis/roles/type"
import { ArrowDown, CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { cloneDeep } from "lodash-es"
import { createRoleApi, deleteRoleApi, getAllRolesApi, updateRoleApi } from "@/common/apis/roles"
import { useTenantStore } from "@/pinia/stores/tenant"
import AssignMenusDialog from "./components/AssignMenusDialog.vue"
import AssignPermissionsDialog from "./components/AssignPermissionsDialog.vue"

defineOptions({
  name: "Roles"
})

const tenantStore = useTenantStore()
const currentSelectedTenantId = ref("")
const loading = ref(false)

// #region 增 + 改 表单逻辑
const defaultForm: RoleForm = {
  scope: 0,
  name: "",
  code: "",
  description: "",
  isActive: true,
  sortOrder: 0
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
    tenantId: row.tenantId,
    scope: row.scope,
    name: row.name,
    code: row.code,
    description: row.description,
    isActive: row.isActive,
    sortOrder: row.sortOrder
  }
}
// #endregion

// #region 查
const roleData = ref<Role[]>([])

function getRoleData() {
  loading.value = true
  getAllRolesApi(currentSelectedTenantId.value, true).then(({ data }) => {
    roleData.value = data
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

watch(() => currentSelectedTenantId.value, () => {
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
          <el-select :style="{ marginLeft: '10px' }" clearable v-model="currentSelectedTenantId" placeholder="请选择租户" style="width: 200px;">
            <el-option v-for="tenant in tenantStore.tenants" :key="tenant.id" :label="tenant.name" :value="tenant.id" />
          </el-select>
        </div>
        <div>
          <el-tooltip content="刷新当前页">
            <el-button type="primary" :icon="RefreshRight" circle @click="getRoleData" />
          </el-tooltip>
        </div>
      </div>
      <div class="table-wrapper">
        <el-table :data="roleData" show-overflow-tooltip>
          <el-table-column prop="tenantName" label="租户名称" align="left" width="200" />
          <el-table-column prop="name" label="角色名称" align="left" width="140" />
          <el-table-column prop="scope" label="权限作用域" align="center" width="100">
            <template #default="scope">
              <el-tag v-if="scope.row.scope === 1" type="success" effect="dark">
                平台
              </el-tag>
              <el-tag v-else-if="scope.row.scope === 2" type="danger" effect="plain">
                租户
              </el-tag>
              <el-tag v-else type="danger" effect="dark">
                未知
              </el-tag>
            </template>
          </el-table-column>
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

          <el-table-column prop="code" label="角色代码" align="left" width="200" />
          <el-table-column prop="description" label="描述" align="left" />
          <el-table-column label="级别" align="center" width="60">
            <template #default="scope">
              {{ scope.row.extra.level }}
            </template>
          </el-table-column>
          <el-table-column prop="sortOrder" label="排序" align="center" width="60" />
          <el-table-column prop="isActive" label="状态" align="center" width="60">
            <template #default="scope">
              <el-tag v-if="scope.row.isActive" type="success" effect="plain">
                启用
              </el-tag>
              <el-tag v-else type="danger" effect="dark">
                禁用
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="isSystem" label="系统角色" align="center" width="80">
            <template #default="scope">
              <el-tag v-if="scope.row.isSystem" type="warning" effect="dark">
                是
              </el-tag>
              <el-tag v-else type="success" effect="plain">
                否
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column fixed="right" label="操作" width="220" align="center">
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
              <el-button type="danger" text bg size="small" @click="handleDelete(scope.row)" :disabled="scope.row.isSystem">
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
        <el-form-item prop="tenantId" label="租户">
          <el-select v-model="formData.tenantId" placeholder="请选择">
            <el-option v-for="item in tenantStore.tenants" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item prop="scope" label="角色作用域">
          <el-select v-model="formData.scope" placeholder="请选择角色作用域">
            <el-option
              label="未知"
              :value="0"
            />
            <el-option
              label="平台"
              :value="1"
            />
            <el-option
              label="租户"
              :value="2"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="name" label="角色名称">
          <el-input v-model="formData.name" placeholder="请输入" />
        </el-form-item>

        <el-form-item prop="code" label="角色代码">
          <el-input v-model="formData.code" placeholder="请输入" />
        </el-form-item>

        <el-form-item prop="description" label="描述">
          <el-input v-model="formData.description" placeholder="请输入" type="textarea" />
        </el-form-item>
        <el-form-item prop="isActive" label="状态">
          <el-radio-group v-model="formData.isActive">
            <el-radio :label="true">
              启用
            </el-radio>
            <el-radio :label="false">
              禁用
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item prop="sortOrder" label="排序">
          <el-input-number v-model="formData.sortOrder" :min="0" />
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
