<script lang="ts" setup>
import type { RouteRecordRaw } from "vue-router"

defineOptions({ name: "NavMenuItems" })

const props = defineProps<{
  /** 当前层级的路由列表 */
  items: RouteRecordRaw[]
  /** 当前层级的绝对路径前缀，如 /console/abc 或 /console/abc/settings */
  basePath: string
}>()

/** 拼接绝对路径 */
function resolvePath(routePath: string, base: string) {
  if (!routePath) return base
  return `${base}/${routePath}`.replace(/\/+/g, "/")
}

/** 过滤不可见子菜单 */
function visibleChildren(item: RouteRecordRaw): RouteRecordRaw[] {
  return item.children?.filter(c => !c.meta?.hidden) ?? []
}

/** 过滤当前层级可见项 */
const visibleItems = computed(() => props.items.filter(r => !r.meta?.hidden))
</script>

<template>
  <template v-for="item in visibleItems" :key="item.path">
    <!-- 有可见子菜单 → el-sub-menu -->
    <el-sub-menu
      v-if="visibleChildren(item).length"
      :index="resolvePath(item.path, basePath)"
    >
      <template #title>
        <SvgIcon v-if="item.meta?.svgIcon" :name="item.meta.svgIcon" class="menu-icon svg-icon" />
        <component v-else-if="item.meta?.elIcon" :is="item.meta.elIcon" class="menu-icon" />
        <span>{{ item.meta?.title }}</span>
      </template>

      <!-- 递归渲染子项 -->
      <NavMenuItems
        :items="visibleChildren(item)"
        :base-path="resolvePath(item.path, basePath)"
      />
    </el-sub-menu>

    <!-- 叶子节点 → el-menu-item -->
    <el-menu-item
      v-else
      :index="resolvePath(item.path, basePath)"
    >
      <SvgIcon v-if="item.meta?.svgIcon" :name="item.meta.svgIcon" class="menu-icon svg-icon" />
      <component v-else-if="item.meta?.elIcon" :is="item.meta.elIcon" class="menu-icon" />
      <template #title>
        {{ item.meta?.title }}
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
