import type { RangeQueryParams } from "./type"

export function buildExcelQuickExportUrl(params: RangeQueryParams): string {
  const url = new URL(`${import.meta.env.VITE_DATA_CENTER_BASE_URL}/exports/excel/quick`)

  // 添加所有参数到URL
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value)
  })

  return url.toString()
}
