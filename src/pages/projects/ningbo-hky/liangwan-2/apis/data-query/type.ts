import type { AutoReviewStatus, EntityId, Granularity, IngestionSource, WaterQualityGrade } from "../common/type"

export type CalculationMode = "Direct" | "TimeSlot"

/** 表格的列定义。 */
export interface MeasurementTableColumn {
  /** 参数定义主键。 */
  parameterDefinitionId: number
  /** 参数编码。 */
  code: string
  /** 参数名称。 */
  name: string
  /** 单位。 */
  unit?: string | null
  /** 小数位数。 */
  decimalPlaces?: number | null
  /** 数据类型，仅曲线响应保证返回。 */
  dataType?: ParameterDataType
  /** 参数组主键。 */
  parameterGroupId?: number
  /** 参数组名称。 */
  parameterGroupName?: string
  /** 上报间隔（分钟）。 */
  reportIntervalMinutes?: number
  /** 排序序号。 */
  sortOrder?: number
  /** 是否为后端自动计算生成的派生列。 */
  isDerived?: boolean
}

/** 表格查询中的单元格。 */
export interface MeasurementTableCell {
  /** 原始数据点主键；聚合数据为空。 */
  pointId?: EntityId | null
  /** 展示值文本。 */
  valueText?: string | null
  /** 数值。 */
  numericValue?: number | null
  /** 接收时间。 */
  receivedAt?: string | null
  /** 自动审核状态。 */
  autoReviewStatus?: AutoReviewStatus
  /** 聚合样本数。 */
  sampleCount?: number
  /** 原始数据的接收来源；仅原始查询返回 */
  source?: IngestionSource
  /** 原始数据的测量数据标志；仅原始查询返回 */
  measurementDataFlag?: string
}

/** 修正测量点的有效值。 */
export interface MeasurementCorrectionRequest {
  /** 修正值文本。 */
  effectiveValueText: string
  /** 是否重跑自动审核。 */
  rerunAutoReview: boolean
}

/** 参数数据类型。 */
export type ParameterDataType = "Decimal" | "Integer" | "Boolean" | "String" | "DateTime" | "Longitude" | "Latitude" | "Enum"

/** 数据查询请求。参数组和参数定义主键必须二选一。 */
export interface MeasurementTableQuery {
  /** 站点主键。 */
  stationId: number
  /** 站点参数组主键。 */
  parameterGroupId?: number | null
  /** 指定参数定义主键。 */
  parameterDefinitionIds?: number[] | null
  /** 查询开始时间（包含）。 */
  from: string
  /** 查询结束时间（不包含）。 */
  to: string
  /** 查询粒度。 */
  granularity: Granularity
  /** 是否在结果中追加后台计算的水质等级派生列。 */
  includeWaterQualityGrade?: boolean
}

/** 表格查询响应。 */
export interface MeasurementTableResult {
  /** 站点主键。 */
  stationId: number
  /** 站点名称。 */
  stationName: string
  /** 参数组主键。 */
  parameterGroupId?: number
  /** 参数组名称。 */
  parameterGroupName?: string
  /** 上报间隔（分钟）。 */
  reportIntervalMinutes: number
  /** 数据粒度。 */
  granularity: Granularity
  /** 参数列。 */
  columns: MeasurementTableColumn[]
  /** 时间对齐的数据行。 */
  rows: Array<{ time: string, values: Record<string, MeasurementTableCell | null> }>
}

/** 紧凑曲线查询响应。 */
export interface MeasurementSeriesResult extends Omit<MeasurementTableResult, "rows"> {
  /** 第 0 项是时间，其余项与 columns 顺序对齐。 */
  rows: Array<Array<string | number | null>>
}

/** 参数组快照中的一个参数和值 */
export interface LatestParameterValue {
  /** 参数编码 */
  code: string
  /** 参数名称 */
  name: string
  /** 参数单位 */
  unit?: string
  /** 参数值 */
  value?: string
}

/** 一个参数组在同一业务时刻的最新快照 */
export interface LatestParameterGroup {
  /** 参数组ID */
  ParameterGroupId: number
  /** 参数组名称 */
  parameterGroupName: string
  /** 上报时间 */
  reportIntervalMinutes?: string
  /** 当前有效数值。 */
  observedAt?: string
  parameters: LatestParameterValue[]
}

/** 站点最新数据响应。 */
export interface LatestMeasurementResult {
  /** 站点主键。 */
  stationId: number
  /** 站点编码。 */
  code: string
  /** 站点名称。 */
  stationName: string
  /** 站点分组名称。 */
  groupName?: string
  /** 参数与最新测量点列表。 */
  parameterGroups: LatestParameterGroup[]
  /** 根据站点各水质参数最新值计算的当前海水水质等级 */
  waterQualityGrade?: WaterQualityGrade
}

