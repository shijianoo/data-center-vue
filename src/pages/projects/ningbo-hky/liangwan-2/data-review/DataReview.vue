<script setup lang="ts">
import { CircleCheck, DataLine } from "@element-plus/icons-vue"
import { computed, defineAsyncComponent, ref } from "vue"
import AsyncLoading from "@/common/components/AsyncLoading.vue"
import SideMenuLayout from "../components/SideMenuLayout.vue"

const menu = ref("level1")
const menuItems = [
  { key: "level1", label: "一级审核", icon: CircleCheck },
  { key: "level2", label: "二级审核", icon: CircleCheck },
  { key: "level3", label: "三级审核", icon: CircleCheck },
  { key: "progress", label: "审核进度", icon: DataLine }
]

const AuditWorkspace = defineAsyncComponent({ loader: () => import("./AuditWorkspace.vue"), loadingComponent: AsyncLoading })
const ReviewProgressView = defineAsyncComponent({ loader: () => import("./ReviewProgressView.vue"), loadingComponent: AsyncLoading })
const currentLevel = computed(() => Number(menu.value.replace("level", "")) as 1 | 2 | 3)
</script>

<template>
  <SideMenuLayout v-model="menu" :items="menuItems">
    <KeepAlive>
      <ReviewProgressView v-if="menu === 'progress'" key="progress" />
      <AuditWorkspace v-else :key="menu" :level="currentLevel" />
    </KeepAlive>
  </SideMenuLayout>
</template>
