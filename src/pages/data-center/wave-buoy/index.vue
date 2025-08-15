<script lang="ts" setup>
import { useAnchorPagination } from "@/common/hooks/useAnchorPagination"
import { useDeviceEvent } from "@/common/hooks/useDeviceEvent"
import { useSerialNumberSelection } from "@/common/hooks/useSerialNumberSelection"
import { formatDateTime } from "@/common/utils/datetime"
import DeviceCommand from "../components/DeviceCommand.vue"
import DeviceProperty from "../components/DeviceProperty.vue"
import DeviceStatus from "./components/DeviceStatus.vue"

const deviceModelId = "97d8f296-bb74-4aa5-8f27-38d454f28b0a"
const { selectedDeviceId, selectedDevice, serialNumberOptions } = useSerialNumberSelection(deviceModelId)
const {
  dataList,
  isLastPage,
  loading,
  pageIndex,
  resetToFirstPage,
  goNextPage
} = useAnchorPagination(deviceModelId, selectedDevice)

const { isReconnecting, isDisconnected } = useDeviceEvent(deviceModelId, (id, data) => {
  console.log("Device event:", id, data)
  if (id === selectedDeviceId.value) {
    console.warn("已收到相同设备的数据：", id)
    resetToFirstPage()
  } else {
    console.warn("已收到不同设备的数据：", id)
  }
})

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
      <el-select style="width: 300px;" v-model="selectedDeviceId" filterable placeholder="请选择设备">
        <el-option
          v-for="option in serialNumberOptions"
          :key="option.id"
          :label="option.label"
          :value="option.id"
        />
      </el-select>
      <el-button type="primary" @click="resetToFirstPage">
        查询
      </el-button>
      <el-button style="margin: 0;" @click="controlDialog = true">
        控制
      </el-button>
      <el-button style="margin: 0;" @click="propertyDialog = true">
        属性
      </el-button>
      <el-button style="margin: 0;" @click="statusDialog = true">
        状态
      </el-button>
    </div>
    <div class="table-wrapper">
      <el-table v-loading="loading" :data="dataList" height="100%">
        <el-table-column label="时间与定位" min-width="200px">
          <template #default="scope">
            <div class="data-item">
              采样时间：{{ formatDateTime(scope.row.time) }}
            </div>
            <div class="data-item">
              接收时间：{{ formatDateTime(scope.row.ReceiveTime) }}
            </div>
            <div class="data-item">
              经度：{{ scope.row.Lon }} °
            </div>
            <div class="data-item">
              经度半球：{{ scope.row.LonHem }}
            </div>
            <div class="data-item">
              纬度：{{ scope.row.Lat }} °
            </div>
            <div class="data-item">
              纬度半球：{{ scope.row.LatHem }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="设备运行与信号" min-width="200px">
          <template #default="scope">
            <div class="data-item">
              上传通道：{{ scope.row.UploadChannel }}
            </div>
            <div class="data-item">
              搜星数：{{ scope.row.SatNum }}
            </div>
            <div class="data-item">
              信号强度：{{ scope.row.CSQ }}
            </div>
            <div class="data-item">
              电池电压：{{ scope.row.Ubatt }} V
            </div>
            <div class="data-item">
              主板温度：{{ scope.row.TempMb }} ℃
            </div>
            <div class="data-item">
              充电状态：{{ scope.row.ChargingStatus }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="传感器与状态" min-width="120px">
          <template #default="scope">
            <div class="data-item">
              漏水状态：{{ scope.row.LeakStatus }}
            </div>
            <div class="data-item">
              环境湿度：{{ scope.row.Rh }}
            </div>
            <div class="data-item">
              姿态X：{{ scope.row.AngX }} °
            </div>
            <div class="data-item">
              姿态Y：{{ scope.row.AngY }} °
            </div>
            <div class="data-item">
              姿态Z：{{ scope.row.AngZ }} °
            </div>
          </template>
        </el-table-column>
        <el-table-column label="总体波浪特征" min-width="150px">
          <template #default="scope">
            <div class="data-item">
              波数：{{ scope.row.WaveNum }}
            </div>
            <div class="data-item">
              平均波高：{{ scope.row.Hm }} m
            </div>
            <div class="data-item">
              平均周期：{{ scope.row.Tm }} s
            </div>
            <div class="data-item">
              最大波高：{{ scope.row.Hmax }} m
            </div>
            <div class="data-item">
              最大周期：{{ scope.row.Tmax }} s
            </div>
            <div class="data-item">
              波向：{{ scope.row.Dir }} °
            </div>
          </template>
        </el-table-column>
        <el-table-column label="涌浪特征" min-width="160px">
          <template #default="scope">
            <div class="data-item">
              涌浪谱平均周期：{{ scope.row.SwTm }} s
            </div>
            <div class="data-item">
              涌浪谱峰周期：{{ scope.row.SwTp }} s
            </div>
            <div class="data-item">
              涌浪谱峰波向：{{ scope.row.SwDp }} °
            </div>
            <div class="data-item">
              涌浪波向扩散度：{{ scope.row.SwDspr }} °
            </div>
            <div class="data-item">
              涌浪平均波向：{{ scope.row.SwDmean }} °
            </div>
          </template>
        </el-table-column>
        <el-table-column label="风浪特征" min-width="170px">
          <template #default="scope">
            <div class="data-item">
              风浪谱的有效波高：{{ scope.row.WsHm }} m
            </div>
            <div class="data-item">
              风浪谱平均周期：{{ scope.row.WsTm }} s
            </div>
            <div class="data-item">
              风浪谱峰周期：{{ scope.row.WsTp }} s
            </div>
            <div class="data-item">
              风浪谱峰波向：{{ scope.row.WsDp }} °
            </div>
            <div class="data-item">
              风浪波向扩散度：{{ scope.row.WsDspr }} °
            </div>
            <div class="data-item">
              风浪平均波向：{{ scope.row.WsDmean }} °
            </div>
          </template>
        </el-table-column>
        <el-table-column label="分位数与谱特征" min-width="170px">
          <template #default="scope">
            <div class="data-item">
              三分之一波高：{{ scope.row.H13 }} m
            </div>
            <div class="data-item">
              三分之一周期：{{ scope.row.T13 }} s
            </div>
            <div class="data-item">
              十分之一波高：{{ scope.row.H10 }} m
            </div>
            <div class="data-item">
              十分之一周期：{{ scope.row.T10 }} s
            </div>
            <div class="data-item">
              谱的有效波高：{{ scope.row.SpecHm }} m
            </div>
            <div class="data-item">
              谱平均周期：{{ scope.row.SpecTm }} s
            </div>
          </template>
        </el-table-column>
        <el-table-column label="谱/风浪/涌浪特征" min-width="200px">
          <template #default="scope">
            <div class="data-item">
              谱峰周期：{{ scope.row.SpecTp }} s
            </div>
            <div class="data-item">
              谱峰波向：{{ scope.row.SpecDp }} °
            </div>
            <div class="data-item">
              波向扩散度：{{ scope.row.Dspr }} °
            </div>
            <div class="data-item">
              平均波向：{{ scope.row.Dmean }} °
            </div>
            <div class="data-item">
              风浪涌浪分离频率：{{ scope.row.SepF }} Hz
            </div>
            <div class="data-item">
              涌浪谱的有效波高：{{ scope.row.SwHm }} m
            </div>
          </template>
        </el-table-column>

        <el-table-column label="风/其他参数" min-width="160px">
          <template #default="scope">
            <div class="data-item">
              反演风速：{{ scope.row.WindSpd }} m/s
            </div>
            <div class="data-item">
              反演风向：{{ scope.row.WindDir }} °
            </div>
            <div class="data-item">
              气压：{{ scope.row.Press }} hPa
            </div>
            <div class="data-item">
              温度：{{ scope.row.Temp }} °C
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="pagination-bar">
      <el-button @click="resetToFirstPage" :disabled="loading">
        首页
      </el-button>
      <el-text>
        第 {{ pageIndex }} 页
      </el-text>
      <el-button @click="goNextPage" :disabled="isLastPage || loading">
        下一页
      </el-button>
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
}

.data-item {
  font-size: 12px;
  line-height: 1.4;
  padding: 0;
}
</style>
