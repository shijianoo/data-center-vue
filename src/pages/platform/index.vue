<script setup lang="ts">
import {
  Refresh
} from "@element-plus/icons-vue"
import { onMounted, onUnmounted, ref } from "vue"
import TenantHeader from "@/layouts/components/TenantHeader/index.vue"
import { useTenantStore } from "@/pinia/stores/tenant"
import KpiCard from "./components/KpiCard.vue"
import TenantList from "./components/TenantList.vue"

const tenantStore = useTenantStore()
const isRefreshing = ref(false)
const countdown = ref(60)
let timer: ReturnType<typeof setInterval> | null = null

function refreshData() {
  isRefreshing.value = true
  // 模拟数据请求
  setTimeout(() => {
    isRefreshing.value = false
    countdown.value = 60
  }, 1000)
}

onMounted(() => {
  timer = setInterval(() => {
    if (countdown.value > 0) countdown.value--
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div>
    <TenantHeader />

    <div class="platform-layout">
      <div class="platform-container">
        <!-- 顶部标题栏 -->
        <div class="page-header">
          <div class="ph-title">
            <h2>平台运维概览</h2>
            <!-- <p>可以显示一个平台的概览信息</p> -->
          </div>

          <div class="refresh-control">
            <el-icon :class="{ 'spin-icon': isRefreshing }" color="var(--el-color-primary)">
              <Refresh />
            </el-icon>
            <span v-if="isRefreshing">数据同步中...</span>
            <span v-else>下次自动刷新: {{ countdown }}s</span>
            <button class="refresh-btn" @click="refreshData">
              立即刷新
            </button>
          </div>
        </div>

        <!-- KPI 卡片组 -->
        <!-- KPI 卡片组 -->
        <div class="stats-grid">
          <KpiCard
            label="客户数量"
            :value="(tenantStore.tenants!.length - 1).toString()"
          />

          <KpiCard
            label="总型号"
            value="12,450"
          />

          <KpiCard
            label="总设备"
            value="5"
            unit="Projects"
          />

          <KpiCard
            label="总在线设备"
            value="12"
          />
        </div>

        <!-- 租户列表 -->
        <TenantList />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.platform-layout {
  min-height: 100vh;
  background-color: var(--bg-body);
  font-family:
    "Inter",
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    sans-serif;
  padding-top: var(--header-h);
  color: var(--text-main);
}

.platform-container {
  padding: 24px;
  padding-top: 84px;
  background-color: var(--el-bg-color-page);
  min-height: 100vh;

  max-width: 1400px;
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
