import type { AutoReviewStatus, ManualReviewStatus } from "./types"
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
export function displayParameterLabel(column: { name: string, unit?: string | null }) {
  return column.unit ? `${column.name}(${column.unit})` : column.name
}

/** 水质等级 numericValue 到中文标准等级的映射。 */
export const waterQualityGradeMap: Record<number, string> = {
  1: "Ⅰ类",
  2: "Ⅱ类",
  3: "Ⅲ类",
  4: "Ⅳ类",
  5: "Ⅴ类",
  6: "劣Ⅴ类"
}

/** 水质等级字符串映射。 */
export const waterQualityGradeLabels: Record<string, string> = {
  ClassI: "Ⅰ类",
  ClassII: "Ⅱ类",
  ClassIII: "Ⅲ类",
  ClassIV: "Ⅳ类",
  ClassV: "Ⅴ类",
  ClassInferiorV: "劣Ⅴ类",
  1: "Ⅰ类",
  2: "Ⅱ类",
  3: "Ⅲ类",
  4: "Ⅳ类",
  5: "Ⅴ类",
  6: "劣Ⅴ类",
  一类: "Ⅰ类",
  二类: "Ⅱ类",
  三类: "Ⅲ类",
  四类: "Ⅳ类",
  五类: "Ⅴ类",
  劣五类: "劣Ⅴ类"
}

/** 格式化水质等级字符串。 */
export function formatWaterQualityGrade(grade?: string | null): string {
  if (!grade) return "—"
  return waterQualityGradeLabels[grade] || grade
}

/** 水质等级对应 Element Plus 标签类型。 */
export function waterQualityGradeTagType(grade?: string | null): "success" | "info" | "warning" | "danger" {
  if (!grade) return "info"
  const formatted = formatWaterQualityGrade(grade)
  if (formatted === "Ⅰ类" || formatted === "Ⅱ类") return "success"
  if (formatted === "Ⅲ类") return "info"
  if (formatted === "Ⅳ类") return "warning"
  if (formatted === "Ⅴ类" || formatted === "劣Ⅴ类") return "danger"
  return "info"
}

/** 格式化水质等级单元格。 */
export function displayWaterQualityGrade(cell: { valueText?: string | null, numericValue?: number | null } | null | undefined): string {
  if (!cell) return "—"
  if (cell.numericValue != null && waterQualityGradeMap[cell.numericValue]) {
    return waterQualityGradeMap[cell.numericValue]
  }
  return formatWaterQualityGrade(cell.valueText ?? cell.numericValue?.toString())
}

/**
 * 按参数配置格式化测量值。
 * decimalPlaces 大于等于 0 时严格保留指定小数位（为 0 时不显示小数部分）；为 null/undefined 时保留后端完整值文本。
 */
export function displayMeasurementValue(
  cell: { valueText?: string | null, numericValue?: number | null } | null | undefined,
  column: { decimalPlaces?: number | null, code?: string, dataType?: string, isDerived?: boolean }
) {
  if (!cell) return "—"
  if (column.code === "waterQualityGrade" || column.dataType === "Enum" || column.isDerived) {
    return displayWaterQualityGrade(cell)
  }
  if (typeof column.decimalPlaces === "number" && column.decimalPlaces >= 0) {
    const numericValue = cell.numericValue ?? Number(cell.valueText)
    if (Number.isFinite(numericValue)) return Number(numericValue).toFixed(column.decimalPlaces)
  }
  return cell.valueText ?? cell.numericValue?.toString() ?? "—"
}
