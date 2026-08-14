/** 自动审核规则定义。 */
export interface ReviewRuleDefinition {
  /** 规则主键。 */
  id: number
  /** 规则唯一编码。 */
  code: string
  /** 规则名称。 */
  name: string
  /** 后端规则实现标识，如 Range、Compare、SameValue。 */
  implementationKey: string
  /** 适用参数定义主键。 */
  parameterDefinitionId: number
  /** 默认规则配置 JSON。 */
  defaultConfigJson: string
  /** 规则说明。 */
  description?: string
}

/** 站点规则绑定。 */
export interface ReviewRuleBinding {
  /** 绑定主键。 */
  id: number
  /** 规则定义主键。 */
  ruleDefinitionId: number
  /** 站点主键。 */
  stationId: number
  /** 站点级阈值覆盖 JSON。 */
  configOverrideJson: string
  /** 执行优先级。 */
  priority: number
}

/** 为指定站点批量创建规则绑定 */
export interface BatchCreateReviewRuleBindingsCommand {
  /** 站点主键 */
  stationId: number
  /** 待绑定的规则定义ID集合 */
  ruleDefinitionIds: number[]
}

/** 修改单条站点规则绑定的可编辑配置 */
export interface UpdateReviewRuleBindingCommand {
  /** 覆盖配置JSON对象。 */
  configOverrideJson: string
  /** 执行优先级。 */
  priority: number
}
