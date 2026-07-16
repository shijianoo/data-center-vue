<script setup lang="ts">
/* eslint-disable style/max-statements-per-line */
import type { MeasurementCell, MeasurementColumn, MeasurementResult, ParameterGroup, Station } from "./apis/type"
import { ElMessage } from "element-plus"
import { computed, onMounted, ref } from "vue"
import { exportMeasurements, getStationGroups, getStations, queryMeasurements, querySeries, reviewPoint, reviseEffectiveValue } from "./apis"

type MenuKey = "review" | "trend" | "export"
const active = ref<MenuKey>("review")
const stations = ref<Station[]>([])
const groups = ref<ParameterGroup[]>([])
const loading = ref(false)
const selectedPointIds = ref<string[]>([])
const result = ref<MeasurementResult>()
const trendResult = ref<{ columns?: MeasurementColumn[], rows?: Array<Array<string | number | null>> }>()
const filter = ref({ stationId: "", parameterGroupId: "", from: "", to: "", granularity: "Raw" })
const drawer = ref(false)
const current = ref<{ cell: MeasurementCell, column: MeasurementColumn, time: string }>()
const reviewForm = ref({ level: 1, status: "Valid", reviewer: "", comment: "" })
const editValue = ref("")
const raw = computed(() => filter.value.granularity === "Raw")
function dateDefault() {
  const now = new Date(); const before = new Date(now.getTime() - 24 * 3600 * 1000); return [before, now].map(date => date.toISOString().slice(0, 16))
}
async function onStationChange() {
  filter.value.parameterGroupId = ""
  groups.value = []
  result.value = undefined
  trendResult.value = undefined
  if (!filter.value.stationId) return
  const station = stations.value.find(item => item.id === filter.value.stationId)
  if (!station) return
  groups.value = await getStationGroups(station.mn)
  const firstGroup = groups.value[0]
  if (!firstGroup) return
  filter.value.parameterGroupId = firstGroup.id
  await queryCurrentGroup()
}
async function selectStation(stationId: string) {
  filter.value.stationId = stationId
  await onStationChange()
}
async function queryCurrentGroup() {
  if (active.value === "trend") await queryTrend()
  else if (active.value === "review") await query()
}
async function handleGroupTabClick(groupId: string) {
  filter.value.parameterGroupId = groupId
  await queryCurrentGroup()
}
function handleMenuChange(menu: MenuKey) {
  active.value = menu
  queryCurrentGroup()
}
async function query() {
  if (!filter.value.stationId || !filter.value.parameterGroupId || !filter.value.from || !filter.value.to) return ElMessage.warning("请完整选择站点、参数组和时间范围")
  loading.value = true; selectedPointIds.value = []
  try {
    result.value = await queryMeasurements({ ...filter.value, from: new Date(filter.value.from).toISOString(), to: new Date(filter.value.to).toISOString() })
  } catch (error: any) {
    ElMessage.error(error.message)
  } finally {
    loading.value = false
  }
}
async function queryTrend() {
  if (!filter.value.stationId || !filter.value.parameterGroupId || !filter.value.from || !filter.value.to) return ElMessage.warning("请完整选择站点、参数组和时间范围")
  loading.value = true
  try {
    trendResult.value = await querySeries({
      stationId: filter.value.stationId,
      parameterGroupId: filter.value.parameterGroupId,
      from: new Date(filter.value.from).toISOString(),
      to: new Date(filter.value.to).toISOString(),
      granularity: filter.value.granularity
    })
  } catch (error: any) {
    ElMessage.error(error.message)
  } finally {
    loading.value = false
  }
}
function cell(row: any, code: string) {
  return row.values?.[code] as MeasurementCell | null
}
function statusType(status?: string): "success" | "danger" | "warning" | "info" {
  return ({ Passed: "success", Failed: "danger", Error: "warning", NoRule: "info" } as const)[status as "Passed" | "Failed" | "Error" | "NoRule"] || "info"
}
function manualLabel(item?: MeasurementCell | null) {
  const level = item?.manualReview?.currentLevel || 0; return level ? `第${level}级已审` : "待一级审核"
}
function open(cellItem: MeasurementCell | null, column: MeasurementColumn, time: string) {
  if (!cellItem) return; current.value = { cell: cellItem, column, time }; editValue.value = cellItem.valueText || ""; reviewForm.value.level = Math.min((cellItem.manualReview?.currentLevel || 0) + 1, 3); reviewForm.value.status = "Valid"; reviewForm.value.comment = ""; drawer.value = true
}
async function submitReview() {
  if (!current.value?.cell.pointId) return; try {
    await reviewPoint(current.value.cell.pointId, reviewForm.value.level, { status: reviewForm.value.status, reviewer: reviewForm.value.reviewer, comment: reviewForm.value.comment }); ElMessage.success("审核已提交"); drawer.value = false; query()
  } catch (error: any) {
    ElMessage.error(error.message)
  }
}
async function updateValue() {
  if (!current.value?.cell.pointId) return; try {
    await reviseEffectiveValue(current.value.cell.pointId, editValue.value); ElMessage.success("有效值已修正"); query()
  } catch (error: any) {
    ElMessage.error(error.message)
  }
}
function toggleRow(row: any, checked: boolean) {
  const ids = Object.values(row.values || {}).map((item: any) => item?.pointId).filter(Boolean) as string[]; selectedPointIds.value = checked ? Array.from(new Set([...selectedPointIds.value, ...ids])) : selectedPointIds.value.filter(id => !ids.includes(id))
}
async function batchReview(level: number) {
  if (!selectedPointIds.value.length) return ElMessage.warning("请先勾选含原始数据点的行")
  const cells = (result.value?.rows || []).flatMap(row => Object.values(row.values || {}) as MeasurementCell[])
  const eligible = selectedPointIds.value.filter(id => cells.find(item => item?.pointId === id)?.manualReview?.currentLevel === level - 1)
  if (!eligible.length) return ElMessage.warning(`所选数据点均不满足第${level}级审核的前序条件`)
  let success = 0
  for (const id of eligible) {
    try {
      await reviewPoint(id, level, { status: "Valid", reviewer: reviewForm.value.reviewer, comment: "批量审核同意" }); success++
    } catch {}
  }
  ElMessage.success(`批量${level}级审核完成：${success}/${eligible.length}，已跳过 ${selectedPointIds.value.length - eligible.length} 条`)
  query()
}
async function download() {
  if (!filter.value.stationId || !filter.value.parameterGroupId) return ElMessage.warning("请先选择站点和参数组"); try {
    const response = await exportMeasurements({ ...filter.value, from: new Date(filter.value.from).toISOString(), to: new Date(filter.value.to).toISOString() }); const url = URL.createObjectURL(response.data); const link = document.createElement("a"); link.href = url; link.download = "liangwan-data.xlsx"; link.click(); URL.revokeObjectURL(url)
  } catch (error: any) {
    ElMessage.error(error.message)
  }
}
onMounted(async () => {
  stations.value = (await getStations({ pageSize: 200 })).items
  ;[filter.value.from, filter.value.to] = dateDefault()
})
</script>

