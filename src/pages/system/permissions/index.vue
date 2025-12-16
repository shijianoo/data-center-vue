<script lang="ts" setup>
import type { FormInstance, FormRules } from "element-plus"
import type { CreateOrUpdatePermission, PermissionTree } from "@/common/apis/permissions/type"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { cloneDeep } from "lodash-es"
import { computed, onMounted, ref } from "vue"
import {
  createPermissionApi,
  deletePermissionApi,
  getPermissionTreeApi,
  updatePermissionApi
} from "@/common/apis/permissions"

defineOptions({
  name: "Permission"
})

const loading = ref<boolean>(false)
const submitLoading = ref<boolean>(false)
const currentUpdateId = ref<string>("")
const selectedIds = ref<string[]>([])

// #region 表单相关
const defaultForm: CreateOrUpdatePermission = {
  parentId: undefined,
  scope: 0,
  type: 0,
  name: "",
  code: "",
  description: undefined,
  isActive: true,
  sortOrder: 0
}

const dialogVisible = ref<boolean>(false)
const formRef = ref<FormInstance | null>(null)
const formData = ref<CreateOrUpdatePermission>(cloneDeep(defaultForm))

const formRules: FormRules<CreateOrUpdatePermission> = {
  scope: [{ validator: (_, value, callback) => {
    if (value === 0) callback(new Error("请选择权限类型"))
    else callback()
  }, trigger: "blur", message: "请选择权限作用域" }],
  type: [{ validator: (_, value, callback) => {
    if (value === 0) callback(new Error("请选择权限类型"))
    else callback()
  }, trigger: "blur", message: "请选择权限类型" }],
  name: [{ required: true, trigger: "blur", message: "请输入权限名称" }],
  code: [{ required: true, trigger: "blur", message: "请输入权限代码" }]
}

function resetForm() {
  currentUpdateId.value = ""
  formRef.value?.clearValidate()
  formData.value = cloneDeep(defaultForm)
}
// #endregion

// #region 数据相关
const tableData = ref<PermissionTree[]>([])

// 权限树选项（用于上级权限选择）
const permissionTreeOptions = computed(() => {
  const buildOptions = (nodes: PermissionTree[], excludeId?: string): any[] => {
    return nodes
      .filter(node => node.id !== excludeId)
      .map(node => ({
        id: node.id,
        name: node.name,
        children: node.children ? buildOptions(node.children, excludeId) : []
      }))
  }
  return buildOptions(tableData.value, currentUpdateId.value)
})

async function getTableData() {
  loading.value = true
  try {
    const { data } = await getPermissionTreeApi()
    tableData.value = data || []
  } catch (error) {
    console.error("获取权限树失败:", error)
    tableData.value = []
    ElMessage.error("获取权限数据失败")
  } finally {
    loading.value = false
  }
}
// #endregion

// #region 增删改操作
function handleCreate(parentRow?: PermissionTree) {
  resetForm()
  if (parentRow) {
    formData.value.parentId = parentRow.id
  }
  dialogVisible.value = true
}

function handleUpdate(row: PermissionTree) {
  currentUpdateId.value = row.id
  formData.value = {
    parentId: row.parentId || undefined,
    scope: row.scope,
    type: row.type,
    name: row.name,
    code: row.code,
    description: row.description || undefined,
    isActive: row.isActive,
    sortOrder: row.sortOrder
  }
  dialogVisible.value = true
}

async function handleCreateOrUpdate() {
  if (!formRef.value) return

  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    if (currentUpdateId.value) {
      await updatePermissionApi(currentUpdateId.value, formData.value)
      ElMessage.success("修改成功")
    } else {
      await createPermissionApi(formData.value)
      ElMessage.success("创建成功")
    }
    dialogVisible.value = false
    await getTableData()
  } catch (error) {
    console.error("操作失败:", error)
    ElMessage.error("操作失败")
  } finally {
    submitLoading.value = false
  }
}

