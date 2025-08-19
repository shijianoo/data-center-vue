<script lang="ts" setup>
import type { DateRange } from "@@/components/DateRangeDialog/index.vue"
import type { BuoyData } from "./apis/type"
import DateRangeDialog from "@@/components/DateRangeDialog/index.vue"
import { ref, watch } from "vue"
import { useSerialNumberSelection } from "@/common/hooks/useSerialNumberSelection"
import { formatDateTime } from "@/common/utils/datetime"
import { buildDownloadUrl, downloadFile } from "@/common/utils/download"
import { API_BASE_URL, getBuoyData } from "./apis"

const deviceModelId = "3445a2f6-8f01-4031-9369-e6f48f0c762a"
const { selectedDevice, selectedDeviceId, serialNumberOptions } = useSerialNumberSelection(deviceModelId)

const dataLoading = ref(false)
const buoyData = ref<BuoyData[]>([])
const pageIndex = ref(1)
const pageSize = ref(40)
const total = ref(0)

async function fetchBuoyData() {
  try {
    if (selectedDevice.value) {
      dataLoading.value = true
      const res = await getBuoyData(selectedDevice.value.serialNumber!, pageIndex.value - 1, pageSize.value)
      buoyData.value = res.data?.results || []
      total.value = res.data?.totalCount || 0
      ElMessage.success("查询浮标数据成功")
    }
  } catch (error) {
    console.error("查询浮标数据失败:", error)
    ElMessage.error("查询浮标数据失败")
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
    dataType: "driftingbuoy",
    fromCard: selectedDevice.value!.serialNumber!,
    start: dateRange.startDate,
    end: dateRange.endDate
  }

  const url = buildDownloadUrl(`${API_BASE_URL}/BDData/DowloadBuoyData`, params)
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
      <el-table :data="buoyData" height="100%" v-loading="dataLoading">
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
            <div class="data-item">
              传感器状态：
              <el-tooltip content="气压传感器状态" effect="light" placement="top">
                <el-tag effect="dark" size="small" :type="scope.row.airPressureSensorStatus === '0' ? 'success' : 'danger'">
                  AP
                </el-tag>
              </el-tooltip>
              <el-tooltip content="气温传感器状态" effect="light" placement="top">
                <el-tag effect="dark" size="small" :type="scope.row.airTemperatureSensorStatus === '0' ? 'success' : 'danger'">
                  AT
                </el-tag>
              </el-tooltip>
              <el-tooltip content="20cm海温/盐度传感器状态" effect="light" placement="top">
                <el-tag effect="dark" size="small" :type="scope.row.seaTemperatureSalinity20CMSensorStatus === '0' ? 'success' : 'danger'">
                  STSS
                </el-tag>
              </el-tooltip>
              <el-tooltip content="风向/风速传感器状态" effect="light" placement="top">
                <el-tag effect="dark" size="small" :type="scope.row.windSpeedWindDirectionSensorStatus === '0' ? 'success' : 'danger'">
                  WIND
                </el-tag>
              </el-tooltip>
              <el-tooltip content="红外皮温传感器状态" effect="light" placement="top">
                <el-tag effect="dark" size="small" :type="scope.row.skinTemperatureSensorStatus === '0' ? 'success' : 'danger'">
                  IST
                </el-tag>
              </el-tooltip>
              <el-tooltip content="25cm海温传感器状态" effect="light" placement="top">
                <el-tag effect="dark" size="small" :type="scope.row.seaTemperature25CMSensorStatus === '0' ? 'success' : 'danger'">
                  STA
                </el-tag>
              </el-tooltip>
              <el-tooltip content="30cm海温传感器状态" effect="light" placement="top">
                <el-tag effect="dark" size="small" :type="scope.row.seaTemperature30CMSensorStatus === '0' ? 'success' : 'danger'">
                  STB
                </el-tag>
              </el-tooltip>
              <el-tooltip content="水帆附着状态" effect="light" placement="top">
                <el-tag effect="dark" size="small" :type="scope.row.waterSailStatus === '0' ? 'success' : 'danger'">
                  WS
                </el-tag>
              </el-tooltip>
            </div>

            <!-- 第二行：系统运行状态 -->
            <div class="data-item">
              系统运行状态
              <el-tooltip content="程序状态" effect="light" placement="top">
                <el-tag effect="dark" size="small" :type="scope.row.startStatus === '0' ? 'success' : 'danger'">
                  START
                </el-tag>
              </el-tooltip>
              <el-tooltip content="看门狗状态" effect="light" placement="top">
                <el-tag effect="dark" size="small" :type="scope.row.watchdogStatus === '0' ? 'success' : 'danger'">
                  WDOG
                </el-tag>
              </el-tooltip>
              <el-tooltip content="50分浮标浸没状态" effect="light" placement="top">
                <el-tag effect="dark" size="small" :type="scope.row.buoyImmersionStatus50 === '0' ? 'danger' : 'success'">
                  WE0
                </el-tag>
              </el-tooltip>
              <el-tooltip content="40分浮标浸没状态" effect="light" placement="top">
                <el-tag effect="dark" size="small" :type="scope.row.buoyImmersionStatus40 === '0' ? 'danger' : 'success'">
                  WE1
                </el-tag>
              </el-tooltip>
              <el-tooltip content="30分浮标浸没状态" effect="light" placement="top">
                <el-tag effect="dark" size="small" :type="scope.row.buoyImmersionStatus30 === '0' ? 'danger' : 'success'">
                  WE2
                </el-tag>
              </el-tooltip>
              <el-tooltip content="20分浮标浸没状态" effect="light" placement="top">
                <el-tag effect="dark" size="small" :type="scope.row.buoyImmersionStatus20 === '0' ? 'danger' : 'success'">
                  WE3
                </el-tag>
              </el-tooltip>
              <el-tooltip content="10分浮标浸没状态" effect="light" placement="top">
                <el-tag effect="dark" size="small" :type="scope.row.buoyImmersionStatus10 === '0' ? 'danger' : 'success'">
                  WE4
                </el-tag>
              </el-tooltip>
              <el-tooltip content="00分浮标浸没状态" effect="light" placement="top">
                <el-tag effect="dark" size="small" :type="scope.row.buoyImmersionStatus00 === '0' ? 'danger' : 'success'">
                  WE5
                </el-tag>
              </el-tooltip>
            </div>

            <!-- 第三行：北斗通讯状态 -->
            <div class="data-item">
              北斗通讯状态：
            </div>

            <!-- 第四行：浮标姿态状态 -->
            <div class="data-item">
              浮标姿态状态
              <el-tooltip content="姿态数据有效状态" effect="light" placement="top">
                <el-tag effect="dark" size="small" :type="scope.row.attitudeValidStatus === '0' ? 'success' : 'danger'">
                  ATTI_Valid
                </el-tag>
              </el-tooltip>
              <el-tooltip content="姿态数据接收状态" effect="light" placement="top">
                <el-tag effect="dark" size="small" :type="scope.row.attitudeReceiveStatus === '0' ? 'success' : 'danger'">
                  ATTI_Rx
                </el-tag>
              </el-tooltip>
            </div>

            <!-- 第五行：GNSS定位状态 -->
            <div class="data-item">
              GNSS定位状态
              <el-tooltip content="有效接收卫星数量" effect="light" placement="top">
                <el-tag effect="dark" size="small" type="info">
                  {{ scope.row.receiveSatelliteNumber || '0' }}
                </el-tag>
              </el-tooltip>
              <el-tooltip content="GNSS数据有效状态" effect="light" placement="top">
                <el-tag effect="dark" size="small" :type="scope.row.gnssDataValidStatus === '0' ? 'success' : 'danger'">
                  Posi
                </el-tag>
              </el-tooltip>
              <el-tooltip content="GNSS校时数据有效状态" effect="light" placement="top">
                <el-tag effect="dark" size="small" :type="scope.row.gnssCheckTimeValidStatus === '0' ? 'success' : 'danger'">
                  ChkDT
                </el-tag>
              </el-tooltip>
            </div>

            <!-- 第六行：报警状态 -->
            <div class="data-item">
              报警状态
              <el-tooltip content="00分报警状态" effect="light" placement="top">
                <el-tag effect="dark" size="small" :type="scope.row.alarm00Status === '0' ? 'success' : 'danger'">
                  IS0
                </el-tag>
              </el-tooltip>
              <el-tooltip content="30分报警状态" effect="light" placement="top">
                <el-tag effect="dark" size="small" :type="scope.row.alarm30Status === '0' ? 'success' : 'danger'">
                  IS1
                </el-tag>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="pagination-bar">
      <el-pagination
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        :page-size="pageSize"
        :current-page="pageIndex"
        :page-sizes="[10, 20, 40, 80, 100]"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
    <!-- <el-dialog
      v-model="cardMgrDialog"
      title="卡号管理"
      @opened="openDialog"
      width="1000px"
      :close-on-click-modal="false"
    >
      <div>
        <el-button type="primary" @click="handleAdd">
          新增卡号
        </el-button>
        <el-table :data="cardList" height="600px" v-loading="loading">
          <el-table-column prop="cardNumber" label="卡号" width="160px" />
          <el-table-column prop="description" label="描述" />
          <el-table-column prop="startDate" label="开始时间" width="160px">
            <template #default="scope">
              {{ formatDateTime(scope.row.startDate) }}
            </template>
          </el-table-column>
          <el-table-column prop="endDate" label="结束时间" width="160px">
            <template #default="scope">
              {{ formatDateTime(scope.row.endDate) }}
            </template>
          </el-table-column>
          <el-table-column fixed="right" label="操作" width="180px" align="center">
            <template #default="scope">
              <el-button type="primary" text bg size="small" @click="handleEdit(scope.row)">
                编辑
              </el-button>
              <el-button type="danger" text bg size="small" @click="handleDelete(scope.row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <el-button @click="cardMgrDialog = false">
          关 闭
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="cardEditDialog"
      :title="isEdit ? '编辑卡号' : '新增卡号'"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="form" :rules="formRules" ref="formRef">
        <el-form-item label="设备卡号" prop="cardNumber">
          <el-input v-model="form.cardNumber" />
        </el-form-item>
        <el-form-item label="开始时间" prop="startDate">
          <el-date-picker v-model="form.startDate" type="datetime" />
        </el-form-item>
        <el-form-item label="结束时间" prop="endDate">
          <el-date-picker v-model="form.endDate" type="datetime" />
        </el-form-item>
        <el-form-item label="卡号描述" prop="description">
          <el-input v-model="form.description" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cardEditDialog = false">
          取 消
        </el-button>
        <el-button type="primary" @click="handleSave" :loading="loading">
          确 定
        </el-button>
      </template>
    </el-dialog> -->
    <DateRangeDialog
      v-model:visible="dateRangeVisible"
      @confirm="handleDateRangeConfirm"
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

.el-tag {
  height: 15px;
  min-width: 20px;
  font-size: 9px;
  border-radius: 0px;
  padding: 0 2px;
  margin-left: 2px;
}

.data-item {
  font-size: 12px;
  line-height: 1.4;
  padding: 0;
}
</style>
