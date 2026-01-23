<script lang="ts" setup>
import { useTenantContextStore } from "@/pinia/stores/tenantContext"

const pageMap: Record<string, any> = {
  Default: defineAsyncComponent(() => import("./DefaultProject.vue")),
  NotFound: defineAsyncComponent(() => import("./NotFound.vue"))
}

function getProjectPage(key: string) {
  return pageMap[key] ?? pageMap.Default
}

const tenantContextStore = useTenantContextStore()
const projectComponent = shallowRef()
watch(() => tenantContextStore.currentProject, (project) => {
  if (project) {
    projectComponent.value = getProjectPage(project.extra!.uiProfile!)
  } else {
    projectComponent.value = pageMap.NotFound
  }
}, { immediate: true })
</script>

<template>
  <component :is="projectComponent" :project="tenantContextStore.currentProject" />
</template>

<style lang="scss" scoped></style>
