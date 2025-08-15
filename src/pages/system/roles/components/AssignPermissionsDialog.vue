<script setup lang="ts">
import type { PermissionTree } from "@/common/apis/permissions/type"
import { ElMessage, ElTree } from "element-plus"
import { nextTick, ref } from "vue"
import { getPermissionTreeApi } from "@/common/apis/permissions"
import { assignPermissionsApi, getRolePermissionIdsApi } from "@/common/apis/roles"

interface Props {
  roleId?: string
  roleName?: string
}

const props = defineProps<Props>()
const visible = defineModel<boolean>("visible")

const loading = ref(false)
const submitting = ref(false)
const treeRef = ref<InstanceType<typeof ElTree>>()
const permissionTree = ref<PermissionTree[]>([])

const treeProps = {
  children: "children",
  label: "name"
}

// 加载数据
async function loadData() {
  loading.value = true
  try {
    // 并行加载权限树和角色已有权限
    const [permissionRes, rolePermissionRes] = await Promise.all([
      getPermissionTreeApi(),
      getRolePermissionIdsApi(props.roleId!)
    ])

    if (permissionRes.data.items) {
      permissionTree.value = permissionRes.data.items
    }

    if (rolePermissionRes.data) {
      // 等待树渲染完成后设置选中状态
      await nextTick()
      treeRef.value?.setCheckedKeys(rolePermissionRes.data)
    }
  } catch (error) {
    console.error("加载数据失败:", error)
    ElMessage.error("加载数据失败")
  } finally {
    loading.value = false
  }
}

// 提交分配权限
async function handleSubmit() {
  if (!props.roleId) return

  submitting.value = true
  try {
    // 获取选中的权限ID（包括半选中的父节点）
    const checkedKeys = treeRef.value?.getCheckedKeys() || []
    const halfCheckedKeys = treeRef.value?.getHalfCheckedKeys() || []
    const allSelectedKeys = [...checkedKeys, ...halfCheckedKeys] as string[]

    await assignPermissionsApi(props.roleId, allSelectedKeys)
    ElMessage.success("权限分配成功")
    handleClose()
  } catch (error) {
    console.error("分配权限失败:", error)
    ElMessage.error("分配权限失败")
  } finally {
    submitting.value = false
  }
}

// 关闭对话框
function handleClose() {
  visible.value = false
  // 重置数据
  permissionTree.value = []
  treeRef.value?.setCheckedKeys([])
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="`为角色「${roleName || ''}」分配权限`"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
    @opened="loadData"
  >
    <div v-loading="loading">
      <ElTree
        ref="treeRef"
        :data="permissionTree"
        :props="treeProps"
        show-checkbox
        node-key="id"
        default-expand-all
        :check-strictly="true"
        class="permission-tree"
      />
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">
          取消
        </el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          确定
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.permission-tree {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  padding: 10px;
}

.dialog-footer {
  text-align: right;
}
</style>
