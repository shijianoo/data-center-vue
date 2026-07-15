<script lang="ts" setup>
import { defineAsyncComponent } from "vue"
import AsyncLoading from "@/common/components/AsyncLoading.vue"
import { useTenantContextStore } from "@/pinia/stores/tenantContext"

const tenantContextStore = useTenantContextStore()
// 已有型号历史页会被精确路由拦截；本 Entry 只承担未注册型号的说明页。
const deviceComponent = defineAsyncComponent({
  loader: () => import("./NotFound.vue"),
  loadingComponent: AsyncLoading
})
</script>

<template>
  <component :is="deviceComponent" :device="tenantContextStore.currentDevice ?? undefined" />
</template>

<style lang="scss" scoped></style>
