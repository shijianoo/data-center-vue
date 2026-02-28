import type { CheckResult, CreateOrUpdateDataPoint, CreateOrUpdateDataSource, CreateOrUpdateRuleBinding, CreateOrUpdateRuleDefinition, DataPoint, DataSource, FieldData, RuleBinding, RuleDefinition } from "./type"
import { dataMonitorRequest } from "@/http/axios"

// #region 数据源

/** 创建数据源 */
export function createDataSourceApi(data: CreateOrUpdateDataSource) {
  return dataMonitorRequest({
    url: "data-source",
    method: "post",
    data
  })
}

/** 删除数据源 */
export function deleteDataSourceApi(id: string) {
  return dataMonitorRequest({
    url: `data-source/${id}`,
    method: "delete"
  })
}

/** 更新数据源 */
export function updateDataSourceApi(data: CreateOrUpdateDataSource) {
  return dataMonitorRequest({
    url: `data-source/${data.id}`,
    method: "put",
    data
  })
}

/** 获取数据源列表 */
export function getDataSourcesApi() {
  return dataMonitorRequest<ApiResponseData<DataSource[]>>({
    url: "data-source",
    method: "GET"
  })
}

/** 根据Id获取数据源 */
export function getDataSourceByIdApi(id: string) {
  return dataMonitorRequest<ApiResponseData<DataSource>>({
    url: `data-source/${id}`,
    method: "get"
  })
}

/** 根据型号Id获取数据源 */
export function getDataSourceByModelIdApi(id: string) {
  return dataMonitorRequest<ApiResponseData<DataSource>>({
    url: `data-source/by-modelid/${id}`,
    method: "get"
  })
}

// #endregion

// #region 数据点

/** 创建数据点 */
export function createDataPointApi(data: CreateOrUpdateDataPoint) {
  return dataMonitorRequest({
    url: "data-point",
    method: "post",
    data
  })
}

/** 删除数据点 */
export function deleteDataPointApi(id: string) {
  return dataMonitorRequest({
    url: `data-point/${id}`,
    method: "delete"
  })
}

/** 更新数据点 */
export function updateDataPointApi(data: CreateOrUpdateDataPoint) {
  return dataMonitorRequest({
    url: `data-point/${data.id}`,
    method: "put",
    data
  })
}

/** 获取数据点列表 */
export function getDataPointsApi(dataSourceId?: string) {
  return dataMonitorRequest<ApiResponseData<DataPoint[]>>({
    url: "data-point",
    method: "get",
    params: {
      dataSourceId
    }
  })
}

/** 根据Id获取数据点 */
export function getDataPointByIdApi(id: string) {
  return dataMonitorRequest<ApiResponseData<DataPoint>>({
    url: `data-point/${id}`,
    method: "get"
  })
}

// #endregion

// #region 规则定义

/** 创建规则定义 */
export function createRuleDefinitionApi(data: CreateOrUpdateRuleDefinition) {
  return dataMonitorRequest({
    url: "rule-refinition",
    method: "post",
    data
  })
}

/** 删除规则定义 */
export function deleteRuleDefinitionApi(id: string) {
  return dataMonitorRequest({
    url: `rule-refinition/${id}`,
    method: "delete"
  })
}

/** 更新规则定义 */
export function updateRuleDefinitionApi(data: CreateOrUpdateRuleDefinition) {
  return dataMonitorRequest({
    url: `rule-refinition/${data.id}`,
    method: "put",
    data
  })
}

/** 获取规则定义列表 */
export function getRuleDefinitionsApi(dataSourceId: string, dataPointId?: string) {
  return dataMonitorRequest<ApiResponseData<RuleDefinition[]>>({
    url: "rule-refinition",
    method: "get",
    params: { dataSourceId, dataPointId }
  })
}

/** 根据型号Id获取规则定义 */
export function getRuleDefinitionsByModelIdApi(id: string) {
  return dataMonitorRequest<ApiResponseData<RuleDefinition[]>>({
    url: `rule-refinition/by-modelId/${id}`,
    method: "get"
  })
}

/** 根据Id获取规则定义 */
export function getRuleDefinitionByIdApi(id: string) {
  return dataMonitorRequest<ApiResponseData<RuleDefinition>>({
    url: `rule-refinition/${id}`,
    method: "get"
  })
}
// #endregion

// #region 规则绑定

/** 创建规则定义 */
export function createRuleBindingApi(data: CreateOrUpdateRuleBinding) {
  return dataMonitorRequest({
    url: "rule-binding",
    method: "post",
    data
  })
}

/** 删除规则定义 */
export function deleteRuleBindingApi(id: string) {
  return dataMonitorRequest({
    url: `rule-binding/${id}`,
    method: "delete"
  })
}

/** 更新规则定义 */
export function updateRuleBindingApi(data: CreateOrUpdateRuleBinding) {
  return dataMonitorRequest({
    url: `rule-binding/${data.id}`,
    method: "put",
    data
  })
}

/** 获取规则定义列表 */
export function getRuleBindingsApi(deviceModelId?: string, deviceId?: string, ruleId?: string) {
  return dataMonitorRequest<ApiResponseData<RuleBinding[]>>({
    url: "rule-binding",
    method: "get",
    params: { deviceModelId, deviceId, ruleId }
  })
}

/** 根据Id获取规则定义 */
export function getRuleBindingByIdApi(id: string) {
  return dataMonitorRequest<ApiResponseData<RuleBinding>>({
    url: `rule-binding/${id}`,
    method: "get"
  })
}

/** 根据指定序列号获取对应数据点的最新数据 */
export function getLatestFieldDataApi(sn: string, dataPointId: string) {
  return dataMonitorRequest<ApiResponseData<FieldData>>({
    url: "rule-binding/latest-field-data",
    method: "get",
    params: { sn, dataPointId }
  })
}

/** 执行规则检查 */
export function executeCheckApi(id: string) {
  return dataMonitorRequest<ApiResponseData<CheckResult>>({
    url: `rule-binding/execute-check`,
    method: "get",
    params: { id }
  })
}
// #endregion
