<script lang="ts" setup>
import AsyncLoading from "@/common/components/AsyncLoading.vue"
import { useTenantContextStore } from "@/pinia/stores/tenantContext"

const pageMap: Record<string, any> = {
  Default: defineAsyncComponent({
    loader: () => import("./DefaultProject.vue"),
    loadingComponent: AsyncLoading
  }),
  NotFound: defineAsyncComponent({
    loader: () => import("./NotFound.vue"),
    loadingComponent: AsyncLoading
  })
}

function getProjectPage(key: string) {
  return pageMap[key] ?? pageMap.Default
}

const tenantContextStore = useTenantContextStore()
const projectComponent = shallowRef()
watch(() => tenantContextStore.currentProject, (project) => {
  if (project) {
    projectComponent.value = getProjectPage(project.extra!.uiProfile!)
  } else if (project === null) {
    projectComponent.value = pageMap.NotFound
  }
}, { immediate: true })
</script>

<template>
  <component :is="projectComponent" :project="tenantContextStore.currentProject" />
</template>

<style lang="scss" scoped></style>
