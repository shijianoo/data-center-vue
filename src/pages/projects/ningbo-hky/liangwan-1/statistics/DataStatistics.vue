<script setup lang="ts">
import type { QualityRateItem } from "../apis/type"
import type { HistoryGroup } from "../history/buoy/config"
import { ElMessage } from "element-plus"
import { getQualityRate } from "../apis"
import { buoyHistoryConfig, buoyOptions } from "../history/buoy/config"
import { shoreHistoryConfig, shoreOptions } from "../history/shore/config"
import "element-plus/es/components/message/style/css"

// 站点选择（包含浮标站与岸基站）
const stationId = ref<string>("NB00")
const groupId = ref<string>("")
const dateRange = ref<[string, string]>(getDefaultDateRange())
const rows = ref<QualityRateItem[]>([])
const loading = ref(false)

/** 获取默认日期范围（前7天至今天） */
function getDefaultDateRange(): [string, string] {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 6)

  const format = (d: Date) => {
    const year = d.getFullYear()
    const month = `${d.getMonth() + 1}`.padStart(2, "0")
    const day = `${d.getDate()}`.padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  return [format(start), format(end)]
}

/** 当前选中站点的可查询参数组 */
const currentGroups = computed<HistoryGroup[]>(() => {
  if (!stationId.value) return []
  if (stationId.value in buoyHistoryConfig) {
    return buoyHistoryConfig[stationId.value as keyof typeof buoyHistoryConfig] ?? []
  }
  if (stationId.value in shoreHistoryConfig) {
    return shoreHistoryConfig[stationId.value as keyof typeof shoreHistoryConfig] ?? []
  }
  return []
})

/** 当前选中的站点名称 */
const selectedStationName = computed(() => {
  const buoy = buoyOptions.find(item => item.key === stationId.value)
  if (buoy) return `${buoy.name} (${buoy.key})`
  const shore = shoreOptions.find(item => item.key === stationId.value)
  if (shore) return `${shore.name} (${shore.key})`
  return stationId.value
})

/** 监听站点切换，自动更新参数组并初始化查询 */
watch(
  stationId,
  (newStation) => {
    if (!newStation) {
      groupId.value = ""
      rows.value = []
      return
    }
    const groups = currentGroups.value
    if (groups.length > 0) {
      groupId.value = groups[0].key
      void search()
    } else {
      groupId.value = ""
      rows.value = []
    }
  },
  { immediate: false }
)

/** 切换参数组自动查询 */
watch(groupId, (newGroup, oldGroup) => {
  if (newGroup && oldGroup && newGroup !== oldGroup) {
    void search()
  }
})

/** 执行质量数据统计查询 */
async function search() {
  if (!stationId.value) {
    ElMessage.warning("请选择站点")
    return
  }
  const group = currentGroups.value.find(g => g.key === groupId.value)
  if (!group) {
    ElMessage.warning("请选择参数组")
    return
  }
  if (!dateRange.value || !dateRange.value[0] || !dateRange.value[1]) {
    ElMessage.warning("请选择时间范围")
    return
  }

  loading.value = true
  try {
    const startTime = new Date(`${dateRange.value[0]}T00:00:00`).toISOString()
    const endTime = new Date(`${dateRange.value[1]}T23:59:59`).toISOString()

    const res = await getQualityRate({
      serialNumber: stationId.value,
      groupName: group.label,
      startTime,
      endTime
    })

    const data = res.data
    if (Array.isArray(data)) {
      rows.value = data
    } else if (data && Array.isArray((data as { items?: QualityRateItem[] }).items)) {
      rows.value = (data as { items: QualityRateItem[] }).items
    } else {
      rows.value = []
    }
  } catch (error) {
    console.error("加载数据统计失败", error)
    ElMessage.error("获取统计数据失败，请重试")
    rows.value = []
  } finally {
    loading.value = false
  }
}

/** 格式化百分比数值 */
function formatRate(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "--"
  }
  const num = Number(value)
  // 如果数值 <= 1，视为 0.95 -> 95.00%；如果 > 1，视为已按百分比表示 95.0 -> 95.00%
  const percentage = num <= 1 ? num * 100 : num
  return `${percentage.toFixed(2)}%`
}

/** 辅助获取 Tag 类型 */
function getRateTagType(value: number | null | undefined): "success" | "warning" | "danger" | "info" {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "info"
  }
  const num = Number(value)
  const percentage = num <= 1 ? num * 100 : num
  if (percentage >= 90) return "success"
  if (percentage >= 70) return "warning"
  return "danger"
}

