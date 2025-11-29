<script lang="ts" setup>
import { useSerialNumberSelection } from "@/common/hooks/useSerialNumberSelection"
import { formatNumber, parseLatHem, parseLeakStatus, parseLonHem, parseUbatt } from "@/common/utils/data-parse"
import { formatDateTime } from "@/common/utils/datetime"
import { getCTChain } from "./apis"

const deviceModelId = "a44e70f1-ab1a-4c02-9482-855863acad42"
const { devicesLoading, selectedDevice, selectedDeviceId, serialNumberOptions } = useSerialNumberSelection(deviceModelId)

const pageIndex = ref(1)
const pageSize = ref(50)
const dataList = ref<any[]>([])
const loading = ref(false)

async function fetchCTChain() {
  loading.value = true
  try {
    const res = await getCTChain(selectedDevice.value!.serialNumber!, pageIndex.value, pageSize.value)
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
    fetchCTChain()
  }
}

function goToPreviousPage() {
  if (pageIndex.value > 1) {
    pageIndex.value--
    fetchCTChain()
  }
}

function goToNextPage() {
  pageIndex.value++
  fetchCTChain()
}

watch(selectedDevice, () => {
  if (selectedDevice.value) {
    fetchCTChain()
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
      <el-button style="margin: 0;" type="primary" @click="fetchCTChain">
        查询
      </el-button>
    </div>
    <div class="table-wrapper">
      <el-table :data="dataList" height="100%" :loading="loading">
        <el-table-column label="信息" min-width="200">
          <template #default="scope">
            <div class="data-item">
              采样时间：{{ formatDateTime(scope.row.sampleTime) }}
            </div>
            <div class="data-item">
              接收时间：{{ formatDateTime(scope.row.receiveTime) }}
            </div>
            <div class="data-item">
              4G：{{ scope.row.from4G }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" min-width="130">
          <template #default="scope">
            <div class="data-item">
              电池电压：{{ parseUbatt(scope.row.ubatt) }}
            </div>
            <div class="data-item">
              主板温度：{{ formatNumber(scope.row.tempMb, 4) }}
            </div>
            <div class="data-item">
              漏水状态：{{ parseLeakStatus(scope.row.leakStatus) }}
            </div>
            <div class="data-item">
              4G信号强度：{{ scope.row.csq }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="经纬度" min-width="110">
          <template #default="scope">
            <div class="data-item">
              经度：{{ formatNumber(scope.row.lon, 4) }}
            </div>
            <div class="data-item">
              经度半球：{{ parseLonHem(scope.row.lonHem) }}
            </div>
            <div class="data-item">
              纬度：{{ formatNumber(scope.row.lat, 4) }}
            </div>
            <div class="data-item">
              纬度半球：{{ parseLatHem(scope.row.latHem) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="姿态" min-width="130">
          <template #default="scope">
            <div class="data-item">
              X轴角度：{{ formatNumber(scope.row.angX, 3) }}
            </div>
            <div class="data-item">
              Y轴角度：{{ formatNumber(scope.row.angY, 3) }}
            </div>
            <div class="data-item">
              Z轴角度：{{ formatNumber(scope.row.angZ, 3) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="CTD1" min-width="140">
          <template #default="scope">
            <div class="data-item">
              温度：{{ formatNumber(scope.row.ctD1Temp, 4) }} ℃
            </div>
            <div class="data-item">
              深度：{{ formatNumber(scope.row.ctD1Pres, 4) }} dbar
            </div>
            <div class="data-item">
              电导率：{{ formatNumber(scope.row.ctD1Cond, 4) }} mS/cm
            </div>
            <div class="data-item">
              盐度：{{ formatNumber(scope.row.ctD1Sali, 4) }} ‰
            </div>
          </template>
        </el-table-column>
        <el-table-column label="CTD2" min-width="140">
          <template #default="scope">
            <div class="data-item">
              温度：{{ formatNumber(scope.row.ctD2Temp, 4) }} ℃
            </div>
            <div class="data-item">
              深度：{{ formatNumber(scope.row.ctD2Pres, 4) }} dbar
            </div>
            <div class="data-item">
              电导率：{{ formatNumber(scope.row.ctD2Cond, 4) }} mS/cm
            </div>
            <div class="data-item">
              盐度：{{ formatNumber(scope.row.ctD2Sali, 4) }} ‰
            </div>
          </template>
        </el-table-column>
        <el-table-column label="CTD3" min-width="140">
          <template #default="scope">
            <div class="data-item">
              温度：{{ formatNumber(scope.row.ctD3Temp, 4) }} ℃
            </div>
            <div class="data-item">
              深度：{{ formatNumber(scope.row.ctD3Pres, 4) }} dbar
            </div>
            <div class="data-item">
              电导率：{{ formatNumber(scope.row.ctD3Cond, 4) }} mS/cm
            </div>
            <div class="data-item">
              盐度：{{ formatNumber(scope.row.ctD3Sali, 4) }} ‰
            </div>
          </template>
        </el-table-column>
        <el-table-column label="CTD4" min-width="140">
          <template #default="scope">
            <div class="data-item">
              温度：{{ formatNumber(scope.row.ctD4Temp, 4) }} ℃
            </div>
            <div class="data-item">
              深度：{{ formatNumber(scope.row.ctD4Pres, 4) }} dbar
            </div>
            <div class="data-item">
              电导率：{{ formatNumber(scope.row.ctD4Cond, 4) }} mS/cm
            </div>
            <div class="data-item">
              盐度：{{ formatNumber(scope.row.ctD4Sali, 4) }} ‰
            </div>
          </template>
        </el-table-column>
        <el-table-column label="CTD5" min-width="140">
          <template #default="scope">
            <div class="data-item">
              温度：{{ formatNumber(scope.row.ctD5Temp, 4) }} ℃
            </div>
            <div class="data-item">
              深度：{{ formatNumber(scope.row.ctD5Pres, 4) }} dbar
            </div>
            <div class="data-item">
              电导率：{{ formatNumber(scope.row.ctD5Cond, 4) }} mS/cm
            </div>
            <div class="data-item">
              盐度：{{ formatNumber(scope.row.ctD5Sali, 4) }} ‰
            </div>
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

  .current-page {
    padding: 0 12px;
    font-size: 14px;
    color: var(--el-text-color-primary);
  }
}

.data-item {
  display: flex;
  font-size: 12px;
  align-items: center;
  line-height: 1.4;
  padding: 0;
}
</style>
