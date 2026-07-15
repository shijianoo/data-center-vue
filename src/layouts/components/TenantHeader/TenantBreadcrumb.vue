<script lang="ts" setup>
import { useTenantContextStore } from "@/pinia/stores/tenantContext"

const tenantContextStore = useTenantContextStore()
</script>

<template>
  <div class="smart-breadcrumb">
    <router-link v-if="tenantContextStore.currentProjectKey" class="bc-item bc-link" :to="tenantContextStore.currentHomePath">
      首页
    </router-link>

    <template v-if="tenantContextStore.currentProjectKey">
      <i class="fas fa-chevron-right bc-sep" />
      <router-link
        v-if="tenantContextStore.currentDeviceCode"
        class="bc-item bc-link"
        :to="tenantContextStore.currentProjectPath"
      >
        {{ tenantContextStore.currentProject?.name || "项目" }}
      </router-link>
      <span v-else class="bc-item bc-current">
        {{ tenantContextStore.currentProject?.name || "项目" }}
      </span>
    </template>

    <template v-if="tenantContextStore.currentDeviceCode">
      <i class="fas fa-chevron-right bc-sep" />
      <router-link
        v-if="tenantContextStore.isHistory"
        class="bc-item bc-link"
        :to="tenantContextStore.currentDevicePath"
      >
        {{ tenantContextStore.currentDevice?.deviceName || tenantContextStore.currentDevice?.displayName || tenantContextStore.currentDevice?.serialNumber || tenantContextStore.currentDeviceCode }}
      </router-link>
      <span v-else class="bc-item bc-current">
        {{ tenantContextStore.currentDevice?.deviceName || tenantContextStore.currentDevice?.displayName || tenantContextStore.currentDevice?.serialNumber || tenantContextStore.currentDeviceCode }}
      </span>
    </template>

    <template v-if="tenantContextStore.isHistory">
      <i class="fas fa-chevron-right bc-sep" />
      <span class="bc-current">历史记录</span>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.smart-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  margin-left: 1px;
  color: var(--text-sub);
  font-size: 13px;
}

.bc-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--text-sub);
  text-decoration: none;
  white-space: nowrap;

  &.bc-link {
    cursor: pointer;

    &:hover {
      color: var(--primary);
    }
  }
}

.bc-sep {
  color: #cbd5e1;
  font-size: 10px;
}

.bc-current {
  color: var(--text-main);
  font-weight: 500;
}

@media (max-width: 900px) {
  .smart-breadcrumb {
    margin-bottom: 6px;
  }
}
</style>
