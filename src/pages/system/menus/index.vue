<script lang="ts" setup>
import type { FormRules } from "element-plus"
import type { MenuForm, MenuTree } from "@/common/apis/menus/type"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { cloneDeep } from "lodash-es"
import { createMenu, deleteMenu, getMenuTree, updateMenu } from "@/common/apis/menus"

defineOptions({
  name: "Menus"
})

const loading = ref(false)

// #region 增 + 改 表单逻辑
const defaultForm: MenuForm = {
  id: undefined,
  name: "",
  type: 0,
  order: 0,
  isHidden: false,
  isSystem: false,
  isActive: true,
  keepAlive: false,
  affix: false
}

const dialogVisible = ref(false)
const formRef = useTemplateRef("formRef")
const formData = ref<MenuForm>(cloneDeep(defaultForm))

const formRules = computed(() => {
  const rules: FormRules = {
    name: [{ required: true, trigger: "blur", message: "请输入菜单名称" }],
    type: [{ required: true, trigger: "change", message: "请选择类型" }]
  }
  if (formData.value.type === 0) {
    // 页面
    rules.path = [{ required: true, trigger: "blur", message: "请输入路由路径" }]
  } else if (formData.value.type === 1) {
    // 外链
    rules.externalUrl = [{ required: true, trigger: "blur", message: "请输入外链地址" }]
    rules.target = [{ required: true, trigger: "blur", message: "请输入打开方式" }]
  } else if (formData.value.type === 2) {
    // 按钮
    rules.permissionCode = [{ required: true, trigger: "blur", message: "请输入权限代码" }]
  }
  return rules
})

// 选择父级菜单
const parentMenuOptions = ref<MenuTree[]>([])

function handleCreate(parent?: MenuTree) {
  resetForm()
  if (parent) {
    formData.value.parentId = parent.id
  } else {
    formData.value.parentId = undefined
  }
  dialogVisible.value = true
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
        await updateMenu(formData.value)
      } else {
        await createMenu(formData.value)
      }
      ElMessage.success("操作成功")
      dialogVisible.value = false
    } finally {
      loading.value = false
      getMenuData()
    }
  })
}
function resetForm() {
  formRef.value?.clearValidate()
  formData.value = cloneDeep(defaultForm)
}
// #endregion

