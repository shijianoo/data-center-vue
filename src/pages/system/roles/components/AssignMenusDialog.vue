<script setup lang="ts">
import type { ElTree } from "element-plus"
import type { MenuTree } from "@/common/apis/menus/type"
import { ElMessage } from "element-plus"
import { nextTick, ref } from "vue"
import { getMenuTree } from "@/common/apis/menus"
import { assignMenusApi, getRoleMenuIdsApi } from "@/common/apis/roles"

interface Props {
  roleId?: string
  roleName?: string
}

const props = defineProps<Props>()
const visible = defineModel<boolean>("visible")

const loading = ref(false)
const submitting = ref(false)
const treeRef = ref<InstanceType<typeof ElTree> | null>(null)
const menuTreeData = ref<MenuTree[]>([])

// 加载数据
async function loadData() {
  loading.value = true
  try {
    // 并行加载菜单树和角色已有菜单
    const [menuRes, roleMenuRes] = await Promise.all([
      getMenuTree(),
      getRoleMenuIdsApi(props.roleId!)
    ])

    if (menuRes.data.items) {
      menuTreeData.value = menuRes.data.items
    }

    if (roleMenuRes.data) {
      // 等待树渲染完成后设置选中状态
      await nextTick()
      if (treeRef.value) {
        treeRef.value.setCheckedKeys(roleMenuRes.data)
      }
    }
  } catch (error) {
    console.error("加载数据失败:", error)
    ElMessage.error("加载数据失败")
  } finally {
    loading.value = false
  }
}

// 提交菜单分配
async function handleSubmit() {
  if (!props.roleId || !treeRef.value) return

  submitting.value = true
  try {
    const checkedKeys = treeRef.value.getCheckedKeys() as string[]
    await assignMenusApi(props.roleId, checkedKeys)
    ElMessage.success("菜单权限分配成功")
    handleClosed()
  } catch (error) {
    console.error("分配菜单失败:", error)
    ElMessage.error("菜单权限分配失败")
  } finally {
    submitting.value = false
  }
}

// 关闭对话框
function handleClosed() {
  visible.value = false
  // 重置数据
  menuTreeData.value = []
  treeRef.value?.setCheckedKeys([])
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="`为角色「${roleName || ''}」分配菜单`"
    width="500px"
    :close-on-click-modal="false"
    @opened="loadData"
    @closed="handleClosed"
  >
    <div v-loading="loading">
      <el-tree
        ref="treeRef"
        :data="menuTreeData"
        show-checkbox
        node-key="id"
        default-expand-all
        :check-strictly="true"
        :props="{ label: 'name' }"
      />
    </div>
    <template #footer>
      <el-button :loading="submitting" @click="handleClosed">
        取消
      </el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        确认
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.el-tree {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  padding: 10px;
}
</style>
