/** 登录请求数据 */
export interface LoginRequestData {
  /** 用户名 */
  username: string
  /** 密码 */
  password: string
  /** 验证码 */
  code: string
  /** 验证码 ID */
  codeId: string
}

/** 登录响应 */
export interface LoginResponse {
  /** 刷新 Token */
  refreshToken: string
  /** 访问 Token */
  accessToken: string
}

/** 验证码响应 */
export interface CaptchaResponse {
  /** 验证码 */
  base64: string
  /** 验证码 ID */
  id: string
}

/** 验证码响应数据 */
export type CaptchaResponseData = ApiResponseData<CaptchaResponse>

/** 登录响应数据 */
export type LoginResponseData = ApiResponseData<LoginResponse>
