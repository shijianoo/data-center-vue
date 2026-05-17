<script lang="ts" setup>
import type { DeviceStatisticsDto } from "@/common/apis/statistics/projects/type"
import { formatHybridAgo } from "@/common/utils/datetime"

defineProps<{
  devices: DeviceStatisticsDto[]
}>()

const emit = defineEmits<{
  (e: "action", row: DeviceStatisticsDto): void
}>()

function getDeviceName(device: DeviceStatisticsDto) {
  return device.displayName || device.deviceName || device.serialNumber
}
</script>

<template>
  <div class="device-grid">
    <article
      v-for="device in devices"
      :key="device.id || device.deviceCode"
      class="device-card"
      :class="{ offline: !device.isOnline }"
      @click="emit('action', device)"
    >
      <div class="dc-header">
        <div class="dc-title-box">
          <h4 :title="getDeviceName(device)">
            {{ getDeviceName(device) }}
          </h4>
          <span class="dc-id" :title="device.serialNumber">SN: {{ device.serialNumber }}</span>
        </div>
        <div class="dc-status" :class="{ offline: !device.isOnline }">
          <span class="status-dot" />
          {{ device.isOnline ? "在线" : "离线" }}
        </div>
      </div>

      <div class="dc-body">
        <div class="dc-metrics">
          <div class="metric-item">
            <div class="metric-label">
              上报周期
            </div>
            <div class="metric-val">
              {{ device.uploadInterval || "-" }}
            </div>
          </div>
          <div class="metric-item">
            <div class="metric-label">
              最后上报
            </div>
            <div class="metric-val time">
              {{ formatHybridAgo(device.lastUploadTime) }}
            </div>
          </div>
        </div>

        <div class="dc-desc" :class="{ empty: !device.description }" :title="device.description || ''">
          {{ device.description || "暂无备注" }}
        </div>
      </div>

      <div class="dc-footer">
        <span class="device-code" :title="device.deviceCode">ID: {{ device.deviceCode }}</span>
        <span class="link-arrow">查看详情 &rarr;</span>
      </div>
    </article>
  </div>
</template>

<style lang="scss" scoped>
.device-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  padding: 18px;
  background: #f8fafc;
}

.device-card {
  background: white;
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  min-width: 0;
  transition:
    border-color 0.2s,
    box-shadow 0.2s,
    transform 0.2s;

  &:hover {
    border-color: var(--accent);
    box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
  }

  &.offline {
    border-color: #fecaca;
  }
}

.dc-header {
  padding: 18px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  background: #fcfcfc;
}

.dc-title-box {
  min-width: 0;

  h4 {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: var(--text-main);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dc-id {
    font-size: 12px;
    color: var(--text-sub);
    margin-top: 4px;
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.dc-status {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 4px;
  background: var(--success-bg);
  color: var(--success);
  border: 1px solid #bbf7d0;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;

  &.offline {
    background: var(--danger-bg);
    color: var(--danger);
    border-color: #fecaca;
  }
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.dc-body {
  padding: 18px;
  flex: 1;
}

.dc-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.metric-item {
  min-width: 0;

  .metric-label {
    font-size: 11px;
    color: var(--text-sub);
    text-transform: uppercase;
    margin-bottom: 4px;
  }

  .metric-val {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-main);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &.time {
      font-size: 13px;
    }
  }
}

.dc-desc {
  margin-top: 14px;
  min-height: 38px;
  font-size: 13px;
  color: var(--text-sub);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;

  &.empty {
    color: #c0c4cc;
    font-style: italic;
  }
}

.dc-footer {
  padding: 12px 18px;
  background: #fcfcfc;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: var(--text-sub);
}

.device-code {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.link-arrow {
  color: var(--accent);
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .device-grid {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 12px;
  }

  .dc-header,
  .dc-body {
    padding: 14px;
  }

  .dc-footer {
    padding: 12px 14px;
  }
}

@media (min-width: 1180px) {
  .device-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
