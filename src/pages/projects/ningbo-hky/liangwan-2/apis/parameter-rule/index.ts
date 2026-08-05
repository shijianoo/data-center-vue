import type { ReviewRuleBinding, ReviewRuleDefinition } from "./type"
import { ecoClient } from "../client"

/** 查询自动审核规则定义。 */
export function getReviewRules() {
  return ecoClient.get<ReviewRuleDefinition[]>("/review-rules")
}

/** 创建自动审核规则定义。 */
export function createReviewRule(data: Omit<ReviewRuleDefinition, "id">) {
  return ecoClient.post<ReviewRuleDefinition>("/review-rules", data)
}

/** 更新自动审核规则定义。 */
export function updateReviewRule(id: number, data: Omit<ReviewRuleDefinition, "id">) {
  return ecoClient.put(`/review-rules/${id}`, data)
}

export function deleteReviewRule(id: number) {
  return ecoClient.delete(`/review-rules/${id}`)
}

export function getReviewRuleBindings(stationId?: number) {
  return ecoClient.get<ReviewRuleBinding[]>("/review-rule-bindings", { params: { stationId } })
}

export function createReviewRuleBinding(data: Omit<ReviewRuleBinding, "id">) {
  return ecoClient.post<ReviewRuleBinding>("/review-rule-bindings", data)
}

export function updateReviewRuleBinding(id: number, data: Omit<ReviewRuleBinding, "id">) {
  return ecoClient.put(`/review-rule-bindings/${id}`, data)
}

export function deleteReviewRuleBinding(id: number) {
  return ecoClient.delete(`/review-rule-bindings/${id}`)
}
