import type maplibregl from "maplibre-gl"
import type { GeoJsonFeature, MapCoordinate, TrackQueryState } from "./types"
import {
  TRACK_LAYER_ID,
  TRACK_POINTS_LAYER_ID,
  TRACK_POINTS_SOURCE_ID,
  TRACK_SOURCE_ID
} from "./constants"
import { getMeta } from "./device-meta"
import { setGeoJsonSource } from "./map-source"
import { BUOY_COLOR, simplifyTrack, toMapLngLat } from "./map-utils"

/** 根据轨迹设置生成实际展示点；过滤开关统一在这里处理，绘线和回放可以保持一致。 */
export function getVisibleTrackPoints(state: TrackQueryState) {
  // 回放和绘线都必须使用同一批点，否则用户看到的轨迹和 Marker 运动路径会不一致。
  return state.filterStable
    ? simplifyTrack(state.points, state.minDistance)
    : state.points
}

/** 多台浮标的轨迹共用一组 source/layer，通过 feature.color 实现不同浮标不同颜色。 */
export function drawTracks(mapInstance: maplibregl.Map | null, trackStateMap: Record<string, TrackQueryState>) {
  const lineFeatures: GeoJsonFeature<{ type: "LineString", coordinates: MapCoordinate[] }>[] = []
  const pointFeatures: GeoJsonFeature<{ type: "Point", coordinates: MapCoordinate }>[] = []

  Object.entries(trackStateMap).forEach(([serialNumber, state]) => {
    if (!state.loaded) return
    // 轨迹颜色从设备元信息读取；以后给每台浮标配置不同颜色时，线和点会自动跟着变。
    const color = getMeta(serialNumber).color
    const points = getVisibleTrackPoints(state)
    const coordinates = points.map(point => toMapLngLat(point.longitude, point.latitude))

    if (coordinates.length > 1) {
      lineFeatures.push({
        type: "Feature",
        properties: { serialNumber, color },
        geometry: {
          type: "LineString",
          coordinates
        }
      })
    }

    if (state.showPoints) {
      // 点位图层只在用户打开“显示点位”时生成，默认只画线，减少地图上的视觉噪音。
      coordinates.forEach((coordinate, index) => {
        pointFeatures.push({
          type: "Feature",
          properties: {
            serialNumber,
            color,
            index: index + 1,
            sampleTime: points[index]?.sampleTime ?? ""
          },
          geometry: {
            type: "Point",
            coordinates: coordinate
          }
        })
      })
    }
  })

  setGeoJsonSource(mapInstance, TRACK_SOURCE_ID, {
    type: "FeatureCollection",
    features: lineFeatures
  })
  setGeoJsonSource(mapInstance, TRACK_POINTS_SOURCE_ID, {
    type: "FeatureCollection",
    features: pointFeatures
  })

  ensureTrackLayers(mapInstance)
}

function ensureTrackLayers(mapInstance: maplibregl.Map | null) {
  if (!mapInstance) return
  // 所有浮标共用一套轨迹图层，通过 feature.properties.color 做样式区分，避免频繁增删 layer。
  if (!mapInstance.getLayer(TRACK_LAYER_ID)) {
    mapInstance.addLayer({
      id: TRACK_LAYER_ID,
      type: "line",
      source: TRACK_SOURCE_ID,
      paint: {
        "line-color": ["coalesce", ["get", "color"], BUOY_COLOR],
        "line-width": 3,
        "line-opacity": 0.9
      }
    })
  }

  if (!mapInstance.getLayer(TRACK_POINTS_LAYER_ID)) {
    mapInstance.addLayer({
      id: TRACK_POINTS_LAYER_ID,
      type: "circle",
      source: TRACK_POINTS_SOURCE_ID,
      paint: {
        "circle-color": "#ffffff",
        "circle-radius": 4,
        "circle-stroke-color": ["coalesce", ["get", "color"], BUOY_COLOR],
        "circle-stroke-width": 2
      }
    })
  }
}