/** 数据获取率和有效率查询请求 */
export interface DataRateRequest {
  /** 站点主键。 */
  stationId: number
  /** 查询开始时间（包含）。 */
  from: string
  /** 查询结束时间（不包含）。 */
  to: string
  /** 站点参数组主键。 */
  parameterGroupId?: number
  /** 有效人工审核状态列表。 */
  validManualReviewStatuses?: string[]
  /** 统计方式；Direct 为直接统计全部数据点，TimeSlot 为仅统计周期时间槽起点的数据 */
  calculationMode: CalculationMode
  /** 站点参数组主键。 */
  excludeMaintenancePeriods?: boolean
}

/** 数据率统计项。 */
export interface DataRateResult {
  /** 参与计算的参数 */
  parameter: MeasurementTableColumn
  /** 按当前上报周期计算的应获取数据点数 */
  expectedCount: number
  /** 因维护或大修区间跳过的应报时间槽数；未启用跳过选项时为零 */
  excludedMaintenanceCount: number
  /** 实际收到数据的时间槽数 */
  receivedCount: number
  /** 当前最高人工审核结论符合有效条件的时间槽数 */
  validCount: number
  /** 未收到数据的时间槽数 */
  missingCount: number
  /** 同一时间槽多出的数据点数 */
  duplicateCount: number
  /** 实际获取数除以应获取数；分母为零时为空。 */
  acquisitionRate?: number | null
  /** 实际有效数除以应获取数；分母为零时为空。 */
  validityRate?: number | null
}

/** 创建数据获取率和有效率统计 Excel 导出的请求 */
export interface CreateDataRateExportRequest {
  /** 站点主键。 */
  stationId: number
  /** 站点 MN。 */
  from: string
  /** 查询结束时间（不包含）。 */
  to: string
  /** 站点参数组主键。 */
  parameterGroupId?: number
  /** 有效人工审核状态列表。 */
  validManualReviewStatuses?: string[]
  /** 统计方式；Direct 为直接统计全部数据点，TimeSlot 为仅统计周期时间槽起点的数据 */
  calculationMode: CalculationMode
  /** 站点参数组主键。 */
  excludeMaintenancePeriods?: boolean
  /** 可选下载文件名主体 */
  fileName: string
}

/** 站点轨迹点 */
export interface StationTrajectoryPoint {
  /** 观测时间。 */
  observedAt: string
  /** 经度 */
  longitude: number
  /** 纬度 */
  latitude: number
}

/** 站点轨迹查询结果 */
export interface StationTrajectoryResult {
  /** 站点主键 */
  stationId: number
  /** 站点编码 */
  code: string
  /** 站点名称 */
  stationName: string
  /** 轨迹点 */
  points: StationTrajectoryPoint[]
}

/** 批量删除数据点请求 */
export interface DeleteMeasurementPointsRequest {
  /** 需要删除的数据点ID */
  pointIds: number[]
  /** 删除原因 */
  reason: string
  /** 是否确认 */
  confirm: boolean
  /** 数据点物理删除口令 */
  password: string
}

/** 批量删除数据点结果 */
export interface DeleteMeasurementPointsResult {
  /** 本次操作批次号 */
  operationId: string
  /** 去重后的请求数量 */
  requestedCount: number
  /** 实际删除数量 */
  deletedCount: number
  /** 不存在的数据点数量 */
  notFoundCount: number
  /** 不存在的数据点 ID */
  notFoundPointIds: number[]
}

/** 质控数据时间范围查询条件 */
export interface QualityControlDataQuery {
  /** 站点Id */
  stationId: number
  /** 业务时间结束 */
  from: string
  /** 业务时间结束 */
  to: string
}

/** 质控数据查询返回的一条参数记录 */
export interface QualityControlDataRecord {
  /** 站点 ID */
  id: EntityId
  /** 参数定义 ID */
  parameterDefinitionId: number
  /** 参数编码 */
  parameterCode: string
  /** 参数名称 */
  parameterName: string
  /** 当前参数单位 */
  unit: string
  /** 质控报文的 HJ212 命令编码 */
  commandCode: string
  /** 业务时间 */
  observedAt: string
  /** 接收时间 */
  receivedAt: string
  /** 数据接收来源 */
  source: number
  /** 设备数据状态 */
  measurementDataFlag: string
  /** 完整的质控指标原始值 */
  metrics: Record<string, string | null>
}
