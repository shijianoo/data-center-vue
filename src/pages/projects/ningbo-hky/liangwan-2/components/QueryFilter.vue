<script setup lang="ts">
import type { Granularity, Station } from "../types"
import { computed, nextTick, watch } from "vue"
import { formatHybridAgo } from "@/common/utils/datetime"
import { useUserStore } from "@/pinia/stores/user"
import { filterVisibleParameterGroups } from "../utils"

const props = withDefaults(defineProps<{
  /** 可选站点。 */
  stations: Station[]
  /** 当前站点主键。 */
  stationId?: number | ""
  /** 当前站点参数组主键。 */
  groupId?: number | ""
  /** 当前时间范围。 */
  dateRange: [Date, Date]
  /** 当前数据粒度。 */
  granularity: Granularity
  /** 当前站点的参数组。 */
  groups: Array<{ id: number, name: string }>
  /** 是否显示粒度选择。 */
  showGranularity?: boolean
  /** 查询按钮加载状态。 */
  loading?: boolean
}>(), { showGranularity: true, loading: false })

const emit = defineEmits<{
  "update:stationId": [value: number | ""]
  "update:groupId": [value: number | ""]
  "update:dateRange": [value: [Date, Date]]
  "update:granularity": [value: Granularity]
  "search": []
}>()

const userStore = useUserStore()

/** 当前选中的站点实体 */
const currentStation = computed(() => props.stations.find(s => s.id === props.stationId))

/** 当前选中的站点 lastSeenAt 格式化文案 */
const currentStationLastSeen = computed(() => {
  if (!currentStation.value?.lastSeenAt) return ""
  return formatHybridAgo(currentStation.value.lastSeenAt)
})

/** 根据用户身份过滤后可展示的参数组 */
const visibleGroups = computed(() => filterVisibleParameterGroups(props.groups, userStore.isPlatformUser))

/** 当可用参数组列表变化且当前选中的 groupId 无效时，自动切到首个可用参数组 */
watch([visibleGroups, () => props.groupId], ([validGroups, currentGroupId]) => {
  if (validGroups.length > 0) {
    const exists = validGroups.some(g => g.id === currentGroupId)
    if (!exists) {
      emit("update:groupId", validGroups[0].id)
    }
  }
}, { immediate: true })

/** 站点变化时清空旧参数组，避免提交跨站点的参数组主键。 */
function handleStationChange(value: number | "") {
  emit("update:stationId", value)
  emit("update:groupId", "")
}

/** 切换参数组时，更新值并自动触发查询。 */
function handleTabChange(value: import("element-plus").TabPaneName) {
  emit("update:groupId", typeof value === "number" ? value : Number(value))
  nextTick(() => {
    emit("search")
  })
}
</script>

<template>
  <el-form inline class="query-filter" @submit.prevent="emit('search')">
    <el-form-item label="站点">
      <div class="station-select-wrapper">
        <el-select
          :model-value="stationId"
          filterable
          placeholder="请选择站点"
          style="width: 200px"
          @update:model-value="handleStationChange"
        >
          <el-option
            v-for="item in stations"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          >
            <div class="station-option-item">
              <span class="station-option-name">{{ item.name }}</span>
              <span v-if="formatHybridAgo(item.lastSeenAt)" class="station-option-time">
                {{ formatHybridAgo(item.lastSeenAt) }}
              </span>
            </div>
          </el-option>
        </el-select>
        <span v-if="currentStationLastSeen" class="current-station-last-seen" :title="`最近通信时间：${currentStation?.lastSeenAt || '—'}`">
          ({{ currentStationLastSeen }})
        </span>
      </div>
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
  </el-form>
  <div class="parameter-group-tabs">
    <el-tabs
      v-if="visibleGroups.length"
      :model-value="groupId"
      class="parameter-group-tabs__content"
      @tab-change="handleTabChange($event)"
    >
      <el-tab-pane v-for="item in visibleGroups" :key="item.id" :label="item.name" :name="item.id" />
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

.station-select-wrapper {
  display: inline-flex;
  align-items: center;
}

.current-station-last-seen {
  margin-left: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.station-option-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 12px;
}

.station-option-name {
  font-weight: 500;
}

.station-option-time {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

@media (max-width: 768px) {
  .query-filter {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;

    :deep(.el-form-item) {
      display: inline-flex;
      align-items: center;
      margin-right: 0 !important;
      margin-bottom: 8px !important;

      .el-form-item__content {
        min-width: 0;
      }

      .el-select {
        width: 130px !important;
        min-width: 110px;
      }

      .el-date-editor {
        width: 220px !important;
        max-width: 100%;
      }
    }
  }

  .station-select-wrapper {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;

    .el-select {
      width: 160px !important;
      min-width: 130px;
    }
  }

  .parameter-group-tabs {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;

    :deep(.el-tabs__nav-scroll) {
      overflow-x: auto;
    }
  }
}
</style>