function handleDelete(row: PermissionTree) {
  ElMessageBox.confirm(
    `确认删除权限"${row.name}"吗？删除后不可恢复！`,
    "删除确认",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    }
  ).then(async () => {
    try {
      await deletePermissionApi(row.id)
      ElMessage.success("删除成功")
      await getTableData()
    } catch (error) {
      console.error("删除失败:", error)
      ElMessage.error("删除失败")
    }
  })
}

function handleSelectionChange(selection: PermissionTree[]) {
  selectedIds.value = selection.map(item => item.id)
}
// #endregion

onMounted(() => {
  getTableData()
})
</script>

<template>
  <div class="app-container">
    <el-card v-loading="loading" shadow="never">
      <div class="toolbar-wrapper">
        <div>
          <el-button type="primary" :icon="CirclePlus" @click="() => handleCreate()">
            新增权限
          </el-button>
        </div>
        <div>
          <el-tooltip content="刷新当前页">
            <el-button type="primary" :icon="RefreshRight" circle @click="getTableData" />
          </el-tooltip>
        </div>
      </div>
      <div class="table-wrapper">
        <el-table
          :data="tableData"
          v-loading="loading"
          row-key="id"
          show-overflow-tooltip
          :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
          @selection-change="handleSelectionChange"
        >
          <el-table-column prop="name" label="权限名称" align="left" width="200" />
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
          <el-table-column prop="type" label="权限类型" align="center" width="100">
            <template #default="scope">
              <el-tag v-if="scope.row.type === 1" type="info" effect="dark">
                分组/目录
              </el-tag>
              <el-tag v-else-if="scope.row.type === 2" type="danger" effect="plain">
                功能/操作
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
          <el-table-column prop="code" label="权限代码" align="left" min-width="150" />
          <el-table-column prop="description" label="描述" align="left" />
          <el-table-column prop="sortOrder" label="排序" align="center" width="80" />
          <el-table-column prop="isSystem" label="系统权限" align="center" width="80">
            <template #default="scope">
              <el-tag v-if="scope.row.isSystem" type="warning" effect="dark">
                是
              </el-tag>
              <el-tag v-else type="success" effect="plain">
                否
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column fixed="right" label="操作" width="240" align="center">
            <template #default="scope">
              <el-button type="primary" text bg size="small" @click="handleCreate(scope.row)">
                新增子权限
              </el-button>
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

    <!-- 新增/修改对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="currentUpdateId ? '修改权限' : '新增权限'"
      @closed="resetForm"
      width="500px"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item prop="parentId" label="上级权限">
          <el-tree-select
            v-model="formData.parentId"
            :data="permissionTreeOptions"
            :props="{ value: 'id', label: 'name', children: 'children' }"
            placeholder="请选择上级权限（可为空）"
            clearable
            check-strictly
            :render-after-expand="false"
          />
        </el-form-item>
        <el-form-item prop="scope" label="权限作用域">
          <el-select v-model="formData.scope" placeholder="请选择权限作用域">
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
        <el-form-item prop="type" label="权限类型">
          <el-select v-model="formData.type" placeholder="请选择权限类型">
            <el-option
              label="未知"
              :value="0"
            />
            <el-option
              label="分组/目录"
              :value="1"
            />
            <el-option
              label="功能/操作"
              :value="2"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="name" label="权限名称">
          <el-input v-model="formData.name" placeholder="请输入权限名称" />
        </el-form-item>
        <el-form-item prop="code" label="权限代码">
          <el-input v-model="formData.code" placeholder="请输入权限代码" />
        </el-form-item>
        <el-form-item prop="description" label="描述">
          <el-input v-model="formData.description" type="textarea" placeholder="请输入描述" />
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
        <el-button type="primary" @click="handleCreateOrUpdate" :loading="submitLoading">
          确认
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.toolbar-wrapper {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.table-wrapper {
  margin-bottom: 20px;
}
</style>
