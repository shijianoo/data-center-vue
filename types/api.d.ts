/** 所有 api 接口的响应数据都应该准守该格式 */
interface ApiResponseData<T> {
  code: number
  data: T
  message: string
}

/** data 字段为字符串的通用 API 响应结构 */
type StringResponse = ApiResponseData<string>

/** 表示 data 为 null 的标准响应结构（如删除成功等） */
type EmptyResponse = ApiResponseData<null>
