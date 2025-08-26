<script lang="ts" setup>
import type { UploadFile, UploadInstance, UploadRawFile } from "element-plus"
import type { DeviceModel } from "@/common/apis/device-models/type"
import type { DeviceFirmware } from "@/common/apis/firmwares/type"
import { getToken } from "@@/utils/cache/cookies"
import { CirclePlus, RefreshRight, UploadFilled } from "@element-plus/icons-vue"
import SparkMD5 from "spark-md5"
import { getDeviceModelsApi } from "@/common/apis/device-models"
import { deleteFirmwaresApi, getFirmwaresByModelApi } from "@/common/apis/firmwares"

defineOptions({
  name: "Firmwares"
})
const loading = ref<boolean>(false)
const deviceModels = ref<DeviceModel[]>([])
const modelOptions = computed(() =>
  deviceModels.value.map(m => ({
    label: m.modelName ? `${m.modelNumber}-${m.modelName}` : `${m.modelNumber}`,
    value: m.id
  }))
)
const searchData = ref({
  modelId: ""
})
const firmwares = ref<DeviceFirmware[]>([])

// #region 上传固件
const uploadLoading = ref(false)
const uploadDialogVisible = ref(false)
const uploadRef = ref<UploadInstance>()
const uploadFormRef = ref()

const versionPattern = /^(\d+)\.(\d+)(?:\.(\d+))?(?:\.(\d+))?$/

const uploadAction = computed(() => {
  const baseUrl = import.meta.env.VITE_DATA_CENTER_BASE_URL
  const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`
  const path = "firmwares/upload"
  const fullUrl = `${cleanBaseUrl}${path}`
  return fullUrl
})

const uploadData = computed(() => ({
  deviceModelId: uploadForm.value.deviceModelId,
  firmwareVersion: uploadForm.value.firmwareVersion,
  description: uploadForm.value.description,
  supportedHardwareVersions: uploadForm.value.supportedHardwareVersions.join(";"),
  fileMd5: uploadForm.value.fileMd5
}))

const uploadForm = ref({
  deviceModelId: "",
  firmwareVersion: "",
  description: "",
  supportedHardwareVersions: [] as string[],
  fileMd5: ""
})

// 表单验证规则
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
  if (value.length === 0) {
    return callback(new Error("至少需要一个硬件版本"))
  }
  for (let i = 0; i < value.length; i++) {
    if (!validateVersionFormat(value[i])) {
      return callback(new Error("所有的版本号必须是有效的2到4段版本号"))
    }
  }
  callback()
}

const uploadFormRules = {
  deviceModelId: [
    { required: true, message: "请选择设备型号", trigger: "change" }
  ],
  firmwareVersion: [
    { required: true, message: "请输入固件版本", trigger: "blur" },
    { validator: validateFirmwareVersion, trigger: "change" }
  ],
  supportedHardwareVersions: [
    { required: true, trigger: "blur", message: "至少需要一个硬件版本" },
    { validator: validateHardwareVersions, trigger: "change" }
  ]
}

const uploadHeaders = computed(() => {
  const token = getToken?.()
  const headers: Record<string, string> = {}
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  console.log("上传请求头:", headers)
  return headers
})

function handleCreate() {
  uploadDialogVisible.value = true
  uploadForm.value = {
    deviceModelId: searchData.value.modelId || "",
    firmwareVersion: "",
    description: "",
    supportedHardwareVersions: [],
    fileMd5: ""
  }
}

function handleUpload() {
  uploadFormRef.value?.validate((valid: boolean) => {
    if (valid) {
      uploadRef.value?.submit()
    }
  })
}

// 计算文件MD5
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

// 上传前的验证
async function beforeUpload(rawFile: UploadRawFile) {
  uploadLoading.value = true
  uploadForm.value.fileMd5 = ""
  try {
    uploadForm.value.fileMd5 = await calculateFileMd5(rawFile)
    console.log("文件MD5:", uploadForm.value.fileMd5)
    return true
  } catch (e) {
    ElMessage.error(`MD5计算失败: ${e}`)
    uploadLoading.value = false
    return false
  }
}

function onUploadSuccess(response: any, _uploadFile: UploadFile): void {
  console.log("上传成功响应:", response)
  ElMessage.success("固件上传成功")
  uploadDialogVisible.value = false
  uploadLoading.value = false
  // 清除表单验证状态
  uploadFormRef.value?.resetFields()
  fetchFirmwares()
}

function onUploadError(error: any, _uploadFile: UploadFile): void {
  console.error("上传失败详细信息:", error)
  console.error("错误对象:", error)
  console.error("错误状态:", error?.status)
  console.error("错误响应:", error?.response)

  let errorMessage = "固件上传失败"
  if (error?.message) {
    errorMessage += `: ${error.message}`
  } else if (error?.status) {
    errorMessage += `: HTTP ${error.status}`
  }

  ElMessage.error(errorMessage)
  uploadLoading.value = false
}

function resetForm() {
  uploadFormRef.value?.resetFields()
  uploadRef.value?.clearFiles()
  uploadForm.value = {
    deviceModelId: "",
    firmwareVersion: "",
    description: "",
    supportedHardwareVersions: [],
    fileMd5: ""
  }
}

// #endregion

// #region 删除
async function handleDelete(device: DeviceFirmware) {
  const firmwareVersion = device.firmwareVersion || "未知版本"
  ElMessageBox.confirm(`正在删除固件：${firmwareVersion}，确认删除？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    await deleteFirmwaresApi(device.id)
    await fetchFirmwares()
    ElMessage.success("删除成功")
  })
}
// #endregion

