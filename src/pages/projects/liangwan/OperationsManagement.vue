<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from "vue"

const pages = {
  catalogGroups: defineAsyncComponent(() => import("./operations/CatalogGroups.vue")),
  parameters: defineAsyncComponent(() => import("./operations/Parameters.vue")),
  stations: defineAsyncComponent(() => import("./operations/Stations.vue")),
  stationGroups: defineAsyncComponent(() => import("./operations/StationGroups.vue")),
  parameterBindings: defineAsyncComponent(() => import("./operations/ParameterBindings.vue")),
  reviewRules: defineAsyncComponent(() => import("./operations/ReviewRules.vue")),
  ruleBindings: defineAsyncComponent(() => import("./operations/RuleBindings.vue"))
}

type MenuKey = keyof typeof pages
const active = ref<MenuKey>("catalogGroups")
const currentPage = computed(() => pages[active.value])
</script>

<template>
  <div class="operations-workspace">
    <aside class="operations-menu">
      <el-menu :default-active="active" :default-openeds="['global', 'station', 'review']" @select="active = $event as MenuKey">
        <el-sub-menu index="global">
          <template #title>
            <span>全局参数配置</span>
          </template><el-menu-item index="catalogGroups">
            参数目录组
          </el-menu-item><el-menu-item index="parameters">
            参数定义
          </el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="station">
          <template #title>
            <span>站点配置</span>
          </template><el-menu-item index="stations">
            站点档案
          </el-menu-item><el-menu-item index="stationGroups">
            站点参数组
          </el-menu-item><el-menu-item index="parameterBindings">
            站点参数绑定
          </el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="review">
          <template #title>
            <span>自动审核配置</span>
          </template><el-menu-item index="reviewRules">
            全局审核规则
          </el-menu-item><el-menu-item index="ruleBindings">
            站点规则绑定
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </aside>
    <main class="operations-main">
      <component :is="currentPage" />
    </main>
  </div>
</template>

<style scoped lang="scss">
.operations-workspace {
  display: flex;
  height: calc(100vh - var(--header-h));
  background: #f5f7fa;
}
.operations-menu {
  width: 236px;
  flex: none;
  padding: 16px;
  background: #fff;
  border-right: 1px solid #ebeef5;
}
.operations-menu :deep(.el-menu) {
  border-right: 0;
  background: transparent;
}
.operations-menu :deep(.el-sub-menu__title),
.operations-menu :deep(.el-menu-item) {
  height: 44px;
  line-height: 44px;
  margin: 3px 0;
  border-radius: 6px;
}
.operations-menu :deep(.el-menu-item.is-active) {
  color: #fff;
  background: linear-gradient(90deg, #409eff, #67b6ff);
  box-shadow: 0 4px 10px rgba(64, 158, 255, 0.2);
}
.operations-main {
  flex: 1;
  min-width: 0;
  padding: 16px;
  overflow: auto;
}
</style>
