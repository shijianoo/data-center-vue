<script lang="ts" setup>
import type { FormInstance, FormRules } from "element-plus"
import type { Project, ProjectForm } from "@/common/apis/projects/type"
import type { TenantSummary } from "@/common/apis/tenant/type"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { cloneDeep } from "lodash-es"
import { onMounted, ref } from "vue"
import {
  createProjectApi,
  deleteProjectApi,
  getProjectListApi,
  updateProjectApi
} from "@/common/apis/projects"
import { getTenantNameByIdsApi, getTenantSummaryListApi } from "@/common/apis/tenant"
import AssignProjectDeviceDialog from "./components/AssignProjectDeviceDialog.vue"
import ProjectExtraDialog from "./components/ProjectExtraDialog.vue"

defineOptions({
  name: "Project"
})

const loading = ref<boolean>(false)
const submitLoading = ref<boolean>(false)
const currentSelectedTenantId = ref("")
const tenantList = ref<TenantSummary[]>([])

async function getTenantList() {
  loading.value = true
  try {
    const { data } = await getTenantSummaryListApi()
    tenantList.value = data || []
  } catch (error) {
    console.error("获取租户列表失败:", error)
    tenantList.value = []
    ElMessage.error("获取租户数据失败")
  } finally {
    loading.value = false
  }
}

// #region 表单相关
const defaultForm: ProjectForm = {
  tenantId: "",
  name: "",
  projectCode: "",
  status: 0,
  isActive: true,
  sortOrder: 0
}

const dialogVisible = ref<boolean>(false)
const formRef = ref<FormInstance | null>(null)
const formData = ref<ProjectForm>(cloneDeep(defaultForm))

const formRules: FormRules<ProjectForm> = {
  tenantId: [{ required: true, trigger: "change", message: "请选择所属租户" }],
  name: [{ required: true, trigger: "blur", message: "请输入项目名称" }],
  projectCode: [{ required: true, trigger: "blur", message: "请输入项目编码" }]
}

function resetForm() {
  formRef.value?.clearValidate()
  formData.value = cloneDeep(defaultForm)
}
// #endregion

// #region 数据相关
interface ProjectItem extends Project {
  tenantName?: string
}
const tableData = ref<ProjectItem[]>([])

async function getTableData() {
  loading.value = true
  try {
    const { data } = await getProjectListApi(currentSelectedTenantId.value)
    tableData.value = data || []

    const tenantIds = tableData.value.map(item => item.tenantId)
    const { data: tenantNameMap } = await getTenantNameByIdsApi(tenantIds)
    tableData.value.forEach((item) => {
      item.tenantName = tenantNameMap[item.tenantId] ?? "未知租户"
    })
  } catch (error) {
    console.error("获取项目列表失败:", error)
    tableData.value = []
    ElMessage.error("获取项目数据失败")
  } finally {
    loading.value = false
  }
}
// #endregion

// #region 增删改操作
function handleCreate() {
  resetForm()
  dialogVisible.value = true
}

function handleUpdate(row: Project) {
  formData.value = {
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    projectCode: row.projectCode,
    address: row.address,
    status: row.status,
    startDate: row.startDate,
    endDate: row.endDate,
    description: row.description,
    isActive: row.isActive,
    sortOrder: row.sortOrder
  }
  dialogVisible.value = true
}

async function handleCreateOrUpdate() {
  if (!formRef.value) return

  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    if (formData.value.id) {
      await updateProjectApi(formData.value.id, formData.value)
      ElMessage.success("修改成功")
    } else {
      await createProjectApi(formData.value)
      ElMessage.success("创建成功")
    }
    dialogVisible.value = false
    await getTableData()
  } catch (error) {
    console.error("操作失败:", error)
    ElMessage.error("操作失败")
  } finally {
    submitLoading.value = false
  }
}

function handleDelete(row: Project) {
  ElMessageBox.confirm(
    `确认删除项目"${row.name}"吗？删除后不可恢复！`,
    "删除确认",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    }
  ).then(async () => {
    try {
      await deleteProjectApi(row.id)
      ElMessage.success("删除成功")
      await getTableData()
    } catch (error) {
      console.error("删除失败:", error)
      ElMessage.error("删除失败")
    }
  })
}

const assignDeviceVisible = ref(false)
const extraDialogVisible = ref(false)
const currentProjectId = ref("")
const currentTenantId = ref("")

function handleAssignDevice(row: Project) {
  currentProjectId.value = row.id
  currentTenantId.value = row.tenantId
  assignDeviceVisible.value = true
}

function handleUpdateExtra(row: Project) {
  currentProjectId.value = row.id
  extraDialogVisible.value = true
}
// #endregion

