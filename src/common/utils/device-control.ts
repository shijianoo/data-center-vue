export interface DispatchMode {
  value: number
  label: string
}

export interface CommandStatus {
  value: number
  label: string
}

export interface UpgradeStatus {
  value: number
  label: string
}

export const DISPATCH_MODE_LIST: DispatchMode[] = [
  { value: 0, label: "未设置" },
  { value: 1, label: "HTTP 被动下发" },
  { value: 2, label: "HTTP 主动拉取" },
  { value: 3, label: "MQTT 主动推送" }
]

export const COMMAND_STATUS_LIST: CommandStatus[] = [
  { value: -3, label: "超时" },
  { value: -2, label: "已取消" },
  { value: -1, label: "失败" },
  { value: 0, label: "待下发" },
  { value: 10, label: "已发送" },
  { value: 20, label: "已确认" },
  { value: 30, label: "已响应" },
  { value: 100, label: "完成" }
]

export const UPGRADE_STATUS_LIST: UpgradeStatus[] = [
  { value: -1, label: "升级失败" },
  { value: 0, label: "待升级" },
  { value: 10, label: "准备好" },
  { value: 11, label: "信息已查询" },
  { value: 20, label: "下载中" },
  { value: 21, label: "下载完成" },
  { value: 30, label: "安装中" },
  { value: 31, label: "重启中" },
  { value: 100, label: "成功" }
]

export function dispatchModeText(mode: number): string {
  return DISPATCH_MODE_LIST.find(item => item.value === mode)?.label || "未知"
}

export function commandStatusText(status: number): string {
  return COMMAND_STATUS_LIST.find(item => item.value === status)?.label || "未知"
}

export function upgradeStatusText(status: number): string {
  return UPGRADE_STATUS_LIST.find(item => item.value === status)?.label || "未知"
}

export function formatRetryCount(retryCount: number, maxRetryCount?: number | null): string {
  if (maxRetryCount == null) {
    return `${retryCount}/∞` // 无限重试
  }
  return `${retryCount}/${maxRetryCount}`
}
