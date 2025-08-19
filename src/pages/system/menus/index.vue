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
  name: "",
  type: 0,
  order: 0,
  isHidden: false,
  isSystem: false,
  isActive: true,
  keepAlive: false,
  affix: false
}

const dialogVisible = ref<boolean>(false)
const formRef = ref<FormInstance | null>(null)
const formData = ref<MenuForm>(cloneDeep(defaultForm))

const formRules = computed(() => {
  const rules: FormRules = {
    name: [{ required: true, trigger: "blur", message: "请输入菜单名称" }],
    type: [{ required: true, trigger: "change", message: "请选择类型" }]
  }
  if (formData.value.type === 0) {
    // 页面
    rules.routePath = [{ required: true, trigger: "blur", message: "请输入路由路径" }]
    rules.routeName = [{ required: true, trigger: "blur", message: "请输入路由名称" }]
  } else if (formData.value.type === 1) {
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
        name: node.name,
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
  return permission ? permission.code : ""
}

async function getMenuData() {
  loading.value = true
  try {
    const { data } = await getMenuTree()
    menuData.value = data.items || []
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
    permissionData.value = data.items || []
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
    name: row.name,
    type: row.type,
    routeName: row.routeName,
    routePath: row.routePath,
    externalUrl: row.externalUrl,
    permissionId: row.permissionId,
    svgIcon: row.svgIcon,
    target: row.target,
    component: row.component,
    description: row.description,
    order: row.order,
    isHidden: row.isHidden,
    isSystem: row.isSystem,
    isActive: row.isActive,
    keepAlive: row.keepAlive,
    affix: row.affix,
    extra: row.extra
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
    `确认删除菜单"${row.name}"吗？删除后不可恢复！`,
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

function handleTypeChange(val: string | number | boolean | undefined) {
  const numVal = Number(val)
  if (numVal === 0) {
    // 页面
    formData.value.externalUrl = undefined
    formData.value.target = undefined
  } else if (numVal === 1) {
    // 外链
    formData.value.routePath = undefined
    formData.value.routeName = undefined
    formData.value.component = undefined
  } else if (numVal === 2) {
    // 按钮
    formData.value.routePath = undefined
    formData.value.routeName = undefined
    formData.value.component = undefined
    formData.value.externalUrl = undefined
    formData.value.target = undefined
  }
}
// #endregion

onMounted(async () => {
  await getPermissionData()
  await getMenuData()
})
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
        <el-table :data="menuData" row-key="id" default-expand-all show-overflow-tooltip>
          <el-table-column prop="name" label="菜单名称" align="center" />
          <el-table-column prop="type" label="菜单类型" align="center" width="80px">
            <template #default="scope">
              <el-tag effect="dark">
                {{ scope.row.type === 0 ? '页面' : scope.row.type === 1 ? '外链' : '权限' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="routePath" label="页面路径" align="center" />
          <el-table-column prop="externalUrl" label="外链地址" align="center" />
          <el-table-column prop="permissionId" label="关联权限" align="center">
            <template #default="scope">
              {{ getPermissionNameById(scope.row.permissionId) }}
            </template>
          </el-table-column>
          <el-table-column prop="svgIcon" label="图标" align="center" width="60px">
            <template #default="scope">
              <SvgIcon v-if="scope.row.svgIcon" :name="scope.row.svgIcon as any" />
            </template>
          </el-table-column>
          <el-table-column prop="order" label="排序" align="center" width="60px" />
          <el-table-column prop="isActive" label="启用" align="center" width="60px">
            <template #default="scope">
              <el-tag effect="dark" :type="scope.row.isActive ? 'success' : 'info'">
                {{ scope.row.isActive ? '是' : '否' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="isHidden" label="隐藏" align="center" width="60px">
            <template #default="scope">
              <el-tag effect="dark" :type="scope.row.isHidden ? 'success' : 'info'">
                {{ scope.row.isHidden ? '是' : '否' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="keepAlive" label="缓存" align="center" width="60px">
            <template #default="scope">
              <el-tag effect="dark" :type="scope.row.keepAlive ? 'success' : 'info'">
                {{ scope.row.keepAlive ? '是' : '否' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="affix" label="固定" align="center" width="60px">
            <template #default="scope">
              <el-tag effect="dark" :type="scope.row.affix ? 'success' : 'info'">
                {{ scope.row.affix ? '是' : '否' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column fixed="right" label="操作" width="240" align="center">
            <template #default="scope">
              <el-button type="primary" text bg size="small" @click="handleCreate(scope.row)">
                新增子菜单
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
      :title="currentUpdateId ? '修改菜单' : '新增菜单'"
      @closed="resetForm"
      width="600px"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item prop="parentId" label="父级菜单">
          <el-tree-select
            v-model="formData.parentId"
            :data="menuTreeOptions"
            :props="{ value: 'id', label: 'name', children: 'children' }"
            placeholder="请选择父级菜单（可为空）"
            clearable
            check-strictly
            :render-after-expand="false"
          />
        </el-form-item>
        <el-form-item prop="type" label="菜单类型">
          <el-radio-group v-model="formData.type" @change="handleTypeChange">
            <el-radio :label="0">
              页面
            </el-radio>
            <el-radio :label="1">
              外链
            </el-radio>
            <el-radio :label="2">
              按钮
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item prop="name" label="菜单名称">
          <el-input v-model="formData.name" placeholder="请输入菜单名称" />
        </el-form-item>
        <el-form-item v-if="formData.type === 0" prop="routeName" label="路由名称">
          <el-input v-model="formData.routeName" placeholder="请输入路由名称" />
        </el-form-item>
        <el-form-item v-if="formData.type === 0" prop="routePath" label="路由路径">
          <el-input v-model="formData.routePath" placeholder="请输入路由路径" />
        </el-form-item>
        <el-form-item v-if="formData.type === 0" prop="component" label="组件路径">
          <el-input v-model="formData.component" placeholder="请输入组件路径" />
        </el-form-item>
        <el-form-item v-if="formData.type === 1" prop="externalUrl" label="外链地址">
          <el-input v-model="formData.externalUrl" placeholder="请输入外链地址" />
        </el-form-item>
        <el-form-item v-if="formData.type === 1" prop="target" label="打开方式">
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
        <el-form-item prop="svgIcon" label="菜单图标">
          <el-input v-model="formData.svgIcon" placeholder="请输入图标名称">
            <template #prepend>
              <SvgIcon v-if="formData.svgIcon" :name="formData.svgIcon as any" />
            </template>
          </el-input>
        </el-form-item>
        <el-form-item prop="description" label="菜单描述">
          <el-input v-model="formData.description" type="textarea" placeholder="请输入菜单描述" />
        </el-form-item>
        <el-form-item prop="extra" label="扩展信息">
          <el-input v-model="formData.extra" placeholder="请输入扩展信息（可选）" />
        </el-form-item>
        <el-form-item v-if="formData.type === 0" prop="isHidden" label="是否隐藏">
          <el-radio-group v-model="formData.isHidden">
            <el-radio :label="false">
              显示
            </el-radio>
            <el-radio :label="true">
              隐藏
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="formData.type === 0" prop="keepAlive" label="页面缓存">
          <el-radio-group v-model="formData.keepAlive">
            <el-radio :label="false">
              不缓存
            </el-radio>
            <el-radio :label="true">
              缓存
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="formData.type === 0" prop="affix" label="固定标签">
          <el-radio-group v-model="formData.affix">
            <el-radio :label="false">
              不固定
            </el-radio>
            <el-radio :label="true">
              固定
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item prop="order" label="排序">
          <el-input-number v-model="formData.order" :min="0" />
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
</style>
