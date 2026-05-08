<script lang="ts" setup>
import type { FormInstance, FormRules } from "element-plus"
import type { TenantForm } from "@/common/apis/tenant/type"
import { ElMessage } from "element-plus"
import { cloneDeep } from "lodash-es"
import { ref } from "vue"
import { createTenantApi, getTenantApi, updateTenantApi } from "@/common/apis/tenant"
import { TENANT_PLAN_OPTIONS, TENANT_STATUS_OPTIONS, TENANT_TYPE_OPTIONS } from "@/common/utils/tenant-constants"

interface Props {
  tenantId?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: "success"): void
}>()
const visible = defineModel<boolean>("visible")
const loading = ref<boolean>(false)
const submitLoading = ref<boolean>(false)

// #region 表单相关
const defaultForm: TenantForm = {
  type: 1,
  status: 1,
  plan: 2,
  isActive: true,
  sortOrder: 0
}

const formRef = ref<FormInstance | null>(null)
const formData = ref<TenantForm>(cloneDeep(defaultForm))

const formRules: FormRules<TenantForm> = {
  name: [{ required: true, trigger: "blur", message: "请输入租户名称" }],
  adminUsername: [{ required: true, trigger: "blur", message: "请输入管理员账号" }]
}

function resetForm() {
  formRef.value?.clearValidate()
  formData.value = cloneDeep(defaultForm)
}

async function opened() {
  if (props.tenantId) {
    loading.value = true
    try {
      const { data } = await getTenantApi(props.tenantId)
      if (data) {
        formData.value = {
          id: data.id,
          name: data.name,
          shortName: data.shortName,
          displayName: data.displayName,
          type: data.type,
          status: data.status,
          plan: data.plan,
          expireTime: data.expireTime,
          slug: data.slug,
          customDomain: data.customDomain,
          contactName: data.contactName,
          contactPhone: data.contactPhone,
          contactEmail: data.contactEmail,
          description: data.description,
          isActive: data.isActive,
          sortOrder: data.sortOrder
        }
      }
    } catch (error) {
      console.error("获取租户详情失败:", error)
      ElMessage.error("获取租户详情失败")
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
  if (!valid) return

  submitLoading.value = true
  try {
    if (formData.value.id) {
      await updateTenantApi(formData.value.id, formData.value)
      ElMessage.success("修改成功")
    } else {
      await createTenantApi(formData.value)
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
    :title="formData.id === undefined ? '新增租户' : '修改租户'"
    @closed="resetForm"
    @opened="opened"
    width="600px"
    destroy-on-close
  >
    <div v-loading="loading">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-tabs type="border-card">
          <el-tab-pane label="基础信息">
            <el-form-item v-if="formData.id === undefined" prop="adminUsername" label="租户管理员">
              <el-input v-model="formData.adminUsername" placeholder="请输入租户管理员" />
            </el-form-item>
            <el-form-item prop="name" label="租户名称">
              <el-input v-model="formData.name" placeholder="请输入租户名称" />
            </el-form-item>
            <el-form-item prop="shortName" label="租户简称">
              <el-input v-model="formData.shortName" placeholder="请输入租户简称" />
            </el-form-item>
            <el-form-item prop="displayName" label="显示名称">
              <el-input v-model="formData.displayName" placeholder="请输入显示名称" />
            </el-form-item>
            <el-form-item prop="type" label="租户类型">
              <el-select v-model="formData.type" placeholder="请选择租户类型">
                <el-option
                  v-for="item in TENANT_TYPE_OPTIONS"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item prop="status" label="租户状态">
              <el-select v-model="formData.status" placeholder="请选择租户状态">
                <el-option
                  v-for="item in TENANT_STATUS_OPTIONS"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item prop="plan" label="套餐类型">
              <el-select v-model="formData.plan" placeholder="请选择套餐类型">
                <el-option
                  v-for="item in TENANT_PLAN_OPTIONS"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item prop="expiredTime" label="过期时间">
              <el-date-picker
                v-model="formData.expireTime"
                type="date"
                aria-label="选择过期时间"
                placeholder="选择过期时间"
                style="width: 100%"
              />
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
          <el-tab-pane label="联系信息">
            <el-form-item prop="contactName" label="联系人">
              <el-input v-model="formData.contactName" placeholder="请输入联系人" />
            </el-form-item>
            <el-form-item prop="contactPhone" label="联系电话">
              <el-input v-model="formData.contactPhone" placeholder="请输入联系电话" />
            </el-form-item>
            <el-form-item prop="contactEmail" label="联系邮箱">
              <el-input v-model="formData.contactEmail" placeholder="请输入联系邮箱" />
            </el-form-item>
          </el-tab-pane>
          <el-tab-pane label="其他信息">
            <el-form-item prop="slug" label="标识">
              <el-input v-model="formData.slug" placeholder="请输入标识" />
            </el-form-item>
            <el-form-item prop="customDomain" label="域名">
              <el-input v-model="formData.customDomain" placeholder="请输入域名" />
            </el-form-item>
            <el-form-item prop="description" label="描述">
              <el-input v-model="formData.description" placeholder="请输入" type="textarea" />
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
