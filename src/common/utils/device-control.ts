export function dispatchModeText(mode: number): string {
  switch (mode) {
    case 0: return "未设置"
    case 1: return "HTTP 被动下发"
    case 2: return "HTTP 主动拉取"
    case 3: return "MQTT 主动推送"
    default: return "未知"
  }
}

export function commandStatusText(status: number): string {
  switch (status) {
    case -3: return "超时"
    case -2: return "已取消"
    case -1: return "失败"

    case 0: return "待下发"

    case 10: return "已发送"

    case 20: return "已确认"

    case 30: return "已响应"

    case 100: return "完成"

    default: return "未知"
  }
}

export function upgradeStatusText(status: number): string {
  switch (status) {
    case -1: return "升级失败"

    case 0: return "待升级"

    case 10: return "准备好"
    case 11: return "信息已查询"

    case 20: return "下载中"
    case 21: return "下载完成"

    case 30: return "安装中"
    case 31: return "重启中"

    case 100: return "成功"

    default: return "未知"
  }
}

export function formatRetryCount(retryCount: number, maxRetryCount?: number | null): string {
  if (maxRetryCount == null) {
    return `${retryCount}/∞` // 无限重试
  }
  return `${retryCount}/${maxRetryCount}`
}
