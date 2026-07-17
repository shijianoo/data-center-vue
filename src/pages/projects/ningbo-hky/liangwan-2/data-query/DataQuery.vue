<script setup lang="ts">
import { DataAnalysis, List } from "@element-plus/icons-vue"
import { defineAsyncComponent, ref, shallowRef, watch } from "vue"
import AsyncLoading from "@/common/components/AsyncLoading.vue"
import SideMenuLayout from "../components/SideMenuLayout.vue"

const menu = ref("list")
const menuItems = [
  { key: "list", label: "数据列表", icon: List },
  { key: "chart", label: "历史曲线", icon: DataAnalysis }
]

/** 数据查询内部页面使用异步组件，避免首屏同时加载 ECharts 与大表格。 */
const pages = {
  list: defineAsyncComponent({ loader: () => import("./DataListView.vue"), loadingComponent: AsyncLoading }),
  chart: defineAsyncComponent({ loader: () => import("./DataChartView.vue"), loadingComponent: AsyncLoading })
}
const activePage = shallowRef(pages.list)
watch(menu, (value) => {
  activePage.value = pages[value as keyof typeof pages]
})
</script>

<template>
  <SideMenuLayout v-model="menu" :items="menuItems">
    <KeepAlive>
      <component :is="activePage" :key="menu" />
    </KeepAlive>
  </SideMenuLayout>
</template>
