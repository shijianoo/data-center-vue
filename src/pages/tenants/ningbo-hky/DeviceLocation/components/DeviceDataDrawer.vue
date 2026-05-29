<script lang="ts" setup>
import type { DeviceMeta, DevicePoint, DisplayField, LatestGroupData } from "../types"
import { computed, ref, watch } from "vue"
import { formatHybridAgo } from "@/common/utils/datetime"
import { getLatestData } from "../../apis"
import { distanceMeters, parseCoordinate } from "../map-utils"

const props = defineProps<{
  visible: boolean
  device: DeviceMeta | null
  latestLocation?: DevicePoint | null
  latestLocationTime?: string | null
}>()

const emit = defineEmits<{
  close: []
  focusFence: []
}>()

const latestGroups = ref<LatestGroupData[]>([])

const locationTime = computed(() => props.latestLocation?.sampleTime ?? props.latestLocationTime ?? null)
const locationText = computed(() => {
  // 最新位置来自地图 Marker 使用的同一份数据，展示时直接保留 6 位小数便于现场核对。
  const location = props.latestLocation
  if (!location) return ""
  return `东经 ${fmt(location.longitude, 6)}° / 北纬 ${fmt(location.latitude, 6)}°`
})
const fenceStatus = computed(() => {
  // 抽屉里的围栏状态只判断“当前最新位置”，历史 GPS 每一行的状态在历史表格里单独计算。
  const device = props.device
  const location = props.latestLocation
  if (!device || device.kind !== "buoy" || !location) return null

  const centerLng = parseCoordinate(device.fence?.longitude)
  const centerLat = parseCoordinate(device.fence?.latitude)
  const radius = Number(device.fence?.radius)
  if (centerLng === null || centerLat === null || !Number.isFinite(radius)) return null

  const distance = distanceMeters(location.longitude, location.latitude, centerLng, centerLat)
  return {
    normal: distance <= radius,
    distance,
    radius
  }
})
const canFocusFence = computed(() => Boolean(props.device?.kind === "buoy" && props.latestLocation && fenceStatus.value))

watch(
  () => props.device?.code,
  () => {
    latestGroups.value = []
    if (props.device) {
      loadLatestData()
    }
  },
  { immediate: true }
)

async function loadLatestData() {
  // 每类数据可能来自不同表，只能按配置分组逐类请求，避免把字段混到同一次查询里。
  // 逐组请求还有一个好处：某个表失败时不会影响其它分组展示最新数据。
  const device = props.device
  if (!device) return

  latestGroups.value = device.groups
    .filter(group => group.tableName)
    // 先把骨架状态放进数组，UI 可以立即显示每个分组的“加载中”。
    .map(group => ({ group, row: null, loading: true }))

  for (const item of latestGroups.value) {
    try {
      const columns = getSelectColumns(item.group)
      const { data } = await getLatestData(item.group.tableName!, device.code, columns)
      item.row = getFirstRow(data)
    } catch (error) {
      console.error(`获取 ${device.code} ${item.group.label} 最新数据失败`, error)
      item.row = null
    } finally {
      item.loading = false
    }
  }
}

function getSelectColumns(group: LatestGroupData["group"]) {
  // queryColumn 用于处理后端 SQL 关键字等特殊查询字段，展示时仍读 column 对应的返回字段。
  const columns = new Set<string>()
  group.fields.forEach((field) => {
    columns.add(field.queryColumn ?? field.column)
  })
  return [...columns]
}

function getFirstRow(data: any) {
  // getLatestData 在不同接口包装下可能返回数组、分页结构或单条对象，这里统一取第一条。
  if (Array.isArray(data)) return data[0] ?? null
  if (Array.isArray(data?.items)) return data.items[0] ?? null
  if (Array.isArray(data?.records)) return data.records[0] ?? null
  return data ?? null
}

function getGroupTime(row: Record<string, unknown> | null) {
  // 兼容最新数据和历史表里不同的采样/接收时间字段命名。
  return row?.sampleTime ?? row?.receiveTime ?? row?.samp_time ?? row?.recv_time ?? null
}

function getDisplayFields(item: LatestGroupData): DisplayField[] {
  const row = item.row
  if (!row) return []
  // 字段配置里带 formatter 的参数先走换算逻辑，例如 NB08 的 pH 电压换算。
  // 没有 formatter 的普通字段统一走 fmt，保证空值和数字精度展示一致。
  return item.group.fields.map(field => ({
    ...field,
    value: field.formatter ? field.formatter(row) : fmt(row[field.column], field.decimals)
  }))
}

