<script lang="ts" setup>
import type { UploadFile, UploadInstance, UploadRawFile } from "element-plus"
import type { DeviceFirmware, UploadOrUpdateDeviceFirmware } from "@/common/apis/firmwares/type"
import { getToken } from "@@/utils/cache/cookies"
import { Delete, Plus, UploadFilled } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import { cloneDeep } from "lodash-es"
import SparkMD5 from "spark-md5"
import { computed, ref } from "vue"
import { updateFirmwareApi } from "@/common/apis/firmwares"

interface Props {
  firmwareData?: DeviceFirmware
  deviceModelId?: string
  modelOptions: { label: string, value: string }[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: "success"): void
}>()

const visible = defineModel<boolean>("visible")
const loading = ref<boolean>(false)

const isEdit = computed(() => !!props.firmwareData?.id)

// #region 表单与验证
const defaultForm = {
  id: undefined as string | undefined,
  deviceModelId: "",
  firmwareVersion: "",
  descriptionList: [] as string[],
  supportedHardwareVersions: [] as string[],
  fileMd5: "",
  isActive: true,
  sortOrder: 0
}

const formData = ref(cloneDeep(defaultForm))
const formRef = ref()
const uploadRef = ref<UploadInstance>()

const versionPattern = /^(\d+)\.(\d+)(?:\.(\d+))?(?:\.(\d+))?$/

function validateVersionFormat(version: string): boolean {
  return versionPattern.test(version)
}

function validateFirmwareVersion(rule: any, value: any, callback: any) {
  if (value && !versionPattern.test(value)) {
    callback(new Error("请输入2到4段式版本号（例如：1.2 或 1.2.3 或 1.2.3.4）"))
  } else {
    callback()
  }
}

function validateHardwareVersions(rule: any, value: any, callback: any) {
  if (!value || value.length === 0) {
    return callback(new Error("至少需要一个硬件版本"))
  }
  for (let i = 0; i < value.length; i++) {
    if (!validateVersionFormat(value[i])) {
      return callback(new Error("所有的版本号必须是有效的2到4段版本号"))
    }
  }
  callback()
}

const formRules = {
  deviceModelId: [{ required: true, message: "请选择设备型号", trigger: "change" }],
  firmwareVersion: [
    { required: true, message: "请输入固件版本", trigger: "blur" },
    { validator: validateFirmwareVersion, trigger: "change" }
  ],
  supportedHardwareVersions: [
    { required: true, trigger: "blur", message: "至少需要一个硬件版本" },
    { validator: validateHardwareVersions, trigger: "change" }
  ]
}
// #endregion

