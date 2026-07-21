<script setup lang="ts">
import type { Granularity, Station } from "../types"
import { WarningFilled } from "@element-plus/icons-vue"
import { nextTick } from "vue"

withDefaults(defineProps<{
  /** 可选站点。 */
  stations: Station[]
  /** 当前站点主键。 */
  stationId?: string
  /** 当前站点参数组主键。 */
  groupId?: string
  /** 当前时间范围。 */
  dateRange: [Date, Date]
  /** 当前数据粒度。 */
  granularity: Granularity
  /** 当前站点的参数组。 */
  groups: Array<{ id: string, name: string }>
  /** 是否显示粒度选择。 */
  showGranularity?: boolean
  /** 查询按钮加载状态。 */
  loading?: boolean
  /** 是否显示自动审核颜色图例。 */
  showAutoReviewLegend?: boolean
}>(), { showGranularity: true, loading: false, showAutoReviewLegend: false })

const emit = defineEmits<{
  "update:stationId": [value: string]
  "update:groupId": [value: string]
  "update:dateRange": [value: [Date, Date]]
  "update:granularity": [value: Granularity]
  "search": []
}>()

/** 站点变化时清空旧参数组，避免提交跨站点的参数组主键。 */
function handleStationChange(value: string) {
  emit("update:stationId", value)
  emit("update:groupId", "")
}

/** 切换参数组时，更新值并自动触发查询。 */
function handleTabChange(value: string) {
  emit("update:groupId", value)
  nextTick(() => {
    emit("search")
  })
}
</script>

<template>
  <el-form inline class="query-filter" @submit.prevent="emit('search')">
    <el-form-item label="站点">
      <el-select
        :model-value="stationId"
        filterable
        placeholder="请选择站点"
        style="width: 190px"
        @update:model-value="handleStationChange"
      >
        <el-option v-for="item in stations" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>
    <el-form-item label="时间范围">
      <el-date-picker
        :model-value="dateRange"
        type="daterange"
        format="YYYY-MM-DD"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        range-separator="至"
        :clearable="false"
        @update:model-value="emit('update:dateRange', $event)"
      />
    </el-form-item>
    <el-form-item v-if="showGranularity">
      <el-select :model-value="granularity" style="width: 120px" @update:model-value="emit('update:granularity', $event)">
        <el-option label="原始数据" value="Raw" />
        <el-option label="时均值" value="Hour" />
        <el-option label="日均值" value="Day" />
        <el-option label="月均值" value="Month" />
      </el-select>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" native-type="submit" :loading="loading">
        查询
      </el-button>
      <slot name="actions" />
    </el-form-item>
    <el-form-item v-if="showAutoReviewLegend" class="auto-review-legend-item">
      <el-tooltip placement="bottom-end" effect="dark">
        <template #content>
          <div class="auto-review-legend-tooltip">
            <div><i class="legend-dot legend-dot--failed" />红色：自动审核未通过</div>
            <div><i class="legend-dot legend-dot--error" />橙色：规则执行异常</div>
            <div><i class="legend-dot legend-dot--no-rule" />灰色：未配置规则</div>
          </div>
        </template>
        <el-icon class="auto-review-legend-trigger" tabindex="0" aria-label="自动审核状态颜色说明">
          <WarningFilled />
        </el-icon>
      </el-tooltip>
    </el-form-item>
  </el-form>
  <div class="parameter-group-tabs">
    <el-tabs
      v-if="groups.length"
      :model-value="groupId"
      class="parameter-group-tabs__content"
      @tab-change="handleTabChange(String($event))"
    >
      <el-tab-pane v-for="item in groups" :key="item.id" :label="item.name" :name="item.id" />
    </el-tabs>
    <span v-else class="parameter-group-tabs__empty">{{ stationId ? '当前站点暂无参数组' : '请先选择站点' }}</span>
  </div>
</template>

<style scoped lang="scss">
.query-filter {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  padding: 0;
  margin-bottom: 16px;
  background: transparent;
  border-bottom: 1px solid var(--el-border-color-light);
  border-radius: 0;
  box-shadow: none;
}

.query-filter :deep(.auto-review-legend-item) {
  margin-right: 0;
  margin-left: auto;
}

.auto-review-legend-trigger {
  margin-top: 8px;
  color: var(--el-color-warning);
  font-size: 20px;
  cursor: help;
}

:global(.auto-review-legend-tooltip) {
  line-height: 26px;
  white-space: nowrap;
}

:global(.auto-review-legend-tooltip .legend-dot) {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-right: 8px;
}

:global(.auto-review-legend-tooltip .legend-dot--failed) {
  background: var(--el-color-danger);
}

:global(.auto-review-legend-tooltip .legend-dot--error) {
  background: var(--el-color-warning);
}

:global(.auto-review-legend-tooltip .legend-dot--no-rule) {
  background: var(--el-color-info);
}

.parameter-group-tabs {
  display: flex;
  align-items: flex-end;
  min-height: 40px;
  margin-top: -16px;
  margin-bottom: 0;
  border-bottom: 1px solid var(--el-border-color-light);
}

.parameter-group-tabs__label {
  flex: none;
  padding: 0 18px 12px 0;
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.parameter-group-tabs__content {
  flex: 1;
  min-width: 0;
}

.parameter-group-tabs__content :deep(.el-tabs__header) {
  margin: 0;
}

.parameter-group-tabs__content :deep(.el-tabs__content) {
  display: none;
}

.parameter-group-tabs__empty {
  padding-bottom: 12px;
  color: var(--el-text-color-placeholder);
  font-size: 13px;
}
</style>