// #region 删除
function handleDelete(row: MenuTree) {
  ElMessageBox.confirm(`正在删除菜单：${row.name}，确认删除？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    await deleteMenu(row.id)
    getMenuData()
    ElMessage.success("删除成功")
  })
}
// #endregion

// #region 编辑
function handleUpdate(row: MenuTree) {
  dialogVisible.value = true
  formData.value = {
    id: row.id,
    parentId: row.parentId,
    name: row.name,
    type: row.type,
    path: row.path,
    externalUrl: row.externalUrl,
    permissionCode: row.permissionCode,
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
}

function handleTypeChange(val: number) {
  if (val === 0) {
    // 页面
    formData.value.externalUrl = undefined
    formData.value.target = undefined
    formData.value.permissionCode = undefined
  } else if (val === 1) {
    // 外链
    formData.value.path = undefined
    formData.value.component = undefined
    formData.value.permissionCode = undefined
  } else if (val === 2) {
    // 按钮
    formData.value.path = undefined
    formData.value.component = undefined
    formData.value.externalUrl = undefined
    formData.value.target = undefined
  }
}
// #endregion

// #region 查
const menuData = ref<MenuTree[]>([])

function getMenuData() {
  loading.value = true
  getMenuTree().then(({ data }) => {
    // 假设后端返回树形结构
    menuData.value = data.items
    console.log("Menu Data:", menuData.value)
    parentMenuOptions.value = flattenMenuTree(data.items)
  }).catch(() => {
    menuData.value = []
    parentMenuOptions.value = []
  }).finally(() => {
    loading.value = false
  })
}
// 扁平化菜单树用于父级菜单选择
function flattenMenuTree(tree: MenuTree[], arr: MenuTree[] = []): MenuTree[] {
  for (const item of tree) {
    arr.push(item)
    if (item.children && item.children.length) {
      flattenMenuTree(item.children, arr)
    }
  }
  return arr
}
// #endregion

onMounted(() => {
  getMenuData()
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
        <el-table :data="menuData" row-key="id" show-overflow-tooltip>
          <el-table-column prop="name" label="菜单名称" align="center" />
          <el-table-column prop="type" label="菜单类型" align="center" width="80px">
            <template #default="scope">
              <el-tag effect="dark">
                {{ scope.row.type === 0 ? '页面' : scope.row.type === 1 ? '外链' : '权限' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="path" label="页面路径" align="center" />
          <el-table-column prop="externalUrl" label="外链地址" align="center" />
          <el-table-column prop="permissionCode" label="权限标识" align="center" />
          <el-table-column prop="svgIcon" label="图标" align="center" width="60px">
            <template #default="scope">
              <SvgIcon v-if="scope.row.svgIcon" :name="scope.row.svgIcon" />
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
          <el-table-column fixed="right" label="操作" width="190" align="center">
            <template #default="scope">
              <el-button type="primary" text bg size="small" @click="handleUpdate(scope.row)">
                修改
              </el-button>
              <el-button type="primary" text bg size="small" @click="() => handleCreate(scope.row)">
                新增
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
      :title="formData.id === undefined ? '新增菜单' : '修改菜单'"
      width="400px"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" label-position="left">
        <el-form-item prop="type" label="菜单类型">
          <el-select v-model="formData.type" placeholder="请选择类型" @change="handleTypeChange">
            <el-option :value="0" label="页面" />
            <el-option :value="1" label="外链" />
            <el-option :value="2" label="按钮" />
          </el-select>
        </el-form-item>
        <el-form-item prop="name" label="菜单名称">
          <el-input v-model="formData.name" placeholder="请输入" />
        </el-form-item>
        <el-form-item v-if="formData.type === 0" prop="path" label="路由路径">
          <el-input v-model="formData.path" placeholder="请输入" />
        </el-form-item>
        <el-form-item v-if="formData.type === 0" prop="component" label="组件名称">
          <el-input v-model="formData.component" placeholder="请输入" />
        </el-form-item>
        <el-form-item v-if="formData.type === 1" prop="externalUrl" label="外链地址">
          <el-input v-model="formData.externalUrl" placeholder="请输入" />
        </el-form-item>
        <el-form-item v-if="formData.type === 1" prop="target" label="打开方式">
          <el-select v-model="formData.target" placeholder="请选择类型">
            <el-option value="'_blank'" label="新窗口" />
            <el-option value="'_self'" label="当前窗口" />
            <el-option value="'_parent'" label="父窗口" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="formData.type === 2" prop="permissionCode" label="权限代码">
          <el-input v-model="formData.permissionCode" placeholder="请输入" />
        </el-form-item>
        <el-form-item prop="parentId" label="父级菜单">
          <el-select v-model="formData.parentId" placeholder="请选择父级菜单" clearable filterable>
            <el-option v-for="item in parentMenuOptions" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item prop="svgIcon" label="菜单图标">
          <el-input v-model="formData.svgIcon" placeholder="请输入" />
        </el-form-item>
        <el-form-item prop="description" label="菜单描述">
          <el-input v-model="formData.description" placeholder="请输入" />
        </el-form-item>
        <el-form-item prop="order" label="菜单排序">
          <el-input-number v-model="formData.order" :min="0" />
        </el-form-item>
        <el-form-item prop="isActive" label="启用状态">
          <el-switch v-model="formData.isActive" />
        </el-form-item>
        <el-form-item prop="isHidden" label="是否隐藏">
          <el-switch v-model="formData.isHidden" />
        </el-form-item>
        <el-form-item prop="keepAlive" label="启用缓存">
          <el-switch v-model="formData.keepAlive" />
        </el-form-item>
        <el-form-item prop="affix" label="启用固定">
          <el-switch v-model="formData.affix" />
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
  </div>
</template>

<style lang="scss" scoped>
.toolbar-wrapper {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}
</style>
