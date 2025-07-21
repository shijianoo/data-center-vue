<script lang="ts" setup>
import type { DeviceProperty } from "@/common/apis/device-properties/type"
import { createDevicePropertyApi, deleteDevicePropertyApi, getDevicePropertiesApi, updateDevicePropertyApi } from "@/common/apis/device-properties"

const visible = defineModel<boolean>("visible") // v-model:visible
const deviceId = defineModel<string>("deviceId") // v-model:deviceId

const propertyData = ref<DeviceProperty[]>([]) // 用于存储设备属性数据

const editDialogVisible = ref(false)
const isEdit = ref(false)
const editForm = ref({
  key: "",
  name: "",
  value: "",
  type: "",
  unit: "",
  description: "",
  isReadOnly: false,
  order: 0
})
const editKey = ref("")

function handleDialogOpen() {
  if (!deviceId.value) {
    ElMessage.error("请先选择设备")
    visible.value = false
  }
}

function fetchPropertyData() {
  console.log("获取设备属性数据", deviceId.value)
  getDevicePropertiesApi(deviceId.value!).then(({ data }) => {
    propertyData.value = data
    console.log("获取设备属性成功", propertyData.value)
  }).catch((error) => {
    console.error("获取设备属性失败:", error)
  })
}
function handleOpened() {
  fetchPropertyData()
}

function handleAddProperty() {
  isEdit.value = false
  editForm.value = {
    key: "",
    name: "",
    value: "",
    type: "",
    unit: "",
    description: "",
    isReadOnly: false,
    order: 0
  }
  editKey.value = ""
  editDialogVisible.value = true
}

function handleEditProperty(row: DeviceProperty) {
  isEdit.value = true
  editForm.value = {
    key: row.key,
    name: row.name,
    value: row.value,
    type: row.type,
    unit: row.unit,
    description: row.description,
    isReadOnly: row.isReadOnly,
    order: row.order
  }
  editKey.value = row.key
  editDialogVisible.value = true
}

function handleDeleteProperty(row: DeviceProperty) {
  ElMessageBox.confirm("确定要删除该属性吗？", "删除确认", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    deleteDevicePropertyApi(deviceId.value!, row.key).then(() => {
      ElMessage.success("属性删除成功")
      fetchPropertyData()
    }).catch((error) => {
      ElMessage.error(`属性删除失败: ${error.message}`)
    })
  }).catch(() => {})
}

function handleSaveProperty() {
  if (!editForm.value.key) {
    ElMessage.error("key不能为空")
    return
  }

  const api = isEdit.value
    ? updateDevicePropertyApi(deviceId.value!, editForm.value.key, editForm.value)
    : createDevicePropertyApi(deviceId.value!, editForm.value.key, editForm.value)
  api.then(() => {
    ElMessage.success(isEdit.value ? "属性修改成功" : "属性添加成功")
    editDialogVisible.value = false
    fetchPropertyData()
  }).catch((error) => {
    ElMessage.error(`${isEdit.value ? "修改" : "添加"}失败: ${error.message}`)
  })
}
</script>

<template>
  <div>
    <el-dialog width="800px" @opened="handleOpened" @open="handleDialogOpen" v-model="visible" title="设备属性" @closed="() => propertyData = []">
      <el-button type="primary" @click="handleAddProperty" style="margin-bottom: 12px;">
        添加属性
      </el-button>
      <el-table :data="propertyData" style="width: 100%">
        <el-table-column prop="name" label="名称" align="center">
          <template #default="scope">
            {{ scope.row.name || scope.row.key }}
          </template>
        </el-table-column>
        <el-table-column prop="value" label="值" align="center" />
        <el-table-column prop="unit" label="单位" align="center" />
        <el-table-column prop="description" label="描述" align="center" />
        <el-table-column label="操作" align="center">
          <template #default="scope">
            <el-button type="primary" size="small" @click="handleEditProperty(scope.row)" :disabled="scope.row.isSystem">
              编辑
            </el-button>
            <el-button type="danger" size="small" @click="handleDeleteProperty(scope.row)" :disabled="scope.row.isSystem">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-dialog width="360" title="编辑属性" v-model="editDialogVisible" @close="() => { editDialogVisible = false; editKey = ''; isEdit = false }">
        <el-form :model="editForm" label-width="80px">
          <el-form-item label="名称">
            <el-input v-model="editForm.name" />
          </el-form-item>
          <el-form-item label="key">
            <el-input v-model="editForm.key" :disabled="isEdit" />
          </el-form-item>
          <el-form-item label="Value">
            <el-input v-model="editForm.value" />
          </el-form-item>
          <el-form-item label="类型">
            <el-select v-model="editForm.type" placeholder="请选择类型">
              <el-option label="整数 (int)" value="int" />
              <el-option label="浮点数 (float)" value="float" />
              <el-option label="布尔值 (bool)" value="bool" />
              <el-option label="字符串 (string)" value="string" />
              <el-option label="JSON对象 (json)" value="json" />
              <el-option label="日期 (date)" value="date" />
            </el-select>
          </el-form-item>
          <el-form-item label="单位">
            <el-input v-model="editForm.unit" />
          </el-form-item>
          <el-form-item label="描述">
            <el-input v-model="editForm.description" />
          </el-form-item>
          <el-form-item label="只读">
            <el-switch v-model="editForm.isReadOnly" />
          </el-form-item>
          <el-form-item label="顺序">
            <el-input v-model="editForm.order" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="editDialogVisible = false">
            取消
          </el-button>
          <el-button type="primary" @click="handleSaveProperty">
            保存
          </el-button>
        </template>
      </el-dialog>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped></style>
