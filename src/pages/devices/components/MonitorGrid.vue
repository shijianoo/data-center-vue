<script lang="ts" setup>
export interface MonitorItem {
  label: string
  value: string | number
  unit?: string
}

const props = defineProps<{
  items: MonitorItem[]
}>()
</script>

<template>
  <div class="card monitor-card">
    <div class="card-header">
      实时监测数据
    </div>
    <div class="card-body">
      <div class="monitor-grid">
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

.monitor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
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
