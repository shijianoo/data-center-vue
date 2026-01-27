<script lang="ts" setup>
import { Loading } from "@element-plus/icons-vue"
</script>

<template>
  <div class="loading-container">
    <el-icon class="is-loading" size="30">
      <Loading />
    </el-icon>
    <span class="loading-text">加载中...</span>
  </div>
</template>

<style lang="scss" scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  min-height: 200px;
  color: var(--el-text-color-secondary);

  .el-icon {
    margin-bottom: 10px;
    color: var(--el-color-primary);
  }

  .loading-text {
    font-size: 14px;
  }
}
</style>