function fmt(value: unknown, decimals?: number) {
  if (value === null || value === undefined || value === "") return "--"
  if (typeof value === "number") return decimals === undefined ? `${value}` : value.toFixed(decimals)
  const numberValue = Number(value)
  if (decimals !== undefined && Number.isFinite(numberValue)) return numberValue.toFixed(decimals)
  return `${value}`
}
</script>

<template>
  <Transition name="drawer-slide">
    <aside v-if="visible && device" class="device-drawer">
      <div class="drawer-header">
        <div>
          <div class="device-name">
            {{ device.name }}
          </div>
          <div class="device-code">
            {{ device.code }}
          </div>
        </div>
        <el-button text @click="emit('close')">
          关闭
        </el-button>
      </div>

      <div class="drawer-body">
        <section class="summary-card" v-if="locationTime || locationText">
          <div class="summary-head">
            <span>最新位置</span>
            <strong v-if="locationTime">{{ formatHybridAgo(locationTime) }}</strong>
          </div>
          <div v-if="locationText" class="summary-location">
            {{ locationText }}
          </div>
          <div v-if="fenceStatus" class="fence-row">
            <div>
              <span>电子围栏</span>
              <strong :class="fenceStatus.normal ? 'normal' : 'abnormal'">
                {{ fenceStatus.normal ? "正常" : "异常" }}
              </strong>
            </div>
            <small>距中心 {{ fmt(fenceStatus.distance, 1) }}m / 半径 {{ fmt(fenceStatus.radius, 0) }}m</small>
          </div>
          <el-button
            v-if="canFocusFence"
            class="focus-fence-btn"
            type="primary"
            plain
            @click="emit('focusFence')"
          >
            定位到浮标
          </el-button>
        </section>

        <section v-for="item in latestGroups" :key="item.group.key" class="data-section">
          <div class="section-head">
            <span>{{ item.group.label }}</span>
            <small v-if="getGroupTime(item.row)">
              最新 {{ formatHybridAgo(getGroupTime(item.row) as any) }}
            </small>
          </div>

          <div v-if="item.loading" class="section-empty">
            加载中...
          </div>
          <div v-else-if="!item.row" class="section-empty">
            暂无数据
          </div>
          <div v-else class="field-grid">
            <div v-for="field in getDisplayFields(item)" :key="field.key" class="field-item">
              <span>{{ field.label }}</span>
              <strong>{{ field.value }}</strong>
            </div>
          </div>
        </section>
      </div>
    </aside>
  </Transition>
</template>

<style lang="scss" scoped>
.device-drawer {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  width: min(390px, calc(100vw - 24px));
  height: 100%;
  background: rgba(255, 255, 255, 0.96);
  border-right: 1px solid #e5e7eb;
  box-shadow: 8px 0 24px rgba(15, 23, 42, 0.18);
  backdrop-filter: blur(8px);
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.device-name {
  font-size: 17px;
  font-weight: 700;
  color: #111827;
}

.device-code {
  margin-top: 2px;
  font-size: 12px;
  color: #64748b;
}

.drawer-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 12px 14px 18px;
}

.summary-card,
.data-section {
  margin-bottom: 12px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}

.summary-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: #475569;

  span {
    font-weight: 700;
    color: #111827;
  }

  strong {
    color: #2563eb;
    font-size: 13px;
  }
}

.summary-location {
  margin-top: 8px;
  color: #64748b;
  font-size: 13px;
  line-height: 1.5;
}

.fence-row {
  margin-top: 10px;
  padding: 9px 10px;
  background: #f8fafc;
  border-radius: 6px;

  div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  span {
    color: #475569;
    font-size: 13px;
  }

  strong {
    font-size: 13px;

    &.normal {
      color: #059669;
    }

    &.abnormal {
      color: #dc2626;
    }
  }

  small {
    display: block;
    margin-top: 4px;
    color: #94a3b8;
  }
}

.focus-fence-btn {
  width: 100%;
  margin-top: 10px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;

  span {
    font-weight: 700;
    color: #111827;
  }

  small {
    color: #64748b;
  }
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.field-item {
  min-width: 0;
  padding: 8px;
  border-radius: 6px;
  background: #f8fafc;

  span {
    display: block;
    overflow: hidden;
    color: #64748b;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    display: block;
    margin-top: 4px;
    color: #0f172a;
    font-size: 15px;
  }
}

.section-empty {
  color: #94a3b8;
  font-size: 13px;
}

.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition:
    transform 0.22s ease,
    opacity 0.22s ease;
}

.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}
</style>
