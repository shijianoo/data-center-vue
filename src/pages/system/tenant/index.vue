<script lang="ts" setup>
import type { FormInstance, FormRules } from "element-plus"
import type { Tenant, TenantForm } from "@/common/apis/tenant/type"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { cloneDeep } from "lodash-es"
import { onMounted, ref } from "vue"
import {
  createTenantApi,
  deleteTenantApi,
  getTenantListApi,
  updateTenantApi
} from "@/common/apis/tenant"
import { useTenantStore } from "@/pinia/stores/tenant"
import AssignUserDialog from "./components/AssignUserDialog.vue"

defineOptions({
  name: "Tenant"
})
const tenantStore = useTenantStore()
const loading = ref<boolean>(false)
const submitLoading = ref<boolean>(false)

// #region 表单相关
const defaultForm: TenantForm = {
  adminUsername: "",
  name: "",
  tenantNo: "",
  type: 1,
  status: 1,
  isActive: true,
  sortOrder: 0,
  plan: 0
}

const dialogVisible = ref<boolean>(false)
const formRef = ref<FormInstance | null>(null)
const formData = ref<TenantForm>(cloneDeep(defaultForm))

const formRules: FormRules<TenantForm> = {
  name: [{ required: true, trigger: "blur", message: "请输入租户名称" }],
  adminUsername: [{ required: true, trigger: "blur", message: "请输入管理员账号" }]
}

function resetForm() {
  formRef.value?.clearValidate()
  formData.value = cloneDeep(defaultForm)
}
// #endregion

// #region 数据相关
const tableData = ref<Tenant[]>([])

