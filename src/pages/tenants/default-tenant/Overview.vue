<script lang="ts" setup>
import type { ProjectWithStats } from "@/common/apis/statistics/tenants/type"
import { useRouter } from "vue-router"
import { getTenantProjectStatsApi } from "@/common/apis/statistics/tenants"
import TenantBreadcrumb from "@/layouts/components/TenantHeader/TenantBreadcrumb.vue"
import { useTenantContextStore } from "@/pinia/stores/tenantContext"
import { useUserStore } from "@/pinia/stores/user"
import ProjectCard from "./components/ProjectCard.vue"
import SectionBar from "./components/SectionBar.vue"
import TenantCard from "./components/TenantCard.vue"

const tenantContext = useTenantContextStore()
const userStore = useUserStore()
const router = useRouter()
const projectStats = ref<ProjectWithStats[]>()
const projectCount = computed(() => projectStats.value?.length || 0)
watch(() => userStore.activeTenant, async () => {
  const { data } = await getTenantProjectStatsApi()
  console.log("当前租户的项目统计信息", data.map(d => d.name).join(","))
  projectStats.value = data
}, { immediate: true })

function goToProject(project: ProjectWithStats) {
  router.push(`${tenantContext.currentHomePath}/projects/${project.projectCode}`)
}
</script>

<template>
  <div class="tenant-container">
    <TenantBreadcrumb />
    <TenantCard :tenant="userStore.activeTenant!" />

    <SectionBar title="项目列表" :count="projectCount" />

    <div class="grid-view">
      <ProjectCard
        v-for="p in projectStats"
        :key="p.id"
        :="p"
        @click="goToProject(p)"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.tenant-container {
  min-height: 100vh;
  max-width: 1280px;
  margin: 0 auto;
  width: 100%;
}

.tenant-breadcrumb {
  margin-bottom: 10px;
}

.tenant-card {
  margin-bottom: 20px;
}

.section-bar {
  margin-bottom: 20px;
}

.grid-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;

  .pc-tag {
    font-size: 11px;
    padding: 4px 8px;
    background: #f8fafc;
    border-radius: 4px;
    color: var(--text-sub);
    border: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 5px;
    i {
      color: var(--text-sub);
    }
  }
}

@media (max-width: 900px) {
  .tenant-breadcrumb {
    margin-bottom: 10px;
  }
  .tenant-card {
    margin-bottom: 10px;
  }
  .section-bar {
    margin-bottom: 10px;
  }
  .grid-view {
    gap: 10px;
  }
}
</style>
