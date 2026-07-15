<script lang="ts" setup>
import type { NavigationItem } from "@/framework/tenant-console/types"

defineOptions({ name: "NavMenuItems" })

const props = defineProps<{
  items: NavigationItem[]
}>()

const visibleItems = computed(() => props.items.filter(item => !item.hidden))

function visibleChildren(item: NavigationItem) {
  return item.children?.filter(child => !child.hidden) ?? []
}
</script>

<template>
  <template v-for="item in visibleItems" :key="item.id">
    <el-sub-menu
      v-if="visibleChildren(item).length"
      :index="item.href"
    >
      <template #title>
        <SvgIcon v-if="item.icon" :name="item.icon" class="menu-icon svg-icon" />
        <span>{{ item.label }}</span>
      </template>

      <NavMenuItems :items="visibleChildren(item)" />
    </el-sub-menu>

    <el-menu-item
      v-else
      :index="item.href"
    >
      <SvgIcon v-if="item.icon" :name="item.icon" class="menu-icon svg-icon" />
      <template #title>
        {{ item.label }}
      </template>
    </el-menu-item>
  </template>
</template>

<style scoped>
.menu-icon {
  margin-right: 8px;
  font-size: 15px;
  flex-shrink: 0;
}
.svg-icon {
  width: 1em;
  height: 1em;
}
</style>
