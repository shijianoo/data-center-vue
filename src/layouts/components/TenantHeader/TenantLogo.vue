<script setup lang="ts">
import { useTenantContextStore } from "@/pinia/stores/tenantContext"

defineProps<{
  alwaysShowBrand?: boolean
}>()
const tenantContext = useTenantContextStore()

const title = computed(() => {
  if (tenantContext.currentTenant?.type === 99) {
    return "平台运维概览"
  } else {
    return tenantContext.currentTenant?.name
  }
})
</script>

<template>
  <div class="tenant-logo" :class="{ 'always-show-brand': alwaysShowBrand }">
    <div>
      <img class="logo-box" src="@/common/assets/images/logo.jpg">
    </div>
    <div class="brand">
      {{ title }}
    </div>
  </div>
</template>

<style scoped>
.tenant-logo {
  display: flex;
  align-items: center;
  gap: 15px;
}

.logo-box {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.brand {
  font-weight: 700;
  font-size: 16px;
  letter-spacing: 0.5px;
  color: white;
}

@media (max-width: 900px) {
  .tenant-logo:not(.always-show-brand) .brand {
    display: none;
  } /* 平板隐藏 Logo 文字 */
}
</style>
