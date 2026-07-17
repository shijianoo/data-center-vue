import type maplibregl from "maplibre-gl"
import type { DevicePoint, GeoJsonFeature, MapCoordinate, TrackQueryState } from "./types"
import { buoyOptions } from "../history/buoy/config"
import {
  FENCE_FILL_LAYER_ID,
  FENCE_LABEL_LAYER_ID,
  FENCE_LABEL_SOURCE_ID,
  FENCE_LINE_LAYER_ID,
  FENCE_SOURCE_ID,
  SHOW_ALL_FENCES,
  SHOW_FENCE_RADIUS_LABEL
} from "./constants"
import { getMeta } from "./device-meta"
import { emptyFeatureCollection, setGeoJsonSource } from "./map-source"
import { BUOY_COLOR, createCirclePolygon, parseCoordinate, toMapLngLat } from "./map-utils"

interface FenceContext {
  // fence-layer 不直接持有 Vue 状态，所有运行时依赖都通过 context 传入，便于复用和测试。
  map: maplibregl.Map | null
  latestLocations: DevicePoint[]
  trackStateMap: Record<string, TrackQueryState>
}

/** 默认只显示当前选中浮标的围栏；打开 SHOW_ALL_FENCES 后可复用为全部围栏总览。 */
export function drawFencesForSelection(context: FenceContext, serialNumber: string | null) {
  // SHOW_ALL_FENCES 是给后续项目预留的总览模式；当前业务默认只强调当前选中浮标。
  const sourceBuoys = SHOW_ALL_FENCES
    ? buoyOptions
    : buoyOptions.filter(buoy => buoy.key === serialNumber)

  const features = sourceBuoys
    .map((buoy) => {
      // 围栏中心优先使用配置坐标；没有配置时退回该浮标最新位置，保证仍有可视范围。
      const coordinates = getFenceCoordinates(context, buoy.key, getFenceRadius(context, buoy.key))
      if (!coordinates.length) return null
      return {
        type: "Feature",
        properties: {
          serialNumber: buoy.key,
          name: buoy.name
        },
        geometry: {
          type: "Polygon",
          coordinates: [coordinates]
        }
      } as GeoJsonFeature<{ type: "Polygon", coordinates: MapCoordinate[][] }>
    })
    .filter((feature): feature is GeoJsonFeature<{ type: "Polygon", coordinates: MapCoordinate[][] }> => Boolean(feature))

  setGeoJsonSource(context.map, FENCE_SOURCE_ID, {
    type: "FeatureCollection",
    features
  })
  ensureFenceLayers(context.map)
}

/** 半径标签单独控制，关闭标签时仍然可以显示围栏圆。 */
export function drawFenceLabel(context: FenceContext, serialNumber: string) {
  if (!SHOW_FENCE_RADIUS_LABEL) {
    clearFenceLabel(context.map)
    return
  }

  const radius = getFenceRadius(context, serialNumber)
  const coordinate = getFenceLabelCoordinate(context, serialNumber)
  setGeoJsonSource(context.map, FENCE_LABEL_SOURCE_ID, coordinate
    ? {
        type: "Feature",
        properties: {
          serialNumber,
          label: `半径 ${Math.round(radius)}m`
        },
        geometry: {
          type: "Point",
          coordinates: coordinate
        }
      }
    : emptyFeatureCollection())
  ensureFenceLabelLayer(context.map)
}

export function clearFenceLabel(mapInstance: maplibregl.Map | null) {
  setGeoJsonSource(mapInstance, FENCE_LABEL_SOURCE_ID, emptyFeatureCollection())
}

export function getFenceCoordinates(context: FenceContext, serialNumber: string, radius: number): MapCoordinate[] {
  const center = getFenceCenter(context, serialNumber)
  if (!center) return []
  return createCirclePolygon(center.longitude, center.latitude, radius)
}

export function getFenceRadius(context: FenceContext, serialNumber: string) {
  // 半径优先级：配置默认值 > 面板临时输入值 > 兜底 300m。
  // 这样已有设备按固定配置展示，新设备也能先通过面板临时调整验证效果。
  return getConfiguredFenceRadius(serialNumber) ?? context.trackStateMap[serialNumber]?.fenceRadius ?? 300
}

export function getConfiguredFenceRadius(serialNumber: string) {
  // 配置里可能暂时为空或被表单保存成字符串，这里统一转成有效正数。
  const radius = Number(getMeta(serialNumber).fence?.radius)
  return Number.isFinite(radius) && radius > 0 ? radius : null
}

function getFenceLabelCoordinate(context: FenceContext, serialNumber: string): MapCoordinate | null {
  const center = getFenceCenter(context, serialNumber)
  if (!center) return null

  // 标签锚点放在围栏中心，实际显示用 text-offset 上移，缩放时不贴圆线也不压住 Marker。
  return toMapLngLat(center.longitude, center.latitude)
}

function getFenceCenter(context: FenceContext, serialNumber: string) {
  const device = getMeta(serialNumber)
  if (!device || device.kind !== "buoy") return null

  // 固定围栏中心是业务配置；如果暂未配置，使用最新位置作为临时中心，避免地图功能完全不可用。
  const fenceLng = parseCoordinate(device.fence?.longitude)
  const fenceLat = parseCoordinate(device.fence?.latitude)
  const fallback = getDeviceRawLngLat(context.latestLocations, serialNumber)
  return fenceLng !== null && fenceLat !== null
    ? { longitude: fenceLng, latitude: fenceLat }
    : fallback
}

function getDeviceRawLngLat(latestLocations: DevicePoint[], serialNumber: string) {
  const location = latestLocations.find(item => item.serialNumber === serialNumber)
  if (!location) return null
  return { longitude: location.longitude, latitude: location.latitude }
}

function ensureFenceLayers(mapInstance: maplibregl.Map | null) {
  if (!mapInstance) return
  // source 由 setGeoJsonSource 负责维护，layer 只在首次绘制时创建，后续只更新 source 数据。
  if (!mapInstance.getLayer(FENCE_FILL_LAYER_ID)) {
    mapInstance.addLayer({
      id: FENCE_FILL_LAYER_ID,
      type: "fill",
      source: FENCE_SOURCE_ID,
      paint: {
        "fill-color": BUOY_COLOR,
        "fill-opacity": 0.08
      }
    })
  }
  if (!mapInstance.getLayer(FENCE_LINE_LAYER_ID)) {
    mapInstance.addLayer({
      id: FENCE_LINE_LAYER_ID,
      type: "line",
      source: FENCE_SOURCE_ID,
      paint: {
        "line-color": BUOY_COLOR,
        "line-width": 2,
        "line-dasharray": [2, 2]
      }
    })
  }
}

function ensureFenceLabelLayer(mapInstance: maplibregl.Map | null) {
  if (!mapInstance || mapInstance.getLayer(FENCE_LABEL_LAYER_ID)) return
  // 半径标签使用 symbol layer，文字锚点在围栏中心并上移，缩放时比贴在圆边上更稳定。
  mapInstance.addLayer({
    id: FENCE_LABEL_LAYER_ID,
    type: "symbol",
    source: FENCE_LABEL_SOURCE_ID,
    layout: {
      "text-field": ["get", "label"],
      "text-size": 12,
      "text-anchor": "bottom",
      "text-offset": [0, -2.8],
      "text-allow-overlap": true,
      "text-ignore-placement": true
    },
    paint: {
      "text-color": "#1d4ed8",
      "text-halo-color": "#ffffff",
      "text-halo-width": 2
    }
  })
}
