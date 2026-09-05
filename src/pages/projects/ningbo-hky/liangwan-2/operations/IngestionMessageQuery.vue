<script setup lang="ts">
import type { IngestionMessageModel } from "../apis/station/type"
import { Refresh } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import { onMounted, ref, watch } from "vue"
import { getApiErrorMessage } from "../apis"
import { getIngestionMessages } from "../apis/station"
import { useProjectOptions } from "../composables/useProjectOptions"
import { displayIngestionSource, displayTime, ingestionSourceTagType } from "../utils"

const { stations, loadStations } = useProjectOptions()
const stationId = ref<number | "">("")
const rows = ref<IngestionMessageModel[]>([])
const loading = ref(false)
const total = ref(0)
const pageNumber = ref(1)
const pageSize = ref(20)

watch([stationId, pageNumber, pageSize], loadData)

/** 加载原始报文数据 */
async function loadData() {
  if (typeof stationId.value !== "number") {
    rows.value = []
    total.value = 0
    return
  }
  loading.value = true
  try {
    const { data } = await getIngestionMessages(stationId.value, pageNumber.value, pageSize.value)
    rows.value = data?.items ?? []
    total.value = Number(data?.total ?? 0)
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, "原始报文加载失败"))
  } finally {
    loading.value = false
  }
}

function handleSizeChange(val: number) {
  pageSize.value = val
  pageNumber.value = 1
}

function handleCurrentChange(val: number) {
  pageNumber.value = val
}

onMounted(async () => {
  const list = await loadStations()
  if (list[0]) stationId.value = list[0].id
})
</script>

<template>
  <section class="lw2-content">
    <div class="lw2-page-title" style="flex-shrink: 0;">
      <h2>原始报文查询</h2>
      <el-space>
        <el-select v-model="stationId" filterable placeholder="请选择站点" style="width: 230px">
          <el-option v-for="station in stations" :key="station.id" :label="station.name" :value="station.id" />
        </el-select>
        <el-button :icon="Refresh" @click="loadData">
          刷新
        </el-button>
      </el-space>
    </div>

    <div style="flex: 1; min-height: 0; height: 0;">
      <el-table v-loading="loading" :data="rows" class="ingestion-table" height="100%">
        <el-table-column prop="receivedAt" label="接收时间" width="180">
          <template #default="scope">
            {{ displayTime(scope.row.receivedAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="receivedMn" label="设备MN" width="180">
          <template #default="scope">
            {{ scope.row.receivedMn || '—' }}
          </template>
        </el-table-column>
        <el-table-column prop="source" label="报文来源" width="90">
          <template #default="scope">
            <el-tag v-if="scope.row.source" size="small" :type="ingestionSourceTagType(scope.row.source)">
              {{ displayIngestionSource(scope.row.source) }}
            </el-tag>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column prop="qn" label="交互号(QN)" width="160" />
        <el-table-column prop="rawMessage" label="完整原始报文" show-overflow-tooltip min-width="300" />
      </el-table>
    </div>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pageNumber"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100, 200]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        background
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </section>
</template>

<style scoped lang="scss">
@use "../styles.scss";
.ingestion-table {
  width: 100%;
}
.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
  flex-shrink: 0;
}
</style>
