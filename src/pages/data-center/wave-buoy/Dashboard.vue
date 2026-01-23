<script lang="ts" setup>
import type { LocationInfo } from "../components/DeviceLocation.vue"
import type { FieldInfo } from "../components/FieldDataChart.vue"
import type { Device } from "@/common/apis/devices/type"
import { queryDeviceLatestData } from "@/common/apis/data-query"
import { useSerialNumberSelection } from "@/common/hooks/useSerialNumberSelection"
import { formatHybridAgo } from "@/common/utils/datetime"
import DeviceCommand from "../components/DeviceCommand.vue"
import DeviceLocation from "../components/DeviceLocation.vue"
import FieldDataChart from "../components/FieldDataChart.vue"

defineOptions({
  name: "WaveBuoyIndex"
})

const deviceModelId = "019b4a4f-303a-773d-b9d4-008ce510f3b1"
const { devicesLoading, devices } = useSerialNumberSelection(deviceModelId)

const latestData = ref<Map<string, any>>(new Map())
const locationInfos = ref<LocationInfo[]>([])
watch(
  devices,
  async (newDevices) => {
    for (const device of newDevices) {
      // 没缓存过才去请求
      if (!latestData.value.has(device.serialNumber)) {
        const res = await queryDeviceLatestData(device.modelNumber!, device.serialNumber)
        latestData.value.set(device.serialNumber, res.data)
      }
    }
    console.log(latestData.value)
    for (const device of newDevices) {
      const data = latestData.value.get(device.serialNumber)
      locationInfos.value.push({
        id: device.serialNumber,
        desc: device.description,
        lon: data.lon,
        lat: data.lat,
        data: new Map([
          ["平均波高", `${data.hm} m`],
          ["平均周期", `${data.tm} s`],
          ["三分之一波高", `${data.h13} m`],
          ["三分之一周期", `${data.t13} s`]
        ])
      })
    }
  }
)

function getLatestData(serialNumber: string): any {
  return latestData.value.get(serialNumber) ?? {}
}

const fields: FieldInfo[] = [
  { name: "hm", label: "平均波高" },
  { name: "tm", label: "平均周期" },
  { name: "h13", label: "三分之一波高" },
  { name: "t13", label: "三分之一周期" }
]

const controlDialog = ref<boolean>(false)
const selectedDevice = ref<Device | null>(null)
</script>

<template>
  <div class="h-[calc(100vh-110px)] flex flex-col p-2 gap-2">
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-2">
      <div class="bg-white min-h-90 px-3 pt-1 pb-2">
        <el-tabs class="h-full" v-loading="devicesLoading">
          <el-tab-pane :lazy="true" class="h-full" :label="device.serialNumber" v-for="device in devices" :key="device.id">
            <FieldDataChart :default-days="7" :windows="['1m', '1h']" default-window="1m" :device="device" :fields="fields" />
          </el-tab-pane>
        </el-tabs>
      </div>
      <!-- 地图区域 -->
      <div class="bg-white min-h-90 flex flex-col">
        <div class="px-3 py-2 border-b border-gray-100">
          设备位置
        </div>
        <div class="flex-1 px-3 pb-3" v-loading="devicesLoading">
          <DeviceLocation :location-infos="locationInfos" />
        </div>
      </div>
    </div>
    <div class="bg-white flex-1">
      <div class="p-2 min-h-88">
        <el-table :style="{ height: '100%' }" v-loading="devicesLoading" :data="devices">
          <el-table-column label="序列号" min-width="200" prop="serialNumber" align="center" />
          <el-table-column label="备注" min-width="200" prop="description" align="center" />
          <el-table-column label="上传周期(分钟)" min-width="120" align="center">
            <template #default="scope">
              {{
                scope.row.properties.UploadInterval
              }}
            </template>
          </el-table-column>
          <el-table-column label="最近上报时间" min-width="160" align="center">
            <template #default="scope">
              {{ formatHybridAgo(getLatestData(scope.row.serialNumber).time) ?? '-' }}
            </template>
          </el-table-column>
          <el-table-column label="固件版本" min-width="80" align="center">
            <template #default="scope">
              {{
                scope.row.properties.FirmwareVersion
              }}
            </template>
          </el-table-column>
          <el-table-column label="信号强度(CSQ)" min-width="120" align="center">
            <template #default="scope">
              {{ getLatestData(scope.row.serialNumber).csq }}
            </template>
          </el-table-column>
          <el-table-column label="电池电量(V)" min-width="100">
            <template #default="scope">
              {{ getLatestData(scope.row.serialNumber).ubatt / 1000 }}
            </template>
          </el-table-column>

          <el-table-column label="操作" align="center">
            <template #default="scope">
              <el-button @click="() => { controlDialog = true; selectedDevice = scope.row }" type="primary" text bg size="small">
                控制
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
    <DeviceCommand
      v-if="selectedDevice"
      v-model:visible="controlDialog"
      v-model:device="selectedDevice"
    />
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
