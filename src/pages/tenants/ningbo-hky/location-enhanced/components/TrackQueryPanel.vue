<script lang="ts" setup>
import type { DeviceMeta, DevicePoint, TrackPayload, TrackPoint, TrackQueryState } from "../types"
import { computed, ref, watch } from "vue"
import { getHistoricalLocations } from "../../apis"
import { parseCoordinate } from "../map-utils"

const props = defineProps<{
  visible: boolean
  device: DeviceMeta | null
  latestLocation?: DevicePoint | null
  state: TrackQueryState | null
}>()

const emit = defineEmits<{
  close: []
  updateState: [patch: Partial<TrackQueryState>]
  loaded: [payload: TrackPayload]
  clear: [serialNumber: string]
  togglePlayback: [serialNumber: string]
}>()

const loading = ref(false)

const isBuoy = computed(() => props.device?.kind === "buoy")
const canQuery = computed(() => Boolean(props.device && isBuoy.value && props.state))

// 面板只负责交互展示，所有查询条件都通过 computed setter 写回父组件的浮标缓存。
// 这样 TrackQueryPanel 可以保持无本地业务状态，切换浮标后由父组件恢复对应浮标的查询现场。
const dateRange = computed<[string, string]>({
  get: () => props.state?.dateRange ?? getDefaultTrackRange(props.latestLocation?.sampleTime),
  set: value => emit("updateState", { dateRange: value })
})

const showPoints = computed({
  get: () => props.state?.showPoints ?? false,
  set: value => emit("updateState", { showPoints: value })
})

const filterStable = computed({
  get: () => props.state?.filterStable ?? true,
  set: value => emit("updateState", { filterStable: value })
})

const minDistance = computed({
  get: () => props.state?.minDistance ?? 20,
  set: value => emit("updateState", { minDistance: value })
})

const fenceRadius = computed({
  get: () => props.state?.fenceRadius ?? props.device?.fence?.radius ?? 300,
  set: value => emit("updateState", { fenceRadius: value })
})

const playbackSpeed = computed({
  get: () => props.state?.playbackSpeed ?? 1,
  set: value => emit("updateState", { playbackSpeed: value })
})

const canPlayback = computed(() => Boolean(props.state?.loaded && props.state.points.length > 1))
const playbackButtonText = computed(() => {
  // 按钮文案跟随回放状态变化，用户不用理解内部状态机也能知道下一步动作。
  const status = props.state?.playbackStatus ?? "idle"
  if (status === "playing") return "暂停"
  if (status === "paused") return "继续"
  if (status === "finished") return "重新播放"
  return "轨迹回放"
})

watch(
  () => props.device?.code,
  () => {
    // 第一次打开设备且还没加载轨迹时，使用设备配置里的默认围栏半径初始化输入框。
    if (props.state && props.device?.fence?.radius && !props.state.loaded) {
      emit("updateState", { fenceRadius: props.device.fence.radius })
    }
  }
)

async function loadTrack() {
  // 轨迹接口只按一台浮标和一个时间段查询，返回后统一标准化为地图可绘制的点位。
  // 绘图、视野缩放和回放控制都由父组件处理，面板只向外抛出一次查询结果。
  const device = props.device
  if (!device || !canQuery.value) return

  loading.value = true
  try {
    const { startTime, endTime } = getTrackQueryRange(dateRange.value)
    const { data } = await getHistoricalLocations({
      serialNumber: device.code,
      startTime,
      endTime
    })
    const rows: Record<string, unknown>[] = Array.isArray(data) ? data : (data?.items ?? data?.records ?? [])
    // 过滤掉经纬度缺失或格式异常的行，避免 MapLibre 接收到非法坐标后整条轨迹不渲染。
    const points = rows
      .map(normalizeTrackPoint)
      .filter((point): point is TrackPoint => Boolean(point))

    const nextState: Partial<TrackQueryState> = {
      points,
      loaded: true,
      playbackStatus: "idle",
      playbackIndex: 0,
      playbackProgress: 0
    }
    emit("updateState", nextState)
    emit("loaded", {
      serialNumber: device.code,
      points,
      showPoints: showPoints.value,
      filterStable: filterStable.value,
      minDistance: minDistance.value,
      fenceRadius: fenceRadius.value
    })
  } catch (error) {
    console.error(`获取 ${device.code} 历史轨迹失败`, error)
    // 查询失败也通知父组件 loaded=true，这样用户能明确看到“已查询但没有可用轨迹”的状态。
    emit("updateState", { points: [], loaded: true, playbackStatus: "idle", playbackIndex: 0, playbackProgress: 0 })
    emit("loaded", {
      serialNumber: device.code,
      points: [],
      showPoints: showPoints.value,
      filterStable: filterStable.value,
      minDistance: minDistance.value,
      fenceRadius: fenceRadius.value
    })
  } finally {
    loading.value = false
  }
}

function clearTrack() {
  const device = props.device
  if (!device) return
  // 清除只影响当前浮标的轨迹缓存，不会影响其它已经加载过的浮标轨迹。
  emit("updateState", { points: [], loaded: false, playbackStatus: "idle", playbackIndex: 0, playbackProgress: 0 })
  emit("clear", device.code)
}

