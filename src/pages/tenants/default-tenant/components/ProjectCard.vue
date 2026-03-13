<script lang="ts" setup>
import type { ProjectWithStats } from "@/common/apis/statistics/tenants/type"
import { formatHybridAgo } from "@/common/utils/datetime"
import { getProjectStatusName } from "@/common/utils/project-constants"

const props = defineProps<ProjectWithStats>()
</script>

<template>
  <div class="proj-card">
    <div class="pc-header">
      <div class="pc-title-box">
        <h3>{{ props.name }}</h3>
        <span title="项目编号" class="pc-id">{{ props.projectCode }}</span>
      </div>
      <div class="pc-status">
        {{ getProjectStatusName(props.status) }}
      </div>
    </div>
    <div class="pc-body">
      <div class="pc-tags">
        <span class="pc-tag" :key="index" v-for="(value, index) in props.extra?.tags"> {{ value }}</span>
      </div>
      <div class="pc-metrics">
        <div class="metric-item">
          <div class="metric-label">
            设备总数
          </div>
          <div class="metric-val">
            {{ props.totalDeviceCount }}
          </div>
        </div>
        <div class="metric-item">
          <div class="metric-label">
            在线数
          </div>
          <div class="metric-val">
            {{ props.onlineDeviceCount }}
          </div>
        </div>
      </div>
    </div>
    <div class="pc-footer">
      <div>
        <span v-if="props.latestUploadTime"><i class="far fa-clock" /> 最近更新: {{ formatHybridAgo(props.latestUploadTime) }}</span>
      </div>
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
        font-size: 12px;
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

      .pc-tag {
        font-size: 11px;
        padding: 4px 8px;
        background: #f8fafc;
        border-radius: 4px;
        color: var(--text-sub);
        border: 1px solid var(--border);
        display: flex;
        align-items: center;
        gap: 5px;
        i {
          color: var(--text-sub);
        }
      }
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
