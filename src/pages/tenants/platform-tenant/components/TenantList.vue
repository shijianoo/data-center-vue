<script setup lang="ts">
import type { TenantStatistics } from "@/common/apis/statistics/tenants/type"
import type { Tenant } from "@/common/apis/tenant/type"
import { getTenantStatistics } from "@/common/apis/statistics/tenants"
import { getTenantPagedApi } from "@/common/apis/tenant"

interface Emits {
  (e: "tenantsChange", tenants: Tenant[]): void
}

const emit = defineEmits<Emits>()

const router = useRouter()

function handleTenantClick(tenant: Tenant) {
  const path = tenant.customDomain || tenant.slug || tenant.tenantCode
  console.log("进入", path)
  router.push(`/console/${path}`)
}

const pageIndex = ref(1)
const total = ref(0)
const tenantList = ref<Tenant[]>([])

const tenantStatsMap = ref<Record<string, TenantStatistics>>({})

watch(pageIndex, async () => {
  try {
    const { data } = await getTenantPagedApi(pageIndex.value, 10)
    total.value = data.total
    tenantList.value = data.items
    emit("tenantsChange", data.items)

    if (data.items.length > 0) {
      const tenantIds = data.items.map(t => t.id)
      const { data: stats } = await getTenantStatistics(tenantIds)
      const statsMap: Record<string, TenantStatistics> = {}
      stats.forEach((s) => {
        statsMap[s.tenantId] = s
      })
      tenantStatsMap.value = statsMap
    }
  } catch (error) {
    console.error("获取租户列表或统计失败", error)
  }
}, { immediate: true })
</script>

<template>
  <div class="list-panel">
    <div class="toolbar">
      <div class="filter-group">
        <button class="filter-btn active">
          全部项目
        </button>
        <!-- <button class="filter-btn" style="color:var(--el-color-danger)">
          异常 (5)
        </button>
        <button class="filter-btn" style="color:var(--el-color-warning)">
          卫星高耗 (8)
        </button>
        <button class="filter-btn">
          离线 > 24h
        </button> -->
      </div>
    </div>

    <div class="table-responsive">
      <table class="ops-table">
        <thead>
          <tr>
            <th width="25%">
              客户名称
            </th>
            <th width="15%">
              项目数
            </th>
            <th width="15%">
              型号数量
            </th>
            <th width="15%">
              总设备数量
            </th>
            <th width="15%">
              总在线数量
            </th>
            <th width="15%">
              操作
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tenant in tenantList" :key="tenant.id" @click="handleTenantClick(tenant)">
            <td>
              <div class="project-cell">
                <div class="p-icon">
                  <i class="fa fa-building" aria-hidden="true" />
                </div>
                <div class="p-info">
                  <span class="p-name">{{ tenant.name }}</span>
                  <span class="p-client">{{ tenant.description }}</span>
                </div>
              </div>
            </td>
            <td>
              {{ tenantStatsMap[tenant.id]?.projectCount || 0 }}
            </td>
            <td class="col-optional">
              {{ tenantStatsMap[tenant.id]?.deviceModelCount || 0 }}
            </td>
            <td>
              {{ tenantStatsMap[tenant.id]?.deviceCount || 0 }}
            </td>
            <td class="col-optional">
              {{ tenantStatsMap[tenant.id]?.onlineDeviceCount || 0 }}
            </td>
            <td>
              <span class="action-btn">进入</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination">
      <el-pagination size="small" :total="total" layout="total,prev, pager, next" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.c-warn {
  color: var(--el-color-warning);
}

.text-sub {
  color: var(--el-text-color-secondary);
}

/* 列表区域 */
.list-panel {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  overflow: hidden;
}

/* 工具栏 */
.toolbar {
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color);
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: center;
  justify-content: space-between;
}

.filter-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-btn {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}

.filter-btn.active {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 600;
}

.table-search {
  width: 200px;
}

/* 表格容器 */
.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.ops-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

.ops-table th {
  text-align: left;
  padding: 12px 20px;
  background: var(--el-fill-color-light);
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-weight: 600;
  text-transform: uppercase;
  border-bottom: 1px solid var(--el-border-color);
  white-space: nowrap;
}

.ops-table td {
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color);
  font-size: 14px;
  vertical-align: middle;
  color: var(--el-text-color-regular);
}

.ops-table tr:hover td {
  background: var(--el-fill-color-lighter);
  cursor: pointer;
}

/* 列表内组件 */
.project-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.p-icon {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}

.p-icon.alert {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

.p-info {
  display: flex;
  flex-direction: column;
}

.p-name {
  font-weight: 600;
  color: var(--el-text-color-primary);
  font-size: 14px;
}

.p-client {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
  white-space: nowrap;
}

.badge.alert {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

.badge.warn {
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning);
}

.badge.ok {
  background: var(--el-color-success-light-9);
  color: var(--el-color-success);
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

/* 进度条 */
.bar-container {
  min-width: 120px;
}

.bar-labels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  margin-bottom: 4px;
  color: var(--el-text-color-secondary);
}

.bar-bg {
  width: 100%;
  height: 6px;
  background: var(--el-fill-color);
  border-radius: 3px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 3px;
}

.action-btn {
  color: var(--el-color-primary);
  font-size: 13px;
  font-weight: 500;
}

.divider {
  color: var(--el-border-color);
  margin: 0 8px;
}

.action-log {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.pagination {
  padding: 15px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  align-items: center;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.page-btn {
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
}

/* 媒体查询 */
@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .filter-group {
    width: 100%;
    overflow-x: auto;
    padding-bottom: 5px;
  }

  .table-search {
    width: 100%;
  }
}
</style>
