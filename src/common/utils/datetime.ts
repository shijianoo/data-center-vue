import dayjs from "dayjs"

const INVALID_DATE = "N/A"

/** 格式化日期时间 */
export function formatDateTime(datetime: string | number | Date = "", template: string = "YYYY-MM-DD HH:mm:ss") {
  const day = dayjs(datetime)
  return day.isValid() ? day.format(template) : INVALID_DATE
}

/** 格式化日期 */
export function formatDate(datetime: string | number | Date = "", template: string = "YYYY-MM-DD") {
  const day = dayjs(datetime)
  return day.isValid() ? day.format(template) : INVALID_DATE
}

/** 格式化时间为 HH:mm */
function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0")
  const minutes = date.getMinutes().toString().padStart(2, "0")
  return `${hours}:${minutes}`
}

/** 将日期格式化为最终所需的人性化时间格式 */
export function formatHybridAgo(input: string | number | Date | null | undefined): string {
  if (!input) {
    return ""
  }
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) {
    return ""
  }

  const now = new Date()
  const diffInSeconds = (now.getTime() - date.getTime()) / 1000

  // 1. 先处理时长：刚刚、分钟、小时
  if (diffInSeconds < 60) {
    return "刚刚"
  }
  if (diffInSeconds < 3600) { // 小于1小时
    return `${Math.floor(diffInSeconds / 60)} 分钟前`
  }
  if (diffInSeconds < 3600 * 6) { // 小于6小时 (可自行调整)
    return `${Math.floor(diffInSeconds / 3600)} 小时前`
  }

  // 2. 处理日历：今天、昨天、前天
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  const dayBeforeYesterday = new Date(yesterday)
  dayBeforeYesterday.setDate(yesterday.getDate() - 1)

  const inputTime = date.getTime()

  if (inputTime >= today.getTime()) {
    // 如果计算下来还是今天（例如跨了6小时但在同一天），就显示小时
    return `${Math.floor(diffInSeconds / 3600)} 小时前`
  } else if (inputTime >= yesterday.getTime()) {
    return `昨天 ${formatTime(date)}`
  } else if (inputTime >= dayBeforeYesterday.getTime()) {
    return `前天 ${formatTime(date)}`
  }

  // 3. 最后，显示完整的日期和时间
  return formatDateTime(date)
}