// #region 上传逻辑
const uploadAction = computed(() => {
  const baseUrl = import.meta.env.VITE_DATA_CENTER_BASE_URL
  const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`
  return `${cleanBaseUrl}firmwares/upload`
})

const uploadData = computed(() => ({
  deviceModelId: formData.value.deviceModelId,
  firmwareVersion: formData.value.firmwareVersion,
  description: formData.value.descriptionList.filter(Boolean).join(";"),
  supportedHardwareVersions: formData.value.supportedHardwareVersions.join(";"),
  fileMd5: formData.value.fileMd5 || "",
  isActive: formData.value.isActive,
  sortOrder: formData.value.sortOrder
}))

const uploadHeaders = ref<{ Authorization: string }>({
  Authorization: `Bearer ${getToken?.()}`
})

async function calculateFileMd5(file: UploadRawFile): Promise<string> {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader()
    fileReader.readAsArrayBuffer(file)
    fileReader.onload = function (e) {
      const spark = new SparkMD5.ArrayBuffer()
      spark.append(e.target!.result as ArrayBuffer)
      resolve(spark.end())
    }
    fileReader.onerror = function () {
      reject(new Error("文件读取失败"))
    }
  })
}

async function beforeUpload(rawFile: UploadRawFile) {
  console.log("开始上传,计算MD5")
  loading.value = true
  formData.value.fileMd5 = ""
  try {
    formData.value.fileMd5 = await calculateFileMd5(rawFile)
    console.log("MD5计算完成", formData.value.fileMd5)

    const token = getToken()
    if (!token) {
      ElMessage.error("获取token失败")
      return false
    }
    console.log("获取token成功", token)
    uploadHeaders.value.Authorization = `Bearer ${token}`

    return true
  } catch (e) {
    console.log("MD5计算失败", e)
    ElMessage.error(`MD5计算失败: ${e}`)
    loading.value = false
    return false
  }
}

function onUploadSuccess(_response: any, _uploadFile: UploadFile): void {
  console.log("上传成功")
  ElMessage.success("固件上传成功")
  visible.value = false
  loading.value = false
  emit("success")
}

function onUploadError(error: any, _uploadFile: UploadFile): void {
  console.log("上传失败", error)
  let errorMessage = "固件上传失败"
  if (error?.message) {
    errorMessage += `: ${error.message}`
  } else if (error?.status) {
    errorMessage += `: HTTP ${error.status}`
  }
  console.log("上传失败", errorMessage)
  ElMessage.error(errorMessage)
  loading.value = false
}
// #endregion

function opened() {
  if (isEdit.value && props.firmwareData) {
    formData.value = {
      id: props.firmwareData.id,
      deviceModelId: props.firmwareData.deviceModelId,
      firmwareVersion: props.firmwareData.firmwareVersion,
      descriptionList: props.firmwareData.description ? props.firmwareData.description.split(";").filter(Boolean) : [],
      supportedHardwareVersions: Array.isArray(props.firmwareData.supportedHardwareVersions)
        ? props.firmwareData.supportedHardwareVersions
        : typeof props.firmwareData.supportedHardwareVersions === "string"
          ? (props.firmwareData.supportedHardwareVersions as unknown as string).split(";").filter(Boolean)
          : [],
      fileMd5: props.firmwareData.md5 || "",
      isActive: props.firmwareData.isActive !== false,
      sortOrder: props.firmwareData.sortOrder || 0
    }
  } else {
    formData.value = cloneDeep(defaultForm)
    if (props.deviceModelId) {
      formData.value.deviceModelId = props.deviceModelId
    }
  }
}

function resetForm() {
  formRef.value?.resetFields()
  uploadRef.value?.clearFiles()
  formData.value = cloneDeep(defaultForm)
}

// 新增备注项
function addDescriptionItem() {
  formData.value.descriptionList.push("")
}

// 删除备注项
function removeDescriptionItem(index: number) {
  formData.value.descriptionList.splice(index, 1)
}

function handleSubmit() {
  formRef.value?.validate(async (valid: boolean) => {
    if (!valid) return

    if (isEdit.value) {
      // 执行更新逻辑
      loading.value = true
      try {
        const payload: UploadOrUpdateDeviceFirmware = {
          id: formData.value.id,
          deviceModelId: formData.value.deviceModelId,
          firmwareVersion: formData.value.firmwareVersion,
          supportedHardwareVersions: formData.value.supportedHardwareVersions.join(";"),
          description: formData.value.descriptionList.filter(Boolean).join(";"),
          isActive: formData.value.isActive,
          sortOrder: formData.value.sortOrder
        }
        await updateFirmwareApi(payload)
        ElMessage.success("固件信息修改成功")
        visible.value = false
        emit("success")
      } catch {
        ElMessage.error("固件信息修改失败")
      } finally {
        loading.value = false
      }
    } else {
      // 执行上传逻辑 (uploadRef处理)
      uploadRef.value?.submit()
    }
  })
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '修改固件信息' : '上传固件'"
    width="550px"
    :close-on-click-modal="false"
    @opened="opened"
    @closed="resetForm"
  >
    <div v-loading="loading">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-tabs type="border-card">
          <el-tab-pane label="基础信息">
            <el-form-item label="设备型号" prop="deviceModelId">
              <el-select
                v-model="formData.deviceModelId"
                placeholder="请选择设备型号"
                :disabled="isEdit"
                clearable
                filterable
                style="width: 100%;"
              >
                <el-option
                  v-for="item in modelOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="固件版本" prop="firmwareVersion">
              <el-input
                v-model="formData.firmwareVersion"
                placeholder="例如：1.2 或 1.2.3 或 1.2.3.4"
              />
            </el-form-item>

            <el-form-item label="硬件版本" prop="supportedHardwareVersions">
              <el-select
                v-model="formData.supportedHardwareVersions"
                placeholder="支持的硬件版本，支持多个回车"
                multiple
                default-first-option
                remote
                filterable
                allow-create
                :reserve-keyword="false"
                style="width: 100%;"
              />
            </el-form-item>

            <el-row>
              <el-col :span="12">
                <el-form-item prop="isActive" label="是否启用">
                  <el-switch v-model="formData.isActive" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item prop="sortOrder" label="排序">
                  <el-input-number v-model="formData.sortOrder" :min="0" style="width: 100px" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="固件更新项">
              <div v-for="(item, index) in formData.descriptionList" :key="index" class="description-item-row" style="display: flex; gap: 10px; margin-bottom: 10px; width: 100%;">
                <el-input v-model="formData.descriptionList[index]" placeholder="请输入更新内容（例如：修复了XXX Bug）" />
                <el-button type="danger" :icon="Delete" circle plain @click="removeDescriptionItem(index)" />
              </div>
              <el-button type="primary" plain :icon="Plus" @click="addDescriptionItem" style="width: 100%;">
                新增更新项
              </el-button>
            </el-form-item>
          </el-tab-pane>

          <el-tab-pane label="上传文件" v-if="!isEdit">
            <el-form-item label="固件文件" required>
              <el-upload
                ref="uploadRef"
                :action="uploadAction"
                :data="uploadData"
                :headers="uploadHeaders"
                :before-upload="beforeUpload"
                :on-success="onUploadSuccess"
                :on-error="onUploadError"
                :limit="1"
                drag
                :auto-upload="false"
                name="file"
                class="upload-full-width"
              >
                <el-icon class="el-icon--upload">
                  <UploadFilled />
                </el-icon>
                <div class="el-upload__text">
                  拖拽文件到此处或<em>点击上传</em>
                </div>
              </el-upload>
            </el-form-item>
          </el-tab-pane>
        </el-tabs>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button :loading="loading" @click="visible = false">
          取消
        </el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          {{ isEdit ? '保存' : '上传' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.upload-full-width {
  width: 100%;

  :deep(.el-upload) {
    width: 100%;
  }

  :deep(.el-upload-dragger) {
    width: 100%;
    height: 120px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
}
</style>
