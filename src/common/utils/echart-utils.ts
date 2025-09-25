/**
 * 根据时间跨度动态格式化时间标签
 * @param value 时间戳
 * @param chartInstance ECharts 实例
 * @returns 格式化后的时间字符串
 */
export function formatTimeLabel(value: any, chartInstance: any): string {
  const date = new Date(value)

  if (!chartInstance) {
    // 如果没有图表实例，使用默认格式
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  try {
    const timeRange = getChartTimeRange(chartInstance)

    // 时间常量 (毫秒)
    const oneHour = 60 * 60 * 1000
    const oneDay = 24 * oneHour
    const oneYear = 365 * oneDay

    // 根据时间跨度选择合适的格式
    if (timeRange <= oneDay) {
      // 小于一天：显示 时:分
      const hours = String(date.getHours()).padStart(2, "0")
      const minutes = String(date.getMinutes()).padStart(2, "0")
      return `${hours}:${minutes}`
    } else if (timeRange <= oneYear) {
      // 大于一天但小于一年：显示 月/日
      const month = date.getMonth() + 1
      const day = date.getDate()
      return `${month}/${day}`
    } else {
      // 超过一年：显示 年-月
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, "0")
      return `${year}-${month}`
    }
  } catch (error) {
    // 如果出现错误，使用默认格式
    console.warn("格式化时间标签时出错:", error)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }
}

/**
 * 获取图表当前显示的时间范围 (毫秒)
 * @param chartInstance ECharts 实例
 * @returns 时间范围 (毫秒)
 */
function getChartTimeRange(chartInstance: any): number {
  const option = chartInstance.getOption()
  let timeRange = 0

  // 优先从 dataZoom 组件获取当前显示范围
  const dataZoom = option.dataZoom?.[0]
  if (dataZoom) {
    if (dataZoom.startValue && dataZoom.endValue) {
      // 如果有具体的时间值
      timeRange = new Date(dataZoom.endValue).getTime() - new Date(dataZoom.startValue).getTime()
    } else if (dataZoom.start !== undefined && dataZoom.end !== undefined) {
      // 如果只有百分比，需要从数据中计算
      const series = option.series
      if (series && series.length > 0 && series[0].data && series[0].data.length > 0) {
        const data = series[0].data
        const timeValues = data.map((item: any) => new Date(item[0]).getTime()).filter(Boolean)
        if (timeValues.length >= 2) {
          const fullRange = Math.max(...timeValues) - Math.min(...timeValues)
          const zoomRange = (dataZoom.end - dataZoom.start) / 100
          timeRange = fullRange * zoomRange
        }
      }
    }
  }

  // 如果 dataZoom 没有提供有效范围，从数据中计算完整时间范围
  if (timeRange === 0) {
    const series = option.series
    if (series && series.length > 0 && series[0].data && series[0].data.length > 0) {
      const data = series[0].data
      const timeValues = data.map((item: any) => new Date(item[0]).getTime()).filter(Boolean)
      if (timeValues.length >= 2) {
        timeRange = Math.max(...timeValues) - Math.min(...timeValues)
      }
    }
  }

  return timeRange
}

/**
 * 保存图片
 * @param chart ECharts 实例
 * @param filename 文件名
 */
export function saveAsImage(chart: any, filename: string) {
  const url = chart.getDataURL({
    type: "png",
    pixelRatio: 2,
    backgroundColor: "#fff"
  })
  const link = document.createElement("a")
  link.download = filename
  link.href = url
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
