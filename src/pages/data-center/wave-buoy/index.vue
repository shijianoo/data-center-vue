<script lang="ts" setup>
import type { FieldInfo } from "../components/FieldDataChart.vue"
import { useSerialNumberSelection } from "@/common/hooks/useSerialNumberSelection"
import DeviceLocation from "../components/DeviceLocation.vue"
import FieldDataChart from "../components/FieldDataChart.vue"

const deviceModelId = "622a9ac7-7df1-42ea-9a26-f0a2a7abec3c"
const { devicesLoading, devices } = useSerialNumberSelection(deviceModelId)

const fields: FieldInfo[] = [
  { name: "hm", label: "平均波高" },
  { name: "tm", label: "平均周期" },
  { name: "h13", label: "三分之一波高" },
  { name: "t13", label: "三分之一周期" }
]
</script>

<template>
  <div class="h-[calc(100vh-110px)] flex flex-col p-2 gap-2">
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-2">
      <div class="bg-white min-h-90 px-3 pt-1 pb-2">
        <el-tabs class="h-full" v-loading="devicesLoading">
          <el-tab-pane :lazy="true" class="h-full" :label="device.serialNumber" v-for="device in devices" :key="device.id">
            <FieldDataChart :default-days="1" :windows="['1m', '1h']" default-window="1m" :device="device" :fields="fields" />
          </el-tab-pane>
        </el-tabs>
      </div>
      <!-- 地图区域 -->
      <div class="bg-white min-h-90 flex flex-col">
        <div class="px-3 py-2 border-b border-gray-100">
          设备位置
        </div>
        <div class="flex-1 px-3 pb-3">
          <DeviceLocation />
        </div>
      </div>
    </div>
    <div class="bg-white flex-1">
      <div class="p-2 min-h-88">
        <el-table style="height: 100%;" v-loading="devicesLoading" :data="devices">
          <el-table-column label="设备序列号" min-width="200" prop="serialNumber" />
          <el-table-column label="设备备注" min-width="200" prop="description" />
          <el-table-column label="最近上报时间" min-width="200" prop="lastReportTime" />
          <el-table-column label="在线状态" min-width="200" />
          <el-table-column label="固件版本" min-width="200" prop="firmwareVersion" />
          <el-table-column label="信号强度" min-width="200" prop="signalStrength" />
          <el-table-column label="电池电量" min-width="200" />
          <el-table-column label="操作" min-width="200">
            <template #default>
              <el-button type="primary" text bg size="small">
                控制
              </el-button>
              <el-button type="primary" text bg size="small">
                属性
              </el-button>
              <el-button type="primary" text bg size="small">
                状态
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.h-full {
  :deep(.el-tabs__header) {
    margin: 0 0 0px !important;
  }

  :deep(.el-tabs__nav-wrap::after) {
    height: 0 !important; /* 移除分割线 */
  }

  :deep(.el-tabs__item) {
    padding: 0 5px !important;
    height: 30px !important;
  }
}
</style>
