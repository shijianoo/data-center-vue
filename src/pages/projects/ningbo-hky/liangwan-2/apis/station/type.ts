import type { EntityId, WaterQualityGrade } from "../common/type"
import type { ParameterDefinition } from "../parameter/type"

/** 站点状态。 */
export type StationStatus = "Disabled" | "Active" | "Maintenance" | "Offline"

/** 站点实体。 */
export interface Station {
  /** 站点数据库主键。 */
  id: number
  /** HJ212 设备唯一标识。 */
  mn: string
  /** 站点名称。 */
  name: string
  /** 站点分组名称。 */
  groupName?: string
  /** 站点配置经度 */
  longitude?: number | null
  /** 站点配置纬度 */
  latitude?: number | null
  /** 电子围栏半径，单位米；未配置时为 null */
  geofenceRadiusMeters?: number | null
  /** 当前运行状态。 */
  status: StationStatus
  /** 站点地址。 */
  address?: string
  /** 自定义扩展信息 JSON。 */
  metadataJson?: string
  /** 最近一次接收数据时间。 */
  lastSeenAt?: string | null
}

/** 保存站点时提交的字段。 */
export type SaveStation = Omit<Station, "id" | "lastSeenAt">

/** 站点参数组实体。 */
export interface StationParameterGroup {
  /** 参数组主键。 */
  id: number
  /** 站点主键。 */
  StationId: number
  /** 参数组名称。 */
  name: string
  /** 预期上报间隔（分钟）。 */
  reportIntervalMinutes: number
  /** 显示顺序。 */
  sortOrder: number
}

/** 站点参数绑定实体。 */
export interface StationParameterBinding {
  /** 绑定主键。 */
  id: number
  /** 参数定义主键。 */
  parameterDefinitionId: number
  /** 自动审核开关 */
  isAutoReviewEnabled: boolean
  /** 站点参数组主键。 */
  stationParameterGroupId: number
  /** 站点内显示名称覆盖值。 */
  displayNameOverride?: string | null
  /** 站点内单位覆盖值。 */
  unitOverride?: string | null
  /** 站点内小数位覆盖值。 */
  decimalPlacesOverride?: number | null
  /** 显示顺序。 */
  sortOrder: number
  /** 后端可能附带的参数定义。 */
  parameterDefinition?: ParameterDefinition
}

/** 站点批量参数绑定实体。 */
export interface BatchStationParameterBindings {
  /** 站点参数组主键。 */
  stationParameterGroupId: number
  /** 参数定义主键。 */
  parameterDefinitionIds: number[]
}

/** 站点维护期类型。 */
export type MaintenanceType = "AnnualOverhaul" | "Emergency" | "Routine" | "Other"

/** 站点维护期。 */
export interface MaintenancePeriod {
  /** 维护期主键。 */
  id: number
  /** 维护类型。 */
  maintenanceType: MaintenanceType
  /** 开始时间。 */
  startAt: string
  /** 结束时间。 */
  endAt: string
  /** 维护原因。 */
  reason?: string
}

/** 同一业务时刻上报的经纬度坐标 */
export interface StationCoordinates {
  /** 经度，单位为度 */
  longitude: number
  /** 纬度，单位为度 */
  latitude: number
  /** 坐标对应的业务时间 */
  observedAt: string
}

/** 地图展示所需的站点信息及其可选的最新动态坐标 */
export interface StationMapItem {
  /** 站点档案；其中经纬度为站点默认坐标 */
  station: Station
  /** 当前的经纬度参数在同一业务时刻均有数值时返回的动态坐标 */
  latestCoordinates: StationCoordinates
  /** 根据站点各水质参数最新值计算的当前海水水质等级 */
  waterQualityGrade?: WaterQualityGrade
}

export interface IngestionMessageModel {
  /** 消息ID */
  id: EntityId
  /** 接收时间 */
  receivedAt: string
  /** 唯一交互号 */
  qn: string
  /** 命令编码 */
  commandCode: string
  /** 完整原始报文 */
  rawMessage: string
}

export type { ParameterDefinition }
