import type maplibregl from "maplibre-gl"
import type { MarkerMap, TrackPoint, TrackQueryState } from "./types"
import { PLAYBACK_SEGMENT_MS } from "./constants"
import { toMapLngLat } from "./map-utils"

interface PlaybackOptions {
  // 用函数而不是直接传对象，是为了每一帧都能拿到 Vue shallowRef/ref 中最新的 Marker 和轨迹状态。
  markerMap: () => MarkerMap
  getTrackState: (serialNumber: string) => TrackQueryState
  getVisibleTrackPoints: (state: TrackQueryState) => TrackPoint[]
}

/** 轨迹回放只移动现有 Marker，不额外创建图层，避免破坏 Marker 的点击和 hover 行为。 */
export function createPlaybackController(options: PlaybackOptions) {
  let frameId: number | null = null
  let deviceCode: string | null = null
  let startedAt = 0
  let segmentFrom = 0
  let segmentDuration = 0

  function toggle(serialNumber: string) {
    // toggle 是面板唯一需要调用的入口，内部根据当前状态决定开始、暂停、继续或重新播放。
    const state = options.getTrackState(serialNumber)
    if (!state.loaded || options.getVisibleTrackPoints(state).length < 2) return

    if (state.playbackStatus === "playing") {
      pause(serialNumber)
      return
    }

    if (state.playbackStatus === "paused") {
      start(serialNumber)
      return
    }

    start(serialNumber, state.playbackStatus === "finished")
  }

  function start(serialNumber: string, restart = false) {
    const state = options.getTrackState(serialNumber)
    const points = options.getVisibleTrackPoints(state)
    const marker = options.markerMap()[serialNumber]
    if (!marker || points.length < 2) return

    if (deviceCode && deviceCode !== serialNumber) {
      // 同一时间只允许一台浮标回放，避免多个 Marker 同时移动导致用户难以观察。
      pause(deviceCode)
    }

    const startIndex = restart ? 0 : Math.min(state.playbackIndex, points.length - 2)
    const progress = restart ? 0 : state.playbackProgress
    // 暂停后继续播放时保留 segment index 和 progress，体验上是“接着走”而不是回到段首。
    state.playbackIndex = startIndex
    state.playbackProgress = progress
    state.playbackStatus = "playing"
    deviceCode = serialNumber
    moveMarkerOnSegment(marker, points[startIndex], points[startIndex + 1], progress)
    playSegment(serialNumber, startIndex, progress)
  }

  function pause(serialNumber: string) {
    const state = options.getTrackState(serialNumber)
    if (state.playbackStatus === "playing") {
      state.playbackStatus = "paused"
    }
    cancelFrame()
    if (deviceCode === serialNumber) {
      deviceCode = null
    }
  }

  function stop(serialNumber?: string) {
    cancelFrame()
    if (serialNumber) {
      const state = options.getTrackState(serialNumber)
      state.playbackStatus = "idle"
      state.playbackIndex = 0
      state.playbackProgress = 0
    }
    if (!serialNumber || deviceCode === serialNumber) {
      deviceCode = null
    }
  }

  function isPlaying(serialNumber: string) {
    return deviceCode === serialNumber && options.getTrackState(serialNumber).playbackStatus === "playing"
  }

  // 根据当前段的起止点和 progress 计算 Marker 的实时位置，并更新 Marker。
  function playSegment(serialNumber: string, segmentIndex: number, initialProgress = 0) {
    cancelFrame()
    const state = options.getTrackState(serialNumber)
    const points = options.getVisibleTrackPoints(state)
    if (segmentIndex >= points.length - 1) {
      // 到达最后一个点后标记为 finished，按钮会显示“重新播放”。
      state.playbackStatus = "finished"
      state.playbackIndex = 0
      state.playbackProgress = 0
      deviceCode = null
      return
    }

    // 速度只影响每段动画耗时，轨迹几何仍完全按照当前过滤后的点位走。
    segmentDuration = PLAYBACK_SEGMENT_MS / Math.max(state.playbackSpeed, 0.1)
    startedAt = performance.now() - segmentDuration * initialProgress
    segmentFrom = segmentIndex
    frameId = requestAnimationFrame(step)
  }

  // 每一帧都根据当前时间计算 progress，更新 Marker 位置，并在段尾自动切换到下一段。
  function step(now: number) {
    if (!deviceCode) return

    const state = options.getTrackState(deviceCode)
    const marker = options.markerMap()[deviceCode]
    const points = options.getVisibleTrackPoints(state)
    const startPoint = points[segmentFrom]
    const endPoint = points[segmentFrom + 1]
    if (!marker || state.playbackStatus !== "playing" || !startPoint || !endPoint) return

    const progress = Math.min((now - startedAt) / segmentDuration, 1)
    state.playbackProgress = progress
    // 每一帧按线性插值移动现有 Marker，既能保持原 Marker 样式，也能继续响应点击/hover。
    moveMarkerOnSegment(marker, startPoint, endPoint, progress)

    // 进度未满时继续请求下一帧，直到到达段尾自动切换到下一段。
    if (progress < 1) {
      frameId = requestAnimationFrame(step)
      return
    }

    // 下一段的开始时间从当前时间算起，避免因为前面某段动画卡顿导致整体回放时间过长。
    state.playbackIndex = segmentFrom + 1
    state.playbackProgress = 0
    // segmentFrom 在 step 里是当前段的起点，下一段的起点就是当前段的终点，所以是 segmentFrom + 1。
    playSegment(deviceCode, segmentFrom + 1)
  }

  /** 取消当前的动画帧请求，停止 Marker 移动，避免多个动画帧同时运行导致状态混乱。 */
  function cancelFrame() {
    if (frameId === null) return
    cancelAnimationFrame(frameId)
    frameId = null
  }

  return {
    toggle,
    pause,
    stop,
    isPlaying
  }
}

// 根据当前段的起止点和 progress 计算 Marker 的实时位置，并更新 Marker。
function moveMarkerOnSegment(marker: maplibregl.Marker, start: TrackPoint, end: TrackPoint, progress: number) {
  const longitude = start.longitude + (end.longitude - start.longitude) * progress
  const latitude = start.latitude + (end.latitude - start.latitude) * progress
  marker.setLngLat(toMapLngLat(longitude, latitude))
}
