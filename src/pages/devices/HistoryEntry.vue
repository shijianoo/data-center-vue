<script lang="ts" setup>
import { defineAsyncComponent } from "vue"
import { useTenantContextStore } from "@/pinia/stores/tenantContext"

const pageMap: Record<string, any> = {
  SOB23BS: defineAsyncComponent(() => import("./sob23bs/History.vue")),
  NotFound: defineAsyncComponent(() => import("./NotFound.vue"))
}

function getHistoryPage(modelCode: string) {
  return pageMap[modelCode] ?? pageMap.NotFound
}

const tenantContextStore = useTenantContextStore()
const deviceComponent = shallowRef()
watch(() => tenantContextStore.currentDevice, (device) => {
  if (device) {
    deviceComponent.value = getHistoryPage(device.modelNumber!)
  } else {
    deviceComponent.value = pageMap.NotFound
  }
}, { immediate: true })
</script>

<template>
  <component :is="deviceComponent" :device="tenantContextStore.currentDevice" />
</template>

<style lang="scss" scoped></style>
