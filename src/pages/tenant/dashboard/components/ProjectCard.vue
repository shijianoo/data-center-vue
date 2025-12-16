<script lang="ts" setup>
defineProps<{
  name: string
  code: string
  status: string
  statusClass?: string
  health: number
  totalDevices: number
  onlineDevices: number
  onlineClass?: string
  lastUpdated: string
}>()
</script>

<template>
  <div class="proj-card">
    <div class="pc-header">
      <div class="pc-title-box">
        <h3>{{ name }}</h3>
        <span class="pc-id">ID: {{ code }}</span>
      </div>
      <div class="pc-status" :class="statusClass">
        {{ status === '告警' ? `${health < 90 ? '2' : '1'} 告警` : '运行正常' }}
      </div>
    </div>
    <div class="pc-body">
      <div class="pc-tags">
        <slot name="tags" />
      </div>
      <div class="pc-metrics">
        <div class="metric-item">
          <div class="metric-label">
            设备总数
          </div>
          <div class="metric-val">
            {{ totalDevices }}
          </div>
        </div>
        <div class="metric-item">
          <div class="metric-label">
            在线数
          </div>
          <div class="metric-val" :class="onlineClass">
            {{ onlineDevices }}
          </div>
        </div>
      </div>
    </div>
    <div class="pc-footer">
      <span><i class="far fa-clock" /> 最近更新: {{ lastUpdated }}</span>
      <span class="link-arrow">进入管理 &rarr;</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.proj-card {
  background: white;
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    border-color: var(--accent);
    box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.05);
  }

  .pc-header {
    padding: 20px;
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    background: #fcfcfc;
    .pc-title-box {
      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 700;
      }
      .pc-id {
        font-family: monospace;
        font-size: 11px;
        color: var(--text-sub);
        margin-top: 4px;
        display: block;
      }
    }
    .pc-status {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 4px;
      background: var(--success-bg);
      color: var(--success);
      border: 1px solid #bbf7d0;
      &.alert {
        background: var(--danger-bg);
        color: var(--danger);
        border-color: #fecaca;
      }
    }
  }

  .pc-body {
    padding: 20px;
    flex: 1;
    .pc-tags {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }
    .pc-metrics {
      display: flex;
      justify-content: space-between;
      .metric-item {
        text-align: left;
        .metric-label {
          font-size: 11px;
          color: var(--text-sub);
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .metric-val {
          font-size: 18px;
          font-weight: 700;
        }
      }
    }
    .pc-progress {
      margin-top: 15px;
      .pg-label {
        display: flex;
        justify-content: space-between;
        font-size: 11px;
        color: var(--text-sub);
        margin-bottom: 5px;
      }
      .pg-track {
        height: 6px;
        background: #f1f5f9;
        border-radius: 3px;
        overflow: hidden;
        .pg-fill {
          height: 100%;
          background: var(--primary);
          &.warn {
            background: var(--warning);
          }
        }
      }
    }
  }

  .pc-footer {
    padding: 12px 20px;
    background: #fcfcfc;
    border-top: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: var(--text-sub);
    .link-arrow {
      color: var(--accent);
    }
  }
}
</style>
