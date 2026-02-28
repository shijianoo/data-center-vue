// #region 数据源

export interface CreateOrUpdateDataSource {
  id?: string
  deviceModelId: string
  modelName?: string
  sourceName: string
  sourceType: number
  resourceName: string
  intervalMinutes: number
  description?: string
  sortOrder: number
}

export interface DataSource {
  id: string
  createdAt: string
  deviceModelId: string
  modelName: string
  sourceName: string
  sourceType: number
  resourceName: string
  intervalMinutes: number
  description?: string
  sortOrder: number
  dataPoints: string[]
}

// #endregion

// #region 数据点

export interface CreateOrUpdateDataPoint {
  id?: string
  dataSourceId: string
  dataMapping: string
  dataName: string
  unit?: string
  description?: string
  sortOrder: number
}

export interface DataPoint {
  id: string
  createdAt: string
  dataSourceId: string
  dataMapping: string
  dataName: string
  unit?: string
  description?: string
  sortOrder: number
  ruleCount: number
}

// #endregion

// #region 规则定义

export interface CreateOrUpdateRuleDefinition {
  id?: string
  tenantId?: string
  dataSourceId: string
  dataPointId?: string
  name: string
  ruleType: number
  operator: number
  intervalMinutes: number
  value1?: string
  value2?: string
  enabled: boolean
  description?: string
  sortOrder: number
}

export interface RuleDefinition {
  id: string
  createdAt: string
  tenantId?: string
  dataSourceId: string
  dataPointId?: string
  name: string
  ruleType: number
  operator: number
  intervalMinutes: number
  value1: string
  value2: string
  enabled: boolean
  description?: string
  sortOrder: number
  dataPointName?: string
  bindingCount: number
}

// #endregion

// #region 规则绑定

export interface CreateOrUpdateRuleBinding {
  id?: string
  ruleId: string
  deviceModelId: string
  deviceId: string
  serialNumber: string
  deviceName?: string
  intervalMinutes: number
  value1?: string
  value2?: string
  enabled: boolean
  description?: string
  sortOrder: number
}

export interface RuleBinding {
  id: string
  createdAt: string
  ruleId: string
  deviceModelId: string
  deviceId: string
  serialNumber: string
  deviceName?: string
  intervalMinutes: number
  nextCheckTime: string
  value1?: string
  value2?: string
  enabled: boolean
  description?: string
  sortOrder: number
  ruleName: string
  defaultValue1: string
  defaultValue2: string
}

export interface FieldData {
  time: string
  name: string
  value?: string
}

export interface CheckResult {
  isAlarm: boolean
  message: string
}
// #endregion
