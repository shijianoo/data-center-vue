import type { TrackPoint } from "./types"
import maplibregl from "maplibre-gl"

export const BUOY_COLOR = "#3b82f6"
export const SHORE_COLOR = "#10b981"
export const UNKNOWN_COLOR = "#64748b"

export function toMapLngLat(longitude: number, latitude: number): [number, number] {
  // 后端位置按 WGS84 存储，天地图底图展示前需要转成 GCJ02。
  // 地图相关模块统一调用这个函数，避免 Marker、轨迹线、围栏圆出现坐标系不一致。
  // const converted = wgs84togcj02(longitude, )
  return [longitude, latitude]
}

export function parseCoordinate(value: unknown) {
  // 兼容十进制度和 ddmm.mmmm 这类海洋设备常见经纬度格式。
  // 判断 abs > 180 是因为经纬度十进制度不会超过 180，而 ddmm.mmmm 会类似 12132.574。
  if (value === null || value === undefined || value === "") return null
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) return null
  const absValue = Math.abs(numberValue)
  if (absValue > 180) {
    const degree = Math.floor(absValue / 100)
    const minutes = absValue - degree * 100
    const decimalDegree = degree + minutes / 60
    return numberValue < 0 ? -decimalDegree : decimalDegree
  }
  return numberValue
}

export function distanceMeters(lng1: number, lat1: number, lng2: number, lat2: number) {
  // Haversine 公式用于计算 WGS84 经纬度之间的近似球面距离，电子围栏判断精度足够。
  const earthRadius = 6371000
  const radLat1 = toRad(lat1)
  const radLat2 = toRad(lat2)
  const deltaLat = toRad(lat2 - lat1)
  const deltaLng = toRad(lng2 - lng1)
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(deltaLng / 2) ** 2
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function simplifyTrack(points: TrackPoint[], minDistance: number) {
  // 简单按相邻点距离过滤静止抖动，保留首尾点保证轨迹时间范围完整。
  // 这个过滤是展示层优化，不会修改原始 points，用户关闭过滤后仍可看到全量点位。
  if (points.length <= 2 || minDistance <= 0) return points
  const result: TrackPoint[] = []

  points.forEach((point) => {
    const last = result[result.length - 1]
    if (!last || distanceMeters(last.longitude, last.latitude, point.longitude, point.latitude) >= minDistance) {
      result.push(point)
    }
  })

  const tail = points[points.length - 1]
  if (tail && result[result.length - 1] !== tail) result.push(tail)
  return result
}

export function createCirclePolygon(longitude: number, latitude: number, radius: number, steps = 96) {
  // 用球面公式生成电子围栏圆形多边形，避免直接用经纬度加减导致半径变形。
  // steps 越大圆越平滑；96 对当前围栏半径已经足够，同时不会给 GeoJSON 带来太多点。
  const coordinates: [number, number][] = []
  const earthRadius = 6371000
  const latRad = toRad(latitude)
  const lngRad = toRad(longitude)
  const angularDistance = radius / earthRadius

  for (let i = 0; i <= steps; i += 1) {
    const bearing = 2 * Math.PI * i / steps
    const pointLat = Math.asin(
      Math.sin(latRad) * Math.cos(angularDistance)
      + Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(bearing)
    )
    const pointLng = lngRad + Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latRad),
      Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(pointLat)
    )
    coordinates.push(toMapLngLat(toDeg(pointLng), toDeg(pointLat)))
  }

  return coordinates
}

export function fitBounds(map: maplibregl.Map, coordinates: [number, number][], padding = 96) {
  // 自动缩放时限制 maxZoom，防止只有一个点或很小范围时地图被拉得过近。
  if (!coordinates.length) return
  const bounds = coordinates.reduce((b, coordinate) => b.extend(coordinate), new maplibregl.LngLatBounds(coordinates[0], coordinates[0]))
  map.fitBounds(bounds, { padding, maxZoom: 14 })
}

function toRad(value: number) {
  return value * Math.PI / 180
}

function toDeg(value: number) {
  return value * 180 / Math.PI
}
