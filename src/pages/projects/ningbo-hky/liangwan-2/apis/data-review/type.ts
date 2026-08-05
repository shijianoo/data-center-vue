import type { AutoReviewStatus, EntityId } from "../common/type"
import type { MeasurementTableColumn, MeasurementTableResult } from "../data-query/type"

/** 人工审核结论。 */
export type ManualReviewStatus = "Valid" | "Invalid" | "Fault" | "Suspect" | "AboveUpperLimit" | "BelowLowerLimit"

/** 数据审核查询请求。 */
export interface MeasurementReviewQuery {
  /** 站点主键。 */
  stationId: number
  /** 关联参数组（可选）。 */
  parameterGroupId?: number | null
  /** 必须提供审核状态筛选。 */
  from: string
  /** 查询结束时间（不包含）。 */
  to: string
  /** 审核级别。 */
  reviewLevel: number
}

/** 数据审核查询中的单元格。 */
export interface MeasurementReviewCell {
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
  /** 审核状态。 */
  reviewStatus?: ManualReviewStatus
  /** 审核评论 */
  reviewComment?: string | null
}

/** 审核数据查询响应。 */
export interface MeasurementReviewResult extends Omit<MeasurementTableResult, "rows"> {
  /** 审核数据行。 */
  rows: Array<{ time: string, values: Record<string, MeasurementReviewCell | null> }>
}

/** 人工审核请求。 */
export interface ManualReviewRequest {
  /** 审核级别 */
  level: number
  /** 审核状态 */
  status: ManualReviewStatus
  /** 审核人 */
  reviewer: string
  /** 审核评论 */
  comment?: string
}

/** 人工审核结果 */
export interface ManualReviewResult {
  /** 测量数据点主键。 */
  pointId: EntityId
  /** 当前审核级别 */
  currentLevel: number
  /** 当前审核状态 */
  currentStatus: ManualReviewStatus
}

/** 批量人工审核请求。 */
export interface BatchManualReviewRequest {
  /** 测量数据点主键列表。 */
  pointIds: EntityId[]
  /** 审核级别 */
  level: number
  /** 审核状态 */
  status: ManualReviewStatus
  /** 审核人 */
  reviewer: string
  /** 审核评论 */
  comment?: string
}

/** 批量人工审核响应 */
export interface BatchManualReviewResult {
  /** 总数。 */
  total: number
  /** 更新数量。 */
  updated: number
}

export interface ReviewProgressRequest {
  /** 查询开始时间（包含）。 */
  from: string
  /** 查询结束时间（不包含）。 */
  to: string
  /** 按站点筛选。 */
  stationId?: number
  /** 粒度。 */
  granularity?: "Day" | "Month"
}

/** 一个自然日或自然月内的人工审核完成率 */
export interface ReviewProgressBucket {
  /** 分桶开始本地时间 */
  BucketStart?: string
  /** 实际存在的数据点总数 */
  TotalCount: number
  /** 至少完成一级审核的数据点数 */
  Level1Completed: number
  /** 至少完成二级审核的数据点数 */
  Level2Completed: number
  /** 完成三级审核的数据点数 */
  Level3Completed: number
  /** 一级完成率；分母为零时为空 */
  Level1Rate: number
  /** 二级完成率；分母为零时为空 */
  Level2Rate: number
  /** 三级完成率；分母为零时为空 */
  Level3Rate: number
  /** 尚未完成任何人工审核的数据点数 */
  UnreviewedCount: number
  /** 只完成一级审核的数据点数 */
  Level1OnlyCount: number
  /** 当前停留在二级审核的数据点数 */
  Level2Count: number
  /** 当前完成三级审核的数据点数 */
  Level3Count: number
}

/** 人工审核完成率查询结果 */
export interface ReviewProgressResult {
  /** 查询范围内的数据点总数 */
  totalCount: number
  /** 至少完成一级审核的数据点数 */
  level1Completed: number
  /** 至少完成二级审核的数据点数 */
  level2Completed: number
  /** 完成三级审核的数据点数 */
  level3Completed: number
  /** 一级总体完成率；分母为零时为空 */
  level1Rate: number
  /** 二级总体完成率；分母为零时为空 */
  level2Rate: number
  /** 三级总体完成率；分母为零时为空 */
  level3Rate: number
  /** 尚未完成任何人工审核的数据点数 */
  unreviewedCount: number
  /** 只完成一级审核的数据点数 */
  level1OnlyCount: number
  /** 当前停留在二级审核的数据点数 */
  level2Count: number
  /** 当前完成三级审核的数据点数 */
  level3Count: number
  /** 仅包含实际存在数据点的自然日或自然月分桶。 */
  buckets?: ReviewProgressBucket[]
}

// Re-export types needed by consumers of this module
export type { MeasurementTableColumn }
