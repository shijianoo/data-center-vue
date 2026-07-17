<script setup lang="ts">
import type { ReviewProgress } from "../types"
import { ElMessage } from "element-plus"
import { computed, onMounted, ref } from "vue"
import { getApiErrorMessage, getManualReviewProgress } from "../apis"
import { useProjectOptions } from "../composables/useProjectOptions"
import { displayRate, displayTime, getDefaultDateRange, toDayEndIso, toDayStartIso } from "../utils"

const { stations, loadStations } = useProjectOptions()
const stationId = ref("")
const parameterCode = ref("")
const dateRange = ref<[Date, Date]>(getDefaultDateRange(24 * 7))
const granularity = ref<"Day" | "Month">("Day")
const progress = ref<ReviewProgress>()
const loading = ref(false)

/** 头部统计卡按三级审核进度统一生成。 */
const summaryCards = computed(() => [
  { label: "数据总量", value: progress.value?.totalCount ?? 0, detail: `未审核 ${progress.value?.unreviewedCount ?? 0}` },
  { label: "一级审核率", value: displayRate(progress.value?.level1Rate), detail: `完成 ${progress.value?.level1Completed ?? 0}` },
  { label: "二级审核率", value: displayRate(progress.value?.level2Rate), detail: `完成 ${progress.value?.level2Completed ?? 0}` },
  { label: "三级审核率", value: displayRate(progress.value?.level3Rate), detail: `完成 ${progress.value?.level3Completed ?? 0}` }
])

/** 查询指定站点或全部站点在时间范围内的审核率。 */
async function search() {
  loading.value = true
  try {
    const { data } = await getManualReviewProgress({
      stationId: stationId.value || undefined,
      parameterCode: parameterCode.value.trim() || undefined,
      from: toDayStartIso(dateRange.value[0]),
      to: toDayEndIso(dateRange.value[1]),
      granularity: granularity.value
    })
    progress.value = data
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "审核进度加载失败"))
  } finally {
    loading.value = false
  }
}

onMounted(loadStations)
</script>

<template>
  <div class="lw2-full-height">
    <el-form inline class="progress-filter" @submit.prevent="search">
      <el-form-item label="站点">
        <el-select v-model="stationId" clearable filterable placeholder="全部站点" style="width: 210px">
          <el-option v-for="station in stations" :key="station.id" :label="`${station.name}（${station.mn}）`" :value="station.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="参数编码">
        <el-input v-model="parameterCode" clearable placeholder="全部参数" style="width: 150px" />
      </el-form-item>
      <el-form-item label="时间范围">
        <el-date-picker v-model="dateRange" type="daterange" format="YYYY-MM-DD" :clearable="false" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" />
      </el-form-item>
      <el-form-item label="统计粒度">
        <el-radio-group v-model="granularity">
          <el-radio-button value="Day">
            按日
          </el-radio-button><el-radio-button value="Month">
            按月
          </el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" native-type="submit" :loading="loading">
          查询
        </el-button>
      </el-form-item>
    </el-form>

    <div class="summary-grid" v-loading="loading">
      <article v-for="item in summaryCards" :key="item.label">
        <span>{{ item.label }}</span><strong>{{ item.value }}</strong><small>{{ item.detail }}</small>
      </article>
    </div>

    <section class="lw2-content">
      <el-table :data="progress?.buckets || []" height="100%" empty-text="请选择范围并查询">
        <el-table-column prop="time" label="统计时间" min-width="170">
          <template #default="scope">
            {{ displayTime(scope.row.time) }}
          </template>
        </el-table-column>
        <el-table-column prop="totalCount" label="总数" align="right" />
        <el-table-column prop="unreviewedCount" label="未审核" align="right" />
        <el-table-column label="一级审核率" align="right">
          <template #default="scope">
            {{ displayRate(scope.row.level1Rate) }}
          </template>
        </el-table-column>
        <el-table-column label="二级审核率" align="right">
          <template #default="scope">
            {{ displayRate(scope.row.level2Rate) }}
          </template>
        </el-table-column>
        <el-table-column label="三级审核率" align="right">
          <template #default="scope">
            {{ displayRate(scope.row.level3Rate) }}
          </template>
        </el-table-column>
      </el-table>
    </section>
  </div>
</template>

<style scoped lang="scss">
@use "../styles.scss";
.progress-filter {
  padding: 0;
  margin-bottom: 16px;
  background: transparent;
  border-bottom: 1px solid var(--el-border-color-light);
  border-radius: 0;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(160px, 1fr));
  gap: 14px;
  margin-bottom: 0;
}
.summary-grid article {
  padding: 8px 18px;
  background: transparent;
  border: 0;
  border-left: 3px solid var(--el-color-primary);
  border-radius: 0;
}
.summary-grid span,
.summary-grid small {
  display: block;
  color: var(--el-text-color-secondary);
}
.summary-grid strong {
  display: block;
  margin: 8px 0 4px;
  color: var(--el-color-primary);
  font-size: 27px;
}
@media (max-width: 1050px) {
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