onMounted(() => {
  getTableData()
  getTenantList()
})

watch(() => currentSelectedTenantId.value, () => {
  getTableData()
})
</script>

<template>
  <div class="app-container">
    <el-card v-loading="loading" shadow="never">
      <div class="toolbar-wrapper">
        <div>
          <el-button type="primary" :icon="CirclePlus" @click="handleCreate">
            新增项目
          </el-button>
          <el-select :style="{ marginLeft: '10px' }" clearable v-model="currentSelectedTenantId" placeholder="请选择租户" style="width: 200px;">
            <el-option v-for="tenant in tenantList" :key="tenant.id" :label="tenant.name" :value="tenant.id" />
          </el-select>
        </div>
        <div>
          <el-tooltip content="刷新当前页">
            <el-button type="primary" :icon="RefreshRight" circle @click="getTableData" />
          </el-tooltip>
        </div>
      </div>
      <div class="table-wrapper">
        <el-table :data="tableData" v-loading="loading" row-key="id">
          <el-table-column prop="name" label="项目名称" align="left" width="160" />
          <el-table-column prop="projectCode" label="项目编号" align="left" width="160" />
          <el-table-column prop="projectNo" label="系统编号" align="left" width="160" />
          <el-table-column prop="tenantName" label="所属租户" align="left" width="160" />
          <el-table-column prop="status" label="项目状态" align="center" width="80" />
          <el-table-column prop="isActive" label="启用状态" align="center" width="100">
            <template #default="scope">
              <el-tag v-if="scope.row.isActive" type="success" effect="plain">
                启用
              </el-tag>
              <el-tag v-else type="danger" effect="dark">
                禁用
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="address" label="地址" align="left" min-width="150" show-overflow-tooltip />
          <el-table-column prop="startDate" label="开始日期" align="center" width="120" />
          <el-table-column prop="endDate" label="结束日期" align="center" width="120" />
          <el-table-column prop="sortOrder" label="排序" align="center" width="80" />
          <el-table-column fixed="right" label="操作" width="220" align="center">
            <template #default="scope">
              <el-button type="primary" text bg size="small" @click="handleUpdate(scope.row)">
                修改
              </el-button>
              <el-button type="primary" text bg size="small" @click="handleUpdateExtra(scope.row)">
                扩展信息
              </el-button>
              <el-button type="primary" text bg size="small" @click="handleAssignDevice(scope.row)">
                分配设备
              </el-button>
              <el-button type="danger" text bg size="small" @click="handleDelete(scope.row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- 新增/修改对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="formData.id === undefined ? '新增项目' : '修改项目'"
      @closed="resetForm"
      width="600px"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item prop="tenantId" label="所属租户">
          <el-select v-model="formData.tenantId" placeholder="请选择所属租户" filterable>
            <el-option
              v-for="item in tenantList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="name" label="项目名称">
          <el-input v-model="formData.name" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item prop="projectCode" label="项目编码">
          <el-input v-model="formData.projectCode" placeholder="请输入项目编码" />
        </el-form-item>
        <!-- <el-form-item prop="status" label="项目状态">
          <el-select v-model="formData.status" placeholder="请选择项目状态">
            <el-option label="进行中" :value="1" />
            <el-option label="已完成" :value="2" />
            <el-option label="已暂停" :value="3" />
            <el-option label="已取消" :value="4" />
          </el-select>
        </el-form-item> -->
        <el-form-item prop="address" label="项目地址">
          <el-input v-model="formData.address" placeholder="请输入项目地址" />
        </el-form-item>
        <el-form-item prop="startDate" label="开始日期">
          <el-date-picker
            v-model="formData.startDate"
            type="date"
            placeholder="选择开始日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item prop="endDate" label="结束日期">
          <el-date-picker
            v-model="formData.endDate"
            type="date"
            placeholder="选择结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item prop="description" label="描述">
          <el-input v-model="formData.description" placeholder="请输入项目描述" type="textarea" />
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
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" @click="handleCreateOrUpdate" :loading="submitLoading">
          确认
        </el-button>
      </template>
    </el-dialog>

    <!-- 分配设备对话框 -->
    <AssignProjectDeviceDialog
      v-model:visible="assignDeviceVisible"
      :project-id="currentProjectId"
      :tenant-id="currentTenantId"
    />

    <!-- 修改扩展信息对话框 -->
    <ProjectExtraDialog
      v-model:visible="extraDialogVisible"
      :project-id="currentProjectId"
      @success="getTableData"
    />
  </div>
</template>

<style lang="scss" scoped>
.toolbar-wrapper {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.table-wrapper {
  margin-bottom: 20px;
}
</style>
