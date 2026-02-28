import type { ComputedRef } from "vue"

/**
 * 规则值字段的配置
 */
export interface RuleValueFieldsConfig {
  /** 规则类型 */
  ruleType: number
  /** 运算符 */
  operator: number
  /** 规则定义的 value1（用于显示默认值） */
  defaultValue1?: string
  /** 规则定义的 value2（用于显示默认值） */
  defaultValue2?: string
  /** 是否为规则绑定模式（显示默认值提示） */
  isBinding?: boolean
}

/**
 * 规则值字段的返回值
 */
export interface RuleValueFieldsResult {
  /** 是否显示运算符选择器 */
  showOperator: ComputedRef<boolean>
  /** 是否显示 Value2 字段 */
  showValue2: ComputedRef<boolean>
  /** Value1 的 label */
  value1Label: ComputedRef<string>
  /** Value2 的 label */
  value2Label: ComputedRef<string>
  /** Value1 的 placeholder */
  value1Placeholder: ComputedRef<string>
  /** Value2 的 placeholder */
  value2Placeholder: ComputedRef<string>
}

/**
 * 规则值字段的 Hook
 * 用于规则定义和规则绑定页面，动态控制 Value1/Value2 的显示、label 和 placeholder
 *
 * @param config 配置对象或返回配置的函数
 * @returns 规则值字段的显示控制
 *
 * @example
 * // 规则定义页面使用
 * const { showOperator, showValue2, value1Label, value2Label, value1Placeholder, value2Placeholder } = useRuleValueFields(() => ({
 *   ruleType: formData.value.ruleType,
 *   operator: formData.value.operator
 * }))
 *
 * @example
 * // 规则绑定页面使用
 * const { showValue2, value1Label, value2Label, value1Placeholder, value2Placeholder } = useRuleValueFields(() => ({
 *   ruleType: currentRule.value?.ruleType || 0,
 *   operator: currentRule.value?.operator || 0,
 *   defaultValue1: currentRule.value?.value1,
 *   defaultValue2: currentRule.value?.value2,
 *   isBinding: true
 * }))
 */
export function useRuleValueFields(
  config: (() => RuleValueFieldsConfig) | ComputedRef<RuleValueFieldsConfig>
): RuleValueFieldsResult {
  // 获取配置
  const getConfig = () => {
    return typeof config === "function" ? config() : config.value
  }

  // 判断是否需要显示运算符（仅数值规则需要）
  const showOperator = computed(() => {
    const { ruleType } = getConfig()
    return ruleType === 3
  })

  // 判断是否需要显示value2（数值规则的"之间"运算符 或 位置规则）
  const showValue2 = computed(() => {
    const { ruleType, operator } = getConfig()
    // 数值规则 - 之间运算符
    if (ruleType === 3 && operator === 7) {
      return true
    }
    // 位置规则
    if (ruleType === 2) {
      return true
    }
    return false
  })

  // 获取Value1的label
  const value1Label = computed(() => {
    const { ruleType, operator } = getConfig()

    if (ruleType === 1) {
      return "最大超时时长"
    }
    if (ruleType === 2) {
      return "经纬度坐标"
    }
    if (ruleType === 3) {
      if (operator === 7) {
        return "最小值"
      }
      if (operator === 8) {
        return "子集"
      }
      return "阈值"
    }
    return "值1"
  })

  // 获取Value2的label
  const value2Label = computed(() => {
    const { ruleType, operator } = getConfig()

    if (ruleType === 2) {
      return "半径（米）"
    }
    if (ruleType === 3 && operator === 7) {
      return "最大值"
    }
    return "值2"
  })

  // 获取Value1的placeholder
  const value1Placeholder = computed(() => {
    const { ruleType, operator, defaultValue1, isBinding } = getConfig()

    // 规则绑定模式：显示规则定义的默认值
    if (isBinding) {
      if (defaultValue1) {
        return `默认: ${defaultValue1} (可选，不填则使用此默认值)`
      }
      // 没有默认值时的提示
      if (ruleType === 1) {
        return "可选，请输入最大时长（分钟）"
      }
      if (ruleType === 2) {
        return "可选，请输入经纬度，如: 116.404,39.915"
      }
      if (ruleType === 3 && operator === 8) {
        return "可选，请输入逗号分隔的值，如: 1,2,3,4"
      }
      return "可选，不填则使用规则定义的默认值"
    }

    // 规则定义模式：显示输入提示
    if (ruleType === 1) {
      return "最大时长(分钟)"
    }
    if (ruleType === 2) {
      return "经纬度，如: 116.404,39.915"
    }
    if (ruleType === 3 && operator === 7) {
      return "请输入最小值"
    }
    if (ruleType === 3 && operator === 8) {
      return "逗号分隔的值，如: 1,2,3,4"
    }
    return "阈值"
  })

  // 获取Value2的placeholder
  const value2Placeholder = computed(() => {
    const { ruleType, operator, defaultValue2, isBinding } = getConfig()

    // 规则绑定模式：显示规则定义的默认值
    if (isBinding) {
      if (defaultValue2) {
        return `默认: ${defaultValue2} (可选，不填则使用此默认值)`
      }
      // 没有默认值时的提示
      if (ruleType === 2) {
        return "可选，请输入半径（米）"
      }
      if (ruleType === 3 && operator === 7) {
        return "可选，请输入最大值"
      }
      return "可选，不填则使用规则定义的默认值"
    }

    // 规则定义模式：显示输入提示
    if (ruleType === 2) {
      return "请输入半径(米)"
    }
    if (ruleType === 3 && operator === 7) {
      return "请输入最大值"
    }
    return "请输入值2"
  })

  return {
    showOperator,
    showValue2,
    value1Label,
    value2Label,
    value1Placeholder,
    value2Placeholder
  }
}
