<script lang="ts" setup>
import type { DeviceSummary } from "@/common/apis/devices/type"
import { Close, Search } from "@element-plus/icons-vue"
import { computed, ref, watch } from "vue"
import { formatHybridAgo } from "@/common/utils/datetime"

const props = defineProps<{
  devices: DeviceSummary[]
}>()

const emit = defineEmits<{
  (e: "search", devices: DeviceSummary[]): void
}>()

const visible = defineModel<boolean>("visible")

const selectableDevices = ref<{ selected: boolean, device: DeviceSummary }[]>([])
watch(() => props.devices, (newVal) => {
  const sorted = [...newVal].sort((a, b) => {
    // 在线状态：在线（true）优先显示
    if (a.isOnline !== b.isOnline) {
      return a.isOnline ? -1 : 1
    }
    // 上次上传时间：最新上传的排在前面
    const timeA = a.lastUploadTime ? new Date(a.lastUploadTime).getTime() : 0
    const timeB = b.lastUploadTime ? new Date(b.lastUploadTime).getTime() : 0
    return timeB - timeA
  })
  selectableDevices.value = sorted.map((d: DeviceSummary) => ({ selected: false, device: d }))
})

const searchQuery = ref("")

const filteredDevices = computed(() => {
  if (!searchQuery.value) return selectableDevices.value
  const query = searchQuery.value.toLowerCase()
  return selectableDevices.value.filter((item) => {
    const d = item.device
    return (
      (d.serialNumber && d.serialNumber.toLowerCase().includes(query))
      || (d.deviceCode && d.deviceCode.toLowerCase().includes(query))
      || (d.deviceName && d.deviceName.toLowerCase().includes(query))
      || (d.displayName && d.displayName.toLowerCase().includes(query))
    )
  })
})

function closeDrawer() {
  visible.value = false
}

function handleSearch() {
  emit("search", selectableDevices.value.filter(d => d.selected).map(d => d.device))
}
</script>

<template>
  <div class="glass-panel left-drawer" :class="{ open: visible }">
    <div class="drawer-head">
      <div style="display:flex; align-items:center; gap:10px; flex:1;">
        <span style="white-space:nowrap;">在线设备</span>
        <div class="search-wrapper">
          <input
            v-model="searchQuery"
            class="search-input"
            placeholder="搜索设备..."
            @click.stop
          >
          <el-icon class="search-icon">
            <Search />
          </el-icon>
        </div>
      </div>
      <el-icon style="cursor:pointer; opacity:0.6;" @click="closeDrawer">
        <Close />
      </el-icon>
    </div>
    <div class="drawer-body">
      <div v-if="filteredDevices.length === 0" style="text-align:center; color:#555; margin-top:50px; font-size:13px;">
        暂无数据
      </div>
      <ul v-else class="device-list">
        <li v-for="d in filteredDevices" :key="d.device.id" class="device-row">
          <label class="device-label">
            <input type="checkbox" v-model="d.selected" class="device-checkbox">
            <div class="device-info">
              <div class="device-name" :title="d.device.displayName || d.device.deviceName || d.device.serialNumber">
                {{ d.device.displayName || d.device.deviceName || d.device.serialNumber }}
              </div>
              <div class="device-meta">
                <span class="status-dot" :class="{ online: d.device.isOnline }" />
                <span class="status-text">{{ d.device.isOnline ? '在线' : '离线' }}</span>
                <span v-if="d.device.lastUploadTime" class="separator">|</span>
                <span v-if="d.device.lastUploadTime">{{ formatHybridAgo(d.device.lastUploadTime) }}</span>
              </div>
            </div>
          </label>
        </li>
      </ul>
    </div>
    <div style="padding:15px; border-top:1px solid rgba(255,255,255,0.1);">
      <button class="form-input btn-primary" @click="handleSearch">
        查询选中轨迹
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.glass-panel {
  background: var(--bg-glass, rgba(15, 23, 42, 0.85));
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: var(--border-glass, 1px solid rgba(255, 255, 255, 0.1));
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
}

.left-drawer {
  position: absolute;
  top: 70px;
  left: 20px;
  bottom: 30px;
  width: 380px;
  z-index: 200;
  transform: translateX(-120%);
  transition: var(--transition, all 0.3s cubic-bezier(0.4, 0, 0.2, 1));
  display: flex;
  flex-direction: column;
  border-radius: var(--radius, 4px);

  &.open {
    transform: translateX(0);
  }
}

.drawer-head {
  padding: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.device-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.device-row {
  padding: 8px 10px;
  border-radius: var(--radius, 4px);
  cursor: pointer;
  margin-bottom: 2px;
  transition: background-color 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
}

.device-label {
  display: flex;
  align-items: center;
  width: 100%;
  cursor: pointer;
  gap: 10px;
}

.device-checkbox {
  accent-color: var(--accent);
}

.device-info {
  flex: 1;
  min-width: 0;
}

.device-name {
  font-size: 16px;
  color: #e2e8f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.device-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #64748b;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #64748b;
}

.status-dot.online {
  background-color: #10b981;
  box-shadow: 0 0 4px rgba(16, 185, 129, 0.4);
}

.separator {
  opacity: 0.3;
}

.form-input {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  padding: 8px;
  font-size: 14px;
  width: 100%;
  border-radius: var(--radius, 4px);
  box-sizing: border-box;
  outline: none;

  &:focus {
    border-color: var(--accent, #0ea5e9);
  }
}

.btn-primary {
  background: var(--accent, #0ea5e9);
  color: #000;
  border: none;
  font-weight: 600;
  cursor: pointer;
  &:hover {
    background: var(--accent-hover, #38bdf8);
    color: #000;
  }
}

.search-wrapper {
  position: relative;
  flex: 1;
  max-width: 200px;
}

.search-input {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  padding: 5px 24px 5px 8px;
  font-size: 12px;
  width: 100%;
  border-radius: 2px;
  box-sizing: border-box;
  outline: none;
  transition: all 0.2s;

  &:focus {
    background: rgba(0, 0, 0, 0.4);
    border-color: var(--accent, #0ea5e9);
  }
}

.search-icon {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
  pointer-events: none;
}
</style>
