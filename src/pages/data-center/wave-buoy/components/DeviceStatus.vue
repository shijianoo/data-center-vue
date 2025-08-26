<script lang="ts" setup>
import type { Device } from "@/common/apis/devices/type"
import { useDeviceStatusQuery } from "@/common/hooks/useDeviceStatusQuery"
import { formatDateTime } from "@/common/utils/datetime"

const visible = defineModel<boolean>("visible") // v-model:visible
const device = defineModel<Device>("device") // v-model:device

const { dataList, loading, pageIndex, isLastPage, goNextPage, resetToFirstPage } = useDeviceStatusQuery(device)

function handleDialogOpen() {
  if (!device.value) {
    ElMessage.warning("请先选择设备")
    visible.value = false
  }
}
function handleOpened() {
  resetToFirstPage()
}
function handleClosed() {
  dataList.value = []
}

// 波浪状态
function getWaveStat(code: number) {
  switch (code) {
    case 0:
      return "正常"
    case 1:
      return "连接异常，接收超时"
    default:
      return `未知状态(${code})`
  }
}

// 海温状态
function getTempStat(code: number) {
  switch (code) {
    case 0:
      return "正常"
    case 0xFF:
      return "校验异常"
    case 0xFE:
      return "接收超时"
    default:
      return `未知状态(${code})`
  }
}

// 气压状态
function getPresStat(code: number) {
  switch (code) {
    case 0:
      return "正常"
    case 1:
      return "异常,数据超限"
    default:
      return `未知状态(${code})`
  }
}

// 姿态状态
function getAttiStat(code: number) {
  switch (code) {
    case 0:
      return "正常"
    case 1:
      return "姿态传感器异常"
    default:
      return `未知状态(${code})`
  }
}

// 温湿度状态
function getHumiStat(code: number) {
  switch (code) {
    case 0:
      return "正常"
    case 1:
      return "湿度值偏大"
    default:
      return `未知状态(${code})`
  }
}

// 北斗状态
function getBdStat(code: number) {
  switch (code) {
    case 0:
      return "正常"
    case 1:
      return "获取波束失败"
    default:
      return `未知状态(${code})`
  }
}

// 4G状态
function getG4Stat(code: number) {
  switch (code) {
    case 0:
      return "正常"
    default:
      return `异常(${code})`
  }
}

// SD卡状态
function getSdStat(code: number) {
  switch (code) {
    case 0:
      return "正常"
    default:
      return `异常(${code})`
  }
}

// 复位状态
function getResetStat(code: number) {
  switch (code) {
    case 0:
      return "正常"
    default:
      return code
  }
}

// GPS状态
function getGpsStat(code: number) {
  switch (code) {
    case 0:
      return "正常"
    case 1:
      return "获取失败"
    default:
      return `未知状态(${code})`
  }
}

// GPS时间
function getGpsTime(code: number) {
  switch (code) {
    case 0:
      return "正常"
    case 1:
      return "获取失败"
    default:
      return `未知状态(${code})`
  }
}

// GPS经纬度
function getGpsSatNum(code: number) {
  switch (code) {
    case 0:
      return "正常"
    case 1:
      return "获取失败"
    default:
      return `未知状态(${code})`
  }
}
</script>

<template>
  <div>
    <el-dialog
      width="900px"

      v-model="visible"
      @open="handleDialogOpen"
      @opened="handleOpened"
      @closed="handleClosed"
      title="设备状态"
    >
      <div>
        <div>
          <el-table v-loading="loading" :data="dataList" height="600px">
            <el-table-column label="时间" min-width="200px">
              <template #default="scope">
                <div class="data-item">
                  采样时间：{{ formatDateTime(scope.row.time) }}
                </div>
                <div class="data-item">
                  接收时间：{{ formatDateTime(scope.row.recv_time) }}
                </div>
                <div class="data-item">
                  上传通道：{{ scope.row.upld_ch }}
                </div>
                <div class="data-item">
                  上传周期：{{ scope.row.upld_intv }}
                </div>
              </template>
            </el-table-column>
            <el-table-column label="模块状态" min-width="200px">
              <template #default="scope">
                <div class="data-item">
                  波浪模块：{{ getWaveStat(scope.row.wave_stat) }}
                </div>
                <div class="data-item">
                  海温模块：{{ getTempStat(scope.row.temp_stat) }}
                </div>
                <div class="data-item">
                  气压模块：{{ getPresStat(scope.row.pres_stat) }}
                </div>
                <div class="data-item">
                  姿态模块：{{ getAttiStat(scope.row.atti_stat) }}
                </div>
                <div class="data-item">
                  湿度模块：{{ getHumiStat(scope.row.humi_stat) }}
                </div>
              </template>
            </el-table-column>
            <el-table-column label="模块状态" min-width="200px">
              <template #default="scope">
                <div class="data-item">
                  北斗模块：{{ getBdStat(scope.row.bd_stat) }}
                </div>
                <div class="data-item">
                  4G模块：{{ getG4Stat(scope.row["4g_stat"]) }}
                </div>
                <div class="data-item">
                  SD卡模块：{{ getSdStat(scope.row.sd_stat) }}
                </div>
                <div class="data-item">
                  复位状态：{{ getResetStat(scope.row.reset_stat) }}
                </div>
              </template>
            </el-table-column>
            <el-table-column label="GPS状态" min-width="200px">
              <template #default="scope">
                <div class="data-item">
                  经纬度：{{ getGpsStat(scope.row.gps_coord) }}
                </div>
                <div class="data-item">
                  时间信息：{{ getGpsTime(scope.row.gps_time) }}
                </div>
                <div class="data-item">
                  卫星数量：{{ getGpsSatNum(scope.row.gps_sat_num) }}
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
      </div>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
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
