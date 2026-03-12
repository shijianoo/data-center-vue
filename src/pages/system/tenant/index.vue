<script lang="ts" setup>
import type { TenantStatistics } from "@/common/apis/statistics/tenants/type"
import type { Tenant } from "@/common/apis/tenant/type"
import { CirclePlus } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { onMounted, ref } from "vue"
import { getTenantStatistics } from "@/common/apis/statistics/tenants"
import {
  deleteTenantApi,
  getTenantListApi,

  getTenantUserIdsByTenantIdsApi
} from "@/common/apis/tenant"
import { formatDate } from "@/common/utils/datetime"
import { getTenantPlanLabel, getTenantStatusLabel, getTenantTypeLabel } from "@/common/utils/tenant-constants"
import AssignDeviceDialog from "./components/AssignDeviceDialog.vue"
import AssignUserDialog from "./components/AssignUserDialog.vue"
import TenantEditDialog from "./components/TenantEditDialog.vue"
import TenantExtraDialog from "./components/TenantExtraDialog.vue"

defineOptions({
  name: "Tenant"
})
const loading = ref<boolean>(false)

const editDialogVisible = ref<boolean>(false)
const currentEditId = ref<string | undefined>(undefined)

// #region 数据相关
const tableData = ref<Tenant[]>([])
const tenantStatistics = ref<Map<string, TenantStatistics>>(new Map())
const tenantUserCount = ref<Map<string, number>>(new Map())

async function getTableData() {
  loading.value = true
  try {
    const { data } = await getTenantListApi()
    tableData.value = data || []

    if (tableData.value.length > 0) {
      const { data: tenantStatisticsData } = await getTenantStatistics(tableData.value.map(t => t.id))
      tenantStatistics.value = new Map(tenantStatisticsData?.map(t => [t.tenantId, t]))

      const { data: tenantUserIdsData } = await getTenantUserIdsByTenantIdsApi(tableData.value.map(t => t.id))
      tenantUserCount.value = new Map(
        Object.entries(tenantUserIdsData).map(([tenantId, userIds]) => [
          tenantId,
          userIds.length
        ])
      )
    }
  } catch (error) {
    console.error("获取租户列表失败:", error)
    tableData.value = []
    ElMessage.error("获取租户数据失败")
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

function handleUpdate(row: Tenant) {
  currentEditId.value = row.id
  editDialogVisible.value = true
}

function handleDelete(row: Tenant) {
  ElMessageBox.confirm(
    `确认删除租户"${row.name}"吗？删除后不可恢复！`,
    "删除确认",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    }
  ).then(async () => {
    try {
      await deleteTenantApi(row.id)
      ElMessage.success("删除成功")
      await getTableData()
    } catch (error) {
      console.error("删除失败:", error)
      ElMessage.error("删除失败")
    }
  })
}
// #endregion

onMounted(() => {
  getTableData()
})

const assignUserDialogVisible = ref(false)
const assignDeviceDialogVisible = ref(false)
const tenantExtraDialogVisible = ref(false)
const currentTenantId = ref<string | undefined>(undefined)

function handleAssignUsers(tenant: Tenant) {
  currentTenantId.value = tenant.id
  assignUserDialogVisible.value = true
}

function handleAssignDevices(tenant: Tenant) {
  currentTenantId.value = tenant.id
  assignDeviceDialogVisible.value = true
}

function handleExtra(tenant: Tenant) {
  currentTenantId.value = tenant.id
  tenantExtraDialogVisible.value = true
}
</script>

<template>
  <div class="app-container">
    <el-card v-loading="loading" shadow="never">
      <div class="toolbar-wrapper">
        <div>
          <el-button type="primary" :icon="CirclePlus" @click="handleCreate">
            新增租户
          </el-button>
        </div>
      </div>
      <div class="table-wrapper">
        <el-table :data="tableData" v-loading="loading" row-key="id">
          <el-table-column type="expand">
            <template #default="scope">
              <div style="padding: 0 30px;">
                <el-descriptions size="small" title="租户详细信息" :column="3" border>
                  <el-descriptions-item label="套餐类型">
                    <el-tag size="small" type="info">
                      {{ getTenantPlanLabel(scope.row.plan) }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="标识">
                    {{ scope.row.slug || '-' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="域名">
                    {{ scope.row.customDomain || '-' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="联系邮箱">
                    {{ scope.row.contactEmail || '-' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="过期时间">
                    {{ scope.row.expireTime ? formatDate(scope.row.expireTime) : '-' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="排序">
                    {{ scope.row.sortOrder }}
                  </el-descriptions-item>
                  <el-descriptions-item label="系统租户">
                    <el-tag v-if="scope.row.isSystem" type="warning" effect="dark" size="small">
                      是
                    </el-tag>
                    <el-tag v-else type="success" effect="plain" size="small">
                      否
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="描述" :span="2">
                    {{ scope.row.description || '-' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="设备数量" :span="1">
                    {{ tenantStatistics.get(scope.row.id)?.deviceCount || 0 }}
                  </el-descriptions-item>
                  <el-descriptions-item label="用户数量" :span="1">
                    {{ tenantUserCount.get(scope.row.id) || 0 }}
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="name" label="租户名称" align="left" min-width="160" show-overflow-tooltip />
          <el-table-column prop="tenantCode" label="租户编码" align="left" min-width="140" show-overflow-tooltip />
          <el-table-column prop="type" label="租户类型" align="center" width="100">
            <template #default="scope">
              <el-tag effect="plain">
                {{ getTenantTypeLabel(scope.row.type) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="租户状态" align="center" width="100">
            <template #default="scope">
              <el-tag effect="plain">
                {{ getTenantStatusLabel(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="isActive" label="状态" align="center" width="80">
            <template #default="scope">
              <el-tag v-if="scope.row.isActive" type="success" effect="plain">
                启用
              </el-tag>
              <el-tag v-else type="danger" effect="dark">
                禁用
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="contactName" label="联系人" align="center" width="100" show-overflow-tooltip />
          <el-table-column prop="contactPhone" label="联系电话" align="center" width="120" show-overflow-tooltip />
          <el-table-column fixed="right" label="操作" width="160" align="center">
            <template #default="scope">
              <el-button type="primary" link size="small" @click="handleUpdate(scope.row)">
                修改
              </el-button>
              <el-button type="danger" link size="small" @click="handleDelete(scope.row)" :disabled="scope.row.isSystem">
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
                    <el-dropdown-item @click="handleExtra(scope.row)">
                      扩展信息
                    </el-dropdown-item>
                    <el-dropdown-item divided @click="handleAssignUsers(scope.row)">
                      分配用户
                    </el-dropdown-item>
                    <el-dropdown-item @click="handleAssignDevices(scope.row)">
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

    <TenantEditDialog v-model:visible="editDialogVisible" :tenant-id="currentEditId" @success="getTableData" />
    <AssignUserDialog :tenant-id="currentTenantId" v-model:visible="assignUserDialogVisible" />
    <AssignDeviceDialog :tenant-id="currentTenantId" v-model:visible="assignDeviceDialogVisible" />
    <TenantExtraDialog :tenant-id="currentTenantId" v-model:visible="tenantExtraDialogVisible" />
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
