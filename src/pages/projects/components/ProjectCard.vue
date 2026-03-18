<script lang="ts" setup>
import { computed } from "vue"
import { getProjectStatusName } from "@/common/utils/project-constants"
import { useTenantContextStore } from "@/pinia/stores/tenantContext"

const tenantContextStore = useTenantContextStore()
const tenant = computed(() => tenantContextStore.currentTenant)
const project = computed(() => tenantContextStore.currentProject)

function formatDate(dateStr?: string) {
  if (!dateStr) return "-"
  return dateStr.substring(0, 10)
}
</script>

<template>
  <div class="project-card">
    <div class="project-title">
      <div class="project-name">
        {{ project!.name }}
      </div>
      <div class="project-tags">
        <el-tag type="success" size="small">
          {{ getProjectStatusName(project!.status) }}
        </el-tag>
      </div>
    </div>

    <div class="project-description" v-if="project!.description">
      {{ project!.description }}
    </div>

    <div class="project-meta">
      <span class="meta-item" v-if="project!.projectCode">
        编号: <strong>{{ project!.projectCode }}</strong>
      </span>
      <span class="meta-item" v-if="tenant">
        客户: <strong>{{ tenant!.name }}</strong>
      </span>
      <span class="meta-item" v-if="project!.address">
        部署地: <strong>{{ project!.address }}</strong>
      </span>
      <span class="meta-item" v-if="project!.extra?.ownerUser">
        负责人: <strong>{{ project!.extra?.ownerUser }}</strong>
      </span>
      <span class="meta-item" v-if="project!.startDate || project!.endDate">
        <i class="far fa-calendar-alt" /> 周期:
        <strong>{{ formatDate(project!.startDate) }} 至 {{ formatDate(project!.endDate) }}</strong>
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.project-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: white;
  gap: 10px;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 30px;

  .project-title {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 15px;

    .project-name {
      font-size: 24px;
      font-weight: 800;
      color: var(--text-main);
    }
  }

  .project-description {
    font-size: 14px;
    color: var(--text-sub);
    line-height: 1.5;
  }

  .project-meta {
    display: flex;
    flex-wrap: wrap;
    column-gap: 24px;
    row-gap: 10px;
    font-size: 13px;
    color: var(--text-sub);

    .meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
      i {
        color: #94a3b8;
      }
    }
  }
}

@media (max-width: 900px) {
  .project-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;

    .project-meta {
      flex-direction: column;
      gap: 10px;
    }
  }
}
</style>