function togglePlayback() {
  const device = props.device
  if (!device || !canPlayback.value) return
  emit("togglePlayback", device.code)
}

function getDefaultTrackRange(time?: string | null): [string, string] {
  // 默认以最新定位日期为结束日期，向前取 7 天，便于第一次打开就能看到近期轨迹。
  const end = time ? new Date(time) : new Date()
  if (Number.isNaN(end.getTime())) return getDefaultTrackRange()

  const start = new Date(end)
  start.setDate(end.getDate() - 7)
  return [formatDay(start), formatDay(end)]
}

function getTrackQueryRange(range: [string, string]) {
  // 日期选择器只选到天，提交接口前扩展成当天 00:00:00 到 23:59:59 的 ISO 时间。
  const [startDay, endDay] = range
  return {
    startTime: new Date(`${startDay}T00:00:00`).toISOString(),
    endTime: new Date(`${endDay}T23:59:59`).toISOString()
  }
}

function formatDay(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

function normalizeTrackPoint(row: Record<string, unknown>): TrackPoint | null {
  // 兼容位置接口直接返回 longitude/latitude，或沿用浮标历史表里的 g02/g03 字段。
  // parseCoordinate 会把 ddmm.mmmm 转成十进制度，后续地图坐标转换统一在父组件/工具层完成。
  const longitude = parseCoordinate(row.longitude ?? row.g02)
  const latitude = parseCoordinate(row.latitude ?? row.g03)
  if (longitude === null || latitude === null) return null
  return {
    ...row,
    longitude,
    latitude,
    sampleTime: row.sampleTime as string | null | undefined
  }
}
</script>

<template>
  <Transition name="track-panel-fade">
    <section v-if="visible && device && isBuoy && state" class="track-panel">
      <div class="panel-head">
        <div>
          <div class="panel-title">
            {{ device.name }}
          </div>
          <div class="panel-subtitle">
            <span>{{ device.code }}</span>
            <span>运动轨迹</span>
          </div>
        </div>
        <el-button text @click="emit('close')">
          关闭
        </el-button>
      </div>

      <el-date-picker
        v-model="dateRange"
        type="daterange"
        single-panel
        value-format="YYYY-MM-DD"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        range-separator="至"
        class="track-range"
      />

      <div class="track-controls">
        <el-switch v-model="showPoints" active-text="显示点位" />
        <el-switch v-model="filterStable" active-text="过滤抖动" />
      </div>

      <div class="number-row">
        <span>过滤距离(m)</span>
        <el-input-number v-model="minDistance" :min="0" :step="5" size="small" />
      </div>
      <div class="number-row">
        <span>围栏半径(m)</span>
        <el-input-number v-model="fenceRadius" :min="10" :step="50" size="small" />
      </div>
      <div class="number-row">
        <span>回放速度</span>
        <el-segmented
          v-model="playbackSpeed"
          :options="[0.5, 1, 2, 4]"
          size="small"
          class="speed-segmented"
        >
          <template #default="{ item }">
            {{ item }}x
          </template>
        </el-segmented>
      </div>

      <div class="track-actions">
        <el-button type="primary" :loading="loading" @click="loadTrack">
          加载轨迹
        </el-button>
        <el-button @click="clearTrack">
          清除
        </el-button>
        <el-button v-if="canPlayback" class="playback-button" @click="togglePlayback">
          {{ playbackButtonText }}
        </el-button>
      </div>
    </section>
  </Transition>
</template>

<style lang="scss" scoped>
.track-panel {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 18;
  width: min(360px, calc(100vw - 32px));
  padding: 14px;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.18);
  backdrop-filter: blur(8px);
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.panel-title {
  max-width: 260px;
  overflow: hidden;
  color: #111827;
  font-size: 17px;
  font-weight: 700;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.panel-subtitle {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
  color: #64748b;
  font-size: 12px;

  span + span {
    position: relative;
    padding-left: 8px;

    &::before {
      position: absolute;
      left: 0;
      color: #cbd5e1;
      content: "/";
    }
  }
}

.track-range {
  display: flex;
  width: 100% !important;
  min-width: 0;
  max-width: 100% !important;
  box-sizing: border-box;
  overflow: hidden;

  :deep(.el-input__wrapper) {
    flex: 1;
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
  }

  :deep(.el-range-input) {
    flex: 1 1 0;
    width: 0;
    min-width: 0;
  }

  :deep(.el-range-separator) {
    flex: 0 0 auto;
    padding: 0 4px;
  }
}

.track-controls {
  display: flex;
  gap: 14px;
  margin: 12px 0;
  flex-wrap: wrap;
}

.number-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 8px;
  color: #475569;
}

.track-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.speed-segmented {
  flex-shrink: 0;
}

.playback-button {
  margin-left: auto;
}

.track-panel-fade-enter-active,
.track-panel-fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.track-panel-fade-enter-from,
.track-panel-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>

<style lang="scss">
// Element Plus 的 daterange 默认带固定宽度，这里用非 scoped 样式兜底压回面板内。
.track-panel {
  .track-range.el-date-editor--daterange {
    width: 100% !important;
    max-width: 100% !important;
  }
}
</style>