onMounted(() => {
  if (currentGroups.value.length > 0) {
    groupId.value = currentGroups.value[0].key
    void search()
  }
})
</script>

<template>
  <div class="statistics-page">
    <!-- 顶部筛选区域 -->
    <div class="statistics-filter-card">
      <el-form inline @submit.prevent="search" class="filter-form">
        <el-form-item label="站点">
          <el-select
            v-model="stationId"
            filterable
            placeholder="请选择站点"
            style="width: 260px"
          >
            <el-option-group label="浮标数据">
              <el-option
                v-for="buoy in buoyOptions"
                :key="buoy.key"
                :label="`${buoy.name} (${buoy.key})`"
                :value="buoy.key"
              >
                <div class="option-row">
                  <span class="option-name">{{ buoy.name }}</span>
                  <span class="option-code">{{ buoy.key }}</span>
                </div>
              </el-option>
            </el-option-group>

            <el-option-group label="岸基站数据">
              <el-option
                v-for="shore in shoreOptions"
                :key="shore.key"
                :label="`${shore.name} (${shore.key})`"
                :value="shore.key"
              >
                <div class="option-row">
                  <span class="option-name">{{ shore.name }}</span>
                  <span class="option-code">{{ shore.key }}</span>
                </div>
              </el-option>
            </el-option-group>
          </el-select>
        </el-form-item>

        <el-form-item label="参数组">
          <el-select
            v-model="groupId"
            placeholder="请选择参数组"
            style="width: 180px"
          >
            <el-option
              v-for="group in currentGroups"
              :key="group.key"
              :label="group.label"
              :value="group.key"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="时间范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            :clearable="false"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 250px"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" native-type="submit" :loading="loading">
            开始统计
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 表格展示区域 -->
    <div class="statistics-table-card" v-loading="loading">
      <div class="card-header-bar">
        <div class="header-title">
          <span class="title-text">数据质量统计</span>
          <el-tag size="small" type="primary" class="station-tag">
            {{ selectedStationName }}
          </el-tag>
        </div>
        <div class="time-tip">
          统计区间: {{ dateRange[0] }} 00:00:00 至 {{ dateRange[1] }} 23:59:59
        </div>
      </div>

      <div class="table-container">
        <el-table
          :data="rows"
          stripe
          height="100%"
          size="default"
          empty-text="暂无统计数据，请选择站点与参数组后点击“开始统计”"
        >
          <el-table-column label="参数名称" min-width="160" fixed>
            <template #default="{ row }">
              <span class="param-name">{{ row.displayName || row.fieldName }}</span>
            </template>
          </el-table-column>

          <el-table-column label="上报周期" align="center" width="110">
            <template #default="{ row }">
              {{ row.periodMinutes ? `${row.periodMinutes} 分钟` : '--' }}
            </template>
          </el-table-column>

          <el-table-column prop="expectedCount" label="应收数据量" align="right" min-width="110" />

          <el-table-column prop="actualCount" label="实收数据量" align="right" min-width="110" />

          <el-table-column label="获取率" align="center" min-width="120">
            <template #default="{ row }">
              <el-tag :type="getRateTagType(row.acquisitionRate)" size="small">
                {{ formatRate(row.acquisitionRate) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="validCount" label="有效数据量" align="right" min-width="110" />

          <el-table-column label="有效率" align="center" min-width="120">
            <template #default="{ row }">
              <el-tag :type="getRateTagType(row.validityRate)" size="small">
                {{ formatRate(row.validityRate) }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.statistics-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - var(--header-h));
  min-height: 0;
  padding: 16px 20px;
  box-sizing: border-box;
  background-color: #f3f6fa;
  overflow: hidden;
}

.statistics-filter-card {
  padding: 16px 20px 4px;
  margin-bottom: 16px;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;

  :deep(.el-form-item) {
    margin-bottom: 12px;
    margin-right: 16px;
  }
}

.option-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.option-name {
  font-weight: 500;
  color: #1f2937;
}

.option-code {
  font-size: 12px;
  color: #9ca3af;
  margin-left: 8px;
}

.statistics-table-card {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  padding: 16px;
  box-sizing: border-box;
  overflow: hidden;
}

.card-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-text {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}

.station-tag {
  font-weight: 500;
}

.time-tip {
  font-size: 12px;
  color: #6b7280;
}

.table-container {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.param-name {
  font-weight: 600;
  color: #1f2937;
}

.param-field {
  font-size: 12px;
  color: #6b7280;
  margin-left: 4px;
}

@media (max-width: 768px) {
  .statistics-page {
    padding: 12px;
  }

  .card-header-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
}
</style>
