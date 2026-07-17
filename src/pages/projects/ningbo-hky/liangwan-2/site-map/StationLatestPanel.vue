<script setup lang="ts">
import type { LatestParameterMeta, MeasurementPoint, Station, StationLatestMeasurements } from "../types"
import { Close, Location } from "@element-plus/icons-vue"
import { autoReviewLabels, autoReviewTagType, displayParameterLabel, displayTime } from "../utils"
import MiniHistoryChart from "./MiniHistoryChart.vue"

defineProps<{
  /** 当前选中的站点。 */
  station: Station
  /** 站点全部最新参数数据。 */
  latest?: StationLatestMeasurements
  /** 最新数据加载状态。 */
  loading: boolean
  /** 参数编码对应的最近 24 小时数值序列。 */
  histories?: Record<string, Array<[string, number]>>
  /** 历史曲线加载状态。 */
  historyLoading?: boolean
}>()

defineEmits<{ close: [] }>()

/** 最新值按参数小数位配置显示，0 表示保留后端完整文本。 */
function displayLatestValue(parameter: LatestParameterMeta, point: MeasurementPoint | null) {
  if (!point) return "—"
  if (parameter.decimalPlaces > 0 && Number.isFinite(point.effectiveNumericValue)) {
    return Number(point.effectiveNumericValue).toFixed(parameter.decimalPlaces)
  }
  return point.effectiveValueText ?? point.effectiveNumericValue?.toString() ?? "—"
}
</script>

<template>
  <section class="latest-panel">
    <header class="latest-panel__header">
      <div>
        <h3>{{ station.name }}</h3>
        <span>{{ station.mn }} · {{ station.groupName || '未分组' }}</span>
      </div>
      <el-button text circle :icon="Close" aria-label="关闭站点详情" @click="$emit('close')" />
    </header>

    <div class="latest-panel__meta">
      <el-icon><Location /></el-icon>
      <span>{{ station.address || '暂无站点地址' }}</span>
      <el-tag size="small" :type="station.status === 'Active' ? 'success' : 'info'">
        {{ station.status }}
      </el-tag>
    </div>

    <el-skeleton v-if="loading" :rows="8" animated class="latest-panel__loading" />
    <el-scrollbar v-else class="latest-panel__body">
      <el-empty v-if="!latest?.parameters.length" description="该站点暂无参数数据" />
      <article v-for="item in latest?.parameters" v-else :key="`${item.parameter.groupId}:${item.parameter.code}:${item.parameter.kind}`" class="parameter-card">
        <div class="parameter-card__meta">
          <strong>{{ displayParameterLabel(item.parameter) }}</strong>
          <small>{{ item.parameter.code }} · {{ item.parameter.groupName || '未分组' }}</small>
        </div>
        <div class="parameter-card__value">
          <b>{{ displayLatestValue(item.parameter, item.point) }}</b>
        </div>
        <MiniHistoryChart :points="histories?.[`${item.parameter.groupId}:${item.parameter.code}`]" :loading="historyLoading" />
        <div class="parameter-card__latest">
          <span :title="displayTime(item.point?.observedAt)">{{ displayTime(item.point?.observedAt) }}</span>
          <el-tag v-if="item.point" size="small" :type="autoReviewTagType(item.point.autoReviewStatus)">
            {{ autoReviewLabels[item.point.autoReviewStatus] || item.point.autoReviewStatus }}
          </el-tag>
          <el-tag v-else size="small" type="info">
            无数据
          </el-tag>
        </div>
      </article>
    </el-scrollbar>
  </section>
</template>

<style scoped lang="scss">
.latest-panel {
  position: absolute;
  top: 16px;
  right: 16px;
  bottom: 16px;
  z-index: 12;
  display: flex;
  flex-direction: column;
  width: min(640px, calc(100vw - 32px));
  color: #e5eef9;
  background: rgba(8, 20, 39, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 0;
  box-shadow: none;
  backdrop-filter: blur(14px);
}

.latest-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 18px 18px 12px;

  h3 {
    margin: 0 0 4px;
    font-size: 20px;
  }
  span {
    color: #94a3b8;
    font-size: 12px;
  }
  :deep(.el-button) {
    color: #cbd5e1;
  }
}

.latest-panel__meta {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0 18px 14px;
  color: #a8b8cc;
  font-size: 13px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.16);

  > span {
    flex: 1;
  }
}

.latest-panel__loading {
  padding: 18px;
}
.latest-panel__body {
  flex: 1;
  padding: 12px;
}

.parameter-card {
  display: grid;
  grid-template-columns: minmax(125px, 1fr) 90px minmax(150px, 1.25fr) 142px;
  gap: 12px;
  align-items: center;
  padding: 12px 6px;
  margin-bottom: 0;
  background: transparent;
  border: 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 0;
}

.parameter-card__meta {
  min-width: 0;

  strong,
  small {
    display: block;
  }
  small {
    margin-top: 4px;
    overflow: hidden;
    color: #8294aa;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.parameter-card__value {
  overflow: hidden;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;

  b {
    color: #60a5fa;
    font-size: 19px;
  }
}

.parameter-card__latest {
  min-width: 0;
  color: #7f92a9;
  font-size: 11px;

  > span {
    display: block;
    margin-bottom: 5px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
