<script setup lang="ts">
import type { DataRate, ParameterGroup, Station } from "./apis/type"
import { ElMessage } from "element-plus"
import { computed, onMounted, ref } from "vue"
import { getDataRates, getStationGroups, getStations } from "./apis"

const stations = ref<Station[]>([])
const groups = ref<ParameterGroup[]>([])
const rates = ref<DataRate[]>([])
const loading = ref(false)
const filter = ref({ stationId: "", parameterGroupId: "", from: "", to: "" })
const selectedStation = computed(() => stations.value.find(item => item.id === filter.value.stationId))

function setDefaultRange() {
  const to = new Date()
  const from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000)
  filter.value.from = from.toISOString().slice(0, 16)
  filter.value.to = to.toISOString().slice(0, 16)
}
async function selectStation(stationId: string) {
  filter.value.stationId = stationId
  filter.value.parameterGroupId = ""
  groups.value = []
  rates.value = []
  if (!selectedStation.value) return
  try {
    groups.value = await getStationGroups(selectedStation.value.mn)
    const firstGroup = groups.value[0]
    if (!firstGroup) return
    filter.value.parameterGroupId = firstGroup.id
    await query()
  } catch (error: any) {
    ElMessage.error(error.message)
  }
}
async function query() {
  if (!selectedStation.value || !filter.value.parameterGroupId || !filter.value.from || !filter.value.to) return ElMessage.warning("请选择站点、参数组和时间范围")
  loading.value = true
  try {
    rates.value = await getDataRates({ mn: selectedStation.value.mn, parameterGroupId: filter.value.parameterGroupId, from: new Date(filter.value.from).toISOString(), to: new Date(filter.value.to).toISOString() })
  } catch (error: any) {
    ElMessage.error(error.message)
  } finally {
    loading.value = false
  }
}
function percent(value: number | null) {
  return value == null ? "—" : `${(value * 100).toFixed(2)}%`
}
onMounted(async () => {
  stations.value = (await getStations({ pageSize: 200 })).items
  setDefaultRange()
})
</script>

<template>
  <div class="workspace">
    <aside>
      <el-menu class="station-menu" :default-active="filter.stationId" @select="selectStation">
        <el-menu-item v-for="station in stations" :key="station.id" :index="station.id">
          <span class="station-status" :class="station.status.toLowerCase()" /><span class="station-name">{{ station.name }}</span><small>{{ station.mn }}</small>
        </el-menu-item>
      </el-menu>
    </aside>
    <main>
      <header>
        <div><h2>参数获取率与有效率</h2><p>当前站点各参数的采集和审核质量统计。</p></div><div class="toolbar">
          <el-select v-model="filter.parameterGroupId" placeholder="选择参数组">
            <el-option v-for="group in groups" :key="group.id" :label="group.name" :value="group.id" />
          </el-select><el-date-picker v-model="filter.from" type="datetime" value-format="YYYY-MM-DDTHH:mm" /><el-date-picker v-model="filter.to" type="datetime" value-format="YYYY-MM-DDTHH:mm" /><el-button type="primary" :loading="loading" @click="query">
            查询统计
          </el-button>
        </div>
      </header><el-empty v-if="!filter.stationId" description="请从左侧选择站点" /><template v-else>
        <el-alert title="有效率由后端按自动审核状态统一计算。维护 / 大修时段的排除口径以服务端实现为准。" type="info" :closable="false" class="notice" /><el-table v-loading="loading" :data="rates" border>
          <el-table-column label="参数" min-width="180">
            <template #default="{ row }">
              {{ row.parameter.name }}（{{ row.parameter.code }}）
            </template>
          </el-table-column><el-table-column prop="expectedCount" label="应获取" /><el-table-column prop="receivedCount" label="已获取" /><el-table-column prop="validCount" label="有效" /><el-table-column prop="missingCount" label="缺失" /><el-table-column prop="duplicateCount" label="重复" /><el-table-column label="获取率">
            <template #default="{ row }">
              {{ percent(row.acquisitionRate) }}
            </template>
          </el-table-column><el-table-column label="有效率">
            <template #default="{ row }">
              {{ percent(row.validityRate) }}
            </template>
          </el-table-column>
        </el-table>
      </template>
    </main>
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
  padding: 16px;
  background: #fff;
  border-right: 1px solid #ebeef5;
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
  flex: 1;
  min-width: 0;
  padding: 24px;
  margin: 16px;
  background: #fff;
}
header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
h2 {
  margin: 0;
  font-size: 20px;
}
p {
  margin: 5px 0 0;
  color: #909399;
  font-size: 13px;
}
.toolbar {
  display: flex;
  gap: 8px;
}
.notice {
  margin-bottom: 16px;
}
</style>
