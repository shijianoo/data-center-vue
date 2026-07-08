<script lang="ts" setup>
import type { LocationInfo } from "../components/DeviceLocation.vue"
import type { FieldInfo } from "../components/FieldDataChart.vue"
import type { Device } from "@/common/apis/devices/type"
import { influxLatestDataQueryApi } from "@/common/apis/data-query"
import { useSerialNumberSelection } from "@/common/hooks/useSerialNumberSelection"
import DeviceCommand from "../components/DeviceCommand.vue"
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
        const res = await influxLatestDataQueryApi({
          bucket: "sob23bs_v1_t1",
          measurement: "data",
          serialNumber: device.serialNumber
        })
        latestData.value.set(device.serialNumber, res.data)
      }
    }
    console.log(latestData.value)
    for (const device of newDevices) {
      const data = latestData.value.get(device.serialNumber)
      if (data) {
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
  }
)

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
    <div class="bg-white h-full px-3 pt-1 pb-2">
      <el-tabs class="h-full" v-loading="devicesLoading">
        <el-tab-pane :lazy="true" class="h-full" :label="device.serialNumber" v-for="device in devices" :key="device.id">
          <FieldDataChart bucket="sob23bs_v1_t1" measurement="data" :default-days="7" :windows="['1m', '1h']" default-window="1m" :device="device" :fields="fields" />
        </el-tab-pane>
      </el-tabs>
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
