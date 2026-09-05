import type { EntityId } from "../common/type"
import type { BatchManualReviewRequest, BatchManualReviewResult, ManualReviewRequest, ManualReviewResult, MeasurementReviewQuery, MeasurementReviewResult, ReviewProgressRequest, ReviewProgressResult } from "./type"
import { ecoClient } from "../client"

/** 查询人工审核数据。 */
export function queryMeasurementReview(data: MeasurementReviewQuery) {
  return ecoClient.post<MeasurementReviewResult>("/measurements/review-query", data)
}

/** 提交单点指定级别人工审核。 */
export function saveManualReview(pointId: EntityId, data: ManualReviewRequest, options?: { headers?: Record<string, string> }) {
  return ecoClient.put<ManualReviewResult>(`/measurement-points/${pointId}/review`, data, options)
}

/** 批量提交人工审核。 */
export function saveBatchManualReview(data: BatchManualReviewRequest, options?: { headers?: Record<string, string> }) {
  return ecoClient.put<BatchManualReviewResult>(`/measurement-points/reviews/batch`, data, options)
}

/** 查询人工审核完成率。 */
export function getManualReviewProgress(data: ReviewProgressRequest) {
  return ecoClient.post<ReviewProgressResult>("/manual-reviews/progress", data)
}
