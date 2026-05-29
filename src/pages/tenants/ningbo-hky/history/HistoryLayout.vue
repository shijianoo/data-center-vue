<script lang="ts" setup>
import { useRoute, useRouter } from "vue-router"
import { buoyOptions } from "./buoy/config"
import { shoreOptions } from "./shore/config"

const route = useRoute()
const router = useRouter()

// 菜单高亮使用完整 path，避免浮标/岸基站编号相同或嵌套路由时匹配不准。
// 这里去掉尾部斜杠，是为了兼容浏览器刷新或路由跳转时可能出现的 /xxx/ 写法。
const activePath = computed(() => route.path.replace(/\/+$/, ""))

function go(path: string) {
  // el-menu 和移动端 el-select 都复用这个跳转函数，后续如果要加埋点也只需要改这里。
  router.push(path)
}

function getBuoyPath(key: string) {
  // 历史数据挂在租户路由下，tenantKey 不能写死，否则切换租户后菜单会跳回固定项目。
  return `/console/${route.params.tenantKey}/history-data/buoy/${key}`
}

function getShorePath(key: string) {
  return `/console/${route.params.tenantKey}/history-data/shore/${key}`
}
</script>

<template>
  <div class="history-layout">
    <div class="mobile-history-switch">
      <el-select
        class="mobile-device-select"
        :model-value="activePath"
        filterable
        @change="go"
      >
        <el-option-group label="浮标数据">
          <el-option
            v-for="buoy in buoyOptions"
            :key="buoy.key"
            :label="`${buoy.name} ${buoy.key}`"
            :value="getBuoyPath(buoy.key)"
          >
            <span class="select-name">{{ buoy.name }}</span>
            <span class="select-code">{{ buoy.key }}</span>
          </el-option>
        </el-option-group>

        <el-option-group label="岸基站数据">
          <el-option
            v-for="shore in shoreOptions"
            :key="shore.key"
            :label="`${shore.name} ${shore.key}`"
            :value="getShorePath(shore.key)"
          >
            <span class="select-name">{{ shore.name }}</span>
            <span class="select-code">{{ shore.key }}</span>
          </el-option>
        </el-option-group>
      </el-select>
    </div>

    <aside class="history-aside">
      <el-menu
        class="history-menu"
        :default-openeds="['buoy', 'shore']"
        :default-active="activePath"
        @select="go"
      >
        <el-sub-menu index="buoy">
          <template #title>
            <span>浮标数据</span>
          </template>

          <el-menu-item
            v-for="buoy in buoyOptions"
            :key="buoy.key"
            :index="getBuoyPath(buoy.key)"
          >
            <span class="menu-name">{{ buoy.name }}</span>
            <span class="menu-code">{{ buoy.key }}</span>
          </el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="shore">
          <template #title>
            <span>岸基站数据</span>
          </template>

          <el-menu-item
            v-for="shore in shoreOptions"
            :key="shore.key"
            :index="getShorePath(shore.key)"
          >
            <span class="menu-name">{{ shore.name }}</span>
            <span class="menu-code">{{ shore.key }}</span>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </aside>

    <main class="history-main">
      <router-view />
    </main>
  </div>
</template>

<style lang="scss" scoped>
.history-layout {
  display: flex;
  height: calc(100vh - var(--header-h));
  min-height: 0;
  background: #f5f7fa;
}

.history-aside {
  width: 270px;
  height: 100%;
  min-height: 0;
  flex-shrink: 0;
  overflow: hidden;
  border-right: 1px solid #e5e7eb;
  background: #fff;
}

.history-menu {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  border-right: none;
}

.mobile-history-switch {
  display: none;
}

.mobile-device-select {
  width: 100%;
}

.select-name {
  font-weight: 600;
  color: #1f2937;
}

.select-code {
  margin-left: 8px;
  color: #94a3b8;
  font-size: 12px;
}

:deep(.el-menu-item) {
  display: flex;
  align-items: center;
}

:deep(.el-menu-item.is-active) {
  background: #eff6ff;
}

:deep(.el-menu-item.is-active .menu-name) {
  color: #1d4ed8;
}

:deep(.el-menu-item.is-active .menu-code) {
  color: #3b82f6;
}

.menu-code {
  margin-left: 8px;
  font-size: 12px;
  font-weight: 500;
  color: #94a3b8;
}

.menu-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
  color: #1f2937;
}

.history-main {
  flex: 1;
  min-width: 0;
  min-height: 0;
}

@media (max-width: 768px) {
  .history-layout {
    flex-direction: column;
  }

  .mobile-history-switch {
    display: block;
    flex-shrink: 0;
    padding: 10px 12px;
    background: #fff;
    border-bottom: 1px solid #e5e7eb;
    box-sizing: border-box;
  }

  .history-aside {
    display: none;
  }

  .history-main {
    height: calc(100vh - var(--header-h) - 53px);
    flex: none;
  }
}
</style>
