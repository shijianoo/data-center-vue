import type { QueryResult } from "../type"
import type { MemberProfileDto, Tenant, TenantExtra, TenantForm, TenantListResponseData, TenantSummary, UserTenantSelection } from "./type"
import { authCenterRequest } from "@/http/axios"

/** 获取租户列表 */
export function getTenantListApi(params?: any) {
  return authCenterRequest<TenantListResponseData>({
    url: "/tenants",
    method: "get",
    params
  })
}

/** 获取指定租户 */
export function getTenantApi(id: string) {
  return authCenterRequest<ApiResponseData<Tenant>>({
    url: `/tenants/${id}`,
    method: "get"
  })
}

/** 获取指定租户名称 */
export function getTenantNameByIdsApi(ids: string[]) {
  return authCenterRequest<ApiResponseData<Record<string, string | null>>>({
    url: `/tenants/names`,
    method: "post",
    data: ids
  })
}

/** 获取指定Key租户 */
export function getTenantByKeyApi(value: string) {
  return authCenterRequest<ApiResponseData<Tenant>>({
    url: `/tenants/resolve/${value}`,
    method: "get"
  })
}

/** 获取当前用户所在租户的成员信息 */
export function getCurrentMemberProfileApi() {
  return authCenterRequest<ApiResponseData<MemberProfileDto>>({
    url: "/tenants/current-member",
    method: "get"
  })
}

/** 获取分页租户 */
export function getTenantPagedApi(pageIndex: number, pageSize: number) {
  return authCenterRequest<ApiResponseData<QueryResult<Tenant>>>({
    url: `/tenants/paged`,
    method: "get",
    params: { pageIndex, pageSize }
  })
}

/** 创建租户 */
export function createTenantApi(data: TenantForm) {
  return authCenterRequest({
    url: "/tenants",
    method: "post",
    data
  })
}

/** 更新租户 */
export function updateTenantApi(id: string, data: TenantForm) {
  return authCenterRequest({
    url: `/tenants/${id}`,
    method: "put",
    data
  })
}

/** 更新租户扩展信息 */
export function updateTenantExtraApi(id: string, data: TenantExtra) {
  return authCenterRequest({
    url: `/tenants/${id}/extra`,
    method: "put",
    data
  })
}

/** 删除租户 */
export function deleteTenantApi(id: string) {
  return authCenterRequest({
    url: `/tenants/${id}`,
    method: "delete"
  })
}

/** 获取租户概览列表 */
export function getTenantSummaryListApi() {
  return authCenterRequest<ApiResponseData<TenantSummary[]>>({
    url: "/tenants/summary",
    method: "get"
  })
}

/** 获取当前登录用户的所有租户 */
export function getCurrentUserTenantsApi() {
  return authCenterRequest<ApiResponseData<UserTenantSelection[]>>({
    url: "/tenants/me",
    method: "get"
  })
}

/** 获取指定租户下所有的用户Id */
export function getTenantUserIdsApi(id: string) {
  return authCenterRequest<ApiResponseData<string[]>>({
    url: `/tenants/${id}/user-ids`,
    method: "get"
  })
}

/** 给指定租户分配用户 */
export function assignUsersApi(id: string, userIds: string[]) {
  return authCenterRequest({
    url: `/tenants/${id}/users`,
    method: "post",
    data: userIds
  })
}
