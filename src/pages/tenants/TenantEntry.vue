<script lang="ts" setup>
import type { Component } from "vue"
import AsyncLoading from "@/common/components/AsyncLoading.vue"
import { useUserStore } from "@/pinia/stores/user"

/** 这里只保留平台首页和通用首页；具体租户定制页在到达 Entry 前已经由精确路由命中。 */
const pageMap: Record<"Platform" | "Default" | "NotFound", Component> = {
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
  })
}

const userStore = useUserStore()
const tenantComponent = shallowRef<Component>()
watch(() => userStore.activeTenant, (tenant) => {
  if (tenant) {
    if (tenant.type === 99) {
      tenantComponent.value = pageMap.Platform
    } else {
      // 定制租户不会进入此组件；能到这里的非平台租户统一使用通用首页。
      tenantComponent.value = pageMap.Default
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
