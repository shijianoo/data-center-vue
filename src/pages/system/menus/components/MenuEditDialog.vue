<script lang="ts" setup>
import type { FormInstance, FormRules } from "element-plus"
import type { MenuForm } from "@/common/apis/menus/type"
import { ElMessage } from "element-plus"
import { cloneDeep } from "lodash-es"
import { computed, ref } from "vue"
import { createMenu, getMenu, updateMenu } from "@/common/apis/menus"

interface Props {
  menuId?: string
  parentId?: string
  menuTreeOptions: any[]
  permissionTreeOptions: any[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: "success"): void
}>()

const visible = defineModel<boolean>("visible")
const loading = ref<boolean>(false)
const submitLoading = ref<boolean>(false)

// #region 表单相关
const defaultForm: MenuForm = {
  id: undefined,
  scope: 0,
  title: "",
  type: 0,
  isActive: true,
  sortOrder: 0
}

const formRef = ref<FormInstance | null>(null)
const formData = ref<MenuForm>(cloneDeep(defaultForm))

const formRules = computed(() => {
  const rules: FormRules = {
    scope: [{ required: true, validator: (_, value, callback) => {
      if (value === 0) callback(new Error("请选择菜单作用域"))
      else callback()
    }, trigger: "change" }],
    title: [{ required: true, trigger: "blur", message: "请输入菜单名称" }],
    type: [{ required: true, validator: (_, value, callback) => {
      if (value === 0) callback(new Error("请选择菜单类型"))
      else callback()
    }, trigger: "change" }]
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
  formRef.value?.clearValidate()
  formData.value = cloneDeep(defaultForm)
}

async function opened() {
  if (props.menuId) {
    loading.value = true
    try {
      const { data } = await getMenu(props.menuId)
      if (data) {
        formData.value = {
          id: data.id,
          parentId: data.parentId || undefined,
          scope: data.scope,
          title: data.title,
          type: data.type,
          routeName: data.routeName,
          routePath: data.routePath,
          component: data.component,
          externalUrl: data.externalUrl,
          target: data.target,
          redirect: data.redirect,
          permissionId: data.permissionId,
          description: data.description,
          isActive: data.isActive,
          sortOrder: data.sortOrder
        }
      }
    } catch (error) {
      console.error("获取菜单详情失败:", error)
      ElMessage.error("获取菜单详情失败")
    } finally {
      loading.value = false
    }
  } else {
    formData.value = cloneDeep(defaultForm)
    if (props.parentId) {
      formData.value.parentId = props.parentId
    }
  }
}

async function handleCreateOrUpdate() {
  if (!formRef.value) return

  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) {
    ElMessage.error("表单校验不通过")
    return
  }

  submitLoading.value = true
  try {
    if (formData.value.id) {
      await updateMenu(formData.value)
      ElMessage.success("修改成功")
    } else {
      await createMenu(formData.value)
      ElMessage.success("创建成功")
    }
    visible.value = false
    emit("success")
  } catch (error) {
    console.error("操作失败:", error)
    ElMessage.error("操作失败")
  } finally {
    submitLoading.value = false
  }
}
// #endregion
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="formData.id === undefined ? '新增菜单' : '修改菜单'"
    @closed="resetForm"
    @opened="opened"
    width="650px"
    destroy-on-close
  >
    <div v-loading="loading">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-tabs type="border-card">
          <el-tab-pane label="基础信息">
            <el-form-item prop="parentId" label="父级菜单">
              <el-tree-select
                v-model="formData.parentId"
                :data="props.menuTreeOptions"
                :props="{ value: 'id', label: 'title', children: 'children' }"
                placeholder="请选择父级菜单（可为空）"
                clearable
                check-strictly
                :render-after-expand="false"
                style="width: 100%;"
              />
            </el-form-item>
            <el-form-item prop="title" label="菜单名称">
              <el-input v-model="formData.title" placeholder="请输入菜单名称" />
            </el-form-item>
            <el-form-item prop="scope" label="菜单作用域">
              <el-select v-model="formData.scope" placeholder="请选择菜单作用域" style="width: 100%;">
                <el-option label="未知" :value="0" />
                <el-option label="平台" :value="1" />
                <el-option label="租户" :value="2" />
              </el-select>
            </el-form-item>
            <el-form-item prop="type" label="菜单类型">
              <el-select v-model="formData.type" placeholder="请选择菜单类型" style="width: 100%;">
                <el-option label="未知" :value="0" />
                <el-option label="目录" :value="1" />
                <el-option label="页面" :value="2" />
                <el-option label="外链" :value="3" />
              </el-select>
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
          </el-tab-pane>

          <el-tab-pane label="路由与权限">
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
              <el-select v-model="formData.target" placeholder="请选择打开方式" style="width: 100%;">
                <el-option value="_blank" label="新窗口" />
                <el-option value="_self" label="当前窗口" />
                <el-option value="_parent" label="父窗口" />
              </el-select>
            </el-form-item>
            <el-form-item prop="permissionId" label="关联权限">
              <el-tree-select
                v-model="formData.permissionId"
                :data="props.permissionTreeOptions"
                :props="{ value: 'id', label: 'name', children: 'children' }"
                placeholder="请选择关联权限（可为空）"
                clearable
                check-strictly
                :render-after-expand="false"
                style="width: 100%;"
              />
            </el-form-item>
            <el-form-item prop="description" label="菜单描述">
              <el-input v-model="formData.description" type="textarea" placeholder="请输入菜单描述" />
            </el-form-item>
          </el-tab-pane>
        </el-tabs>
      </el-form>
    </div>
    <template #footer>
      <el-button @click="visible = false">
        取消
      </el-button>
      <el-button type="primary" @click="handleCreateOrUpdate" :loading="submitLoading">
        确认
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>

</style>
