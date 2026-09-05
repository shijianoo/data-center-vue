export interface HistoryQuery {
  tableName: string
  serialNumber: string
  selectColumns: string[]
  startTime: string
  endTime: string
  sortDirection?: string
  Aggregate?: "Hourly" | "Daily" | "Weekly" | "Monthly"
  downloadFileName?: string
}

export interface HistoryLocationQuery {
  serialNumber: string
  startTime: string
  endTime: string
}

/** 数据获取率和有效率查询请求 */
export interface QualityRateRequest {
  /** 设备编号，例如 NB00 */
  serialNumber: string
  /** 数据组名称 */
  groupName: string
  /** 统计开始时间 */
  startTime: string
  /** 统计结束时间 */
  endTime: string
}

/** 单个字段的获取率和有效率 */
export interface QualityRateItem {
  /** 数据组名称 */
  groupName: string
  /** 数据库字段名称 */
  fieldName: string
  /** 字段中文名称 */
  displayName: string
  /** 数据来源表名称 */
  tableName: string
  /** 该数据组的上报周期，单位为分钟 */
  periodMinutes: number
  /** 根据时间范围和上报周期计算的理论数据条数 */
  expectedCount: number
  /** 时间范围内实际查询到的数据条数 */
  actualCount: number
  /** 获取率（实际条数 / 理论条数 × 100），无理论条数时为空 */
  acquisitionRate: number
  /** 字段值处于配置正常范围内的条数 */
  validCount: number
  /** 有效率（有效条数 / 实际条数 × 100），无实际数据时为空 */
  validityRate: number
  /** 配置的正常值下限 */
  minValue: number
  /** 配置的正常值上限 */
  maxValue: number
}

/** 设备质量统计结果 */
export interface QualityRateResponse {
  /** 设备编号 */
  serialNumber: string
  /** 实际统计开始时间 */
  startTime: string
  /** 实际统计结束时间 */
  endTime: string
  /** 按数据组和字段展开的统计结果 */
  items: QualityRateItem[]
}

/** 批量删除数据请求 */
export interface DeleteDataRequest {
  /** 际数据表名，例如 buoy_water_data。 */
  tableName: string
  /** 需要删除的数据唯一标识 */
  recordIds: number[]
}
