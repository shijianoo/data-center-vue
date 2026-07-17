<script setup lang="ts">
import { Link, Refresh } from "@element-plus/icons-vue"
import { ref } from "vue"
import { getTcpGatewayUrl } from "../apis"

/** TCP Gateway 调试页面与 EcoCenter API 使用同一个服务端根地址。 */
const gatewayUrl = getTcpGatewayUrl()
const frameKey = ref(0)

/** 通过重建 iframe 刷新外部调试页面及其连接状态。 */
function refreshFrame() {
  frameKey.value++
}

/** 浏览器禁止 iframe 时，可在新标签页直接打开同一调试地址。 */
function openInNewWindow() {
  window.open(gatewayUrl, "_blank", "noopener,noreferrer")
}
</script>

<template>
  <section class="remote-debug-page">
    <header class="remote-debug-toolbar">
      <div>
        <strong>远程调试</strong>
        <span>{{ gatewayUrl }}</span>
      </div>
      <el-space>
        <el-button :icon="Refresh" @click="refreshFrame">
          刷新
        </el-button>
        <el-button :icon="Link" @click="openInNewWindow">
          新窗口打开
        </el-button>
      </el-space>
    </header>
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
