import type { LoginResponse } from "@@/apis/auth/type"
import { authCenterRequest } from "@/http/axios"

/**
 * 使用refreshToken刷新accessToken
 * @param refreshToken 用于刷新的token
 */
export function refreshTokenApi(refreshToken: string) {
  return authCenterRequest<ApiResponseData<LoginResponse>>({
    url: "auth/refresh",
    method: "post",
    headers: {
      // 不使用默认Authorization，而是直接在body中提供refreshToken
      Authorization: undefined
    },
    data: {
      refreshToken
    }
  })
}
