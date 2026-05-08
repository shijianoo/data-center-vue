<script setup lang="ts">
import { useTenantContextStore } from "@/pinia/stores/tenantContext"

defineProps<{
  alwaysShowBrand?: boolean
}>()
const tenantContext = useTenantContextStore()

const isPlatform = computed(() => tenantContext.currentTenant?.type === 99)

/** 主显示名：口语名 > 简称 > 全称 */
const primaryName = computed(() => {
  if (isPlatform.value) return "平台运维概览"
  const t = tenantContext.currentTenant
  return t?.displayName || t?.shortName || t?.name || ""
})

/** 全称：仅当主名称不是全称时才显示 */
const fullName = computed(() => {
  if (isPlatform.value) return ""
  const t = tenantContext.currentTenant
  if (!t?.name) return ""
  // 主名称已经是全称，无需再显示
  if (primaryName.value === t.name) return ""
  return t.name
})
</script>

<template>
  <div class="tenant-logo" :class="{ 'always-show-brand': alwaysShowBrand }">
    <div>
      <img class="logo-box" src="@/common/assets/images/logo.jpg">
    </div>
    <div class="brand">
      <span class="brand-primary">{{ primaryName }}</span>
      <span v-if="fullName" class="brand-full" :title="fullName">{{ fullName }}</span>
    </div>
  </div>
</template>

<style scoped>
.tenant-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.logo-box {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  flex-shrink: 0;
}

.brand {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.brand-primary {
  font-weight: 700;
  font-size: 15px;
  letter-spacing: 0.3px;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.brand-full {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.45);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0.2px;
  line-height: 1.3;
  max-width: 200px;
}

@media (max-width: 900px) {
  .tenant-logo:not(.always-show-brand) .brand {
    display: none;
  }
}
</style>
