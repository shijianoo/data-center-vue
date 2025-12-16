import type { Tenant, TenantForm, TenantListResponseData } from "./type"
import { authCenterRequest } from "@/http/axios"

/** 获取租户列表 */
export function getTenantListApi(params?: any) {
  return authCenterRequest<TenantListResponseData>({
    url: "/tenant",
    method: "get",
    params
  })
}

/** 获取指定租户 */
export function getTenantApi(id: string) {
  return authCenterRequest<ApiResponseData<Tenant>>({
    url: `/tenant/${id}`,
    method: "get"
  })
}

/** 创建租户 */
export function createTenantApi(data: TenantForm) {
  return authCenterRequest({
    url: "/tenant",
    method: "post",
    data
  })
}

/** 更新租户 */
export function updateTenantApi(id: string, data: TenantForm) {
  return authCenterRequest({
    url: `/tenant/${id}`,
    method: "put",
    data
  })
}

/** 删除租户 */
export function deleteTenantApi(id: string) {
  return authCenterRequest({
    url: `/tenant/${id}`,
    method: "delete"
  })
}

/** 获取当前登录用户的所有租户 */
export function getCurrentUserTenantsApi() {
  return authCenterRequest<ApiResponseData<Tenant[]>>({
    url: "/tenant/me",
    method: "get"
  })
}

/** 获取指定租户下所有的用户Id */
export function getTenantUserIdsApi(id: string) {
  return authCenterRequest<ApiResponseData<string[]>>({
    url: `/tenant/${id}/user-ids`,
    method: "get"
  })
}

/** 给指定租户分配用户 */
export function assignUsersApi(id: string, userIds: string[]) {
  return authCenterRequest({
    url: `/tenant/${id}/users`,
    method: "post",
    data: userIds
  })
}
