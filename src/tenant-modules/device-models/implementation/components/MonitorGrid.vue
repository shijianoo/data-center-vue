<script lang="ts" setup>
import type { Device } from "@/common/apis/devices/type"

export interface MonitorItem {
  label: string
  value: string | number
  unit?: string
}

const props = defineProps<{
  device: Device
  items: MonitorItem[]
}>()
</script>

<template>
  <div class="card monitor-card">
    <div class="card-header">
      <div class="title">
        实时监测数据
      </div>
      <div class="extra-info" v-if="props.device?.samplingInterval">
        <div class="interval-tag">
          <i class="fas fa-clock" />
          采样间隔: {{ props.device.samplingInterval }} 分
        </div>
      </div>
    </div>
    <div class="card-body">
      <div class="monitor-grid">
        <div v-if="props.items.length === 0" class="no-data">
          无数据
        </div>
        <div v-for="(item, index) in props.items" :key="index" class="monitor-item">
          <div class="monitor-label">
            {{ item.label }}
          </div>
          <div class="monitor-val">
            {{ item.value }} <span v-if="item.unit" class="monitor-unit">{{ item.unit }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.monitor-card {
  background: white;
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 24px;

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
}

.interval-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #64748b;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 2px 10px;
  font-weight: normal;
}

.monitor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
}

.no-data {
  text-align: center;
  color: var(--text-sub);
  font-size: 13px;
}

.monitor-item {
  background: #f8fafc;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.monitor-label {
  font-size: 11px;
  color: var(--text-sub);
  margin-bottom: 5px;
  text-transform: uppercase;
}

.monitor-val {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-main);
}

.monitor-unit {
  font-size: 12px;
  color: var(--text-sub);
  margin-left: 2px;
  font-weight: 400;
}
</style>
