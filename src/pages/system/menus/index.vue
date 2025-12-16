<script lang="ts" setup>
import type { FormInstance, FormRules } from "element-plus"
import type { MenuForm, MenuTree } from "@/common/apis/menus/type"
import type { PermissionTree } from "@/common/apis/permissions/type"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { cloneDeep } from "lodash-es"
import { computed, onMounted, ref } from "vue"
import { createMenu, deleteMenu, getMenuTree, updateMenu } from "@/common/apis/menus"
import { getPermissionTreeApi } from "@/common/apis/permissions"
import MenuExtraDialog from "./components/MenuExtraDialog.vue"

defineOptions({
  name: "Menus"
})

const loading = ref<boolean>(false)
const submitLoading = ref<boolean>(false)
const currentUpdateId = ref<string>("")

// #region 表单相关
const defaultForm: MenuForm = {
  id: undefined,
  parentId: undefined,
  scope: 0,
  title: "",
  type: 0,
  sortOrder: 0,
  isActive: true
}
const currentMenuId = ref<string>("")
const menuExtraDialogVisible = ref<boolean>(false)
const dialogVisible = ref<boolean>(false)
const formRef = ref<FormInstance | null>(null)
const formData = ref<MenuForm>(cloneDeep(defaultForm))

const formRules = computed(() => {
  const rules: FormRules = {
    scope: [{ required: true, validator: (_, value, callback) => {
      if (value === 0) callback(new Error("请选择菜单作用域"))
      else callback()
    }, trigger: "blur", message: "请选择菜单作用域" }],
    title: [{ required: true, trigger: "blur", message: "请输入菜单名称" }],
    type: [{ required: true, validator: (_, value, callback) => {
      if (value === 0) callback(new Error("请选择菜单类型"))
      else callback()
    }, trigger: "blur", message: "请选择菜单类型" }]
  }
  if (formData.value.type === 1) {
    // 目录
    rules.routePath = [{ required: true, trigger: "blur", message: "请输入路由路径" }]
  } else if (formData.value.type === 2) {
    // 页面
    rules.routePath = [{ required: true, trigger: "blur", message: "请输入路由路径" }]
    rules.routeName = [{ required: true, trigger: "blur", message: "请输入路由名称" }]
    rules.component = [{ required: true, trigger: "blur", message: "请输入组件路径" }]
  } else if (formData.value.type === 3) {
    // 外链
    rules.externalUrl = [{ required: true, trigger: "blur", message: "请输入外链地址" }]
    rules.target = [{ required: true, trigger: "blur", message: "请输入打开方式" }]
  }
  return rules
})

function resetForm() {
  currentUpdateId.value = ""
  formRef.value?.clearValidate()
  formData.value = cloneDeep(defaultForm)
}
// #endregion

// #region 数据相关
const menuData = ref<MenuTree[]>([])
const permissionData = ref<PermissionTree[]>([])

// 菜单树选项（用于父级菜单选择）
const menuTreeOptions = computed(() => {
  const buildOptions = (nodes: MenuTree[], excludeId?: string): any[] => {
    return nodes
      .filter(node => node.id !== excludeId)
      .map(node => ({
        id: node.id,
        title: node.title,
        children: node.children ? buildOptions(node.children, excludeId) : []
      }))
  }
  return buildOptions(menuData.value, currentUpdateId.value)
})

// 权限树选项（用于权限选择）
const permissionTreeOptions = computed(() => {
  const buildOptions = (nodes: PermissionTree[]): any[] => {
    return nodes.map(node => ({
      id: node.id,
      name: node.name,
      code: node.code,
      children: node.children ? buildOptions(node.children) : []
    }))
  }
  return buildOptions(permissionData.value)
})

// 根据权限ID获取权限名称
function getPermissionNameById(permissionId?: string): string {
  if (!permissionId) return ""

  const findPermission = (nodes: PermissionTree[]): PermissionTree | null => {
    for (const node of nodes) {
      if (node.id === permissionId) {
        return node
      }
      if (node.children) {
        const found = findPermission(node.children)
        if (found) return found
      }
    }
    return null
  }

  const permission = findPermission(permissionData.value)
  return permission ? `${permission.name}(${permission.code})` : ""
}

