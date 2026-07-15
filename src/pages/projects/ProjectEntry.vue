<script lang="ts" setup>
import type { Component } from "vue"
import AsyncLoading from "@/common/components/AsyncLoading.vue"
import { useTenantContextStore } from "@/pinia/stores/tenantContext"

/** 项目定制页由 Manifest 处理；Entry 只需在通用页面和实体不存在页面之间切换。 */
const pageMap: Record<"Default" | "NotFound", Component> = {
  Default: defineAsyncComponent({
    loader: () => import("./DefaultProject.vue"),
    loadingComponent: AsyncLoading
  }),
  NotFound: defineAsyncComponent({
    loader: () => import("./NotFound.vue"),
    loadingComponent: AsyncLoading
  })
}

const tenantContextStore = useTenantContextStore()
const projectComponent = shallowRef<Component>()
watch(() => tenantContextStore.currentProject, (project) => {
  if (project) {
    // 项目级定制由 Manifest 精确路由处理；这里仅渲染标准项目页。
    projectComponent.value = pageMap.Default
  } else if (project === null) {
    projectComponent.value = pageMap.NotFound
  }
}, { immediate: true })
</script>

<template>
  <component :is="projectComponent" :project="tenantContextStore.currentProject" />
</template>

<style lang="scss" scoped></style>
