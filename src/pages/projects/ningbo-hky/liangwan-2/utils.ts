import type { AutoReviewStatus, ManualReviewStatus, MeasurementCell, MeasurementColumn } from "./types"
import dayjs from "dayjs"

/** 自动审核状态的中文名称。 */
export const autoReviewLabels: Record<string, string> = {
  Passed: "通过",
  Failed: "未通过",
  Error: "规则异常",
  NoRule: "未配置规则"
}

/** 人工审核状态的中文名称。 */
export const manualReviewLabels: Record<ManualReviewStatus, string> = {
  Valid: "有效",
  Invalid: "无效",
  Fault: "故障",
  Suspect: "可疑",
  AboveUpperLimit: "超上限",
  BelowLowerLimit: "低于下限"
}

/** 自动审核状态对应 Element Plus 标签类型。 */
export function autoReviewTagType(status?: AutoReviewStatus) {
  if (status === "Passed") return "success"
  if (status === "Failed") return "danger"
  if (status === "Error") return "warning"
  return "info"
}

/** 默认查询最近 24 小时，返回 Element Plus 时间选择器需要的 Date 数组。 */
export function getDefaultDateRange(hours = 24): [Date, Date] {
  const end = new Date()
  return [new Date(end.getTime() - hours * 60 * 60 * 1000), end]
}

/** 返回指定日期从 00:00:00 到 23:59:59 的完整一天范围。 */
export function getWholeDayRange(value: Date | string = new Date()): [Date, Date] {
  return [dayjs(value).startOf("day").toDate(), dayjs(value).endOf("day").toDate()]
}

/** 将所选开始日期规范化为当天 00:00:00。 */
export function toDayStartIso(value: Date | string) {
  return dayjs(value).startOf("day").format("YYYY-MM-DDTHH:mm:ss")
}

/** 将所选结束日期规范化为当天 23:59:59。 */
export function toDayEndIso(value: Date | string) {
  return dayjs(value).endOf("day").format("YYYY-MM-DDT23:59:59")
}

/** 按用户选择的具体时分秒格式化本地 ISO 时间，供维护时段等精确时间配置使用。 */
export function toLocalIso(value: Date | string) {
  return dayjs(value).format("YYYY-MM-DDTHH:mm:ss")
}

/** 展示日期时间，空值统一显示短横线。 */
export function displayTime(value?: string | null) {
  return value ? dayjs(value).format("YYYY-MM-DD HH:mm:ss") : "—"
}

/** 将 0～1 的比例格式化为百分数。 */
export function displayRate(value?: number | null) {
  return value == null ? "—" : `${(value * 100).toFixed(2)}%`
}

/** 参数表头单行显示为“名称(单位)”，无单位时仅显示名称。 */
export function displayParameterLabel(column: Pick<MeasurementColumn, "name" | "unit">) {
  return column.unit ? `${column.name}(${column.unit})` : column.name
}

/**
 * 按参数配置格式化测量值。
 * decimalPlaces 为 0 时保留后端完整值文本；大于 0 时严格保留指定小数位。
 */
export function displayMeasurementValue(cell: MeasurementCell | null | undefined, column: Pick<MeasurementColumn, "decimalPlaces">) {
  if (!cell) return "—"
  if (column.decimalPlaces > 0) {
    const numericValue = cell.numericValue ?? Number(cell.valueText)
    if (Number.isFinite(numericValue)) return Number(numericValue).toFixed(column.decimalPlaces)
  }
  return cell.valueText ?? cell.numericValue?.toString() ?? "—"
}
