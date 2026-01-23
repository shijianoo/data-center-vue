<script lang="ts" setup>
import { useTenantContextStore } from "@/pinia/stores/tenantContext"

const tenantContextStore = useTenantContextStore()
const tenant = computed(() => tenantContextStore.currentTenant)
const project = computed(() => tenantContextStore.currentProject)
</script>

<template>
  <div class="project-hero-card">
    <div class="tc-left">
      <div class="tc-header">
        <div class="tc-title-row">
          <div class="tc-name">
            {{ project!.name }}
          </div>
        </div>
        <div class="tc-meta">
          <span class="meta-item"><i class="far fa-building" /> 客户: <strong>{{ tenant!.name }}</strong></span>
          <span class="meta-item"><i class="fas fa-map-marker-alt" /> 部署地: {{ project!.address }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.project-hero-card {
  display: flex;
  justify-content: space-between;
  background: white;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 30px;

  .tc-left {
    flex: 1;

    .tc-title-row {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 12px;
      .tc-name {
        font-size: 24px;
        font-weight: 800;
      }
    }

    .tc-meta {
      display: flex;
      gap: 24px;
      font-size: 13px;
      color: var(--text-sub);
      margin-top: 10px;
      .meta-item i {
        margin-right: 6px;
      }
    }
  }

  .tc-right {
    display: flex;
    align-items: center;
    .btn {
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid var(--border);
      background: white;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
      &:hover {
        border-color: var(--primary);
        color: var(--primary);
      }
      &.btn-primary {
        background: var(--primary);
        color: white;
        border-color: var(--primary);
        &:hover {
          opacity: 0.9;
          color: white;
        }
      }
    }
  }
}

// Mobile
@media (max-width: 900px) {
  .project-hero-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
    .tc-meta {
      flex-direction: column;
      gap: 10px;
    }
    .tc-right {
      width: 100%;
      .btn {
        width: 100%;
        justify-content: center;
      }
    }
  }
}
</style>
