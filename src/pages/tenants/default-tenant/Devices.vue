<script setup lang="ts">
import type { Device } from "@/common/apis/devices/type"
import { getDevicesFromTenant } from "@/common/apis/device-assignment"
import { formatHybridAgo } from "@/common/utils/datetime"
import { useTenantContextStore } from "@/pinia/stores/tenantContext"
import DeviceProfileDialog from "./components/DeviceProfileDialog.vue"

const tentantContext = useTenantContextStore()
const deviceList = ref<Device[]>([])
const showProfileDialog = ref(false)
const currentDevice = ref<Device | null>(null)
const searchKey = ref("")
const modelFilter = ref("all")
const modelList = computed(() => {
  return deviceList.value.map(device => device.modelName).filter((value, index, self) => self.indexOf(value) === index)
})
const onlineFilter = ref("all")
const filteredDeviceList = computed(() => {
  return deviceList.value.filter((device) => {
    const name = device.displayName || device.deviceName || device.serialNumber
    return name.includes(searchKey.value) && (modelFilter.value === "all" || device.modelName === modelFilter.value) && (onlineFilter.value === "all" || device.isOnline === (onlineFilter.value === "online"))
  })
})

watch(() => tentantContext.currentTenant, () => {
  fetchData()
}, { immediate: true })

async function fetchData() {
  if (!tentantContext.currentTenant) return
  const { data } = await getDevicesFromTenant(tentantContext.currentTenant!.id)
  console.log(data)
  deviceList.value = data
}

function handleConfigure(device: Device) {
  currentDevice.value = device
  showProfileDialog.value = true
}
</script>

<template>
  <div class="devices-container">
    <div class="toolbar">
      <input type="text" v-model="searchKey" class="search-box" placeholder="输入 SN 或 设备名称...">
      <select class="filter-select" v-model="modelFilter">
        <option value="all">
          所有型号
        </option>
        <option v-for="model in modelList" :key="model" :value="model">
          {{ model }}
        </option>
      </select>
      <select class="filter-select" v-model="onlineFilter">
        <option value="all">
          所有状态
        </option>
        <option value="online">
          在线
        </option>
        <option value="offline">
          离线
        </option>
      </select>
    </div>

    <div class="table-wrap">
      <table class="dev-table">
        <thead>
          <tr>
            <th width="20%">
              设备名称 / SN
            </th>
            <th width="20%">
              型号
            </th>
            <th width="10%">
              状态
            </th>
            <th width="20%">
              最新上报
            </th>
            <th width="10%">
              固件
            </th>
            <th width="10%">
              操作
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="device in filteredDeviceList" :key="device.id">
            <td><b>{{ device.displayName || device.deviceName || device.serialNumber }}</b><br><span style="font-size:12px; color:#999">{{ device.deviceCode }}</span></td>
            <td>{{ device.modelName }}</td>
            <td><span class="badge" :class="device.isOnline ? 'bg-green' : 'bg-gray'">{{ device.isOnline ? '在线' : '离线' }}</span></td>
            <td style="color:#64748b">
              {{ formatHybridAgo(device.lastUploadTime) }}
            </td>

            <td>{{ device.firmwareVersion ?? "-" }}</td>
            <td><a href="#" style="color:var(--primary)" @click.prevent="handleConfigure(device)">配置</a></td>
          </tr>
        </tbody>
      </table>
      <div class="pagination">
        <span>共 {{ filteredDeviceList.length }} 条记录</span>
      </div>
    </div>
    <DeviceProfileDialog v-model:visible="showProfileDialog" :device="currentDevice" @success="fetchData()" />
  </div>
</template>

<style scoped>
.devices-container {
  min-height: 100vh;
  max-width: 1280px;
  padding: 20px;
  margin: 0 auto;
  width: 100%;
}

.section-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

a {
  text-decoration: none;
  color: inherit;
}

/* 工具栏 */
.toolbar {
  background: white;
  padding: 20px;
  border-radius: 8px 8px 0 0;
  border: 1px solid var(--border);
  border-bottom: none;
  display: flex;
  gap: 15px;
  align-items: center;
}
.search-box {
  font-size: 14px;
  height: 30px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  width: 300px;
}
.filter-select {
  font-size: 14px;
  height: 30px;
  padding: 0 13px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: white;
}

/* 表格 */
.table-wrap {
  background: white;
  border: 1px solid var(--border);
  border-radius: 0 0 8px 8px;
  overflow: hidden;
}
.dev-table {
  width: 100%;
  border-collapse: collapse;
}
.dev-table th {
  text-align: left;
  padding: 15px 20px;
  background: #f8fafc;
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
  border-bottom: 1px solid var(--border);
}
.dev-table td {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  font-size: 14px;
  vertical-align: middle;
}
.dev-table tr:hover {
  background: #fcfcfc;
}

.badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}
.bg-green {
  background: #ecfdf5;
  color: #10b981;
}
.bg-gray {
  background: #f1f5f9;
  color: #64748b;
}

.pagination {
  padding: 15px;
  font-size: 13px;
  color: #64748b;
  display: flex;
  justify-content: space-between;
}
</style>
