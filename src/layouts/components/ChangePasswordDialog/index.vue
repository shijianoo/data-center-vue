<script lang="ts" setup>
import type { FormRules } from "element-plus"
import { changePasswordApi } from "@/common/apis/users"
import { useUserStore } from "@/pinia/stores/user"

interface ChangePasswordForm {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

const visible = defineModel<boolean>("visible")

const loading = ref(false)
const formRef = useTemplateRef("formRef")
const formData = ref<ChangePasswordForm>({
  oldPassword: "",
  newPassword: "",
  confirmPassword: ""
})

function validateConfirmPassword(rule: any, value: string, callback: any) {
  if (value !== formData.value.newPassword) {
    callback(new Error("两次输入的密码不一致"))
  } else {
    callback()
  }
}

const formRules: FormRules<ChangePasswordForm> = {
  oldPassword: [
    { required: true, message: "请输入当前密码", trigger: "blur" }
  ],
  newPassword: [
    { required: true, message: "请输入新密码", trigger: "blur" },
    { min: 6, message: "密码长度不能少于6位", trigger: "blur" }
  ],
  confirmPassword: [
    { required: true, message: "请确认新密码", trigger: "blur" },
    { validator: validateConfirmPassword, trigger: "blur" }
  ]
}

async function handleSubmit() {
  if (!formRef.value) return

  try {
    const valid = await formRef.value.validate()
    if (!valid) {
      ElMessage.error("表单校验不通过")
      return
    }
  } catch {
    ElMessage.error("表单校验不通过")
    return
  }

  loading.value = true
  try {
    await changePasswordApi(
      formData.value.oldPassword,
      formData.value.newPassword
    )
    ElMessage.success("密码修改成功")
    visible.value = false
    resetForm()
    logout()
  } catch (error: any) {
    ElMessage.error(error.message || "密码修改失败")
  } finally {
    loading.value = false
  }
}

function resetForm() {
  formRef.value?.clearValidate()
  formData.value = {
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  }
}

function handleClose() {
  visible.value = false
  resetForm()
}

const router = useRouter()
const userStore = useUserStore()

function logout() {
  userStore.logout()
  router.push("/login")
}
</script>

<template>
  <el-dialog
    v-model="visible"
    title="修改密码"
    width="400px"
    :close-on-click-modal="false"
    @closed="resetForm"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      label-position="left"
    >
      <el-form-item prop="oldPassword" label="当前密码">
        <el-input
          v-model="formData.oldPassword"
          type="password"
          placeholder="请输入当前密码"
          show-password
          autocomplete="current-password"
        />
      </el-form-item>
      <el-form-item prop="newPassword" label="新密码">
        <el-input
          v-model="formData.newPassword"
          type="password"
          placeholder="请输入新密码"
          show-password
          autocomplete="new-password"
        />
      </el-form-item>
      <el-form-item prop="confirmPassword" label="确认密码">
        <el-input
          v-model="formData.confirmPassword"
          type="password"
          placeholder="请再次输入新密码"
          show-password
          autocomplete="new-password"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">
        取消
      </el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        确认修改
      </el-button>
    </template>
  </el-dialog>
</template>
