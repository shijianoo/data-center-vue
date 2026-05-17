import type maplibregl from "maplibre-gl"
import type { GeoJsonFeature, GeoJsonFeatureCollection } from "./types"

/** 空 FeatureCollection 用于清空图层数据，比移除 source/layer 更稳定。 */
export function emptyFeatureCollection(): GeoJsonFeatureCollection {
  return {
    type: "FeatureCollection",
    features: []
  }
}

/** MapLibre 的 GeoJSON source 首次要 addSource，后续只能 setData，统一放在这里避免重复判断。 */
export function setGeoJsonSource(
  mapInstance: maplibregl.Map | null,
  id: string,
  data: GeoJsonFeature | GeoJsonFeatureCollection
) {
  if (!mapInstance) return
  const source = mapInstance.getSource(id) as maplibregl.GeoJSONSource | undefined
  if (source) {
    // source 已存在时只更新数据，图层样式和层级顺序都不会被重置。
    source.setData(data)
  } else {
    // 首次绘制图层前先注册 source，具体 layer 由各自模块按需创建。
    mapInstance.addSource(id, { type: "geojson", data })
  }
}
