<script lang="ts" setup>
import type { FormInstance, FormRules } from "element-plus"
import type { UserForm } from "@/common/apis/users/type"
import { ElMessage } from "element-plus"
import { cloneDeep } from "lodash-es"
import { ref } from "vue"
import { createUserApi, getUserApi, updateUserApi } from "@/common/apis/users"

interface Props {
  userId?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: "success"): void
}>()

const visible = defineModel<boolean>("visible")
const loading = ref<boolean>(false)
const submitLoading = ref<boolean>(false)

// #region 表单相关
const defaultForm: UserForm = {
  id: undefined,
  userName: "",
  isActive: true,
  sortOrder: 0
}

const formRef = ref<FormInstance | null>(null)
const formData = ref<UserForm>(cloneDeep(defaultForm))

const formRules: FormRules<UserForm> = {
  userName: [
    { required: true, trigger: "blur", message: "请输入用户名称" },
    { min: 3, max: 20, message: "用户名长度应在3-20个字符之间", trigger: "blur" }
  ],
  password: [
    { required: true, trigger: "blur", message: "请输入用户密码" },
    { min: 6, message: "密码长度不能少于6个字符", trigger: "blur" }
  ],
  email: [
    { type: "email", message: "请输入正确的邮箱格式", trigger: "blur" }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: "请输入正确的手机号格式", trigger: "blur" }
  ]
}

function resetForm() {
  formRef.value?.clearValidate()
  formData.value = cloneDeep(defaultForm)
}

async function opened() {
  if (props.userId) {
    loading.value = true
    try {
      const { data } = await getUserApi(props.userId)
      if (data) {
        formData.value = {
          id: data.id,
          userName: data.userName,
          nickName: data.nickName,
          realName: data.realName,
          email: data.email,
          phone: data.phone,
          description: data.description,
          isActive: data.isActive,
          sortOrder: data.sortOrder
        }
      }
    } catch (error) {
      console.error("获取用户详情失败:", error)
      ElMessage.error("获取用户详情失败")
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
      await updateUserApi(formData.value)
    } else {
      await createUserApi(formData.value)
    }
    ElMessage.success("操作成功")
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
    :title="formData.id === undefined ? '新增用户' : '修改用户'"
    @closed="resetForm"
    @opened="opened"
    width="600px"
    destroy-on-close
  >
    <div v-loading="loading">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-tabs type="border-card">
          <el-tab-pane label="基础信息">
            <el-form-item prop="userName" label="用户名称">
              <el-input v-model="formData.userName" placeholder="请输入用户名称" />
            </el-form-item>
            <el-form-item prop="password" v-if="formData.id === undefined" label="密码">
              <el-input v-model="formData.password" placeholder="请输入密码" />
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
          <el-tab-pane label="个人信息">
            <el-form-item prop="nickName" label="昵称">
              <el-input v-model="formData.nickName" placeholder="请输入昵称" />
            </el-form-item>
            <el-form-item prop="realName" label="真实姓名">
              <el-input v-model="formData.realName" placeholder="请输入真实姓名" />
            </el-form-item>
            <el-form-item prop="email" label="邮箱">
              <el-input v-model="formData.email" placeholder="请输入邮箱" />
            </el-form-item>
            <el-form-item prop="phone" label="手机号">
              <el-input v-model="formData.phone" placeholder="请输入手机号" />
            </el-form-item>
          </el-tab-pane>
          <el-tab-pane label="其他信息">
            <el-form-item prop="description" label="描述">
              <el-input v-model="formData.description" type="textarea" placeholder="请输入描述" />
            </el-form-item>
          </el-tab-pane>
        </el-tabs>
      </el-form>
    </div>
    <template #footer>
      <el-button @click="visible = false">
        取消
      </el-button>
      <el-button type="primary" :loading="submitLoading" @click="handleCreateOrUpdate">
        确认
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>

</style>
