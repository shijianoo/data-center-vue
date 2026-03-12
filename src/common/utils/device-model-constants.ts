export interface ModelCategory {
  value: number
  label: string
}

export interface ModelStatus {
  value: number
  label: string
}

// 随便定义的，后期真实运用需要仔细斟酌
export const MODEL_CATEGORY_OPTIONS: ModelCategory[] = [
  { value: 0, label: "未知" },
  { value: 1, label: "漂流" },
  { value: 2, label: "锚定" },
  { value: 3, label: "观测平台" },
  { value: 4, label: "高速运动平台" },
  { value: 4, label: "船载平台" }
]

export const MODEL_STATUS_OPTIONS: ModelStatus[] = [
  { value: 0, label: "未知" },
  { value: 1, label: "正常" },
  { value: 2, label: "弃用" },
  { value: 3, label: "停产" }
]

export function getModelCategoryLabel(value: number): string {
  const option = MODEL_CATEGORY_OPTIONS.find(option => option.value === value)
  return option ? option.label : "未知"
}

export function getModelStatusLabel(value: number): string {
  const option = MODEL_STATUS_OPTIONS.find(option => option.value === value)
  return option ? option.label : "未知"
}
