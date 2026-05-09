<script lang="ts" setup>
import type { ProjectWithStats } from "@/common/apis/statistics/tenants/type"
import { formatHybridAgo } from "@/common/utils/datetime"
import { getProjectStatusName } from "@/common/utils/project-constants"

const props = defineProps<ProjectWithStats>()

const hasDevices = computed(() => props.totalDeviceCount > 0)

/** 在线率百分比（0~100） */
const onlineRate = computed(() => {
  if (!hasDevices.value) return 0
  return Math.round((props.onlineDeviceCount / props.totalDeviceCount) * 100)
})

/** 进度条颜色：在线率低于 50% 显示警告色 */
const rateClass = computed(() => onlineRate.value < 50 ? "warn" : "")

/** 格式化日期（只取年月日） */
function fmtDate(s?: string) {
  if (!s) return ""
  return s.slice(0, 10)
}
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
      <!-- Tags（始终显示，有则显示） -->
      <div v-if="props.extra?.tags?.length" class="pc-tags">
        <span v-for="(value, index) in props.extra.tags" :key="index" class="pc-tag">{{ value }}</span>
      </div>

      <!-- 有设备：显示统计数字 + 在线率进度条 -->
      <template v-if="hasDevices">
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
              在线
            </div>
            <div class="metric-val online">
              {{ props.onlineDeviceCount }}
            </div>
          </div>
          <div class="metric-item">
            <div class="metric-label">
              在线率
            </div>
            <div class="metric-val" :class="rateClass">
              {{ onlineRate }}%
            </div>
          </div>
        </div>
        <div class="pc-progress">
          <div class="pg-track">
            <div class="pg-fill" :class="rateClass" :style="{ width: `${onlineRate}%` }" />
          </div>
        </div>
      </template>

      <!-- 无设备：显示项目基础信息（描述 / 地址 / 日期） -->
      <template v-else>
        <div class="pc-info-list">
          <div v-if="props.description" class="info-row desc">
            <span class="info-text" :title="props.description">{{ props.description }}</span>
          </div>
          <div v-if="props.address" class="info-row">
            <span class="info-text" :title="props.address">地址：{{ props.address }}</span>
          </div>
          <div v-if="props.startDate" class="info-row">
            <span class="info-text">
              {{ fmtDate(props.startDate) }}
              <template v-if="props.endDate"> — {{ fmtDate(props.endDate) }}</template>
            </span>
          </div>
          <!-- 无任何信息时的占位 -->
          <div v-if="!props.description && !props.address && !props.startDate" class="info-empty">
            暂无设备数据
          </div>
        </div>
      </template>
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
      margin-bottom: 16px;
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
      }
    }

    .pc-metrics {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      .metric-item {
        text-align: left;
        .metric-label {
          font-size: 11px;
          color: var(--text-sub);
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .metric-val {
          font-size: 20px;
          font-weight: 700;
          &.online {
            color: var(--success);
          }
          &.warn {
            color: var(--warning);
          }
        }
      }
    }

    .pc-progress {
      margin-top: 12px;
      .pg-track {
        height: 5px;
        background: #f1f5f9;
        border-radius: 3px;
        overflow: hidden;
        .pg-fill {
          height: 100%;
          background: var(--success);
          border-radius: 3px;
          transition: width 0.4s ease;
          &.warn {
            background: var(--warning);
          }
        }
      }
    }

    .pc-info-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      .info-row {
        .info-text {
          font-size: 13px;
          color: var(--text-sub);
          line-height: 1.6;
          overflow: hidden;
        }
      }
      .info-empty {
        font-size: 13px;
        color: #c0c4cc;
        font-style: italic;
        padding: 8px 0;
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
    .no-device-hint {
      color: #c0c4cc;
      font-style: italic;
    }
    .link-arrow {
      color: var(--accent);
    }
  }
}
</style>
