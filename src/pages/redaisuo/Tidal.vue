<script lang="ts" setup>
import { useSerialNumberSelection } from "@/common/hooks/useSerialNumberSelection"
import { formatNumber, parseLeakStatus, parseUbatt } from "@/common/utils/data-parse"
import { formatDateTime } from "@/common/utils/datetime"
import { getTidal } from "./apis"

const deviceModelId = "019b4a50-1202-7c53-aa63-08e2a1caa1e7"
const { devicesLoading, selectedDevice, selectedDeviceId, serialNumberOptions } = useSerialNumberSelection(deviceModelId)

const pageIndex = ref(1)
const pageSize = ref(50)
const dataList = ref<any[]>([])
const loading = ref(false)

async function fetchTidal() {
  loading.value = true
  try {
    const res = await getTidal(selectedDevice.value!.serialNumber!, pageIndex.value, pageSize.value)
    dataList.value = res.data
  } catch (error) {
    console.error(error)
    ElMessage.error("查询失败")
  } finally {
    loading.value = false
  }
}

// 分页功能
function goToFirstPage() {
  if (pageIndex.value > 1) {
    pageIndex.value = 1
    fetchTidal()
  }
}

function goToPreviousPage() {
  if (pageIndex.value > 1) {
    pageIndex.value--
    fetchTidal()
  }
}

function goToNextPage() {
  pageIndex.value++
  fetchTidal()
}

watch(selectedDevice, () => {
  if (selectedDevice.value) {
    fetchTidal()
  }
})
</script>

<template>
  <div class="app-container">
    <div class="search-wrapper">
      <el-select :loading="devicesLoading" style="width: 300px;" v-model="selectedDeviceId" filterable placeholder="请选择设备">
        <el-option
          v-for="option in serialNumberOptions"
          :key="option.id"
          :label="option.label"
          :value="option.id"
        />
      </el-select>
      <el-button style="margin: 0;" type="primary" @click="fetchTidal">
        查询
      </el-button>
    </div>
    <div class="table-wrapper">
      <el-table :data="dataList" height="100%" :loading="loading">
        <el-table-column label="采样时间" align="center" min-width="160">
          <template #default="scope">
            <span>{{ formatDateTime(scope.row.sampleTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="接收时间" align="center" min-width="160">
          <template #default="scope">
            <span>{{ formatDateTime(scope.row.receiveTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="csq" label="信号强度" align="center" min-width="100" />
        <el-table-column
          label="电池电压(V)" align="center" min-width="100"
        >
          <template #default="scope">
            <span>{{ parseUbatt(scope.row.ubatt) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="tempMb" label="主板温度(℃)" align="center" min-width="100" />
        <el-table-column label="漏水状态" align="center" min-width="100">
          <template #default="scope">
            <span>{{ parseLeakStatus(scope.row.leakStatus) }} </span>
          </template>
        </el-table-column>
        <el-table-column
          label="CTD温度(℃)"
          align="center"
          min-width="100"
        >
          <template #default="scope">
            <span>{{ formatNumber(scope.row.ctdTemp, 4) }}</span>
          </template>
        </el-table-column>
        <el-table-column
          label="CTD深度(dbar)"
          align="center"
          min-width="100"
        >
          <template #default="scope">
            <span>{{ formatNumber(scope.row.ctdPres, 2) }}</span>
          </template>
        </el-table-column>
        <el-table-column
          label="CTD电导率(mS/cm)"
          align="center"
          min-width="110"
        >
          <template #default="scope">
            <span>{{ formatNumber(scope.row.ctdCond, 4) }}</span>
          </template>
        </el-table-column>
        <el-table-column
          label="CTD盐度"
          align="center"
          min-width="100"
        >
          <template #default="scope">
            <span>{{ formatNumber(scope.row.ctdSali, 4) }}</span>
          </template>
        </el-table-column>
        <el-table-column
          label="WT温度(℃)"
          align="center"
          min-width="100"
        >
          <template #default="scope">
            <span>{{ formatNumber(scope.row.wtTemp, 4) }}</span>
          </template>
        </el-table-column>
        <el-table-column
          label="WT深度(dbar)"
          align="center"
          min-width="100"
        >
          <template #default="scope">
            <span>{{ formatNumber(scope.row.wtPres, 2) }}</span>
          </template>
        </el-table-column>
        <el-table-column
          label="潮位(m)"
          align="center"
          min-width="100"
        >
          <template #default="scope">
            <span>{{ formatNumber(scope.row.tide, 4) }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="pagination-bar">
      <el-button :disabled="pageIndex === 1" @click="goToFirstPage">
        首页
      </el-button>
      <el-button :disabled="pageIndex === 1" @click="goToPreviousPage">
        上一页
      </el-button>
      <span class="current-page">第 {{ pageIndex }} 页</span>
      <el-button @click="goToNextPage">
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

.search-wrapper {
  margin-bottom: 5px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: flex-start;
}

@media (max-width: 500px) {
  .search-wrapper {
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
  }
  .search-wrapper .el-select,
  .search-wrapper .el-button {
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
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;

  .current-page {
    padding: 0 12px;
    font-size: 14px;
    color: var(--el-text-color-primary);
  }
}
</style>
