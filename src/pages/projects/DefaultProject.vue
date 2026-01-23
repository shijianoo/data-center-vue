<script lang="ts" setup>
import type { DeviceModelStatistics } from "@/common/apis/statistics/projects/type"
import { getDeviceModelStatisticsApi } from "@/common/apis/statistics/projects"
import TenantBreadcrumb from "@/layouts/components/TenantHeader/TenantBreadcrumb.vue"
import { useTenantContextStore } from "@/pinia/stores/tenantContext"
import ProjectHeroCard from "./components/ProjectHeroCard.vue"
import ModelEntry from "./models/ModelEntry.vue"

const tenantContextStore = useTenantContextStore()
const modelStats = ref<DeviceModelStatistics[]>([])
const loading = ref(false)
watch(() => tenantContextStore.currentProject, async (project) => {
  if (!project) return
  loading.value = true
  try {
    const { data } = await getDeviceModelStatisticsApi(project.id)
    modelStats.value = data
  } finally {
    loading.value = false
  }
}, { immediate: true })
</script>

<template>
  <div class="project-dashboard">
    <div class="project-container">
      <TenantBreadcrumb />
      <ProjectHeroCard />

      <div v-loading="loading">
        <template v-if="modelStats.length !== 0">
          <ModelEntry
            v-for="model in modelStats"
            :key="model.id"
            v-bind="model"
          />
        </template>
        <div v-else-if="!loading" class="empty-state">
          <i class="fas fa-folder-open" />
          <span>该项目暂无设备数据</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.project-dashboard {
  min-height: 100vh;
  max-width: 1280px;
  margin: 0 auto;
  width: 100%;
}

.project-hero-card {
  margin-bottom: 20px;
}

.empty-state {
  padding: 60px;
  text-align: center;
  color: var(--text-sub);
  background: white;
  border: 1px solid var(--border);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  i {
    font-size: 32px;
    opacity: 0.3;
  }
}

@media (max-width: 900px) {
  .project-hero-card {
    margin-bottom: 10px;
  }
}
</style>
