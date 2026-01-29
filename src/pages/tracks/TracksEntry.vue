<script lang="ts" setup>
import { useUserStore } from "@/pinia/stores/user"

const pageMap: Record<string, any> = {
  Default: defineAsyncComponent({
    loader: () => import("./DefaultTracks.vue")
  }),
  NotFound: defineAsyncComponent({
    loader: () => import("./NotFound.vue")
  })
}

const userStore = useUserStore()
const tracksComponent = shallowRef()
watch(() => userStore.activeTenant, (tenant) => {
  if (tenant) {
    tracksComponent.value = pageMap.Default
  } else if (tenant == null) {
    tracksComponent.value = pageMap.NotFound
  }
}, { immediate: true })
</script>

<template>
  <component :is="tracksComponent" :tenant="userStore.activeTenant!" />
</template>

<style lang="scss" scoped></style>
