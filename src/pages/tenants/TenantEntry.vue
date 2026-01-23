<script lang="ts" setup>
import { useUserStore } from "@/pinia/stores/user"

const pageMap: Record<string, any> = {
  Platform: defineAsyncComponent(() => import("./platform-tenant/Overview.vue")),
  Default: defineAsyncComponent(() => import("./default-tenant/Overview.vue")),
  NotFound: defineAsyncComponent(() => import("./NotFound.vue"))
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
  } else {
    tenantComponent.value = pageMap.NotFound
  }
}, { immediate: true })
</script>

<template>
  <component :is="tenantComponent" :tenant="userStore.activeTenant!" />
</template>

<style lang="scss" scoped></style>
