<script setup lang="ts">
import { ref } from "vue"

interface Channel {
  name: string
  code: string
}

interface Emits {
  (e: "click"): void
}

const emit = defineEmits<Emits>()

// 内置通道列表
const channels = ref<Channel[]>([
  { name: "全部", code: "" },
  { name: "4G", code: "1" },
  { name: "北斗", code: "2" }
])

const selectedChannel = defineModel<string | undefined>("modelValue", {
  default: () => ""
})

function handleChannelSelect(channel: Channel) {
  selectedChannel.value = channel.code
}

function handleButtonClick() {
  emit("click")
}

// 根据 code 获取对应的通道名称
function getChannelName(code: string | undefined) {
  const channel = channels.value.find(c => c.code === code)
  return channel ? channel.name : "所有"
}
</script>

<template>
  <el-button-group>
    <el-button type="primary" @click="handleButtonClick">
      查询{{ getChannelName(selectedChannel) }}通道
    </el-button>
    <el-dropdown trigger="click" @command="handleChannelSelect">
      <el-button type="primary">
        <el-icon>
          <arrow-down />
        </el-icon>
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item
            v-for="channel in channels"
            :key="channel.code || 'all'"
            :command="channel"
          >
            {{ channel.name }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </el-button-group>
</template>

<style scoped>
@media (max-width: 628px) {
  /* el-button-group 在移动端占据整行 */
  .el-button-group {
    width: 100% !important;
    display: flex !important;
  }

  /* el-button-group 内的 el-button 占据剩余空间 */
  .el-button-group .el-button:not(.el-dropdown__caret-button) {
    flex: 1 !important;
  }

  /* el-dropdown 的按钮保持固定宽度 */
  .el-button-group .el-dropdown .el-button {
    flex: none !important;
    width: auto !important;
    min-width: 32px !important;
  }
}
</style>
