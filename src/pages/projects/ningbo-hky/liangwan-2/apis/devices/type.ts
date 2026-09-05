/** 站点下用于接入 HJ212 的设备映射。 */
export interface StationDeviceModel {
  /** 设备映射记录主键 */
  id: number | string
  /** 所属逻辑站点主键 */
  stationId: number | string
  /** 设备在 HJ212 报文中使用的完整 MN */
  mn: string
  /** 设备或数据源名称，可为空 */
  name?: string
  /** 设备类型或数据来源说明，可为空 */
  deviceKind?: string
  /** 是否允许该设备继续接入数据 (1/true 为启用，0/false 为禁用) */
  isEnabled: boolean
}

/** 创建或修改站点设备映射 */
export interface SaveStationDeviceCommand {
  /** 设备在 HJ212 报文中使用的完整 MN */
  mn: string
  /** 设备或数据源名称，可为空 */
  name?: string
  /** 设备类型或数据来源说明，可为空 */
  deviceKind?: string
  /** 是否允许该设备继续接入数据 */
  isEnabled: boolean
}
