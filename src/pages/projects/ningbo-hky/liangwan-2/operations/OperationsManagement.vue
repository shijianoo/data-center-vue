<script setup lang="ts">
import type { Component } from "vue"
import { Connection, DataAnalysis, Document, Files, Link, Location, Monitor, Tools } from "@element-plus/icons-vue"
import { computed, defineAsyncComponent, markRaw, ref, shallowRef, watch } from "vue"
import AsyncLoading from "@/common/components/AsyncLoading.vue"
import { useUserStore } from "@/pinia/stores/user"
import SideMenuLayout from "../components/SideMenuLayout.vue"

const userStore = useUserStore()

/** 运维管理菜单使用稳定、非响应式的图标组件引用。 */
interface OperationMenuItem {
  /** 菜单唯一键。 */
  key: string
  /** 菜单名称。 */
  label: string
  /** Element Plus 图标组件。 */
  icon: Component
}

/** 平台管理员专属菜单；对象只创建一次，避免路由激活时动态图标被卸载。 */
const platformAdminMenuItems: OperationMenuItem[] = [
  { key: "parameters", label: "参数管理", icon: markRaw(Files) },
  { key: "stations", label: "站点管理", icon: markRaw(Location) },
  { key: "stationParameters", label: "站点参数配置", icon: markRaw(Connection) }
]

/** 平台运维人员可见菜单。 */
const platformOpsMenuItems: OperationMenuItem[] = [
  { key: "rules", label: "自动审核规则", icon: markRaw(DataAnalysis) },
  { key: "bindings", label: "规则绑定", icon: markRaw(Link) },
  { key: "remoteDebug", label: "远程调试", icon: markRaw(Monitor) },
  { key: "ingestionMessages", label: "原始报文查询", icon: markRaw(Document) }
]

/** 所有有权进入运维管理的用户可见菜单（含普通用户）。 */
const commonMenuItems: OperationMenuItem[] = [
  { key: "maintenance", label: "维护时段", icon: markRaw(Tools) }
]

/**
 * 根据用户角色按权限分级计算可查看菜单列表：
 * 1. isPlatformAdmin：最高权限，展示全部菜单
 * 2. isPlatformOps：次高权限，隐藏 parameters, stations, stationParameters
 * 3. 普通用户：仅展示 maintenance
 */
const menuItems = computed<OperationMenuItem[]>(() => {
  if (userStore.isPlatformAdmin) {
    console.log("当前为平台管理员")
    return [...platformAdminMenuItems, ...platformOpsMenuItems, ...commonMenuItems]
  }
  if (userStore.isPlatformOps) {
    console.log("当前为平台运维")
    return [...platformOpsMenuItems, ...commonMenuItems]
  }
  console.log("当前为平台租户")
  return commonMenuItems
})

const pages = {
  parameters: defineAsyncComponent({ loader: () => import("./ParameterDefinitionManagement.vue"), loadingComponent: AsyncLoading }),
  stations: defineAsyncComponent({ loader: () => import("./StationManagement.vue"), loadingComponent: AsyncLoading }),
  stationParameters: defineAsyncComponent({ loader: () => import("./StationParameterManagement.vue"), loadingComponent: AsyncLoading }),
  rules: defineAsyncComponent({ loader: () => import("./ReviewRuleManagement.vue"), loadingComponent: AsyncLoading }),
  bindings: defineAsyncComponent({ loader: () => import("./ReviewRuleBindingManagement.vue"), loadingComponent: AsyncLoading }),
  maintenance: defineAsyncComponent({ loader: () => import("./MaintenanceManagement.vue"), loadingComponent: AsyncLoading }),
  remoteDebug: defineAsyncComponent({ loader: () => import("./RemoteDebug.vue"), loadingComponent: AsyncLoading }),
  ingestionMessages: defineAsyncComponent({ loader: () => import("./IngestionMessageQuery.vue"), loadingComponent: AsyncLoading })
}

const menu = ref(menuItems.value[0]?.key || "maintenance")
const activePage = shallowRef(pages[menu.value as keyof typeof pages])

watch(menuItems, (items) => {
  // 角色在运行时变化时，立即移出已经不可见的页面。
  if (!items.some(item => item.key === menu.value)) menu.value = items[0]?.key || "maintenance"
}, { immediate: true })
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
