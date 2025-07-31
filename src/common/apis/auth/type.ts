export interface LoginRequestData {
  username: string
  /** 密码 */
  password: string
  /** 验证码 */
  code: string
  /** 验证码 ID */
  codeId: string
}

export interface LoginResponse {
  refreshToken: string
  accessToken: string
}

export interface CaptchaResponse {
  base64: string
  id: string
}

export type CaptchaResponseData = ApiResponseData<CaptchaResponse>

export type LoginResponseData = ApiResponseData<LoginResponse>