async function getMenuData() {
  loading.value = true
  try {
    const { data } = await getMenuTree()
    menuData.value = data || []
  } catch (error) {
    console.error("获取菜单树失败:", error)
    menuData.value = []
    ElMessage.error("获取菜单数据失败")
  } finally {
    loading.value = false
  }
}

async function getPermissionData() {
  try {
    const { data } = await getPermissionTreeApi()
    permissionData.value = data || []
  } catch (error) {
    console.error("获取权限树失败:", error)
    permissionData.value = []
  }
}
// #endregion

// #region 增删改操作
function handleCreate(parentRow?: MenuTree) {
  resetForm()
  if (parentRow) {
    formData.value.parentId = parentRow.id
  }
  dialogVisible.value = true
}

function handleUpdate(row: MenuTree) {
  currentUpdateId.value = row.id
  formData.value = {
    id: row.id,
    parentId: row.parentId || undefined,
    scope: row.scope,
    title: row.title,
    type: row.type,
    routeName: row.routeName,
    routePath: row.routePath,
    component: row.component,
    externalUrl: row.externalUrl,
    target: row.target,
    redirect: row.redirect,
    permissionId: row.permissionId,
    description: row.description,
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
      await updateMenu(formData.value)
      ElMessage.success("修改成功")
    } else {
      await createMenu(formData.value)
      ElMessage.success("创建成功")
    }
    dialogVisible.value = false
    await getMenuData()
  } catch (error) {
    console.error("操作失败:", error)
    ElMessage.error("操作失败")
  } finally {
    submitLoading.value = false
  }
}

function handleDelete(row: MenuTree) {
  ElMessageBox.confirm(
    `确认删除菜单"${row.title}"吗？删除后不可恢复！`,
    "删除确认",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    }
  ).then(async () => {
    try {
      await deleteMenu(row.id)
      ElMessage.success("删除成功")
      await getMenuData()
    } catch (error) {
      console.error("删除失败:", error)
      ElMessage.error("删除失败")
    }
  })
}
// #endregion

onMounted(async () => {
  await getPermissionData()
  await getMenuData()
})

function getMenuType(menu: MenuTree) {
  if (menu.type === 0) {
    return "未知"
  } else if (menu.type === 1) {
    return "目录"
  } else if (menu.type === 2) {
    return "页面"
  } else if (menu.type === 3) {
    return "外链"
  } else {
    return "未知"
  }
}

function openMenuExtraDialog(menuId: string) {
  currentMenuId.value = menuId
  menuExtraDialogVisible.value = true
}
</script>

