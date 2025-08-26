<script lang="ts" setup>
import ChannelDropdown from "@@/components/ChannelDropdown/index.vue"
import { InfoFilled } from "@element-plus/icons-vue"
import { useAnchorPagination } from "@/common/hooks/useAnchorPagination"
import { useDeviceEvent } from "@/common/hooks/useDeviceEvent"
import { useSerialNumberSelection } from "@/common/hooks/useSerialNumberSelection"
import { parseLatHem, parseLeakStatus, parseLonHem, parseUbatt, parseUploadChannel } from "@/common/utils/data-parse"
import { formatDateTime } from "@/common/utils/datetime"
import DeviceCommand from "../components/DeviceCommand.vue"
import DeviceProperty from "../components/DeviceProperty.vue"
import DeviceStatus from "./components/DeviceStatus.vue"

const deviceModelId = "622a9ac7-7df1-42ea-9a26-f0a2a7abec3c"
const { selectedDeviceId, selectedDevice, serialNumberOptions } = useSerialNumberSelection(deviceModelId)
const {
  dataList,
  isLastPage,
  loading,
  pageIndex,
  uploadChannel,
  resetToFirstPage,
  goNextPage
} = useAnchorPagination(selectedDevice)

const { isReconnecting, isDisconnected } = useDeviceEvent(deviceModelId, (id, data) => {
  console.log("Device event:", id, data)
  if (id === selectedDeviceId.value) {
    resetToFirstPage()
  }
})

const controlDialog = ref<boolean>(false)
const propertyDialog = ref<boolean>(false)
const statusDialog = ref<boolean>(false)

