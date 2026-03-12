<script lang="ts" setup>
import type { MenuTree } from "@/common/apis/menus/type"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { onMounted, ref } from "vue"
import { deleteMenu, getMenuTree } from "@/common/apis/menus"
import { getPermissionTreeApi } from "@/common/apis/permissions"
import MenuEditDialog from "./components/MenuEditDialog.vue"
import MenuExtraDialog from "./components/MenuExtraDialog.vue"

defineOptions({
  name: "Menus"
})

const loading = ref<boolean>(false)
const currentUpdateId = ref<string | undefined>(undefined)
const currentParentId = ref<string | undefined>(undefined)
const editDialogVisible = ref<boolean>(false)
const menuExtraDialogVisible = ref<boolean>(false)
const currentMenuId = ref<string>("")

// #region 数据相关
const menuData = ref<MenuTree[]>([])
const permissionData = ref<any[]>([])

// 菜单树选项（用于父级菜单选择）
const menuTreeOptions = computed(() => {
  const buildOptions = (nodes: MenuTree[], excludeId?: string): any[] => {
    return nodes
      .filter(node => node.id !== excludeId)
      .map(node => ({
        id: node.id,
        title: node.title,
        children: node.children && node.children.length > 0 ? buildOptions(node.children, excludeId) : undefined
      }))
  }
  return buildOptions(menuData.value, currentUpdateId.value)
})

// 权限树选项（用于权限选择）
const permissionTreeOptions = computed(() => {
  const buildOptions = (nodes: any[]): any[] => {
    return nodes.map(node => ({
      id: node.id,
      name: node.name,
      code: node.code,
      children: node.children && node.children.length > 0 ? buildOptions(node.children) : undefined
    }))
  }
  return buildOptions(permissionData.value)
})

// 根据权限ID获取权限名称
function getPermissionNameById(permissionId?: string): string {
  if (!permissionId) return ""

  const findPermission = (nodes: any[]): any | null => {
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
  currentUpdateId.value = undefined
  currentParentId.value = parentRow?.id
  editDialogVisible.value = true
}

function handleUpdate(row: MenuTree) {
  currentUpdateId.value = row.id
  currentParentId.value = undefined
  editDialogVisible.value = true
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
        <el-table :data="menuData" row-key="id">
          <el-table-column prop="title" label="菜单名称" align="left" min-width="160" />
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
          <el-table-column prop="permissionId" label="关联权限" align="left" min-width="160" show-overflow-tooltip>
            <template #default="scope">
              {{ getPermissionNameById(scope.row.permissionId) }}
            </template>
          </el-table-column>
          <el-table-column prop="routePath" label="页面路径" align="left" show-overflow-tooltip />
          <el-table-column prop="component" label="组件路径" align="left" show-overflow-tooltip />

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
                    <el-dropdown-item @click="openMenuExtraDialog(scope.row.id)">
                      扩展配置
                    </el-dropdown-item>
                    <el-dropdown-item divided @click="handleCreate(scope.row)">
                      添加子菜单
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <MenuEditDialog
      v-model:visible="editDialogVisible"
      :menu-id="currentUpdateId"
      :parent-id="currentParentId"
      :menu-tree-options="menuTreeOptions"
      :permission-tree-options="permissionTreeOptions"
      @success="getMenuData"
    />

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
