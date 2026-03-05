<script lang="ts" setup>
import { defineAsyncComponent } from "vue"
import AsyncLoading from "@/common/components/AsyncLoading.vue"
import { useTenantContextStore } from "@/pinia/stores/tenantContext"

const pageMap: Record<string, any> = {
  SOB23BS: defineAsyncComponent({
    loader: () => import("./SOB23BSv1t1/History.vue"),
    loadingComponent: AsyncLoading
  }),
  SOB10: defineAsyncComponent({
    loader: () => import("./SOB10v1t1/History.vue"),
    loadingComponent: AsyncLoading
  }),
  NotFound: defineAsyncComponent({
    loader: () => import("./NotFound.vue"),
    loadingComponent: AsyncLoading
  })
}

function getHistoryPage(modelCode: string) {
  return pageMap[modelCode] ?? pageMap.NotFound
}

const tenantContextStore = useTenantContextStore()
const deviceComponent = shallowRef()
watch(() => tenantContextStore.currentDevice, (device) => {
  if (device) {
    deviceComponent.value = getHistoryPage(device.modelNumber!)
  } else if (device === null) {
    deviceComponent.value = pageMap.NotFound
  }
}, { immediate: true })
</script>

<template>
  <component :is="deviceComponent" :device="tenantContextStore.currentDevice" />
</template>

<style lang="scss" scoped></style>
