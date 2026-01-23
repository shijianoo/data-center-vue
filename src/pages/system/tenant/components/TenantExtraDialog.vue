<script lang="ts" setup>
import type { TenantExtra } from "@/common/apis/tenant/type"
import { ElMessage } from "element-plus"
import { getTenantApi, updateTenantExtraApi } from "@/common/apis/tenant"

interface Props {
  tenantId: string
}

const props = defineProps<Props>()
const visible = defineModel<boolean>("visible")

const loading = ref(false)
const submitLoading = ref(false)
const formData = ref<TenantExtra>({
  maxProjects: 0,
  maxUserCount: 0,
  isVip: false
})

async function fetchTenantExtra() {
  if (!props.tenantId) return
  loading.value = true
  try {
    const { data } = await getTenantApi(props.tenantId)
    if (data && data.extra) {
      formData.value = { ...data.extra }
    } else {
      formData.value = {
        maxProjects: 0,
        maxUserCount: 0,
        isVip: false
      }
    }
  } catch (error) {
    console.error("获取租户扩展信息失败:", error)
    ElMessage.error("获取租户扩展信息失败")
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  if (!props.tenantId) return
  submitLoading.value = true
  try {
    await updateTenantExtraApi(props.tenantId, formData.value)
    ElMessage.success("更新成功")
    visible.value = false
  } catch (error) {
    console.error("更新租户扩展信息失败:", error)
    ElMessage.error("更新失败")
  } finally {
    submitLoading.value = false
  }
}

function open() {
  if (!props.tenantId) {
    ElMessage.warning("请选择一个租户")
    visible.value = false
  }
}

function opened() {
  fetchTenantExtra()
}

function closed() {
  formData.value = {
    maxProjects: 0,
    maxUserCount: 0,
    isVip: false
  }
}
</script>

<template>
  <el-dialog
    @open="open"
    @opened="opened"
    @closed="closed"
    v-model="visible"
    title="租户扩展信息"
    width="700px"
    destroy-on-close
  >
    <div v-loading="loading">
      <el-form :model="formData" label-width="120px">
        <el-tabs type="border-card">
          <el-tab-pane label="品牌与展示">
            <el-form-item label="UI 配置">
              <el-input v-model="formData.uiProfile" placeholder="请输入 UI 配置" />
            </el-form-item>
            <el-form-item label="简称">
              <el-input v-model="formData.shortName" placeholder="请输入简称" />
            </el-form-item>
            <el-form-item label="Logo URL">
              <el-input v-model="formData.logoURL" placeholder="请输入 Logo URL" />
            </el-form-item>
            <el-form-item label="主题颜色">
              <el-color-picker v-model="formData.themeColor" />
            </el-form-item>
            <el-form-item label="富文本说明">
              <el-input v-model="formData.richText" type="textarea" :rows="4" placeholder="请输入富文本说明" />
            </el-form-item>
          </el-tab-pane>
          <el-tab-pane label="详情信息">
            <el-form-item label="时区">
              <el-input v-model="formData.timeZone" placeholder="请输入时区" />
            </el-form-item>
            <el-form-item label="文化/语言">
              <el-input v-model="formData.culture" placeholder="请输入文化/语言" />
            </el-form-item>
            <el-form-item label="地址">
              <el-input v-model="formData.address" placeholder="请输入地址" />
            </el-form-item>
            <el-form-item label="网站">
              <el-input v-model="formData.website" placeholder="请输入网站" />
            </el-form-item>
            <el-form-item label="纳税识别号">
              <el-input v-model="formData.taxNumber" placeholder="请输入纳税识别号" />
            </el-form-item>
          </el-tab-pane>
          <el-tab-pane label="配额与备注">
            <el-form-item label="最大项目数">
              <el-input-number v-model="formData.maxProjects" :min="0" />
            </el-form-item>
            <el-form-item label="最大用户数">
              <el-input-number v-model="formData.maxUserCount" :min="0" />
            </el-form-item>
            <el-form-item label="是否 VIP">
              <el-switch v-underline v-model="formData.isVip" />
            </el-form-item>
            <el-form-item label="备注">
              <el-input v-model="formData.remark" type="textarea" :rows="3" placeholder="请输入备注" />
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
