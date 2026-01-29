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
  padding-top: 20px;
  width: 100%;
}

.platform-layout {
  min-height: 100vh;
  font-family:
    "Inter",
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    sans-serif;
  padding-top: var(--header-h);
}

.platform-container {
  padding: 24px;
  padding-top: 84px;
  background-color: var(--el-bg-color-page);
  min-height: 100vh;
  max-width: 1280px;
  padding: 30px;
  margin: 0 auto;
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

/* 运维专属：自动刷新控制器 */
.refresh-control {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  background: var(--el-bg-color);
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color);
}

.spin-icon {
  animation: spin 2s linear infinite;
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}

.refresh-btn {
  border: none;
  background: none;
  color: var(--el-color-primary);
  font-weight: 600;
  cursor: pointer;
  margin-left: 10px;
  font-size: 13px;
}

/* KPI 卡片组 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}
</style>
