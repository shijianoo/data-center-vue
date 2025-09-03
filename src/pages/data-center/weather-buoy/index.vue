<script lang="ts" setup>
import type { DateRange } from "@@/components/DateRangeDialog/index.vue"
import type { BuoyData } from "./apis/type"
import DateRangeDialog from "@@/components/DateRangeDialog/index.vue"
import { ref, watch } from "vue"
import { useSerialNumberSelection } from "@/common/hooks/useSerialNumberSelection"
import { formatDateTime } from "@/common/utils/datetime"
import { buildDownloadUrl, downloadFile } from "@/common/utils/download"
import { API_BASE_URL, getWeatherBuoyData } from "./apis"

// 状态指示器辅助函数
function getStatusClass(status: string | undefined, inverse = false) {
  if (inverse) {
    return status === "0" ? "status-danger" : "status-success"
  }
  return status === "0" ? "status-success" : "status-danger"
}

const deviceModelId = "9285430f-7e05-40de-94d4-bcdb40335697"
const { selectedDevice, selectedDeviceId, serialNumberOptions } = useSerialNumberSelection(deviceModelId)

const dataLoading = ref(false)
const buoyData = ref<BuoyData[]>([])
const pageIndex = ref(1)
const pageSize = ref(20)
const total = ref(0)

async function fetchBuoyData() {
  try {
    if (selectedDevice.value) {
      dataLoading.value = true
      const res = await getWeatherBuoyData(selectedDevice.value.serialNumber!, pageIndex.value, pageSize.value)
      buoyData.value = res.data?.results || []
      total.value = res.data?.totalCount || 0
      ElMessage.success("查询成功")
    }
  } catch (error) {
    console.error("查询浮标数据失败:", error)
    ElMessage.error("查询失败")
    buoyData.value = []
    total.value = 0
  } finally {
    dataLoading.value = false
  }
}

watch(
  () => selectedDevice.value,
  async () => {
    fetchBuoyData()
  },
  { immediate: true }
)

function handleSizeChange(size: number) {
  pageSize.value = size
  pageIndex.value = 1
  console.log(`每页条数: ${pageSize.value}`)
  fetchBuoyData()
}
function handleCurrentChange(page: number) {
  pageIndex.value = page
  console.log(`当前页码: ${pageIndex.value}`)
  fetchBuoyData()
}

const dateRangeVisible = ref(false)
function handleDateRangeConfirm(dateRange: DateRange) {
  console.log("开始日期", dateRange.startDate)
  console.log("结束日期", dateRange.endDate)

  if (!selectedDevice.value) {
    ElMessage.warning("请先选择设备")
  }

  const params = {
    deviceId: selectedDevice.value!.serialNumber!,
    start: dateRange.startDate,
    end: dateRange.endDate
  }

  const url = buildDownloadUrl(`${API_BASE_URL}/WeatherBuoy/Dowload`, params)
  downloadFile(url)
}
</script>

