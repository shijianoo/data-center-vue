<script lang="ts" setup>
import type { IridiumData } from "@/common/apis/device-data/type"
import { ref } from "vue"
import { queryIridiumData } from "@/common/apis/device-data"
import { formatDateTime } from "@/common/utils/datetime"

const pageIndex = ref(1)
const pageSize = 50
const loading = ref(false)
const imei = ref("")
const anchorTime = ref<string | undefined>(undefined)
const iridiumData = ref<IridiumData[]>([])
const hasNext = ref(false)

function updatePageStatus(list: IridiumData[]) {
  hasNext.value = list.length === pageSize
}

async function fetchData(cursorTime?: string) {
  loading.value = true
  const params = {
    anchorTime: cursorTime,
    reverse: true,
    limit: pageSize,
    imei: imei.value || undefined
  }
  try {
    const res = await queryIridiumData(params)
    const list = res.data?.items || []
    iridiumData.value = list
    updatePageStatus(list)
    // 更新游标
    anchorTime.value = list.length ? list[0].time : undefined
  } finally {
    loading.value = false
  }
}

// 查询
async function onSearch() {
  anchorTime.value = undefined
  await fetchData(anchorTime.value)
  pageIndex.value = 1
}

// 下一页
async function onNextPage() {
  if (!iridiumData.value.length || !hasNext.value) return
  const lastTime = iridiumData.value[iridiumData.value.length - 1].time
  await fetchData(lastTime)
  pageIndex.value++
}
</script>

<template>
  <div class="app-container">
    <div class="search-bar">
      <el-input v-model="imei" placeholder="IMEI号" style="max-width: 300px;" clearable />
      <el-button type="primary" @click="onSearch" :loading="loading">
        查询
      </el-button>
    </div>
    <div class="table-wrapper">
      <el-table :data="iridiumData" height="100%">
        <el-table-column prop="time" label="接收时间" width="160px">
          <template #default="scope">
            {{ formatDateTime(scope.row.time) }}
          </template>
        </el-table-column>
        <el-table-column prop="IMEI" label="IMEI" width="180px" />
        <el-table-column prop="Content" label="数据" show-overflow-tooltip />
      </el-table>
    </div>
    <div class="pagination-bar">
      <el-button @click="onSearch" :disabled="loading">
        首页
      </el-button>
      <el-text>
        第 {{ pageIndex }} 页
      </el-text>
      <el-button @click="onNextPage" :disabled="!iridiumData.length || !hasNext || loading">
        下一页
      </el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.app-container {
  height: calc(100vh - 110px);
  display: flex;
  flex-direction: column;
  padding: 5px;
}

.search-bar {
  margin-bottom: 5px;
  display: flex;
  gap: 8px;
}

@media (max-width: 300px) {
  .search-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
  }
  .search-bar .el-button {
    width: 100%;
    margin-left: 0 !important;
    margin-right: 0 !important;
  }
}

.table-wrapper {
  flex: 1;
  overflow: auto;
}

.pagination-bar {
  margin-top: 5px;
  text-align: right;
}
</style>
