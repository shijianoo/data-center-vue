import type { PageResult } from "../common/type"
import type { ParameterDataType } from "../data-query/type"

/** 参数定义实体。 */
export interface ParameterDefinition {
  /** 参数定义主键。 */
  id: number
  /** HJ212 参数编码。 */
  code: string
  /** 参数名称。 */
  name: string
  /** 可空展示分组名称 */
  groupName: string
  /** 参数数据类型。 */
  dataType: ParameterDataType
  /** 单位。 */
  unit?: string
  /** 小数位数。 */
  decimalPlaces: number
  /** 优先级排列的指标后缀，使用逗号分隔。例如Rtd,Avg */
  metricSuffixes?: string
  /** 显示顺序。 */
  sortOrder: number
  /** 参数说明。 */
  description?: string
}

// Re-export for convenience
export type { PageResult, ParameterDataType }
