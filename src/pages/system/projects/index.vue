<script lang="ts" setup>
import type { Project } from "@/common/apis/projects/type"
import type { TenantSummary } from "@/common/apis/tenant/type"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { onMounted, ref, watch } from "vue"
import {
  deleteProjectApi,
  getProjectListApi
} from "@/common/apis/projects"
import { getTenantNameByIdsApi, getTenantSummaryListApi } from "@/common/apis/tenant"
import { formatDate } from "@/common/utils/datetime"
import AssignProjectDeviceDialog from "./components/AssignProjectDeviceDialog.vue"
import ProjectEditDialog from "./components/ProjectEditDialog.vue"
import ProjectExtraDialog from "./components/ProjectExtraDialog.vue"

defineOptions({
  name: "Project"
})

const loading = ref<boolean>(false)
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

const editDialogVisible = ref<boolean>(false)
const currentEditId = ref<string | undefined>(undefined)

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
  currentEditId.value = undefined
  editDialogVisible.value = true
}

function handleUpdate(row: Project) {
  currentEditId.value = row.id
  editDialogVisible.value = true
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
          <el-table-column type="expand">
            <template #default="scope">
              <div style="padding: 0 30px;">
                <el-descriptions size="small" title="项目详细信息" :column="3" border>
                  <el-descriptions-item label="系统编号">
                    {{ scope.row.projectNo || '-' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="项目状态">
                    {{ scope.row.status === 0 ? '默认状态' : scope.row.status }}
                  </el-descriptions-item>
                  <el-descriptions-item label="排序">
                    {{ scope.row.sortOrder }}
                  </el-descriptions-item>
                  <el-descriptions-item label="开始日期">
                    {{ scope.row.startDate ? formatDate(scope.row.startDate) : '-' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="结束日期">
                    {{ scope.row.endDate ? formatDate(scope.row.endDate) : '-' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="地址" :span="2">
                    {{ scope.row.address || '-' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="描述" :span="3">
                    {{ scope.row.description || '-' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="项目简称">
                    {{ scope.row.shortName || '-' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="显示名称">
                    {{ scope.row.displayName || '-' }}
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="name" label="项目名称" align="left" min-width="140" show-overflow-tooltip />
          <el-table-column prop="projectCode" label="项目编号" align="left" min-width="140" show-overflow-tooltip />
          <el-table-column prop="tenantName" label="所属租户" align="left" min-width="140" show-overflow-tooltip />
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
          <el-table-column fixed="right" label="操作" width="160" align="center">
            <template #default="scope">
              <el-button type="primary" link size="small" @click="handleUpdate(scope.row)">
                修改
              </el-button>
              <el-button type="danger" link size="small" @click="handleDelete(scope.row)">
                删除
              </el-button>
              <el-dropdown trigger="click" style="margin-left: 12px; vertical-align: middle;">
                <el-button type="primary" link size="small">
                  更多
                  <el-icon class="el-icon--right">
                    <ArrowDown />
                  </el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="handleUpdateExtra(scope.row)">
                      扩展信息
                    </el-dropdown-item>
                    <el-dropdown-item divided @click="handleAssignDevice(scope.row)">
                      分配设备
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <ProjectEditDialog
      v-model:visible="editDialogVisible"
      :project-id="currentEditId"
      :tenant-list="tenantList"
      @success="getTableData"
    />

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
