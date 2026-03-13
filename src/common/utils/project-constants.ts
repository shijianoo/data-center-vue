export interface ProjectType {
  value: number
  label: string
}

export interface ProjectStatus {
  value: number
  label: string
}

export const PROJECT_TYPE_LIST: ProjectType[] = [
  { value: 0, label: "正式项目" },
  { value: 1, label: "试点项目" },
  { value: 2, label: "演示项目" },
  { value: 3, label: "测试项目" },
  { value: 4, label: "内部项目" }
]

export const PROJECT_STATUS_LIST: ProjectStatus[] = [
  { value: 0, label: "未开始" },
  { value: 1, label: "进行中" },
  { value: 2, label: "暂停" },
  { value: 3, label: "已完成" },
  { value: 4, label: "已取消" },
  { value: 5, label: "已归档" }
]

export function getProjectTypeName(type: number): string {
  return PROJECT_TYPE_LIST.find(item => item.value === type)?.label || ""
}

export function getProjectStatusName(status: number): string {
  return PROJECT_STATUS_LIST.find(item => item.value === status)?.label || ""
}
