import type { BuoyKey } from "../history/buoy/config"
import type { ShoreKey } from "../history/shore/config"
import type { DeviceMeta } from "./types"
import { buoyHistoryConfig, buoyOptions } from "../history/buoy/config"
import { shoreHistoryConfig, shoreOptions } from "../history/shore/config"
import { BUOY_COLOR, SHORE_COLOR, UNKNOWN_COLOR } from "./map-utils"

/** 统一封装设备元信息查询，地图、抽屉、轨迹都从这里拿名称、颜色、分组和围栏配置。 */
export function getMeta(serialNumber: string): DeviceMeta {
  // 先按浮标查找，因为浮标除了名称和分组，还额外带电子围栏配置。
  const buoy = buoyOptions.find(item => item.key === serialNumber)
  if (buoy) {
    return {
      code: buoy.key,
      name: buoy.name,
      kind: "buoy",
      color: BUOY_COLOR,
      groups: buoyHistoryConfig[buoy.key as BuoyKey] ?? [],
      fence: {
        longitude: buoy.longitude ?? null,
        latitude: buoy.latitude ?? null,
        radius: buoy.radius ?? null
      }
    }
  }

  // 岸基站没有轨迹和围栏，但最新数据抽屉仍然复用 groups 查询每类参数的最新值。
  const shore = shoreOptions.find(item => item.key === serialNumber)
  if (shore) {
    return {
      code: shore.key,
      name: shore.name,
      kind: "shore",
      color: SHORE_COLOR,
      groups: shoreHistoryConfig[shore.key as ShoreKey] ?? []
    }
  }

  // 接口返回了未知编号时也给出可渲染的兜底信息，避免整个地图因为配置缺失报错。
  return {
    code: serialNumber,
    name: serialNumber,
    kind: "unknown",
    color: UNKNOWN_COLOR,
    groups: []
  }
}
