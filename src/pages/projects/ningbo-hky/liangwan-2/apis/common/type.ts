/** EcoCenter API 中使用字符串传输的 64 位主键。 */
export type EntityId = string | number

/** 数据进入平台的来源 Tcp:平台内置 TCP 网关接收,Beidou:北斗转发接口接收,HttpApi:普通 HTTP 接口接收 */
export type IngestionSource = "Unknown" | "Tcp" | "Beidou" | "HttpApi"

/** 查询粒度：原始值、时均值、日均值、月均值。 */
export type Granularity = "Raw" | "Hour" | "Day" | "Month"

/** 自动审核状态。 */
export type AutoReviewStatus = "Passed" | "Failed" | "Error" | "NoRule" | string

/** 水质等级 */
export type WaterQualityGrade = "ClassI" | "ClassII" | "ClassIII" | "ClassIV" | "ClassV"

/** 通用分页响应。 */
export interface PageResult<T> {
  /** 当前页数据。 */
  items: T[]
  /** 数据总量。 */
  total: number
  /** 当前页码。 */
  pageNumber: number
  /** 每页条数。 */
  pageSize: number
}
