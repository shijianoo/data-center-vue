<script lang="ts" setup>
import type { DeviceStatisticsDto } from "@/common/apis/statistics/projects/type"
import { formatHybridAgo } from "@/common/utils/datetime"

defineProps<{
  devices: DeviceStatisticsDto[]
}>()

const emit = defineEmits<{
  (e: "action", row: DeviceStatisticsDto): void
}>()

function getStatusClass(status: boolean) {
  return status ? "sb-green" : "sb-red"
}

function getStatusText(status: boolean) {
  return status ? "正常" : "离线"
}

function getDeviceName(device: DeviceStatisticsDto) {
  const name = device.displayName ?? device.deviceName
  return name ? `${name} | ${device.serialNumber}` : device.serialNumber
}
</script>

<template>
  <div class="table-container">
    <table class="custom-table">
      <thead>
        <tr>
          <th width="25%">
            设备名称 / SN
          </th>
          <th width="10%">
            状态
          </th>
          <th width="10%">
            上报周期
          </th>
          <th width="20%">
            最后上报
          </th>
          <th width="20%">
            备注
          </th>
          <th width="10%">
            操作
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in devices"
          :key="row.id || row.deviceCode"
          :class="{ 'bg-danger-light': row.isOnline === false }"
          @click="emit('action', row)"
        >
          <td class="device-name">
            <div style="font-weight: 600; color: var(--text-main);">
              {{ getDeviceName(row) }}
            </div>
            <div style="font-size: 12px; color: var(--text-sub);">
              ID: {{ row.deviceCode }}
            </div>
          </td>
          <td>
            <span class="status-badge" :class="getStatusClass(row.isOnline)">
              <span class="dot" /> {{ getStatusText(row.isOnline) }}
            </span>
          </td>
          <td>{{ row.uploadInterval }}</td>
          <td>
            {{ formatHybridAgo(row.lastUploadTime) }}
          </td>
          <td>{{ row.description }}</td>
          <td><a class="link-primary">详情</a></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style lang="scss" scoped>
.table-container {
  width: 100%;
  overflow-x: auto;
}

.custom-table {
  width: 100%;
  border-collapse: collapse;
  th {
    text-align: left;
    padding: 12px 24px;
    height: 40px;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-sub);
    background: white;
    border-bottom: 1px solid var(--border);
    white-space: nowrap;
  }
  td {
    padding: 16px 24px;
    font-size: 14px;
    border-bottom: 1px solid var(--border);
    vertical-align: middle;
    white-space: nowrap;
  }
  tr {
    background: white;
    cursor: pointer;
    &.bg-danger-light {
      background: var(--danger-bg);
    }
  }
  tr:last-child td {
    border-bottom: none;
  }
  tr:hover td {
    background: #f8fafc;
  }
}

.device-name {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
  &.sb-green {
    background: var(--success-bg);
    color: var(--success);
  }
  &.sb-red {
    background: var(--danger-bg);
    color: var(--danger);
  }
  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }
}

.link-primary {
  color: var(--accent);
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
}
</style>
