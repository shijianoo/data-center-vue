<script lang="ts" setup>
import type { FormInstance, FormRules } from "element-plus"
import type { CreateOrUpdateDeviceModelDto } from "@/common/apis/device-models/type"
import { ElMessage } from "element-plus"
import { cloneDeep } from "lodash-es"
import { ref } from "vue"
import { createDeviceModelApi, getDeviceModelByIdApi, updateDeviceModelApi } from "@/common/apis/device-models"
import { MODEL_CATEGORY_OPTIONS, MODEL_STATUS_OPTIONS } from "@/common/utils/device-model-constants"

interface Props {
  modelId?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: "success"): void
}>()

const visible = defineModel<boolean>("visible")
const loading = ref<boolean>(false)
const submitLoading = ref<boolean>(false)

// #region 表单相关
const defaultForm: CreateOrUpdateDeviceModelDto = {
  id: undefined,
  productCode: "",
  modelNumber: "",
  status: 0,
  category: 0,
  isActive: true,
  sortOrder: 0
}

const formRef = ref<FormInstance | null>(null)
const formData = ref<CreateOrUpdateDeviceModelDto>(cloneDeep(defaultForm))

const formRules: FormRules<CreateOrUpdateDeviceModelDto> = {
  productCode: [{ required: true, trigger: "blur", message: "请输入产品编码" }],
  modelNumber: [{ required: true, trigger: "blur", message: "请输入设备型号" }],
  status: [{ required: true, trigger: "change", message: "请选择型号状态" }],
  category: [{ required: true, trigger: "change", message: "请选择设备分类" }]
}

function resetForm() {
  formRef.value?.clearValidate()
  formData.value = cloneDeep(defaultForm)
}

async function opened() {
  if (props.modelId) {
    loading.value = true
    try {
      const { data } = await getDeviceModelByIdApi(props.modelId)
      if (data) {
        formData.value = {
          id: data.id,
          productCode: data.productCode,
          modelNumber: data.modelNumber,
          modelName: data.modelName,
          displayName: data.displayName,
          manufacturer: data.manufacturer,
          status: data.status,
          category: data.category,
          description: data.description,
          isActive: data.isActive,
          sortOrder: data.sortOrder
        }
      }
    } catch (error) {
      console.error("获取型号详情失败:", error)
      ElMessage.error("获取详情失败")
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
      await updateDeviceModelApi(formData.value)
      ElMessage.success("修改成功")
    } else {
      await createDeviceModelApi(formData.value)
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
    :title="formData.id === undefined ? '新增设备型号' : '修改设备型号'"
    @closed="resetForm"
    @opened="opened"
    width="650px"
    destroy-on-close
  >
    <div v-loading="loading">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-tabs type="border-card">
          <el-tab-pane label="基础信息">
            <el-form-item prop="productCode" label="产品编码">
              <el-input v-model="formData.productCode" placeholder="请输入产品编码" />
            </el-form-item>
            <el-form-item prop="modelNumber" label="设备型号">
              <el-input v-model="formData.modelNumber" placeholder="请输入设备型号" />
            </el-form-item>
            <el-form-item prop="modelName" label="设备名称">
              <el-input v-model="formData.modelName" placeholder="请输入设备名称" />
            </el-form-item>
            <el-form-item prop="displayName" label="显示名称">
              <el-input v-model="formData.displayName" placeholder="请输入显示名称" />
            </el-form-item>
            <el-form-item prop="manufacturer" label="生产厂家">
              <el-input v-model="formData.manufacturer" placeholder="请输入生产厂家" />
            </el-form-item>
          </el-tab-pane>

          <el-tab-pane label="分类与状态">
            <el-form-item prop="status" label="型号状态">
              <el-select v-model="formData.status" placeholder="请选择型号状态" style="width: 100%;">
                <el-option v-for="value in MODEL_STATUS_OPTIONS" :key="value.value" :label="value.label" :value="value.value" />
              </el-select>
            </el-form-item>
            <el-form-item prop="category" label="设备分类">
              <el-select v-model="formData.category" placeholder="请选择设备分类" style="width: 100%;">
                <el-option v-for="value in MODEL_CATEGORY_OPTIONS" :key="value.value" :label="value.label" :value="value.value" />
              </el-select>
            </el-form-item>
            <el-form-item prop="isActive" label="是否启用">
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
            <el-form-item prop="description" label="设备描述">
              <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入设备描述" />
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
