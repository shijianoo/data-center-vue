<script lang="ts" setup>
import type { UserExtra } from "@/common/apis/users/type"
import { ElMessage } from "element-plus"
import { ref } from "vue"
import { getUserApi, updateUserExtraApi } from "@/common/apis/users"

interface Props {
  userId?: string
}

const props = defineProps<Props>()
const visible = defineModel<boolean>("visible")

const loading = ref(false)
const submitLoading = ref(false)
const formData = ref<UserExtra>({
  gender: 0
})

async function fetchUserExtra() {
  if (!props.userId) return
  loading.value = true
  try {
    const { data } = await getUserApi(props.userId)
    if (data && data.extra) {
      formData.value = { ...data.extra }
    } else {
      formData.value = {
        gender: 0
      }
    }
  } catch (error) {
    console.error("获取用户扩展信息失败:", error)
    ElMessage.error("获取用户扩展信息失败")
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  if (!props.userId) return
  submitLoading.value = true
  try {
    const submitData: UserExtra = {
      ...formData.value,
      id: props.userId // 需要回传 userId 给后端
    }
    await updateUserExtraApi(submitData)
    ElMessage.success("更新成功")
    visible.value = false
  } catch (error) {
    console.error("更新用户扩展信息失败:", error)
    ElMessage.error("更新失败")
  } finally {
    submitLoading.value = false
  }
}

function open() {
  if (!props.userId) {
    ElMessage.warning("请选择一个用户")
    visible.value = false
  }
}

function opened() {
  fetchUserExtra()
}

function closed() {
  formData.value = {
    gender: 0
  }
}
</script>

<template>
  <el-dialog
    @open="open"
    @opened="opened"
    @closed="closed"
    v-model="visible"
    title="用户扩展信息"
    width="600px"
    destroy-on-close
  >
    <div v-loading="loading">
      <el-form :model="formData" label-width="100px">
        <el-tabs type="border-card">
          <el-tab-pane label="基本设置">
            <el-form-item label="头像 URL">
              <el-input v-model="formData.avatarUrl" placeholder="请输入头像 URL" />
            </el-form-item>
            <el-form-item label="性别">
              <el-radio-group v-model="formData.gender">
                <el-radio :label="0">
                  未知
                </el-radio>
                <el-radio :label="1">
                  男
                </el-radio>
                <el-radio :label="2">
                  女
                </el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="生日">
              <el-date-picker
                v-model="formData.birthday"
                type="date"
                placeholder="选择生日"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-tab-pane>
          <el-tab-pane label="偏好设置">
            <el-form-item label="语言文化">
              <el-input v-model="formData.culture" placeholder="请输入首选语言/文化，如: zh-CN" />
            </el-form-item>
            <el-form-item label="主题偏好">
              <el-select v-model="formData.themeMode" placeholder="请选择系统主题偏好" clearable>
                <el-option label="日间模式" value="light" />
                <el-option label="夜间模式" value="dark" />
                <el-option label="跟随系统" value="system" />
              </el-select>
            </el-form-item>
            <el-form-item label="时区">
              <el-input v-model="formData.timeZone" placeholder="请输入时区，如: Asia/Shanghai" />
            </el-form-item>
          </el-tab-pane>
        </el-tabs>
      </el-form>
    </div>
    <template #footer>
      <el-button @click="visible = false">
        取消
      </el-button>
      <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
        确认
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>

</style>
