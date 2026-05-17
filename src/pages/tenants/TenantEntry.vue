<script lang="ts" setup>
import AsyncLoading from "@/common/components/AsyncLoading.vue"
import { useUserStore } from "@/pinia/stores/user"

const pageMap: Record<string, any> = {
  Platform: defineAsyncComponent({
    loader: () => import("./platform-tenant/Overview.vue"),
    loadingComponent: AsyncLoading
  }),
  Default: defineAsyncComponent({
    loader: () => import("./default-tenant/Overview.vue"),
    loadingComponent: AsyncLoading
  }),
  NotFound: defineAsyncComponent({
    loader: () => import("./NotFound.vue"),
    loadingComponent: AsyncLoading
  }),
  nbhky: defineAsyncComponent({
    loader: () => import("./ningbo-hky/location-enhanced/EnhancedDeviceLocation.vue"),
    loadingComponent: AsyncLoading
  })
}

function getTenantPage(key: string) {
  return pageMap[key] ?? pageMap.Default
}

const userStore = useUserStore()
const tenantComponent = shallowRef()
watch(() => userStore.activeTenant, (tenant) => {
  if (tenant) {
    if (tenant.type === 99) {
      tenantComponent.value = pageMap.Platform
    } else {
      tenantComponent.value = getTenantPage(tenant.extra!.uiProfile!)
    }
  } else if (tenant === null) {
    tenantComponent.value = pageMap.NotFound
  }
}, { immediate: true })
</script>

<template>
  <component :is="tenantComponent" :tenant="userStore.activeTenant!" />
</template>

<style lang="scss" scoped></style>