// #region 查询
async function fetchDeviceModels() {
  loading.value = true
  try {
    const { data } = await getDeviceModelsApi()
    deviceModels.value = data
  } catch {
    ElMessage.error("查询失败")
  } finally {
    loading.value = false
  }
}

async function fetchFirmwares() {
  loading.value = true
  try {
    if (!searchData.value.modelId) {
      ElMessage.warning("请先选择设备型号")
      firmwares.value = []
      return
    }
    const { data } = await getFirmwaresByModelApi(searchData.value.modelId)
    firmwares.value = data.items
  } catch (error) {
    console.error("获取固件列表失败:", error)
    firmwares.value = []
    ElMessage.error("查询失败")
  } finally {
    loading.value = false
  }
}

watch(
  () => searchData.value.modelId,
  async (modelId) => {
    if (modelId) {
      await fetchFirmwares()
    }
  },
  { immediate: true }
)

onMounted(async () => {
  await fetchDeviceModels()
})
// #endregion
</script>

<template>
  <div class="app-container">
    <el-card shadow="never" class="search-wrapper">
      <el-form :inline="true" :model="searchData">
        <el-form-item label="设备型号">
          <el-select
            v-model="searchData.modelId"
            placeholder="请选择设备型号"
            clearable
            filterable
            style="min-width: 240px"
          >
            <el-option
              v-for="item in modelOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="fetchFirmwares">
            查询
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-loading="loading" shadow="never">
      <div class="toolbar-wrapper">
        <div>
          <el-button type="primary" :icon="CirclePlus" @click="handleCreate">
            上传固件
          </el-button>
        </div>
        <div>
          <el-tooltip content="刷新当前页">
            <el-button type="primary" :icon="RefreshRight" circle @click="fetchFirmwares" />
          </el-tooltip>
        </div>
      </div>
      <div class="table-wrapper">
        <el-card shadow="never">
          <el-table :data="firmwares" v-loading="loading">
            <el-table-column prop="firmwareVersion" label="固件版本" align="center" />
            <el-table-column prop="supportedHardwareVersions" label="支持硬件版本" align="center" />
            <el-table-column prop="description" label="备注" align="center" />
            <el-table-column fixed="right" label="操作" width="100" align="center">
              <template #default="scope">
                <el-button type="danger" text bg size="small" @click="handleDelete(scope.row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>
    </el-card>

    <!-- 上传固件对话框 -->
    <el-dialog
      v-model="uploadDialogVisible"
      title="上传固件"
      width="500px"
      :close-on-click-modal="false"
      @closed="resetForm"
    >
      <el-form ref="uploadFormRef" :model="uploadForm" :rules="uploadFormRules">
        <el-form-item label="设备型号" prop="deviceModelId">
          <el-select
            v-model="uploadForm.deviceModelId"
            placeholder="请选择设备型号"
            clearable
            filterable
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
            v-model="uploadForm.firmwareVersion"
            placeholder="请输入固件版本（例如：1.2 或 1.2.3 或 1.2.3.4）"
          />
        </el-form-item>

        <el-form-item label="硬件版本" prop="supportedHardwareVersions">
          <el-select
            v-model="uploadForm.supportedHardwareVersions"
            placeholder="请输入支持的硬件版本，支持多个"
            multiple
            default-first-option
            remote
            filterable
            allow-create
            :reserve-keyword="false"
          />
        </el-form-item>

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
        </el-form-item><el-form-item label="固件备注">
          <el-input
            v-model="uploadForm.description"
            type="textarea"
            :rows="2"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button :loading="uploadLoading" @click="uploadDialogVisible = false">
            取消
          </el-button>
          <el-button type="primary" :loading="uploadLoading" @click="handleUpload">
            上传
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.search-wrapper {
  margin-bottom: 20px;
  :deep(.el-card__body) {
    padding-bottom: 2px;
  }
}

.toolbar-wrapper {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.table-wrapper {
  margin-bottom: 20px;
}

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