<template>
  <div class="workspace">
    <aside class="station-panel">
      <el-menu class="station-menu" :default-active="filter.stationId" @select="selectStation">
        <el-menu-item v-for="station in stations" :key="station.id" :index="station.id">
          <span class="station-status" :class="station.status.toLowerCase()" /><span class="station-name">{{ station.name }}</span><small>{{ station.mn }}</small>
        </el-menu-item>
      </el-menu>
    </aside>
    <main>
      <section class="title">
        <div><h2>{{ active === 'review' ? '数据审核' : active === 'trend' ? '参数趋势' : '数据下载' }}</h2><span>{{ active === 'review' ? '切换参数组即可直接查询并审核数据' : '当前站点参数组数据' }}</span></div><div class="toolbar">
          <el-radio-group v-model="active" @change="handleMenuChange($event as MenuKey)">
            <el-radio-button value="review">
              数据审核
            </el-radio-button><el-radio-button value="trend">
              参数趋势
            </el-radio-button><el-radio-button value="export">
              数据下载
            </el-radio-button>
          </el-radio-group>
          <el-date-picker v-model="filter.from" type="datetime" value-format="YYYY-MM-DDTHH:mm" /><el-date-picker v-model="filter.to" type="datetime" value-format="YYYY-MM-DDTHH:mm" />
          <el-select v-if="active !== 'export'" v-model="filter.granularity" style="width:110px">
            <el-option v-for="item in ['Raw', 'Hour', 'Day', 'Month']" :key="item" :label="item" :value="item" />
          </el-select><el-button type="primary" :loading="loading" @click="active === 'export' ? download() : queryCurrentGroup()">
            {{ active === 'export' ? '下载 Excel' : '查询' }}
          </el-button>
        </div>
      </section>
      <el-empty v-if="!filter.stationId" description="请先从左侧选择站点，系统将自动加载其参数组。" />
      <template v-else>
        <el-tabs :model-value="filter.parameterGroupId" class="group-tabs" @tab-change="handleGroupTabClick(String($event))">
          <el-tab-pane v-for="group in groups" :key="group.id" :label="`${group.name} · ${group.reportIntervalMinutes}分钟`" :name="group.id" />
        </el-tabs>
        <template v-if="active === 'review'">
          <el-alert v-if="!raw" title="聚合粒度仅供查询，不支持人工审核和有效值修正。" type="warning" :closable="false" class="mb" /><div class="actions">
            <el-input v-model="reviewForm.reviewer" placeholder="审核人" style="width:160px" /><el-button :disabled="!raw" @click="batchReview(1)">
              批量一级同意
            </el-button><el-button :disabled="!raw" @click="batchReview(2)">
              批量二级同意
            </el-button><el-button :disabled="!raw" @click="batchReview(3)">
              批量三级同意
            </el-button>
          </div><el-table v-loading="loading" :data="result?.rows || []" border height="calc(100vh - 245px)">
            <el-table-column v-if="raw" width="52">
              <template #default="{ row }">
                <el-checkbox :model-value="Object.values(row.values || {}).some((item: any) => selectedPointIds.includes(item?.pointId))" @change="toggleRow(row, Boolean($event))" />
              </template>
            </el-table-column><el-table-column prop="time" label="采集时间" width="170" fixed /><el-table-column v-for="column in result?.columns" :key="column.code" :label="`${column.name} (${column.code})`" min-width="180">
              <template #default="{ row }">
                <template v-if="cell(row, column.code)">
                  <el-link :underline="false" @click="open(cell(row, column.code), column, row.time)">
                    {{ cell(row, column.code)?.valueText ?? '—' }} {{ column.unit }}
                  </el-link><div>
                    <el-tag size="small" :type="statusType(cell(row, column.code)?.autoReviewStatus)">
                      {{ cell(row, column.code)?.autoReviewStatus || '—' }}
                    </el-tag><el-tag size="small" effect="plain">
                      {{ manualLabel(cell(row, column.code)) }}
                    </el-tag>
                  </div>
                </template><span v-else>—</span>
              </template>
            </el-table-column>
          </el-table>
        </template>
        <template v-else-if="active === 'trend'">
          <el-alert title="趋势查询返回数值序列；第一版以数据表展示，后续可直接接入折线图。" type="info" :closable="false" class="mb" /><el-button type="primary" :loading="loading" @click="queryTrend">
            查询趋势
          </el-button><el-table :data="trendResult?.rows || []" border class="trend-table">
            <el-table-column label="时间" width="180">
              <template #default="{ row }">
                {{ row[0] }}
              </template>
            </el-table-column><el-table-column v-for="(column, index) in trendResult?.columns" :key="column.code" :label="`${column.name}（${column.unit || ''}）`">
              <template #default="{ row }">
                {{ row[index + 1] ?? '—' }}
              </template>
            </el-table-column>
          </el-table>
        </template><template v-else>
          <el-result icon="success" title="导出数据" sub-title="选择左侧站点、参数组和时间范围后下载 Excel">
            <template #extra>
              <el-button type="primary" @click="download">
                下载 Excel
              </el-button>
            </template>
          </el-result>
        </template>
      </template>
    </main>
    <el-drawer v-model="drawer" title="数据点审核" size="460px">
      <template v-if="current">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="参数">
            {{ current.column.name }}（{{ current.column.code }}）
          </el-descriptions-item><el-descriptions-item label="采集时间">
            {{ current.time }}
          </el-descriptions-item><el-descriptions-item label="原始值">
            {{ current.cell.valueText }}
          </el-descriptions-item><el-descriptions-item label="自动审核">
            <el-tag :type="statusType(current.cell.autoReviewStatus)">
              {{ current.cell.autoReviewStatus }}
            </el-tag>
          </el-descriptions-item><el-descriptions-item label="人工审核">
            {{ manualLabel(current.cell) }}
          </el-descriptions-item>
        </el-descriptions><el-divider>自动审核详情</el-divider><pre>{{ current.cell.autoReviewResultsJson || '未配置自动审核规则' }}</pre><el-divider>人工审核</el-divider><el-form label-width="88px">
          <el-form-item label="审核级别">
            <el-radio-group v-model="reviewForm.level">
              <el-radio-button :value="1" :disabled="(current.cell.manualReview?.currentLevel || 0) !== 0">
                一级
              </el-radio-button><el-radio-button :value="2" :disabled="(current.cell.manualReview?.currentLevel || 0) !== 1">
                二级
              </el-radio-button><el-radio-button :value="3" :disabled="(current.cell.manualReview?.currentLevel || 0) !== 2">
                三级
              </el-radio-button>
            </el-radio-group>
          </el-form-item><el-form-item label="审核结论">
            <el-select v-model="reviewForm.status">
              <el-option v-for="item in ['Valid', 'Invalid', 'Fault', 'Suspect', 'AboveUpperLimit', 'BelowLowerLimit']" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item><el-form-item label="审核人">
            <el-input v-model="reviewForm.reviewer" />
          </el-form-item><el-form-item label="审核意见">
            <el-input v-model="reviewForm.comment" type="textarea" />
          </el-form-item><el-button type="primary" :disabled="!raw || !current.cell.pointId" @click="submitReview">
            提交审核
          </el-button>
        </el-form><el-divider>有效值修正</el-divider><el-input v-model="editValue">
          <template #append>
            <el-button :disabled="!raw || !current.cell.pointId" @click="updateValue">
              修正
            </el-button>
          </template>
        </el-input>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped lang="scss">
