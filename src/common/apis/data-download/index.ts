import type { RangeQueryRequest } from "./type"
import { dataCenterRequest } from "@/http/axios"

//* 通过指定时间区间下载Excel文件 */
export function downloadFile(request: RangeQueryRequest) {
  return dataCenterRequest({
    url: "/data-download/excel-by-range",
    method: "get",
    params: request
  })
}

//* 构建下载Excel文件的URL */
export function buildDownloadExcelByRangeUrl(params: RangeQueryRequest): string {
  const url = new URL(`${import.meta.env.VITE_DATA_CENTER_BASE_URL}/data-download/excel-by-range`)

  // 添加所有参数到URL
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value)
  })

  return url.toString()
}
