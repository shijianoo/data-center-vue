import type maplibregl from "maplibre-gl"
import type { HistoryField, HistoryGroup } from "../history/buoy/config"

export type DeviceKind = "buoy" | "shore" | "unknown"
export type PlaybackStatus = "idle" | "playing" | "paused" | "finished"

export interface DevicePoint {
  // serialNumber 对应 NBxx 编号，用作 Marker、抽屉、轨迹缓存的统一 key。
  serialNumber: string
  // 最新定位的采样时间，用于默认轨迹查询范围和抽屉里的友好时间展示。
  sampleTime: string | null
  longitude: number
  latitude: number
}

export interface DeviceMeta {
  // DeviceMeta 是页面层统一使用的设备描述，避免各组件直接依赖浮标/岸基站配置文件。
  code: string
  name: string
  kind: DeviceKind
  color: string
  // groups 复用历史数据配置，最新数据抽屉按同样的表和字段逐组查询。
  groups: HistoryGroup[]
  // 只有浮标会有电子围栏；岸基站不配置时保持 undefined。
  fence?: {
    longitude: number | null
    latitude: number | null
    radius: number | null
  }
}

export interface LatestGroupData {
  // 抽屉里每个参数分组单独 loading，因为最新数据需要按表逐批请求。
  group: HistoryGroup
  row: Record<string, unknown> | null
  loading: boolean
}

export interface TrackPoint {
  // 轨迹点标准化后必须有十进制度经纬度，原始行里的其他字段会继续保留。
  longitude: number
  latitude: number
  sampleTime?: string | null
  [key: string]: unknown
}

/** 每台浮标独立保存轨迹查询条件和已加载结果，方便切换设备后恢复现场。 */
export interface TrackQueryState {
  // 日期只保存到天；TrackQueryPanel 发请求时会转换为当天 00:00:00 到 23:59:59。
  dateRange: [string, string]
  // showPoints 控制是否把轨迹的每个采样点画出来，便于排查点位密度。
  showPoints: boolean
  // filterStable 为 true 时会过滤移动距离很小的抖动点，让曲线更清晰。
  filterStable: boolean
  minDistance: number
  // 围栏半径允许在轨迹面板临时调整，优先级高于配置里的默认半径。
  fenceRadius: number
  points: TrackPoint[]
  loaded: boolean
  // 回放状态和进度存进同一份 state，切换浮标后也能继续展示按钮状态。
  playbackStatus: PlaybackStatus
  // 播放速度，单位为倍速，默认值为 1
  playbackSpeed: number
  // playbackIndex 和 playbackProgress 共同记录回放进度，前者是当前播放到的轨迹段 index，后者是当前段内的进度（0-1）。
  playbackIndex: number
  playbackProgress: number
}

/** 轨迹面板加载完成后回传给地图图层绘制的数据。 */
export interface TrackPayload {
  // payload 是一次轨迹查询的快照，父组件收到后负责写入缓存并重绘图层。
  serialNumber: string
  points: TrackPoint[]
  showPoints: boolean
  filterStable: boolean
  minDistance: number
  fenceRadius: number
}

export interface DisplayField extends HistoryField {
  // 在最新数据抽屉里，字段配置和值会合并成 DisplayField，模板只负责渲染。
  value: string
}

export type MapCoordinate = [number, number]
export type GeoJsonGeometry
  = | { type: "LineString", coordinates: MapCoordinate[] }
    | { type: "Point", coordinates: MapCoordinate }
    | { type: "Polygon", coordinates: MapCoordinate[][] }

export interface GeoJsonFeature<T extends GeoJsonGeometry = GeoJsonGeometry> {
  // 这里定义最小可用的 GeoJSON 类型，避免引入额外依赖，也能满足 MapLibre setData。
  type: "Feature"
  properties: Record<string, unknown>
  geometry: T
}

export interface GeoJsonFeatureCollection {
  type: "FeatureCollection"
  features: GeoJsonFeature[]
}

export interface PlaybackController {
  toggle: (serialNumber: string) => void
  pause: (serialNumber: string) => void
  stop: (serialNumber?: string) => void
}

export type MarkerMap = Record<string, maplibregl.Marker>
