<script setup lang="ts">
import { useRoute } from "vue-router"
import { useTenantContextStore } from "@/pinia/stores/tenantContext"

defineProps<{
  alwaysShowBrand?: boolean
}>()

const tenantContext = useTenantContextStore()
const route = useRoute()

const isPlatform = computed(() => tenantContext.currentTenant?.type === 99)

/**
 * 从 route.meta 读取 logoTitle 覆盖。
 * route.meta 在导航确认时立即响应式更新，早于组件 mount/unmount，
 * 因此读取它不会产生任何"中间态"闪烁。
 */
const metaTitle = computed(
  () => route.meta?.logoTitle
)

/** 主显示名：页面 lease > route meta > 当前设备/项目 > 租户。 */
const primaryName = computed(() => {
  if (tenantContext.logoTitle?.primary != null) return tenantContext.logoTitle.primary
  if (metaTitle.value?.primary != null) return metaTitle.value.primary
  if (isPlatform.value) return "平台运维概览"
  const device = tenantContext.currentDevice
  if (device?.displayName || device?.deviceName || device?.modelName) {
    return device.displayName || device.deviceName || device.modelName || ""
  }
  const project = tenantContext.currentProject
  if (project?.displayName || project?.shortName || project?.name) {
    return project.displayName || project.shortName || project.name
  }
  const t = tenantContext.currentTenant
  return t?.displayName || t?.shortName || t?.name || ""
})

/** 副标题独立继承，避免当前级没有全称时短暂显示空白。 */
const fullName = computed(() => {
  if (tenantContext.logoTitle?.sub != null) return tenantContext.logoTitle.sub
  if (metaTitle.value?.sub != null) return metaTitle.value.sub
  if (isPlatform.value) return ""
  const device = tenantContext.currentDevice
  if (device?.deviceName || device?.modelName) {
    const value = device.deviceName || device.modelName || ""
    return value === primaryName.value ? "" : value
  }
  const project = tenantContext.currentProject
  if (project?.name) return project.name === primaryName.value ? "" : project.name
  const t = tenantContext.currentTenant
  if (!t?.name) return ""
  if (primaryName.value === t.name) return ""
  return t.name
})

/** Logo 图片地址：租户自定义 logoURL 优先，否则用内置图片 */
const logoSrc = computed(() => {
  const url = tenantContext.currentTenant?.extra?.logoURL
  return url || null
})
</script>

<template>
  <div class="tenant-logo" :class="{ 'always-show-brand': alwaysShowBrand }">
    <div>
      <img
        v-if="logoSrc"
        class="logo-box"
        :src="logoSrc"
        :alt="primaryName"
      >
      <img
        v-else
        class="logo-box"
        src="@/common/assets/images/logo.jpg"
        alt="logo"
      >
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
  color: var(--tenant-header-text, white);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.brand-full {
  font-size: 11px;
  color: var(--tenant-header-text-muted, rgba(255, 255, 255, 0.45));
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
