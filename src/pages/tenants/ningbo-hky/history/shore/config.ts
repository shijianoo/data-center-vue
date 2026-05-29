// 岸基站历史表格复用浮标历史页的字段定义，保证两类页面渲染逻辑一致。
// 这样字段宽度、queryColumn、formatter 等能力只维护一套，后续新增参数也能直接复用。
import type { HistoryField, HistoryGroup, HistoryRow } from "../buoy/config"

export type ShoreKey = "NB09" | "NB10" | "NB11"

export interface ShoreOption {
  key: ShoreKey
  name: string
}

export const shoreOptions: ShoreOption[] = [
  { key: "NB09", name: "甬江入海河口岸基站" },
  { key: "NB10", name: "西周综合污水处理厂排污口岸基站" },
  { key: "NB11", name: "大嵩江入海口岸基站" }
]

// 岸基站水质表目前沿用 buoy_water_data 表结构，因此字段名和浮标标准水质字段保持一致。
const waterFields: HistoryField[] = [
  { key: "waterTemp", label: "温度(℃)", column: "water_temp", width: 120, decimals: 2 },
  { key: "salinity", label: "盐度(‰)", column: "sal", width: 120, decimals: 2 },
  { key: "do", label: "溶解氧(mg/L)", column: "do", queryColumn: "\"do\"", width: 120, decimals: 2 },
  { key: "dos", label: "溶解氧饱和度(%)", column: "dos", width: 120, decimals: 2 },
  { key: "ph", label: "pH", column: "ph", width: 120, decimals: 2 },
  { key: "chl_a", label: "叶绿素a(μg/L)", column: "chl_a", width: 120, decimals: 2 },
  { key: "turb", label: "浊度(NTU)", column: "turb", width: 120, decimals: 2 },
  { key: "cond", label: "电导率(mS/cm)", column: "cond", width: 120, decimals: 3 }
]

// 污染物指标单独来自 shore_nutri_data；这里保持当前 ShoreData.vue 里的字段和表结构不变。
const nutrientFields: HistoryField[] = [
  { key: "cod", label: "COD(mg/L)", column: "cod", width: 120, decimals: 3 },
  { key: "nh3", label: "氨氮(mg/L)", column: "nh3", width: 120, decimals: 3 },
  { key: "tp", label: "总磷(mg/L)", column: "tp", width: 120, decimals: 3 },
  { key: "tn", label: "总氮(mg/L)", column: "tn", width: 120, decimals: 3 }
]

// 海流数据目前只有 NB11 配置，字段较少所以固定宽度展示，避免表格在宽屏上显得过空。
const currentFields: HistoryField[] = [
  { key: "sec_flow", label: "断面流量", column: "sec_flow", width: 120, decimals: 3, formatter: (value: HistoryRow) => Math.abs(value.sec_flow as number).toFixed(3) },
  { key: "sec_area", label: "断面面积", column: "sec_area", width: 120, decimals: 3 },
  { key: "flow_vel", label: "流速(m/s)", column: "flow_vel", width: 120, decimals: 3, formatter: (value: HistoryRow) => Math.abs(value.flow_vel as number).toFixed(3) },
  { key: "water_level", label: "水深(m)", column: "water_level", width: 120, decimals: 2 }
]

export const shoreHistoryConfig: Record<ShoreKey, HistoryGroup[]> = {
  // 按岸基站编号声明可查询的参数类型；页面只读取这份配置，不写站点特例逻辑。
  NB09: [
    group("water", "水质数据", "buoy_water_data", waterFields),
    group("nutrient", "污染物指标", "shore_nutri_data", nutrientFields)
  ],
  NB10: [
    group("water", "水质数据", "buoy_water_data", waterFields),
    group("nutrient", "污染物指标", "shore_nutri_data", nutrientFields)
  ],
  NB11: [
    group("water", "水质数据", "buoy_water_data", waterFields),
    group("nutrient", "污染物指标", "shore_nutri_data", nutrientFields),
    group("current", "海流数据", "shore_current_data", currentFields)
  ]
}

export function getShoreName(key: ShoreKey) {
  return shoreOptions.find(item => item.key === key)?.name ?? key
}

function group(key: string, label: string, tableName: string, fields: HistoryField[]): HistoryGroup {
  // 与浮标配置保持同样的数据结构，方便 DeviceDataDrawer 也能按分组读取最新数据。
  return { key, label, tableName, fields }
}

export type { HistoryRow }
