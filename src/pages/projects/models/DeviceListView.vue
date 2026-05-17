<script lang="ts" setup>
import type { DeviceStatisticsDto } from "@/common/apis/statistics/projects/type"
import DeviceGridView from "./DeviceGridView.vue"
import DeviceTableView from "./DeviceTableView.vue"

const props = defineProps<{
  devices: DeviceStatisticsDto[]
  searchQuery?: string
}>()

const emit = defineEmits<{
  (e: "action", row: DeviceStatisticsDto): void
}>()

type ViewMode = "table" | "grid"

const viewMode = ref<ViewMode>("grid")

const filteredDevices = computed(() => {
  const query = props.searchQuery?.trim().toLowerCase()
  if (!query) return props.devices

  return props.devices.filter((device) => {
    return [
      device.serialNumber,
      device.deviceCode,
      device.displayName,
      device.deviceName
    ].some(value => value?.toLowerCase().includes(query))
  })
})

function handleAction(row: DeviceStatisticsDto) {
  emit("action", row)
}
</script>

<template>
  <div class="device-list-view">
    <div class="view-toolbar">
      <div class="result-count">
        当前显示 <strong>{{ filteredDevices.length }}</strong> 台设备
      </div>

      <div class="view-switch" aria-label="切换设备列表展示方式">
        <button
          type="button"
          class="switch-btn"
          :class="{ active: viewMode === 'grid' }"
          title="网格视图"
          @click="viewMode = 'grid'"
        >
          <i class="fas fa-border-all" />
          <span>网格</span>
        </button>
        <button
          type="button"
          class="switch-btn"
          :class="{ active: viewMode === 'table' }"
          title="表格视图"
          @click="viewMode = 'table'"
        >
          <i class="fas fa-table-list" />
          <span>表格</span>
        </button>
      </div>
    </div>

    <template v-if="filteredDevices.length">
      <DeviceGridView
        v-if="viewMode === 'grid'"
        :devices="filteredDevices"
        @action="handleAction"
      />
      <DeviceTableView
        v-else
        :devices="filteredDevices"
        @action="handleAction"
      />
    </template>

    <div v-else class="empty-result">
      <i class="fas fa-magnifying-glass" />
      <span>没有匹配的设备</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.device-list-view {
  background: white;
}

.view-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 18px;
  border-bottom: 1px solid var(--border);
  background: white;
}

.result-count {
  font-size: 13px;
  color: var(--text-sub);

  strong {
    color: var(--text-main);
    font-weight: 700;
  }
}

.view-switch {
  display: inline-flex;
  align-items: center;
  padding: 3px;
  border-radius: 8px;
  background: #f1f5f9;
  border: 1px solid var(--border);
}

.switch-btn {
  height: 30px;
  padding: 0 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-sub);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 13px;
  transition:
    background 0.15s,
    color 0.15s,
    box-shadow 0.15s;

  &.active {
    background: white;
    color: var(--accent);
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.12);
  }
}

.empty-result {
  padding: 42px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--text-sub);
  font-size: 14px;
  background: #f8fafc;
}

@media (max-width: 768px) {
  .view-toolbar {
    align-items: stretch;
    flex-direction: column;
    padding: 12px;
  }

  .view-switch {
    width: 100%;
  }

  .switch-btn {
    flex: 1;
    justify-content: center;
  }
}
</style>
