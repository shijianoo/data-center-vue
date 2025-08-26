<script setup lang="ts">
import { defineEmits, ref } from "vue"

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
  { name: "所有", code: "" },
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
  <div class="channel-dropdown-wrapper">
    <el-dropdown
      trigger="click"
      split-button
      type="primary"
      @click="handleButtonClick"
      @command="handleChannelSelect"
    >
      查询{{ getChannelName(selectedChannel) }}
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
  </div>
</template>

<style scoped>

</style>
