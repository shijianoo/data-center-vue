import type * as Auth from "@/common/apis/auth/type"
import { authCenterRequest } from "@/http/axios"

/** 获取登录验证码 */
export function getCaptchaApi() {
  return authCenterRequest<Auth.CaptchaResponseData>({
    url: "captcha",
    method: "get"
  })
}

/** 登录并返回 Token */
export function loginApi(data: Auth.LoginRequestData) {
  return authCenterRequest<Auth.LoginResponseData>({
    url: "auth/login",
    method: "post",
    data
  })
}

/**
 * 使用refreshToken刷新accessToken
 * @param refreshToken 用于刷新的token
 */
export function refreshTokenApi(refreshToken: string) {
  return authCenterRequest<ApiResponseData<Auth.LoginResponseData>>({
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
