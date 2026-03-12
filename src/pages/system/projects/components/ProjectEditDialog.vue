<script lang="ts" setup>
import type { FormInstance, FormRules } from "element-plus"
import type { ProjectForm } from "@/common/apis/projects/type"
import type { TenantSummary } from "@/common/apis/tenant/type"
import { ElMessage } from "element-plus"
import { cloneDeep } from "lodash-es"
import { ref } from "vue"
import { createProjectApi, getProjectApi, updateProjectApi } from "@/common/apis/projects"

interface Props {
  projectId?: string
  tenantList: TenantSummary[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: "success"): void
}>()

const visible = defineModel<boolean>("visible")
const loading = ref<boolean>(false)
const submitLoading = ref<boolean>(false)

// #region 表单相关
const defaultForm: ProjectForm = {
  id: undefined,
  tenantId: "",
  name: "",
  projectCode: "",
  status: 0,
  isActive: true,
  sortOrder: 0
}

const formRef = ref<FormInstance | null>(null)
const formData = ref<ProjectForm>(cloneDeep(defaultForm))

const formRules: FormRules<ProjectForm> = {
  tenantId: [{ required: true, trigger: "change", message: "请选择所属租户" }],
  name: [{ required: true, trigger: "blur", message: "请输入项目名称" }],
  projectCode: [{ required: true, trigger: "blur", message: "请输入项目编码" }]
}

function resetForm() {
  formRef.value?.clearValidate()
  formData.value = cloneDeep(defaultForm)
}

async function opened() {
  if (props.projectId) {
    loading.value = true
    try {
      const { data } = await getProjectApi(props.projectId)
      if (data) {
        formData.value = {
          id: data.id,
          tenantId: data.tenantId,
          name: data.name,
          projectCode: data.projectCode,
          address: data.address,
          status: data.status,
          startDate: data.startDate,
          endDate: data.endDate,
          description: data.description,
          isActive: data.isActive,
          sortOrder: data.sortOrder
        }
      }
    } catch (error) {
      console.error("获取项目详情失败:", error)
      ElMessage.error("获取项目详情失败")
    } finally {
      loading.value = false
    }
  } else {
    formData.value = cloneDeep(defaultForm)
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
      await updateProjectApi(formData.value.id, formData.value)
      ElMessage.success("修改成功")
    } else {
      await createProjectApi(formData.value)
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
    :title="formData.id === undefined ? '新增项目' : '修改项目'"
    @closed="resetForm"
    @opened="opened"
    width="650px"
    destroy-on-close
  >
    <div v-loading="loading">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-tabs type="border-card">
          <el-tab-pane label="基础信息">
            <el-form-item prop="tenantId" label="所属租户">
              <el-select v-model="formData.tenantId" placeholder="请选择所属租户" filterable style="width: 100%;">
                <el-option
                  v-for="item in props.tenantList"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item prop="name" label="项目名称">
              <el-input v-model="formData.name" placeholder="请输入项目名称" />
            </el-form-item>
            <el-form-item prop="projectCode" label="项目编码">
              <el-input v-model="formData.projectCode" placeholder="请输入项目编码" />
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
          <el-tab-pane label="扩展信息">
            <el-form-item prop="startDate" label="开始日期">
              <el-date-picker
                v-model="formData.startDate"
                type="date"
                placeholder="选择开始日期"
                style="width: 100%;"
              />
            </el-form-item>
            <el-form-item prop="endDate" label="结束日期">
              <el-date-picker
                v-model="formData.endDate"
                type="date"
                placeholder="选择结束日期"
                style="width: 100%;"
              />
            </el-form-item>
            <el-form-item prop="address" label="项目地址">
              <el-input v-model="formData.address" placeholder="请输入项目地址" />
            </el-form-item>
            <el-form-item prop="description" label="描述">
              <el-input v-model="formData.description" placeholder="请输入项目描述" type="textarea" :rows="3" />
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
