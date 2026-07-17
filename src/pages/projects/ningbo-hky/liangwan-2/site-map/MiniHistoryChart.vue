<script setup lang="ts">
import { computed } from "vue"

const props = withDefaults(defineProps<{
  /** 最近 24 小时的 `[时间, 数值]` 序列。 */
  points?: Array<[string, number]>
  /** 历史曲线加载状态。 */
  loading?: boolean
}>(), { points: () => [], loading: false })

/** 最多保留 160 个绘制点，避免高频参数生成过大的 SVG。 */
const sampledPoints = computed(() => {
  const points = props.points.filter(item => Number.isFinite(item[1]))
  if (points.length <= 160) return points
  const step = Math.ceil(points.length / 160)
  const sampled = points.filter((_, index) => index % step === 0)
  const last = points.at(-1)
  if (last && sampled.at(-1) !== last) sampled.push(last)
  return sampled
})

/** 将数值序列归一化到 160 × 42 的 SVG 坐标。 */
const polylinePoints = computed(() => {
  const points = sampledPoints.value
  if (!points.length) return ""
  const values = points.map(item => item[1])
  const minimum = Math.min(...values)
  const maximum = Math.max(...values)
  const range = maximum - minimum || 1
  return points.map((item, index) => {
    const x = points.length === 1 ? 80 : (index / (points.length - 1)) * 156 + 2
    const y = 39 - ((item[1] - minimum) / range) * 34
    return `${x.toFixed(2)},${y.toFixed(2)}`
  }).join(" ")
})

const rangeTitle = computed(() => {
  if (!sampledPoints.value.length) return "最近 24 小时暂无历史数据"
  const values = sampledPoints.value.map(item => item[1])
  return `最近 24 小时：${Math.min(...values)} ～ ${Math.max(...values)}`
})
</script>

<template>
  <div class="mini-chart" :title="rangeTitle">
    <span v-if="loading" class="mini-chart__empty">加载中…</span>
    <svg v-else-if="polylinePoints" viewBox="0 0 160 42" preserveAspectRatio="none" aria-label="最近24小时历史曲线">
      <line x1="0" y1="40" x2="160" y2="40" class="mini-chart__axis" />
      <polyline :points="polylinePoints" class="mini-chart__line" />
    </svg>
    <span v-else class="mini-chart__empty">暂无曲线</span>
  </div>
</template>

<style scoped lang="scss">
.mini-chart {
  width: 100%;
  height: 42px;
}

.mini-chart svg {
  display: block;
  width: 100%;
  height: 100%;
}

.mini-chart__axis {
  stroke: rgba(148, 163, 184, 0.2);
  stroke-width: 1;
}

.mini-chart__line {
  fill: none;
  stroke: #60a5fa;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
  vector-effect: non-scaling-stroke;
}

.mini-chart__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #60748b;
  font-size: 11px;
}
</style>
