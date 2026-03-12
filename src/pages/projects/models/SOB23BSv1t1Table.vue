<script lang="ts" setup>
import type { DeviceStatisticsDto } from "@/common/apis/statistics/projects/type"
import { getLatestTelemetryDataBatch } from "@/common/apis/telemetry"

const props = defineProps<{
  devices: DeviceStatisticsDto[]
}>()

const emit = defineEmits<{
  (e: "action", row: any): void
}>()

const latestsMap = ref<Record<string, any>>({})
function getStatusClass(status: boolean) {
  return status ? "sb-green" : "sb-red"
}

function getStatusText(status: boolean) {
  return status ? "正常" : "离线"
}

async function getTelemetryData() {
  const { data } = await getLatestTelemetryDataBatch({
    modelNumber: "SOB23BS",
    version: 1,
    dataType: 1
  }, props.devices.map(item => item.serialNumber))
  console.log(data)
  data.forEach((s) => {
    latestsMap.value[s.serialNumber] = s.data
  })

  console.log(latestsMap.value)
}

onMounted(() => {
  getTelemetryData()
})
</script>

<template>
  <div class="table-container">
    <table class="custom-table">
      <thead>
        <tr>
          <th width="15%">
            设备 / SN
          </th>
          <th width="10%">
            状态
          </th>
          <th width="10%">
            平均波高 (m)
          </th>
          <th width="10%">
            平均周期 (s)
          </th>
          <th width="10%">
            1/3波高 (m)
          </th>
          <th width="10%">
            1/3波周期 (s)
          </th>
          <th width="10%">
            电池 (V)
          </th>
          <th width="15%">
            操作
          </th>
        </tr>
      </thead>
      <tbody>
        <tr @click="emit('action', row)" v-for="(row, rIdx) in devices" :key="rIdx" :class="{ 'bg-danger-light': row.isOnline === false }">
          <td>
            <div style="font-weight: 600; color: var(--text-main);">
              {{ row.serialNumber }}
            </div>
            <div style="font-size: 12px; color: var(--text-sub);">
              ID: {{ row.deviceCode }}
            </div>
          </td>
          <td>
            <span class="status-badge" :class="getStatusClass(row.isOnline)">
              <span class="dot" /> {{ getStatusText(row.isOnline) }}
            </span>
          </td>
          <td>{{ latestsMap[row.serialNumber]?.hm || "-" }}</td>
          <td>{{ latestsMap[row.serialNumber]?.tm || "-" }}</td>
          <td>{{ latestsMap[row.serialNumber]?.h13 || "-" }}</td>
          <td>{{ latestsMap[row.serialNumber]?.t13 || "-" }}</td>
          <td>{{ latestsMap[row.serialNumber]?.ubatt / 1000 || "-" }}</td>
          <td><a class="link-primary">详情</a></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style lang="scss" scoped>
.table-container {
  width: 100%;
  overflow-x: auto;
}

.custom-table {
  width: 100%;
  border-collapse: collapse;
  th {
    text-align: left;
    padding: 12px 24px;
    height: 40px;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-sub);
    background: white;
    border-bottom: 1px solid var(--border);
  }
  td {
    padding: 16px 24px;
    font-size: 14px;
    border-bottom: 1px solid var(--border);
    vertical-align: middle;
  }
  tr {
    background: white;
    &.bg-danger-light {
      background: var(--danger-bg);
    }
  }
  tr:last-child td {
    border-bottom: none;
  }
  tr:hover td {
    background: #f8fafc;
  }
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
  &.sb-green {
    background: var(--success-bg);
    color: var(--success);
  }
  &.sb-red {
    background: var(--danger-bg);
    color: var(--danger);
  }
  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }
}

.link-primary {
  color: var(--accent);
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
}

.bg-danger-light {
  background: var(--danger-bg);
}
</style>