<template>
  <div class="app-container">
    <div class="search-wrapper">
      <el-select style="width: 300px;" v-model="selectedDeviceId" filterable placeholder="请选择设备">
        <el-option
          v-for="option in serialNumberOptions"
          :key="option.id"
          :label="option.label"
          :value="option.id"
        />
      </el-select>
      <el-button style="margin: 0;" type="primary" @click="fetchBuoyData">
        查询
      </el-button>
      <el-button style="margin: 0;" type="primary" @click="dateRangeVisible = true">
        下载
      </el-button>
    </div>

    <div class="table-wrapper">
      <el-table
        :data="buoyData" height="100%" v-loading="dataLoading" :virtual="true"
        :item-size="120"
      >
        <el-table-column label="时间" min-width="200">
          <template #default="scope">
            <div class="data-item">
              <div>
                接收时间：{{ formatDateTime(scope.row.receiveTime) }}
              </div>
              <div>
                观测日期：{{ formatDateTime(scope.row.observeDate) }}
              </div>
              <div>
                校验和：{{ scope.row.checkSum }}
              </div>
              <div>
                异或校验：{{ scope.row.xorCheck }}
              </div>
            </div>
          </template>
        </el-table-column>
        <!-- 第一列：浮标信息 -->
        <el-table-column label="浮标信息" min-width="110">
          <template #default="scope">
            <div class="data-item">
              <div>
                类型：{{ scope.row.buoyType }}
              </div>
              <div>
                经度：{{ scope.row.longitude }}
              </div>
              <div>
                经度半球：{{ scope.row.longitudeHemisphere }}
              </div>
              <div>
                纬度：{{ scope.row.latitude }}
              </div>
              <div>
                纬度半球：{{ scope.row.latitudeHemisphere }}
              </div>
            </div>
          </template>
        </el-table-column>
        <!-- 第二列：气温 -->
        <el-table-column label="气温(℃)" min-width="90">
          <template #default="scope">
            <div class="data-item">
              <div>
                00分: {{ scope.row.airTemperature00 }}
              </div>
              <div>
                10分: {{ scope.row.airTemperature10 }}
              </div>
              <div>
                20分: {{ scope.row.airTemperature20 }}
              </div>
              <div>
                30分: {{ scope.row.airTemperature30 }}
              </div>
              <div>
                40分: {{ scope.row.airTemperature40 }}
              </div>
              <div class="data-item">
                50分: {{ scope.row.airTemperature50 }}
              </div>
            </div>
          </template>
        </el-table-column>
        <!-- 第三列：红外皮温 -->
        <el-table-column label="红外皮温(℃)" min-width="110">
          <template #default="scope">
            <div class="data-item">
              <div>
                00分: {{ scope.row.skinTemperature00 }}
              </div>
              <div>
                10分: {{ scope.row.skinTemperature10 }}
              </div>
              <div>
                20分: {{ scope.row.skinTemperature20 }}
              </div>
              <div>
                30分: {{ scope.row.skinTemperature30 }}
              </div>
              <div>
                40分: {{ scope.row.skinTemperature40 }}
              </div>
              <div>
                50分: {{ scope.row.skinTemperature50 }}
              </div>
            </div>
          </template>
        </el-table-column>
        <!-- 第四列：气压 -->
        <el-table-column label="气压(hPa)" min-width="120">
          <template #default="scope">
            <div class="data-item">
              <div>
                气压00分: {{ scope.row.pressure00 }}
              </div>
              <div>
                气压趋势00: {{ scope.row.pressureTrend00 }}
              </div>
              <div>
                气压30分: {{ scope.row.pressure30 }}
              </div>
              <div>
                气压趋势30: {{ scope.row.pressureTrend30 }}
              </div>
            </div>
          </template>
        </el-table-column>
        <!-- 第五列：海温(20cm) -->
        <el-table-column label="海温(20cm)℃" min-width="120">
          <template #default="scope">
            <div class="data-item">
              <div>
                00分: {{ scope.row.seaTemperature20CM00 }}
              </div>
              <div>
                15分: {{ scope.row.seaTemperature20CM15 }}
              </div>
              <div>
                30分: {{ scope.row.seaTemperature20CM30 }}
              </div>
              <div>
                45分: {{ scope.row.seaTemperature20CM45 }}
              </div>
            </div>
          </template>
        </el-table-column>
        <!-- 第六列：电导率 -->
        <el-table-column label="电导率(mS/cm)" min-width="130">
          <template #default="scope">
            <div class="data-item">
              <div>
                00分: {{ scope.row.salinity00 }}
              </div>
              <div>
                15分: {{ scope.row.salinity15 }}
              </div>
              <div>
                30分: {{ scope.row.salinity30 }}
              </div>
              <div>
                45分: {{ scope.row.salinity45 }}
              </div>
            </div>
          </template>
        </el-table-column>
        <!-- 第七列：风速 -->
        <el-table-column label="风速(m/s)" min-width="90">
          <template #default="scope">
            <div class="data-item">
              <div>
                00分: {{ scope.row.windSpeed00 }}
              </div>
              <div>
                10分: {{ scope.row.windSpeed10 }}
              </div>
              <div>
                20分: {{ scope.row.windSpeed20 }}
              </div>
              <div>
                30分: {{ scope.row.windSpeed30 }}
              </div>
              <div>
                40分: {{ scope.row.windSpeed40 }}
              </div>
              <div class="data-item">
                50分: {{ scope.row.windSpeed50 }}
              </div>
            </div>
          </template>
        </el-table-column>
        <!-- 第八列：风向 -->
        <el-table-column label="风向(°)" min-width="80">
          <template #default="scope">
            <div class="data-item">
              <div>
                00分: {{ scope.row.windDirection00 }}
              </div>
              <div>
                10分: {{ scope.row.windDirection10 }}
              </div>
              <div>
                20分: {{ scope.row.windDirection20 }}
              </div>
              <div>
                30分: {{ scope.row.windDirection30 }}
              </div>
              <div>
                40分: {{ scope.row.windDirection40 }}
              </div>
              <div>
                50分: {{ scope.row.windDirection50 }}
              </div>
            </div>
          </template>
        </el-table-column>
        <!-- 第九列：海温(25/30cm) -->
        <el-table-column label="海温(25/30cm)℃" min-width="140">
          <template #default="scope">
            <div class="data-item">
              <div>25cm-00分: {{ scope.row.seaTemperature25CM00 }}</div>
              <div>25cm-30分: {{ scope.row.seaTemperature25CM30 }}</div>
              <div>30cm-00分: {{ scope.row.seaTemperature30CM00 }}</div>
              <div>30cm-30分: {{ scope.row.seaTemperature30CM30 }}</div>
            </div>
          </template>
        </el-table-column>
        <!-- 第十列：浮标状态 -->
        <el-table-column label="浮标状态" min-width="130">
          <template #default="scope">
            <div class="data-item">
              <div>进水状态：{{ scope.row.waterIngressStatus }}</div>
              <div>主板温度：{{ scope.row.boardTemperature }} ℃</div>
              <div>电源电压：{{ scope.row.supplyVoltage }} V</div>
              <div>横滚角：{{ scope.row.attitudeRollAngle }} °</div>
              <div>俯仰角：{{ scope.row.attitudePitchAngle }} °</div>
              <div>方位角：{{ scope.row.attitudeBearingAngle }} °</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="设备状态" min-width="340">
          <template #default="scope">
            <!-- 第一行：传感器状态 -->
            <div class="data-item device-status">
              <span class="status-label">传感器状态:</span>
              <span
                class="status-indicator"
                :class="getStatusClass(scope.row.airPressureSensorStatus)"
                :title="`气压传感器状态: ${scope.row.airPressureSensorStatus === '0' ? '正常' : '异常'}`"
              >AP</span>
              <span
                class="status-indicator"
                :class="getStatusClass(scope.row.airTemperatureSensorStatus)"
                :title="`气温传感器状态: ${scope.row.airTemperatureSensorStatus === '0' ? '正常' : '异常'}`"
              >AT</span>
              <span
                class="status-indicator"
                :class="getStatusClass(scope.row.seaTemperatureSalinity20CMSensorStatus)"
                :title="`20cm海温/盐度传感器状态: ${scope.row.seaTemperatureSalinity20CMSensorStatus === '0' ? '正常' : '异常'}`"
              >STSS</span>
              <span
                class="status-indicator"
                :class="getStatusClass(scope.row.windSpeedWindDirectionSensorStatus)"
                :title="`风向/风速传感器状态: ${scope.row.windSpeedWindDirectionSensorStatus === '0' ? '正常' : '异常'}`"
              >WIND</span>
              <span
                class="status-indicator"
                :class="getStatusClass(scope.row.skinTemperatureSensorStatus)"
                :title="`红外皮温传感器状态: ${scope.row.skinTemperatureSensorStatus === '0' ? '正常' : '异常'}`"
              >IST</span>
              <span
                class="status-indicator"
                :class="getStatusClass(scope.row.seaTemperature25CMSensorStatus)"
                :title="`25cm海温传感器状态: ${scope.row.seaTemperature25CMSensorStatus === '0' ? '正常' : '异常'}`"
              >STA</span>
              <span
                class="status-indicator"
                :class="getStatusClass(scope.row.seaTemperature30CMSensorStatus)"
                :title="`30cm海温传感器状态: ${scope.row.seaTemperature30CMSensorStatus === '0' ? '正常' : '异常'}`"
              >STB</span>
              <span
                class="status-indicator"
                :class="getStatusClass(scope.row.waterSailStatus)"
                :title="`水帆附着状态: ${scope.row.waterSailStatus === '0' ? '正常' : '异常'}`"
              >WS</span>
            </div>

            <!-- 第二行：系统运行状态 -->
            <div class="data-item device-status">
              <span class="status-label">系统运行状态:</span>
              <span
                class="status-indicator"
                :class="getStatusClass(scope.row.startStatus)"
                :title="`程序状态: ${scope.row.startStatus === '0' ? '正常' : '异常'}`"
              >START</span>
              <span
                class="status-indicator"
                :class="getStatusClass(scope.row.watchdogStatus)"
                :title="`看门狗状态: ${scope.row.watchdogStatus === '0' ? '正常' : '异常'}`"
              >WDOG</span>
              <span
                class="status-indicator"
                :class="getStatusClass(scope.row.buoyImmersionStatus50, true)"
                :title="`50分浮标浸没状态: ${scope.row.buoyImmersionStatus50 === '0' ? '浸没' : '正常'}`"
              >WE0</span>
              <span
                class="status-indicator"
                :class="getStatusClass(scope.row.buoyImmersionStatus40, true)"
                :title="`40分浮标浸没状态: ${scope.row.buoyImmersionStatus40 === '0' ? '浸没' : '正常'}`"
              >WE1</span>
              <span
                class="status-indicator"
                :class="getStatusClass(scope.row.buoyImmersionStatus30, true)"
                :title="`30分浮标浸没状态: ${scope.row.buoyImmersionStatus30 === '0' ? '浸没' : '正常'}`"
              >WE2</span>
              <span
                class="status-indicator"
                :class="getStatusClass(scope.row.buoyImmersionStatus20, true)"
                :title="`20分浮标浸没状态: ${scope.row.buoyImmersionStatus20 === '0' ? '浸没' : '正常'}`"
              >WE3</span>
              <span
                class="status-indicator"
                :class="getStatusClass(scope.row.buoyImmersionStatus10, true)"
                :title="`10分浮标浸没状态: ${scope.row.buoyImmersionStatus10 === '0' ? '浸没' : '正常'}`"
              >WE4</span>
              <span
                class="status-indicator"
                :class="getStatusClass(scope.row.buoyImmersionStatus00, true)"
                :title="`00分浮标浸没状态: ${scope.row.buoyImmersionStatus00 === '0' ? '浸没' : '正常'}`"
              >WE5</span>
            </div>

            <!-- 第三行：北斗通讯状态 -->
            <div class="data-item device-status">
              <span class="status-label">北斗通讯状态:</span>
            </div>

            <!-- 第四行：浮标姿态状态 -->
            <div class="data-item device-status">
              <span class="status-label">浮标姿态状态:</span>
              <span
                class="status-indicator"
                :class="getStatusClass(scope.row.attitudeValidStatus)"
                :title="`姿态数据有效状态: ${scope.row.attitudeValidStatus === '0' ? '正常' : '异常'}`"
              >ATTI_Valid</span>
              <span
                class="status-indicator"
                :class="getStatusClass(scope.row.attitudeReceiveStatus)"
                :title="`姿态数据接收状态: ${scope.row.attitudeReceiveStatus === '0' ? '正常' : '异常'}`"
              >ATTI_Rx</span>
            </div>

            <!-- 第五行：GNSS定位状态 -->
            <div class="data-item device-status">
              <span class="status-label">GNSS定位状态:</span>
              <span
                class="status-indicator status-info"
                :title="`有效接收卫星数量: ${scope.row.receiveSatelliteNumber || '0'}`"
              >{{ scope.row.receiveSatelliteNumber || '0' }}</span>
              <span
                class="status-indicator"
                :class="getStatusClass(scope.row.gnssDataValidStatus)"
                :title="`GNSS数据有效状态: ${scope.row.gnssDataValidStatus === '0' ? '正常' : '异常'}`"
              >Posi</span>
              <span
                class="status-indicator"
                :class="getStatusClass(scope.row.gnssCheckTimeValidStatus)"
                :title="`GNSS校时数据有效状态: ${scope.row.gnssCheckTimeValidStatus === '0' ? '正常' : '异常'}`"
              >ChkDT</span>
            </div>

            <!-- 第六行：报警状态 -->
            <div class="data-item device-status">
              <span class="status-label">报警状态:</span>
              <span
                class="status-indicator"
                :class="getStatusClass(scope.row.alarm00Status)"
                :title="`00分报警状态: ${scope.row.alarm00Status === '0' ? '正常' : '异常'}`"
              >IS0</span>
              <span
                class="status-indicator"
                :class="getStatusClass(scope.row.alarm30Status)"
                :title="`30分报警状态: ${scope.row.alarm30Status === '0' ? '正常' : '异常'}`"
              >IS1</span>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="pagination-bar" style="display: flex; justify-content: flex-end;">
      <el-pagination
        background
        layout="total, prev, pager, next"
        :total="total"
        :page-size="pageSize"
        :current-page="pageIndex"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
    <DateRangeDialog
      v-model:visible="dateRangeVisible"
      @confirm="handleDateRangeConfirm"
      :max-days="30"
    />
  </div>
</template>

<style lang="scss">
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
}

.data-item {
  font-size: 12px;
  line-height: 1.4;
}

.device-status {
  display: flex;
  align-items: center;
  gap: 2px;
}

.status-label {
  display: inline-block;
  vertical-align: middle;
  white-space: nowrap;
}

.status-indicator {
  display: inline-block;
  color: white;
  cursor: help;
  padding: 0 1px;
  min-width: 20px;
  text-align: center;
  font-size: 9px;
  height: 15px;
  line-height: 15px;
  border: 1px solid transparent;

  &:hover {
    border-color: black;
  }

  &.status-success {
    background-color: #67c23a;
  }

  &.status-danger {
    background-color: red;
  }

  &.status-info {
    background-color: #909399;
  }
}
</style>
