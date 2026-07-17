/** EcoCenter API 中使用字符串传输的 64 位主键。 */
export type EntityId = string

/** 查询粒度：原始值、时均值、日均值、月均值。 */
export type Granularity = "Raw" | "Hour" | "Day" | "Month"

/** 参数业务类型。 */
export type ParameterKind = "Monitoring" | "System"

/** 参数数据类型。 */
export type ParameterDataType = "Decimal" | "Integer" | "Boolean" | "String" | "DateTime" | "Longitude" | "Latitude" | "Enum"

/** 自动审核状态。 */
export type AutoReviewStatus = "Passed" | "Failed" | "Error" | "NoRule" | string

/** 人工审核结论。 */
export type ManualReviewStatus = "Valid" | "Invalid" | "Fault" | "Suspect" | "AboveUpperLimit" | "BelowLowerLimit"

/** 通用分页响应。 */
export interface PageResult<T> {
  /** 当前页数据。 */
  items: T[]
  /** 数据总量。 */
  total: number
  /** 当前页码。 */
  pageNumber: number
  /** 每页条数。 */
  pageSize: number
}

/** 站点状态。 */
export type StationStatus = "Disabled" | "Active" | "Maintenance" | "Offline"

/** 站点实体。 */
export interface Station {
  /** 站点数据库主键。 */
  id: EntityId
  /** HJ212 设备唯一标识。 */
  mn: string
  /** 站点名称。 */
  name: string
  /** 站点分组名称。 */
  groupName?: string
  /** 配置经度；地图优先使用最新经度参数值。 */
  longitude?: number | null
  /** 配置纬度；地图优先使用最新纬度参数值。 */
  latitude?: number | null
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

/** 参数目录分组实体。 */
export interface ParameterCatalogGroup {
  /** 分组主键。 */
  id: EntityId
  /** 上级分组主键，顶级分组为空。 */
  parentId?: EntityId | null
  /** 分组名称。 */
  name: string
  /** 分组参数类型。 */
  parameterKind: ParameterKind
  /** 显示顺序。 */
  sortOrder: number
}

/** 参数定义实体。 */
export interface ParameterDefinition {
  /** 参数定义主键。 */
  id: EntityId
  /** HJ212 参数编码。 */
  code: string
  /** 参数名称。 */
  name: string
  /** 参数业务类型。 */
  parameterKind: ParameterKind
  /** 所属目录分组主键。 */
  catalogGroupId: EntityId
  /** 参数数据类型。 */
  dataType: ParameterDataType
  /** 单位。 */
  unit?: string
  /** 小数位数。 */
  decimalPlaces: number
  /** HJ212 主值指标后缀。 */
  primaryMetricSuffix?: string
  /** 显示顺序。 */
  sortOrder: number
  /** 参数说明。 */
  description?: string
}

/** 站点参数组实体。 */
export interface StationParameterGroup {
  /** 参数组主键。 */
  id: EntityId
  /** 参数组名称。 */
  name: string
  /** 参数组类型。 */
  groupKind: ParameterKind
  /** 预期上报间隔（分钟）。 */
  reportIntervalMinutes: number
  /** 显示顺序。 */
  sortOrder: number
}

/** 站点参数绑定实体。 */
export interface StationParameterBinding {
  /** 绑定主键。 */
  id: EntityId
  /** 参数定义主键。 */
  parameterDefinitionId: EntityId
  /** 站点参数组主键。 */
  stationParameterGroupId: EntityId
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

/** 最新数据中的参数元信息。 */
export interface LatestParameterMeta {
  /** 参数定义主键。 */
  id?: EntityId
  /** 参数编码。 */
  code: string
  /** 参数类型。 */
  kind: ParameterKind
  /** 参数名称。 */
  name: string
  /** 单位。 */
  unit?: string
  /** 小数位数。 */
  decimalPlaces: number
  /** 数据类型。 */
  dataType: ParameterDataType
  /** 所属站点参数组主键。 */
  groupId?: EntityId
  /** 所属站点参数组名称。 */
  groupName?: string
  /** 上报周期（分钟）。 */
  reportIntervalMinutes?: number
  /** 显示顺序。 */
  sortOrder?: number
}

/** 单点人工审核摘要。 */
export interface ManualReviewSummary {
  /** 已完成人工审核等级，0 表示未审核。 */
  currentLevel: number
  /** 当前人工审核结论。 */
  currentStatus?: ManualReviewStatus
}

/** 最新测量点。 */
export interface MeasurementPoint {
  /** 测量点主键。 */
  id: EntityId
  /** 业务观测时间。 */
  observedAt: string
  /** 服务端接收时间。 */
  receivedAt?: string
  /** 设备原始上报主值。 */
  reportedValueText?: string | null
  /** 当前有效值文本。 */
  effectiveValueText?: string | null
  /** 当前有效数值。 */
  effectiveNumericValue?: number | null
  /** HJ212 指标键值。 */
  metrics?: Record<string, string>
  /** 自动审核状态。 */
  autoReviewStatus: AutoReviewStatus
  /** 各自动规则审核结果 JSON。 */
  autoReviewResultsJson?: string
  /** 人工审核摘要。 */
  manualReview?: ManualReviewSummary
}

/** 站点最新数据响应。 */
export interface StationLatestMeasurements {
  /** 站点 MN。 */
  mn: string
  /** 站点名称。 */
  stationName: string
  /** 站点分组名称。 */
  groupName?: string
  /** 参数与最新测量点列表。 */
  parameters: Array<{ parameter: LatestParameterMeta, point: MeasurementPoint | null }>
}

/** 数据查询请求。参数组和参数定义主键必须二选一。 */
export interface MeasurementQueryRequest {
  /** 站点主键。 */
  stationId: EntityId
  /** 站点参数组主键。 */
  parameterGroupId?: EntityId | null
  /** 指定参数定义主键。 */
  parameterDefinitionIds?: EntityId[] | null
  /** 查询开始时间（包含）。 */
  from: string
  /** 查询结束时间（不包含）。 */
  to: string
  /** 查询粒度。 */
  granularity: Granularity
}

/** 对齐表格的列定义。 */
export interface MeasurementColumn {
  /** 参数定义主键。 */
  parameterDefinitionId: EntityId
  /** 参数编码。 */
  code: string
  /** 参数名称。 */
  name: string
  /** 单位。 */
  unit?: string
  /** 小数位数。 */
  decimalPlaces: number
  /** 参数类型。 */
  kind?: ParameterKind
  /** 数据类型，仅曲线响应保证返回。 */
  dataType?: ParameterDataType
}

/** 查询表格中的单元格。 */
export interface MeasurementCell {
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
  /** 自动规则结果 JSON。 */
  autoReviewResultsJson?: string
  /** 人工审核摘要。 */
  manualReview?: ManualReviewSummary | null
  /** 聚合样本数。 */
  sampleCount?: number
}

/** 对齐表格查询响应。 */
export interface MeasurementQueryResult {
  /** 站点主键。 */
  stationId: EntityId
  /** 站点名称。 */
  stationName: string
  /** 参数组主键。 */
  parameterGroupId?: EntityId
  /** 参数组名称。 */
  parameterGroupName?: string
  /** 上报间隔（分钟）。 */
  reportIntervalMinutes: number
  /** 数据粒度。 */
  granularity: Granularity
  /** 参数列。 */
  columns: MeasurementColumn[]
  /** 时间对齐的数据行。 */
  rows: Array<{ time: string, values: Record<string, MeasurementCell | null> }>
}

/** 紧凑曲线查询响应。 */
export interface MeasurementSeriesResult extends Omit<MeasurementQueryResult, "rows"> {
  /** 第 0 项是时间，其余项与 columns 顺序对齐。 */
  rows: Array<Array<string | number | null>>
}

/** 数据率统计项。 */
export interface DataRateItem {
  /** 参数信息。 */
  parameter: LatestParameterMeta
  /** 应收数据量。 */
  expectedCount: number
  /** 实收数据量。 */
  receivedCount: number
  /** 有效数据量。 */
  validCount: number
  /** 缺失数据量。 */
  missingCount: number
  /** 重复数据量。 */
  duplicateCount: number
  /** 获取率，0～1；分母为零时为空。 */
  acquisitionRate?: number | null
  /** 有效率，0～1；分母为零时为空。 */
  validityRate?: number | null
}

/** 审核进度统计。 */
export interface ReviewProgress {
  /** 数据点总数。 */
  totalCount: number
  /** 一级审核完成数。 */
  level1Completed: number
  /** 二级审核完成数。 */
  level2Completed: number
  /** 三级审核完成数。 */
  level3Completed: number
  /** 一级审核率。 */
  level1Rate: number
  /** 二级审核率。 */
  level2Rate: number
  /** 三级审核率。 */
  level3Rate: number
  /** 未审核数量。 */
  unreviewedCount: number
  /** 仅完成一级数量。 */
  level1OnlyCount: number
  /** 当前处于二级数量。 */
  level2Count: number
  /** 当前处于三级数量。 */
  level3Count: number
  /** 分桶时间，汇总行中可能为空。 */
  time?: string
  /** 分桶统计列表，仅汇总响应包含。 */
  buckets?: ReviewProgress[]
}

/** 自动审核规则定义。 */
export interface ReviewRuleDefinition {
  /** 规则主键。 */
  id: EntityId
  /** 规则唯一编码。 */
  code: string
  /** 规则名称。 */
  name: string
  /** 后端规则实现标识，如 Range、Compare、SameValue。 */
  implementationKey: string
  /** 适用参数定义主键。 */
  parameterDefinitionId: EntityId
  /** 默认规则配置 JSON。 */
  defaultConfigJson: string
  /** 配置结构 JSON。 */
  configSchemaJson: string
  /** 规则说明。 */
  description?: string
}

/** 站点规则绑定。 */
export interface ReviewRuleBinding {
  /** 绑定主键。 */
  id: EntityId
  /** 规则定义主键。 */
  ruleDefinitionId: EntityId
  /** 站点主键。 */
  stationId: EntityId
  /** 站点级阈值覆盖 JSON。 */
  configOverrideJson: string
  /** 执行优先级。 */
  priority: number
}

/** 站点维护期类型。 */
export type MaintenanceType = "AnnualOverhaul" | "Emergency" | "Routine" | "Other"

/** 站点维护期。 */
export interface MaintenancePeriod {
  /** 维护期主键。 */
  id: EntityId
  /** 维护类型。 */
  maintenanceType: MaintenanceType
  /** 开始时间。 */
  startAt: string
  /** 结束时间。 */
  endAt: string
  /** 维护原因。 */
  reason?: string
}