async function getTableData() {
  loading.value = true
  try {
    const { data } = await getTenantListApi()
    tableData.value = data || []
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
  resetForm()
  dialogVisible.value = true
}

function handleUpdate(row: Tenant) {
  formData.value = {
    id: row.id,
    name: row.name,
    type: row.type,
    status: row.status,
    plan: row.plan,
    slug: row.slug,
    customDomain: row.customDomain,
    contactName: row.contactName,
    contactPhone: row.contactPhone,
    contactEmail: row.contactEmail,
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
      await updateTenantApi(formData.value.id, formData.value)
      ElMessage.success("修改成功")
    } else {
      await createTenantApi(formData.value)
      ElMessage.success("创建成功")
    }
    dialogVisible.value = false
    await getTableData()
  } catch (error) {
    console.error("操作失败:", error)
    ElMessage.error("操作失败")
  } finally {
    submitLoading.value = false
    tenantStore.getTenantList()
  }
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
const currentTenantId = ref<string | null>(null)
function handleAssignUsers(tenant: Tenant) {
  currentTenantId.value = tenant.id
  assignUserDialogVisible.value = true
}

function getTenantType(tenant: Tenant) {
  if (tenant.type === 1) {
    return "企业租户"
  } else if (tenant.type === 2) {
    return "个人租户"
  } else if (tenant.type === 3) {
    return "试用租户"
  } else if (tenant.type === 98) {
    return "内部租户"
  } else if (tenant.type === 99) {
    return "平台租户"
  } else {
    return "未知"
  }
}

function getTenantStatus(tenant: Tenant) {
  if (tenant.status === 1) {
    return "正常"
  } else if (tenant.status === 2) {
    return "待激活"
  } else if (tenant.status === 3) {
    return "欠费"
  } else if (tenant.status === 4) {
    return "锁定"
  } else if (tenant.status === 99) {
    return "禁用"
  } else {
    return "未知"
  }
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
        <div>
          <el-tooltip content="刷新当前页">
            <el-button type="primary" :icon="RefreshRight" circle @click="getTableData" />
          </el-tooltip>
        </div>
      </div>
      <div class="table-wrapper">
        <el-table :data="tableData" v-loading="loading" row-key="id">
          <el-table-column prop="name" label="租户名称" align="left" width="160" />
          <el-table-column prop="tenantCode" label="租户编码" align="left" width="140" />
          <el-table-column prop="type" label="租户类型" align="center" width="80">
            <template #default="scope">
              <el-tag effect="plain">
                {{ getTenantType(scope.row) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="租户状态" align="center" width="80">
            <template #default="scope">
              <el-tag effect="plain">
                {{ getTenantStatus(scope.row) }}
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
          <el-table-column prop="plan" label="套餐类型" align="center" width="80" />
          <el-table-column prop="slug" label="标识" align="center" width="80" />
          <el-table-column prop="customDomain" label="域名" align="center" width="80" />
          <el-table-column prop="expireTime" label="过期时间" align="center" width="120" />
          <el-table-column prop="contactName" label="联系人" align="center" width="80" />
          <el-table-column prop="contactPhone" label="联系电话" align="center" width="80" />
          <el-table-column prop="contactEmail" label="联系邮箱" align="center" width="80" />
          <el-table-column prop="description" label="描述" align="left" />
          <el-table-column prop="sortOrder" label="排序" align="center" width="80" />
          <el-table-column prop="isSystem" label="系统租户" align="center" width="80">
            <template #default="scope">
              <el-tag v-if="scope.row.isSystem" type="warning" effect="dark">
                是
              </el-tag>
              <el-tag v-else type="success" effect="plain">
                否
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column fixed="right" label="操作" width="220" align="center">
            <template #default="scope">
              <el-dropdown trigger="click">
                <el-button type="primary" text bg size="small">
                  租户管理
                  <el-icon class="el-icon--right">
                    <ArrowDown />
                  </el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="handleAssignUsers(scope.row)">
                      分配用户
                    </el-dropdown-item>
                    <el-dropdown-item>
                      分配设备
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <el-button type="primary" text bg size="small" @click="handleUpdate(scope.row)">
                修改
              </el-button>
              <el-button type="danger" text bg size="small" @click="handleDelete(scope.row)" :disabled="scope.row.isSystem">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- 新增对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="formData.id === undefined ? '新增租户' : '修改租户'"
      @closed="resetForm"
      width="600px"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item v-if="formData.id === undefined" prop="adminUsername" label="租户管理员">
          <el-input v-model="formData.adminUsername" placeholder="请输入租户管理员" />
        </el-form-item>
        <el-form-item prop="name" label="租户名称">
          <el-input v-model="formData.name" placeholder="请输入租户名称" />
        </el-form-item>
        <el-form-item prop="type" label="租户类型">
          <el-select v-model="formData.type" placeholder="请选择租户类型">
            <el-option
              label="企业租户"
              :value="1"
            />
            <el-option
              label="个人租户"
              :value="2"
            />
            <el-option
              label="试用租户"
              :value="3"
            />
            <el-option
              label="内部租户"
              :value="98"
            />
            <el-option
              disabled
              label="平台租户"
              :value="99"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="type" label="租户状态">
          <el-select v-model="formData.status" placeholder="请选择租户状态">
            <el-option
              label="未知"
              :value="0"
            />
            <el-option
              label="正常"
              :value="1"
            />
            <el-option
              label="待激活"
              :value="2"
            />
            <el-option
              label="欠费"
              :value="3"
            />
            <el-option
              label="锁定"
              :value="4"
            />
            <el-option
              label="禁用"
              :value="99"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="type" label="套餐类型">
          <el-select v-model="formData.plan" placeholder="请选择套餐类型">
            <el-option
              label="未知"
              :value="0"
            />
            <el-option
              label="试用套餐"
              :value="1"
            />
            <el-option
              label="基础套餐"
              :value="2"
            />
            <el-option
              label="专业套餐"
              :value="3"
            />
            <el-option
              label="企业套餐"
              :value="4"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="slug" label="标识">
          <el-input v-model="formData.slug" placeholder="请输入标识" />
        </el-form-item>
        <el-form-item prop="customDomain" label="域名">
          <el-input v-model="formData.customDomain" placeholder="请输入域名" />
        </el-form-item>
        <!-- <el-form-item prop="expireTime" label="过期时间">
          <el-input v-model="formData.expireTime" placeholder="请输入过期时间" />
        </el-form-item> -->
        <el-form-item prop="contactName" label="联系人">
          <el-input v-model="formData.contactName" placeholder="请输入联系人" />
        </el-form-item>
        <el-form-item prop="contactPhone" label="联系电话">
          <el-input v-model="formData.contactPhone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item prop="contactEmail" label="联系邮箱">
          <el-input v-model="formData.contactEmail" placeholder="请输入联系邮箱" />
        </el-form-item>
        <el-form-item prop="description" label="描述">
          <el-input v-model="formData.description" placeholder="请输入" type="textarea" />
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
    <AssignUserDialog :tenant-id="currentTenantId!" v-model:visible="assignUserDialogVisible" />
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
