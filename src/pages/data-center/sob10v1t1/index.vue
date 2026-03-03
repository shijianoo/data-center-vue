<script lang="ts" setup>
import { buildDownloadExcelByRangeUrl } from "@/common/apis/data-download"
import { pagedDataQuery } from "@/common/apis/data-query"
import { selectDateRange } from "@/common/composables/useDateRangeSelector"
import { useSerialNumberSelection } from "@/common/hooks/useSerialNumberSelection"
import { parseLatHem, parseLeakStatus, parseLonHem } from "@/common/utils/data-parse"
import { formatDateTime } from "@/common/utils/datetime"
import { downloadFile } from "@/common/utils/download"

const deviceModelId = "019c2c62-d292-7c50-af4f-a423023bf63f"
const { devicesLoading, selectedDeviceId, selectedDevice, serialNumberOptions } = useSerialNumberSelection(deviceModelId)

const pageIndex = ref(1)
const pageSize = ref(20)
const total = ref(0)
const dataList = ref<any[]>([])

async function fetchData() {
  if (!selectedDevice) {
    ElMessage.warning("设备不存在")
    return
  }
  try {
    const { data } = await pagedDataQuery({
      model: selectedDevice.value!.modelNumber,
      version: 1,
      dataType: 1,
      serialNumber: selectedDevice.value!.serialNumber,
      uploadChannel: 0,
      page: pageIndex.value,
      size: pageSize.value
    })
    ElMessage.success("查询完成")
    console.log("数据查询完成", data.records)
    dataList.value = data.records
    total.value = data.totalCount
  } catch (e) {
    ElMessage.warning("查询失败")
    console.log("查询失败", e)
  }
}

watch([selectedDevice, pageIndex], async ([device]) => {
  if (device) {
    fetchData()
  }
})

async function dataExport() {
  if (!selectedDevice) {
    ElMessage.warning("请先选择设备")
    return
  }
  const data = await selectDateRange({ maxDays: 30 })
  if (data) {
    const url = buildDownloadExcelByRangeUrl({
      model: selectedDevice.value!.modelNumber,
      version: 1,
      dataType: 1,
      serialNumber: selectedDevice.value!.serialNumber,
      uploadChannel: 0,
      startTime: data.startDate,
      endTime: data.endDate
    })
    downloadFile(url)
  }
}
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
      <el-button type="primary" @click="fetchData" style="margin: 0;">
        查询
      </el-button>
      <el-button style="margin: 0;" @click="dataExport">
        下载
      </el-button>
    </div>

    <div class="table-wrapper">
      <el-table :data="dataList">
        <el-table-column label="采样时间" width="160">
          <template #default="scope">
            {{ formatDateTime(scope.row.samp_time) }}
          </template>
        </el-table-column>
        <el-table-column label="接收时间" width="160">
          <template #default="scope">
            {{ formatDateTime(scope.row.recv_time) }}
          </template>
        </el-table-column>
        <el-table-column label="经度" prop="lon">
          <template #default="scope">
            {{ scope.row.lon }} {{ parseLonHem(scope.row.lon_hem) }}
          </template>
        </el-table-column>
        <el-table-column label="纬度" prop="lat">
          <template #default="scope">
            {{ scope.row.lat }} {{ parseLatHem(scope.row.lat_hem) }}
          </template>
        </el-table-column>
        <el-table-column label="水温(℃)" prop="temp_wat" />
        <el-table-column label="主板温度(℃)" prop="temp_mb" />
        <el-table-column label="湿度(g/m³)" prop="humid" />
        <el-table-column label="倾角(°)" prop="tilt_ang" />
        <el-table-column label="电池电压(V)" prop="ubatt" />
        <el-table-column label="漏水状态">
          <template #default="scope">
            {{ parseLeakStatus(scope.row.leak_stat) }}
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="pagination-bar">
      <el-pagination
        background
        layout="total, prev, pager, next"
        :total="total"
        v-model:page-size="pageSize"
        v-model:current-page="pageIndex"
      />
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

@media (max-width: 628px) {
  .search-wrapper {
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
  }
  .search-wrapper .el-select {
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
}
</style>
