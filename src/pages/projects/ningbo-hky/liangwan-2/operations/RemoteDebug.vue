<script setup lang="ts">
import { ref } from "vue"
import { getTcpGatewayUrl } from "../apis"

/** TCP Gateway 调试页面与 EcoCenter API 使用同一个服务端根地址。 */
const gatewayUrl = getTcpGatewayUrl()
const frameKey = ref(0)
</script>

<template>
  <section class="remote-debug-page">
    <iframe
      :key="frameKey"
      :src="gatewayUrl"
      class="remote-debug-frame"
      title="TCP Gateway 远程调试"
    />
  </section>
</template>

<style scoped lang="scss">
.remote-debug-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.remote-debug-toolbar {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  min-height: 40px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color-light);

  strong,
  span {
    display: block;
  }

  span {
    margin-top: 3px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }
}

.remote-debug-frame {
  flex: 1;
  width: 100%;
  min-height: 0;
  border: 0;
}
</style>
