<script lang="ts" setup>
import type { Tenant } from "@/common/apis/tenant/type"
import { getDeviceOverviewStatistics } from "@/common/apis/statistics/devices"
import KpiCard from "./components/KpiCard.vue"
import TenantList from "./components/TenantList.vue"

const tenantList = ref<Tenant[]>([])
const totalModelCount = ref<number>(0)
const totalDeviceCount = ref<number>(0)
const onlineDeviceCount = ref<number>(0)

onMounted(() => {
  getDeviceOverviewStatistics().then(({ data }) => {
    totalModelCount.value = data.totalModelCount
    totalDeviceCount.value = data.totalDeviceCount
    onlineDeviceCount.value = data.onlineDeviceCount
  })
})
</script>

<template>
  <div class="tenant-container">
    <div class="page-header">
      <div class="ph-title">
        <h2>平台运维概览</h2>
      </div>
    </div>

    <div class="stats-grid">
      <KpiCard
        label="客户数量"
        :value="tenantList.length.toString()"
      />

      <KpiCard
        label="总型号"
        :value="totalModelCount.toString()"
      />

      <KpiCard
        label="总设备"
        :value="totalDeviceCount.toString()"
      />

      <KpiCard
        label="总在线设备"
        :value="onlineDeviceCount.toString()"
      />
    </div>

    <TenantList @tenants-change="(tenants) => tenantList = tenants" />
  </div>
</template>

<style lang="scss" scoped>
.tenant-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 20px;
  width: 100%;
}

/* 顶部标题栏 */
.page-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 15px;
}

.ph-title h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.ph-title p {
  margin: 4px 0 0 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

@media (max-width: 900px) {
  .tenant-container {
    padding: 10px;
  }
}
</style>
