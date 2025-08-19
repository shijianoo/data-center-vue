<script lang="ts" setup>
import type { BeidouData } from "@/common/apis/device-data/type"
import { ref } from "vue"
import { queryBeidouData } from "@/common/apis/device-data"
import { formatDateTime } from "@/common/utils/datetime"

const pageIndex = ref(1)
const pageSize = 50
const loading = ref(false)
const fromCard = ref("")
const toCard = ref("")
const anchorTime = ref<string | undefined>(undefined)
const beidouData = ref<BeidouData[]>([])
const hasNext = ref(false)

function updatePageStatus(list: BeidouData[]) {
  hasNext.value = list.length === pageSize
}

async function fetchData(cursorTime?: string) {
  loading.value = true
  const params = {
    anchorTime: cursorTime,
    reverse: true,
    limit: pageSize,
    fromCard: fromCard.value || undefined,
    toCard: toCard.value || undefined
  }
  try {
    const res = await queryBeidouData(params)
    const list = res.data?.items || []
    beidouData.value = list
    updatePageStatus(list)
    // 更新游标
    anchorTime.value = list.length ? list[0].time : undefined
    ElMessage.success("查询完成")
  } catch {
    ElMessage.error("查询失败")
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
  if (!beidouData.value.length || !hasNext.value) return
  const lastTime = beidouData.value[beidouData.value.length - 1].time
  await fetchData(lastTime)
  pageIndex.value++
}
</script>

<template>
  <div class="app-container">
    <div class="search-bar">
      <el-input v-model="fromCard" placeholder="发送卡号" style="width: 300px;" clearable />
      <el-input v-model="toCard" placeholder="接收卡号" style="width: 300px;" clearable />
      <el-button type="primary" @click="onSearch" :loading="loading">
        查询
      </el-button>
    </div>
    <div class="table-wrapper">
      <el-table :data="beidouData" height="100%">
        <el-table-column prop="time" label="发送时间" width="160px">
          <template #default="scope">
            {{ formatDateTime(scope.row.time) }}
          </template>
        </el-table-column>
        <el-table-column prop="FromCard" label="发送卡" width="120" show-overflow-tooltip />
        <el-table-column prop="ToCard" label="接收卡" width="120" show-overflow-tooltip />
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
      <el-button @click="onNextPage" :disabled="!beidouData.length || !hasNext || loading">
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
  flex-wrap: wrap;
  align-items: flex-start;
}

@media (max-width: 500px) {
  .search-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
  }
  .search-bar .el-input,
  .search-bar .el-button {
    width: 100% !important;
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
