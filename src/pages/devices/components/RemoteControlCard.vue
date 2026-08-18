<script lang="ts" setup>
import type { Device } from "@/common/apis/devices/type"
import { ref } from "vue"
import CustomControlDialog from "./CustomControlDialog.vue"

interface Props {
  device: Device
}

defineProps<Props>()

const showCustomDialog = ref(false)
</script>

<template>
  <div class="card remote-control-card">
    <div class="card-header">
      <span>远程控制</span>
      <el-button
        v-role-enable="['platform_admin', 'platform_ops']"
        type="primary"
        link
        size="small"
        @click="showCustomDialog = true"
      >
        自定义
      </el-button>
    </div>
    <div class="card-body">
      <div class="control-grid">
        <slot />
      </div>
    </div>

    <!-- 自定义指令 Dialog -->
    <CustomControlDialog
      v-model:visible="showCustomDialog"
      :device="device"
    />
  </div>
</template>

<style lang="scss" scoped>
.card {
  background: white;
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-header {
  padding: 16px 20px;
  height: 50px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: 700;
  background: #fcfcfc;
}

.card-body {
  padding: 20px;
}

.control-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
</style>
