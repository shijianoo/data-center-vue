import type { PageResult } from "../common/type"
import type { ParameterDefinition } from "./type"
import { ecoClient } from "../client"

/** 分页查询参数定义。 */
export function getParameterDefinitions(params: { keyword?: string, pageNumber?: number, pageSize?: number } = {}) {
  return ecoClient.get<PageResult<ParameterDefinition>>("/parameter-definitions", { params: { pageNumber: 1, pageSize: 200, ...params } })
}

/** 创建参数定义。 */
export function createParameterDefinition(data: Omit<ParameterDefinition, "id">) {
  return ecoClient.post<ParameterDefinition>("/parameter-definitions", data)
}

/** 更新参数定义。 */
export function updateParameterDefinition(id: number, data: Omit<ParameterDefinition, "id">) {
  return ecoClient.put<ParameterDefinition>(`/parameter-definitions/${id}`, data)
}

/** 删除参数定义。 */
export function deleteParameterDefinition(id: number) {
  return ecoClient.delete(`/parameter-definitions/${id}`)
}