<template>
  <div class="app-container">
    <el-card v-loading="loading" shadow="never">
      <div class="toolbar-wrapper">
        <div>
          <el-button type="primary" :icon="CirclePlus" @click="() => handleCreate()">
            新增菜单
          </el-button>
        </div>
        <div>
          <el-tooltip content="刷新当前页">
            <el-button type="primary" :icon="RefreshRight" circle @click="getMenuData" />
          </el-tooltip>
        </div>
      </div>
      <div class="table-wrapper">
        <el-table :data="menuData" row-key="id" show-overflow-tooltip>
          <el-table-column prop="title" label="菜单名称" align="left" width="200" />
          <el-table-column prop="scope" label="菜单作用域" align="center" width="100">
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
          <el-table-column prop="type" label="菜单类型" align="center" width="80">
            <template #default="scope">
              <el-tag>
                {{ getMenuType(scope.row) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="permissionId" label="关联权限" align="left" width="190">
            <template #default="scope">
              {{ getPermissionNameById(scope.row.permissionId) }}
            </template>
          </el-table-column>
          <el-table-column prop="routePath" label="页面路径" align="left" />
          <el-table-column prop="component" label="组件路径" align="left" />

          <el-table-column prop="sortOrder" label="排序" align="center" width="80" />
          <el-table-column prop="isSystem" label="系统菜单" align="center" width="80">
            <template #default="scope">
              <el-tag v-if="scope.row.isSystem" type="warning" effect="dark">
                是
              </el-tag>
              <el-tag v-else type="success" effect="plain">
                否
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column fixed="right" label="操作" width="320" align="center">
            <template #default="scope">
              <el-button type="primary" text bg size="small" @click="handleCreate(scope.row)">
                新增子菜单
              </el-button>
              <el-button type="primary" text bg size="small" @click="handleUpdate(scope.row)">
                修改
              </el-button>
              <el-button type="primary" text bg size="small" @click="openMenuExtraDialog(scope.row.id)">
                修改扩展
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
      :title="currentUpdateId ? '修改菜单' : '新增菜单'"
      @closed="resetForm"
      width="600px"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item prop="parentId" label="父级菜单">
          <el-tree-select
            v-model="formData.parentId"
            :data="menuTreeOptions"
            :props="{ value: 'id', label: 'title', children: 'children' }"
            placeholder="请选择父级菜单（可为空）"
            clearable
            check-strictly
            :render-after-expand="false"
          />
        </el-form-item>

        <el-form-item prop="scope" label="菜单作用域">
          <el-select v-model="formData.scope" placeholder="请选择菜单作用域">
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

        <el-form-item prop="type" label="菜单类型">
          <el-select v-model="formData.type" placeholder="请选择菜单类型">
            <el-option
              label="未知"
              :value="0"
            />
            <el-option
              label="目录"
              :value="1"
            />
            <el-option
              label="页面"
              :value="2"
            />
            <el-option
              label="外链"
              :value="3"
            />
          </el-select>
        </el-form-item>

        <el-form-item prop="title" label="菜单名称">
          <el-input v-model="formData.title" placeholder="请输入菜单名称" />
        </el-form-item>

        <el-form-item v-if="formData.type === 2" prop="routeName" label="路由名称">
          <el-input v-model="formData.routeName" placeholder="请输入路由名称" />
        </el-form-item>
        <el-form-item v-if="formData.type === 1 || formData.type === 2" prop="routePath" label="路由路径">
          <el-input v-model="formData.routePath" placeholder="请输入路由路径" />
        </el-form-item>
        <el-form-item v-if="formData.type === 2" prop="component" label="组件路径">
          <el-input v-model="formData.component" placeholder="请输入组件路径" />
        </el-form-item>
        <el-form-item v-if="formData.type === 1" prop="redirect" label="重定向">
          <el-input v-model="formData.redirect" placeholder="请输入重定向地址" />
        </el-form-item>

        <el-form-item v-if="formData.type === 3" prop="externalUrl" label="外链地址">
          <el-input v-model="formData.externalUrl" placeholder="请输入外链地址" />
        </el-form-item>
        <el-form-item v-if="formData.type === 3" prop="target" label="打开方式">
          <el-select v-model="formData.target" placeholder="请选择打开方式">
            <el-option value="_blank" label="新窗口" />
            <el-option value="_self" label="当前窗口" />
            <el-option value="_parent" label="父窗口" />
          </el-select>
        </el-form-item>

        <el-form-item prop="permissionId" label="关联权限">
          <el-tree-select
            v-model="formData.permissionId"
            :data="permissionTreeOptions"
            :props="{ value: 'id', label: 'name', children: 'children' }"
            placeholder="请选择关联权限（可为空）"
            clearable
            check-strictly
            :render-after-expand="false"
          />
        </el-form-item>
        <el-form-item prop="description" label="菜单描述">
          <el-input v-model="formData.description" type="textarea" placeholder="请输入菜单描述" />
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
        <el-form-item prop="order" label="排序">
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

    <MenuExtraDialog
      v-model:visible="menuExtraDialogVisible"
      :menu-id="currentMenuId"
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
