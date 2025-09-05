import type { DateRange } from "@/common/components/DateRangeDialog/index.vue"
// 导入Vue相关函数
import { readonly, ref } from "vue"
import GlobalDateRangeDialog from "@/common/components/DateRangeDialog/index.vue"

import { globalDialogManager } from "@/common/utils/globalDialog"

export interface DateRangeSelectorOptions {
  /** 最大可选择天数，默认60天 */
  maxDays?: number
  /** 是否返回UTC时间，默认false返回本地时间 */
  useUtc?: boolean
}

/**
 * 全局时间范围选择器
 *
 * @param options 配置选项
 * @returns Promise<DateRange | null> 用户选择的时间范围，取消时返回null
 *
 * @example
 * ```typescript
 * // 基础用法
 * const dateRange = await selectDateRange()
 * if (dateRange) {
 *   console.log('开始时间:', dateRange.startDate)
 *   console.log('结束时间:', dateRange.endDate)
 * }
 *
 * // 带配置的用法
 * const dateRange = await selectDateRange({
 *   maxDays: 30,
 *   useUtc: true
 * })
 * ```
 */
export async function selectDateRange(
  options: DateRangeSelectorOptions = {}
): Promise<DateRange | null> {
  const { maxDays = 60, useUtc = false } = options

  try {
    const result = await globalDialogManager.create<DateRange | null>(
      GlobalDateRangeDialog,
      {
        maxDays,
        useUtc
      }
    )
    return result
  } catch (error) {
    console.error("时间范围选择失败:", error)
    return null
  }
}

/**
 * 时间范围选择器 Hook
 * 提供响应式的时间选择功能
 *
 * @param options 配置选项
 * @returns 包含选择方法和状态的对象
 *
 * @example
 * ```typescript
 * const { selectRange, isSelecting } = useDateRangeSelector({
 *   maxDays: 30
 * })
 *
 * async function handleDownload() {
 *   const dateRange = await selectRange()
 *   if (dateRange) {
 *     // 处理下载逻辑
 *   }
 * }
 * ```
 */
export function useDateRangeSelector(options: DateRangeSelectorOptions = {}) {
  const isSelecting = ref(false)

  const selectRange = async (): Promise<DateRange | null> => {
    if (isSelecting.value) {
      return null
    }

    try {
      isSelecting.value = true
      return await selectDateRange(options)
    } finally {
      isSelecting.value = false
    }
  }

  return {
    selectRange,
    isSelecting: readonly(isSelecting)
  }
}
