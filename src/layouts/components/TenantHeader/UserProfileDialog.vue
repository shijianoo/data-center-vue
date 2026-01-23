<script setup lang="ts">
import type { FormInstance, FormItemRule } from "element-plus"
import type { UserForm } from "@/common/apis/users/type"
import { ElMessage } from "element-plus"
import { ref, watch } from "vue"
import { changePasswordApi, updateUserApi } from "@/common/apis/users"
import { useUserStore } from "@/pinia/stores/user"

const visible = defineModel<boolean>("visible")

const userStore = useUserStore()
const loading = ref(false)
const activeTab = ref("basic")
const formRef = ref<FormInstance>()
const passwordFormRef = ref<FormInstance>()

const formData = ref<UserForm>({
  id: "",
  userName: "",
  realName: "",
  nickName: "",
  email: "",
  phone: "",
  description: "",
  isActive: true,
  sortOrder: 0
})

const passwordForm = ref({
  oldPassword: "",
  newPassword: "",
  confirmPassword: ""
})

const rules: Partial<Record<string, FormItemRule[]>> = {
  realName: [{ message: "请输入真实姓名", trigger: "blur" }],
  email: [{ type: "email", message: "请输入正确的邮箱地址", trigger: "blur" }]
}

const passwordRules: Partial<Record<string, FormItemRule[]>> = {
  oldPassword: [{ required: true, message: "请输入旧密码", trigger: "blur" }],
  newPassword: [
    { required: true, message: "请输入新密码", trigger: "blur" },
    { min: 6, message: "密码长度不能少于6位", trigger: "blur" }
  ],
  confirmPassword: [
    { required: true, message: "请再次输入新密码", trigger: "blur" },
    {
      validator: (rule: any, value: any, callback: any) => {
        if (value !== passwordForm.value.newPassword) {
          callback(new Error("两次输入密码不一致"))
        } else {
          callback()
        }
      },
      trigger: "blur"
    }
  ]
}

watch(() => visible.value, (val) => {
  if (val) {
    activeTab.value = "basic"
    if (userStore.user) {
      const user = userStore.user
      formData.value = {
        id: user.id,
        userName: user.userName,
        realName: user.realName || "",
        nickName: user.nickName || "",
        email: user.email || "",
        phone: user.phone || "",
        description: user.description || "",
        isActive: user.isActive,
        sortOrder: user.sortOrder
      }
    }
    // Reset password form
    passwordForm.value = {
      oldPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  }
})

function handleClose() {
  visible.value = false
}

async function handleSubmit() {
  if (!formRef.value) return

  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true
      try {
        await updateUserApi(formData.value)
        ElMessage.success("修改成功")
        await userStore.getInfo()
        handleClose()
      } catch (error) {
        console.error(error)
      } finally {
        loading.value = false
      }
    }
  })
}

async function handleChangePassword() {
  if (!passwordFormRef.value) return

  await passwordFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true
      try {
        await changePasswordApi(passwordForm.value.oldPassword, passwordForm.value.newPassword)
        ElMessage.success("密码修改成功，请重新登录")
        handleClose()
        userStore.logout()
      } catch (error) {
        console.error(error)
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<template>
  <el-dialog
    v-model="visible"
    title="个人设置"
    width="550px"
    append-to-body
    @close="handleClose"
  >
    <el-tabs v-model="activeTab">
      <!-- Basic Info Tab -->
      <el-tab-pane label="基本信息" name="basic">
        <el-form
          ref="formRef"
          :model="formData"
          :rules="rules"
          label-width="80px"
          class="mt-4"
        >
          <el-form-item label="用户名">
            <el-input v-model="formData.userName" disabled />
          </el-form-item>
          <el-form-item label="昵称" prop="nickName">
            <el-input v-model="formData.nickName" placeholder="请输入昵称" />
          </el-form-item>
          <el-form-item label="姓名" prop="realName">
            <el-input v-model="formData.realName" placeholder="请输入姓名" />
          </el-form-item>
          <el-form-item label="个人简介" prop="description">
            <el-input
              v-model="formData.description"
              type="textarea"
              :rows="3"
              placeholder="请输入个人简介"
            />
          </el-form-item>
        </el-form>
        <div class="dialog-footer">
          <el-button @click="handleClose">
            取消
          </el-button>
          <el-button type="primary" :loading="loading" @click="handleSubmit">
            保存基本信息
          </el-button>
        </div>
      </el-tab-pane>

      <!-- Security Settings Tab -->
      <el-tab-pane label="安全设置" name="security">
        <div class="security-section">
          <h4 class="section-title">
            修改密码
          </h4>
          <el-form
            ref="passwordFormRef"
            :model="passwordForm"
            :rules="passwordRules"
            label-width="100px"
          >
            <el-form-item label="旧密码" prop="oldPassword">
              <el-input
                v-model="passwordForm.oldPassword"
                type="password"
                placeholder="请输入旧密码"
                show-password
              />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input
                v-model="passwordForm.newPassword"
                type="password"
                placeholder="请输入新密码"
                show-password
              />
            </el-form-item>
            <el-form-item label="确认新密码" prop="confirmPassword">
              <el-input
                v-model="passwordForm.confirmPassword"
                type="password"
                placeholder="请再次输入新密码"
                show-password
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="loading" @click="handleChangePassword">
                修改密码
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <el-divider />

        <div class="security-section">
          <h4 class="section-title">
            账号验证
          </h4>
          <div class="verification-item">
            <div class="v-info">
              <span class="v-label">手机号</span>
              <span class="v-value">{{ formData.phone || '未绑定' }}</span>
            </div>
            <el-button link type="primary" disabled>
              修改
            </el-button>
          </div>
          <div class="verification-item">
            <div class="v-info">
              <span class="v-label">邮箱</span>
              <span class="v-value">{{ formData.email || '未绑定' }}</span>
            </div>
            <el-button link type="primary" disabled>
              修改
            </el-button>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </el-dialog>
</template>

<style scoped>
.mt-4 {
  margin-top: 16px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.security-section {
  padding: 0 10px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--text-main);
}

.verification-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-light);
}

.verification-item:last-child {
  border-bottom: none;
}

.v-info {
  display: flex;
  gap: 20px;
  align-items: center;
}

.v-label {
  width: 60px;
  color: var(--text-sub);
}

.v-value {
  color: var(--text-main);
  font-weight: 500;
}
</style>
