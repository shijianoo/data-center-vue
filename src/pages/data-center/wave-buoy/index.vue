<script lang="ts" setup>
import ChannelDropdown from "@@/components/ChannelDropdown/index.vue"
import { buildExcelQuickExportUrl } from "@/common/apis/data-export"
import { selectDateRange } from "@/common/composables/useDateRangeSelector"
import { useDeviceDataPagination } from "@/common/hooks/useDeviceDataPagination"
import { useDeviceEvent } from "@/common/hooks/useDeviceEvent"
import { useSerialNumberSelection } from "@/common/hooks/useSerialNumberSelection"
import { downloadFile } from "@/common/utils/download"
import DeviceCommand from "../components/DeviceCommand.vue"
import DeviceProperty from "../components/DeviceProperty.vue"
import DeviceStatus from "./components/DeviceStatus.vue"
import WaveBuoyTable from "./components/WaveBuoyTable.vue"

const deviceModelId = "622a9ac7-7df1-42ea-9a26-f0a2a7abec3c"
const { devicesLoading, selectedDeviceId, selectedDevice, serialNumberOptions } = useSerialNumberSelection(deviceModelId)
const {
  dataList,
  loading,
  pageIndex,
  pageSize,
  uploadChannel,
  total,
  fetchFirstPageData
} = useDeviceDataPagination(selectedDevice)

const { isReconnecting, isDisconnected } = useDeviceEvent(deviceModelId, (id, data) => {
  console.log("Device event:", id, data)
  if (id === selectedDeviceId.value && pageIndex.value === 1) {
    fetchFirstPageData()
  } else {
    ElMessage.success("设备已收到新数据")
  }
})

async function dataExport() {
  const data = await selectDateRange({ maxDays: 30 })
  if (data) {
    const url = buildExcelQuickExportUrl({
      model: selectedDevice.value!.modelNumber,
      sn: selectedDevice.value!.serialNumber,
      ch: uploadChannel.value,
      start: data.startDate,
      stop: data.endDate
    })
    downloadFile(url)
  }
}

const controlDialog = ref<boolean>(false)
const propertyDialog = ref<boolean>(false)
const statusDialog = ref<boolean>(false)
</script>

<template>
  <div class="app-container">
    <el-alert
      v-if="isReconnecting"
      title="实时数据推送已断开，正在重新连接..."
      type="warning"
      effect="dark"
      show-icon
    />
    <el-alert
      v-else-if="isDisconnected"
      title="实时数据推送已断开，请检查网络连接并尝试刷新页面"
      type="error"
      effect="dark"
      show-icon
    />
    <div class="search-wrapper">
      <el-select :loading="devicesLoading" style="width: 300px;" v-model="selectedDeviceId" filterable placeholder="请选择设备">
        <el-option
          v-for="option in serialNumberOptions"
          :key="option.id"
          :label="option.label"
          :value="option.id"
        />
      </el-select>
      <ChannelDropdown @click="fetchFirstPageData" v-model="uploadChannel" />
      <el-button style="margin: 0;" @click="controlDialog = true">
        控制
      </el-button>
      <el-button style="margin: 0;" @click="propertyDialog = true">
        属性
      </el-button>
      <el-button style="margin: 0;" @click="statusDialog = true">
        状态
      </el-button>
      <el-button style="margin: 0;" @click="dataExport">
        下载
      </el-button>
    </div>
    <div class="table-wrapper">
      <WaveBuoyTable :loading="loading" :data-list="dataList" />
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

    <DeviceCommand
      v-model:visible="controlDialog" v-model:device="selectedDevice"
    />
    <DeviceProperty
      v-model:visible="propertyDialog" v-model:device-id="selectedDeviceId"
    />
    <DeviceStatus
      v-model:visible="statusDialog"
      v-model:device="selectedDevice"
    />
  </div>
</template>

<style lang="scss" scoped>
.app-container {
  height: calc(100vh - 110px);
  display: flex;
  flex-direction: column;
  padding: 5px;
}

.el-alert {
  margin: 0px 0px 5px 0px;
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
  .search-wrapper .el-select,
  .search-wrapper .channel-dropdown-wrapper,
  .search-wrapper .channel-dropdown-wrapper .el-dropdown,
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
}

.data-item {
  display: flex;
  font-size: 12px;
  align-items: center;
  line-height: 1.4;
  padding: 0;
}

.info-icon {
  color: #409eff;
  cursor: pointer;
  margin-left: 5px;
  font-size: 14px;
}

.charging-panels {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
}

.charging {
  border-radius: 2px;
  padding: 0 4px;
  border-radius: 2px;
  background-color: #67c23a;
  color: white;
}

.not-charging {
  border-radius: 2px;
  padding: 0 4px;
  background-color: #909399;
  color: white;
}
</style>