.workspace {
  display: flex;
  height: calc(100vh - var(--header-h));
  background: #f5f7fa;
}
aside {
  width: 248px;
  flex: none;
  background: #fff;
  border-right: 1px solid #ebeef5;
  padding: 16px;
  overflow: auto;
}
aside h3 {
  margin: 0 0 12px;
}
aside h4 {
  color: #606266;
  margin: 0 0 8px;
}
.el-menu {
  border: 0;
}
.toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
}
.station-menu {
  height: 100%;
  overflow-y: auto;
}
.station-menu :deep(.el-menu-item) {
  display: flex;
  gap: 8px;
  align-items: center;
  height: 48px;
  line-height: 1;
  margin: 2px 0;
  padding: 0 8px !important;
  border-radius: 6px;
}
.station-menu :deep(.el-menu-item.is-active) {
  background: #ecf5ff;
}
.station-status {
  width: 7px;
  height: 7px;
  flex: none;
  border-radius: 50%;
  background: #a8abb2;
}
.station-status.active {
  background: #67c23a;
}
.station-status.maintenance {
  background: #e6a23c;
}
.station-status.offline,
.station-status.disabled {
  background: #f56c6c;
}
.station-name {
  overflow: hidden;
  flex: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.station-menu small {
  color: #909399;
  font-size: 11px;
}
main {
  min-width: 0;
  flex: 1;
  padding: 20px;
  overflow: auto;
}
.title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.title h2 {
  margin: 0 0 4px;
  font-size: 20px;
}
.title span {
  font-size: 13px;
  color: #909399;
}
.title > div:last-child {
  display: flex;
  gap: 10px;
}
.actions {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.mb {
  margin-bottom: 12px;
}
.trend-table {
  margin-top: 16px;
}
.group-tabs {
  margin-bottom: 14px;
  padding: 0 4px;
  background: #fff;
  border-radius: 8px;
}
.group-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
}
.group-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}
.group-tabs :deep(.el-tabs__item) {
  height: 48px;
  line-height: 48px;
}
pre {
  max-height: 160px;
  overflow: auto;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
  white-space: pre-wrap;
  font-size: 12px;
}
</style>