function getChargingPanels(status: number) {
  const panels = []
  for (let i = 0; i < 5; i++) {
    const isCharging = (status & (1 << i)) !== 0
    panels.push({
      name: `No${i + 1}`,
      charging: isCharging
    })
  }
  return panels
}
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
      <ChannelDropdown @click="resetToFirstPage" v-model="uploadChannel" />
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
              接收时间：{{ formatDateTime(scope.row.recv_time) }}
            </div>
            <div class="data-item">
              上传通道：{{ parseUploadChannel(scope.row.upld_ch) }}
            </div>
            <div class="data-item">
              经度：{{ scope.row.lon.toFixed(4) }} ° {{ parseLonHem(scope.row.lon_hem) }}
            </div>
            <div class="data-item">
              纬度：{{ scope.row.lat.toFixed(4) }} ° {{ parseLatHem(scope.row.lat_hem) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="设备运行与信号" min-width="200px">
          <template #default="scope">
            <div class="data-item">
              搜星数：{{ scope.row.sat_num }}
            </div>
            <div class="data-item">
              信号强度：{{ scope.row.c_s_q }}
            </div>
            <div class="data-item">
              电池电压：{{ parseUbatt(scope.row.ubatt) }} V
            </div>
            <div class="data-item">
              主板温度：{{ scope.row.temp_mb }} ℃
            </div>
            <div class="data-item">
              充电状态：{{ scope.row.chg_stat === 0 ? "未充电" : "充电中" }}
              <el-tooltip effect="light" placement="top">
                <template #content>
                  <div class="charging-panels">
                    <div
                      v-for="(panel, index) in getChargingPanels(scope.row.chg_stat)"
                      :key="index"
                      :class="[panel.charging ? 'charging' : 'not-charging']"
                    >
                      {{ panel.name }}: {{ panel.charging ? '充电中' : '未充电' }}
                    </div>
                  </div>
                </template>
                <el-icon class="info-icon">
                  <InfoFilled />
                </el-icon>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="传感器与状态" min-width="120px">
          <template #default="scope">
            <div class="data-item">
              漏水状态：{{ parseLeakStatus(scope.row.leak_stat) }}
            </div>
            <div class="data-item">
              环境湿度：{{ (scope.row.rh * 100).toFixed(1) }} %
            </div>
            <div class="data-item">
              姿态X：{{ scope.row.ang_x }} °
            </div>
            <div class="data-item">
              姿态Y：{{ scope.row.ang_y }} °
            </div>
            <div class="data-item">
              姿态Z：{{ scope.row.ang_z }} °
            </div>
          </template>
        </el-table-column>
        <el-table-column label="总体波浪特征" min-width="150px">
          <template #default="scope">
            <div class="data-item">
              波数：{{ scope.row.wave_num }}
            </div>
            <div class="data-item">
              波向：{{ scope.row.dir }} °
            </div>
            <div class="data-item">
              平均波高：{{ scope.row.hm }} m
            </div>
            <div class="data-item">
              平均周期：{{ scope.row.tm }} s
            </div>
            <div class="data-item">
              最大波高：{{ scope.row.hmax }} m
            </div>
            <div class="data-item">
              最大周期：{{ scope.row.tmax }} s
            </div>
          </template>
        </el-table-column>
        <el-table-column label="涌浪特征" min-width="160px">
          <template #default="scope">
            <div class="data-item">
              涌浪谱平均周期：{{ scope.row.sw_tm }} s
            </div>
            <div class="data-item">
              涌浪谱峰周期：{{ scope.row.sw_tp }} s
            </div>
            <div class="data-item">
              涌浪谱峰波向：{{ scope.row.sw_dp }} °
            </div>
            <div class="data-item">
              涌浪波向扩散度：{{ scope.row.sw_dspr }} °
            </div>
            <div class="data-item">
              涌浪平均波向：{{ scope.row.sw_dmean }} °
            </div>
          </template>
        </el-table-column>
        <el-table-column label="风浪特征" min-width="170px">
          <template #default="scope">
            <div class="data-item">
              风浪谱的有效波高：{{ scope.row.ws_hm }} m
            </div>
            <div class="data-item">
              风浪谱平均周期：{{ scope.row.ws_tm }} s
            </div>
            <div class="data-item">
              风浪谱峰周期：{{ scope.row.ws_tp }} s
            </div>
            <div class="data-item">
              风浪谱峰波向：{{ scope.row.ws_dp }} °
            </div>
            <div class="data-item">
              风浪波向扩散度：{{ scope.row.ws_dspr }} °
            </div>
            <div class="data-item">
              风浪平均波向：{{ scope.row.ws_dmean }} °
            </div>
          </template>
        </el-table-column>
        <el-table-column label="分位数与谱特征" min-width="170px">
          <template #default="scope">
            <div class="data-item">
              三分之一波高：{{ scope.row.h13 }} m
            </div>
            <div class="data-item">
              三分之一周期：{{ scope.row.t13 }} s
            </div>
            <div class="data-item">
              十分之一波高：{{ scope.row.h10 }} m
            </div>
            <div class="data-item">
              十分之一周期：{{ scope.row.t10 }} s
            </div>
            <div class="data-item">
              谱的有效波高：{{ scope.row.spec_hm }} m
            </div>
            <div class="data-item">
              谱平均周期：{{ scope.row.spec_tm }} s
            </div>
          </template>
        </el-table-column>
        <el-table-column label="谱/风浪/涌浪特征" min-width="200px">
          <template #default="scope">
            <div class="data-item">
              谱峰周期：{{ scope.row.spec_tp }} s
            </div>
            <div class="data-item">
              谱峰波向：{{ scope.row.spec_dp }} °
            </div>
            <div class="data-item">
              波向扩散度：{{ scope.row.dspr }} °
            </div>
            <div class="data-item">
              平均波向：{{ scope.row.dmean }} °
            </div>
            <div class="data-item">
              风浪涌浪分离频率：{{ scope.row.sep_f.toFixed(3) }} Hz
            </div>
            <div class="data-item">
              涌浪谱的有效波高：{{ scope.row.sw_hm.toFixed(3) }} m
            </div>
          </template>
        </el-table-column>

        <el-table-column label="风/其他参数" min-width="160px">
          <template #default="scope">
            <div class="data-item">
              反演风速：{{ scope.row.wind_spd }} m/s
            </div>
            <div class="data-item">
              反演风向：{{ scope.row.wind_dir }} °
            </div>
            <div class="data-item">
              气压：{{ scope.row.press.toFixed(3) }} hPa
            </div>
            <div class="data-item">
              温度：{{ scope.row.temp.toFixed(4) }} °C
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
