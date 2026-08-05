<script setup lang="ts">
import type { LatestMeasurementResult, Station } from "../types"
import { Close } from "@element-plus/icons-vue"
import { computed, ref } from "vue"
import { formatHybridAgo } from "@/common/utils/datetime"
import { formatWaterQualityGrade, waterQualityGradeTagType } from "../utils"

const props = defineProps<{
  /** 当前选中的站点。 */
  station: Station
  /** 站点全部最新参数数据。 */
  latest?: LatestMeasurementResult
  /** 站点地图数据项包含的水质等级（选填）。 */
  mapItemGrade?: string
  /** 最新数据加载状态。 */
  loading: boolean
}>()

const emit = defineEmits<{ close: [], queryTrajectory: [range: [Date, Date]] }>()

const currentGrade = computed(() => props.latest?.waterQualityGrade || props.mapItemGrade)

const to = new Date()
const from = new Date(to.getTime() - 7 * 24 * 3600 * 1000)
const trackDateRange = ref<[Date, Date]>([from, to])

function displayValue(value?: string, unit?: string) {
  if (value == null || value === "") return "—"
  return unit ? `${value} ${unit}` : value
}
</script>

<template>
  <section class="latest-panel">
    <div class="latest-panel_title">
      <div class="title-left">
        <span class="station-name">{{ station.name }}</span>
        <el-tag
          v-if="currentGrade"
          size="small"
          :type="waterQualityGradeTagType(currentGrade)"
          effect="light"
        >
          {{ formatWaterQualityGrade(currentGrade) }}
        </el-tag>
      </div>
      <div class="header-actions">
        <el-popover placement="bottom-end" width="320" trigger="click">
          <template #reference>
            <el-button size="small" type="primary" plain>
              查询轨迹
            </el-button>
          </template>
          <div class="trajectory-popover">
            <div class="trajectory-popover__title">
              轨迹查询
            </div>
            <el-date-picker
              v-model="trackDateRange"
              type="daterange"
              size="small"
              range-separator="-"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="width: 100%;"
              :clearable="false"
              :teleported="false"
            />
            <div style="text-align: right; margin-top: 12px;">
              <el-button size="small" type="primary" @click="emit('queryTrajectory', trackDateRange)">
                查询
              </el-button>
            </div>
          </div>
        </el-popover>
        <el-button text circle :icon="Close" aria-label="关闭站点详情" @click="$emit('close')" />
      </div>
    </div>

    <el-skeleton v-if="loading" :rows="8" animated class="latest-panel__loading" />
    <el-scrollbar v-else class="latest-panel__body">
      <el-empty v-if="!latest?.parameterGroups?.length" description="该站点暂无参数数据" />
      <template v-else>
        <section v-for="group in latest.parameterGroups" :key="group.ParameterGroupId" class="data-section">
          <div class="section-head">
            <span>{{ group.parameterGroupName }}</span>
            <small v-if="group.observedAt">
              最新 {{ formatHybridAgo(group.observedAt) }}
            </small>
          </div>

          <div v-if="!group.parameters?.length" class="section-empty">
            暂无数据
          </div>
          <div v-else class="field-grid">
            <div v-for="param in group.parameters" :key="param.code" class="field-item">
              <span>{{ param.name }}</span>
              <strong>{{ displayValue(param.value, param.unit) }}</strong>
            </div>
          </div>
        </section>
      </template>
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
  width: min(340px, calc(100vw - 32px));
  color: #334155;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(14px);
}

.latest-panel_title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  font-weight: 600;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  font-size: 16px;
}

.title-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;

  .station-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.latest-panel__loading {
  padding: 18px;
}
.latest-panel__body {
  flex: 1;
  padding: 12px;
}

.data-section {
  margin-bottom: 12px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;

  span {
    font-weight: 700;
    color: #111827;
  }

  small {
    color: #64748b;
  }
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.field-item {
  min-width: 0;
  padding: 8px;
  border-radius: 6px;
  background: #f8fafc;

  span {
    display: block;
    overflow: hidden;
    color: #64748b;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    display: block;
    margin-top: 4px;
    color: #0f172a;
    font-size: 15px;
  }
}

.section-empty {
  color: #94a3b8;
  font-size: 13px;
}
.trajectory-popover__title {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}
</style>
