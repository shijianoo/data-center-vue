export type BuoyKey = "NB00" | "NB01" | "NB02" | "NB03" | "NB04" | "NB05" | "NB06" | "NB07" | "NB08"

export interface HistoryField {
  key: string
  label: string
  column: string
  // column 是表格读取返回数据时使用的字段名；queryColumn 只在提交 selectColumns 时使用。
  // 例如 PostgreSQL 里 do 是关键字，查询必须传 "\"do\""，但接口返回行里仍然是 row.do。
  queryColumn?: string
  // decimals 只控制前端展示精度，不改变后端原始值；需要公式换算时使用 formatter。
  decimals?: number
  // 字段少的分组可以通过 width/align 靠左紧凑显示，避免两三列铺满整张表。
  width?: number | string
  minWidth?: number | string
  align?: "left" | "center" | "right"
  // 可选阈值配置：低于 min 或高于 max 时，历史表格会把该单元格标红。
  // thresholdValue 用于 formatter 场景，例如“三氮”或 NB08 pH 这类展示值不是单一原始字段。
  threshold?: {
    min?: number
    max?: number
  }
  thresholdValue?: (row: HistoryRow) => unknown
  formatter?: (row: HistoryRow) => string
}

// 阈值配置示例：
// { key: "ph", label: "pH", column: "ph", decimals: 2, threshold: { min: 6, max: 9 } }
// 对 formatter 字段可再提供 thresholdValue，例如三氮合计或 NB08 由电压换算得到的 pH。
//
// 如果公共字段组需要按设备覆盖阈值，不要复制整组字段，使用 overrideFields 即可：
// group("water", "水质数据", "buoy_water_data", overrideFields(waterFields, {
//   waterTemp: { threshold: { min: 0, max: 30 } },
//   ph: { threshold: { min: 6, max: 9 } }
// }))
//
// 这样 NB00 可以用一套阈值，NB01 再单独覆盖成更宽的范围：
// group("water", "水质数据", "buoy_water_data", overrideFields(waterFields, {
//   waterTemp: { threshold: { min: -5, max: 40 } }
// }))
// overrideFields 只影响当前这次 group 使用的字段，不会修改 waterFields 原始配置。

export interface HistoryGroup {
  key: string
  label: string
  // 同一个设备的不同参数可能来自不同历史表，所以按分组分别配置表名和字段。
  tableName?: string
  fields: HistoryField[]
  // GPS 分组才需要围栏状态列，避免把业务状态逻辑混进所有表格。
  locationStatus?: boolean
}

export interface BuoyOption {
  key: BuoyKey
  name: string
  // longitude/latitude/radius 是固定电子围栏配置，历史 GPS 表格和地图页都会复用。
  longitude?: number | null
  latitude?: number | null
  radius?: number | null
}

export interface HistoryRow {
  sampleTime?: string | null
  receiveTime?: string | null
  [key: string]: unknown
}

// 标准水质表字段：NB00/NB01/NB02/NB03/NB04/NB07 使用这组字段。
const waterFields: HistoryField[] = [
  { key: "waterTemp", label: "温度(℃)", column: "water_temp", decimals: 2 },
  { key: "salinity", label: "盐度(‰)", column: "sal", decimals: 2 },
  { key: "do", label: "溶解氧(mg/L)", column: "do", queryColumn: "\"do\"", decimals: 2 },
  { key: "dos", label: "溶解氧饱和度(%)", column: "dos", decimals: 2 },
  { key: "ph", label: "pH", column: "ph", decimals: 2 },
  { key: "chl_a", label: "叶绿素a(μg/L)", column: "chl_a", decimals: 2 },
  { key: "turb", label: "浊度(NTU)", column: "turb", decimals: 2 },
  { key: "cond", label: "电导率(mS/cm)", column: "cond", decimals: 3 }
]

// 宽表水质字段：部分老设备把水质、光照、电压等数据放在 wide_buoy_data。
const wideWaterFields: HistoryField[] = [
  { key: "w02", label: "温度(℃)", column: "w02", decimals: 2 },
  { key: "w03", label: "盐度(‰)", column: "w03", decimals: 2 },
  { key: "w07", label: "溶解氧(mg/L)", column: "w07", decimals: 2 },
  { key: "w08", label: "溶解氧饱和度(%)", column: "w08", decimals: 2 },
  { key: "w09", label: "pH", column: "w09", decimals: 2 },
  { key: "w05", label: "叶绿素a(μg/L)", column: "w05", decimals: 2 },
  { key: "w06", label: "浊度(NTU)", column: "w06", decimals: 2 },
  { key: "w04", label: "电导率(mS/cm)", column: "w04", decimals: 3 }
]

// 新气象水文表字段，字段名更语义化。
const meteoFields: HistoryField[] = [
  { key: "wind_spd", label: "风速(m/s)", column: "wind_spd", decimals: 2 },
  { key: "wind_dir", label: "风向(°)", column: "wind_dir", decimals: 0 },
  { key: "max_wind_spd", label: "最大瞬时风速(m/s)", column: "max_wind_spd", decimals: 2 },
  { key: "max_wind_dir", label: "最大瞬时风速风向(°)", column: "max_wind_dir", decimals: 0 },
  { key: "rh", label: "相对湿度(%)", column: "rh", decimals: 2 },
  { key: "rain", label: "降雨量(mm)", column: "rain", decimals: 2 },
  { key: "air_temp", label: "气温(℃)", column: "air_temp", decimals: 2 },
  { key: "air_press", label: "气压(hPa)", column: "air_press", decimals: 2 }
]

// 宽表气象字段，NB00/NB05 仍使用 q01/q02 这类历史字段名。
const wideMeteoFields: HistoryField[] = [
  { key: "q03", label: "风速(m/s)", column: "q03", decimals: 2 },
  { key: "q04", label: "风向(°)", column: "q04", decimals: 0 },
  { key: "q05", label: "最大瞬时风速(m/s)", column: "q05", decimals: 2 },
  { key: "q06", label: "最大瞬时风速风向(°)", column: "q06", decimals: 0 },
  { key: "q07", label: "相对湿度(%)", column: "q07", decimals: 2 },
  { key: "q08", label: "降雨量(mm)", column: "q08", decimals: 2 },
  { key: "q01", label: "气温(℃)", column: "q01", decimals: 2 },
  { key: "q02", label: "气压(hPa)", column: "q02", decimals: 2 }
]

// 营养盐字段里“三氮”不是后端独立字段，而是氨氮、硝氮、亚硝氮的前端合计展示。
const nutrientFields: HistoryField[] = [
  { key: "nh4", label: "氨氮(mg/L)", column: "nh4", decimals: 4 },
  { key: "no3", label: "硝氮(mg/L)", column: "no3", decimals: 4 },
  { key: "no2", label: "亚硝氮(mg/L)", column: "no2", decimals: 4 },
  {
    key: "tri_nitrogen",
    label: "三氮(mg/L)",
    column: "nh4",
    decimals: 4,
    formatter: row => formatTotal(row, ["nh4", "no3", "no2"], 4)
  },
  { key: "po4", label: "磷酸盐(mg/L)", column: "po4", decimals: 4 }
]

const nutrientFieldsWithoutTotal: HistoryField[] = nutrientFields.filter(field => field.key !== "tri_nitrogen")

export const buoyOptions: BuoyOption[] = [
  { key: "NB00", name: "强蛟生态浮标", longitude: 121.542906, latitude: 29.472561, radius: 50 },
  { key: "NB01", name: "南韭山生态浮标", longitude: 122.183392, latitude: 29.456208, radius: 50 },
  { key: "NB02", name: "松兰山海滨浮标", longitude: 121.997222, latitude: 29.409542, radius: 50 },
  { key: "NB03", name: "渔山生态浮标", longitude: 122.248864, latitude: 28.886947, radius: 50 },
  { key: "NB04", name: "三门生态浮标", longitude: 121.776067, latitude: 29.112817, radius: 50 },
  { key: "NB05", name: "杭州湾生态浮标", longitude: 121.603425, latitude: 30.152307, radius: 50 },
  { key: "NB06", name: "镇海重点化工区排污口浮标", longitude: 121.677867, latitude: 30.036408, radius: 50 },
  { key: "NB07", name: "松兰山生态浮标", longitude: 121.998558, latitude: 29.497536, radius: 50 },
  { key: "NB08", name: "杭州湾新区北污水排放口浮标", longitude: 121.623179, latitude: 30.135525, radius: 50 }
]

export const buoyHistoryConfig: Record<BuoyKey, HistoryGroup[]> = {
  // 每个 NBxx 按“参数类型 -> 表名 -> 字段”的方式配置。
  // 页面层只理解 HistoryGroup，不关心具体设备差异，从而避免为每台设备写一套查询逻辑。
  NB00: [
    group("water", "水质数据", "buoy_water_data", waterFields),
    group("meteo", "气象数据", "buoy_met_hydro_data", meteoFields),
    group("nutrient", "营养盐", "buoy_nutri_data", nutrientFields),
    group("altimeter", "高度计", "wide_buoy_data", [compactField({ key: "w14", label: "高度计(m)", column: "w14", decimals: 2 })]),
    group("light", "光照数据", "buoy_met_hydro_data", [compactField({ key: "par", label: "光照(lux)", column: "par", decimals: 0 })]),
    group("gps", "GPS信息", "wide_buoy_data", gpsFields())
  ],
  NB01: [
    group("water", "水质数据", "buoy_water_data", waterFields),
    group("meteo", "气象数据", "buoy_met_hydro_data", meteoFields),
    group("nutrient", "营养盐", "buoy_nutri_data", nutrientFields),
    group("altimeter", "高度计", "buoy_met_hydro_data", [compactField({ key: "water_depth", label: "高度计(m)", column: "water_depth", decimals: 2 })]),
    group("light", "光照数据", "buoy_met_hydro_data", [compactField({ key: "par", label: "光照(lux)", column: "par", decimals: 0 })]),
    group("gps", "GPS信息", "wide_buoy_data", gpsFields())
  ],
  NB02: [
    group("water", "水质数据", "buoy_water_data", waterFields),
    group("meteo", "气象数据", "buoy_met_hydro_data", meteoFields),
    group("altimeter", "高度计", "buoy_met_hydro_data", [compactField({ key: "water_depth", label: "高度计(m)", column: "water_depth", decimals: 2 })]),
    group("light", "光照数据", "buoy_met_hydro_data", [compactField({ key: "par", label: "光照(lux)", column: "par", decimals: 0 })]),
    group("battery", "电池电压", "wide_buoy_data", [compactField({ key: "v02", label: "电池电压(V)", column: "v02", decimals: 2 })]),
    group("gps", "GPS信息", "wide_buoy_data", gpsFields())
  ],
  NB03: [
    group("water", "水质数据", "buoy_water_data", waterFields),
    group("meteo", "气象数据", "buoy_met_hydro_data", meteoFields),
    group("nutrient", "营养盐", "buoy_nutri_data", nutrientFields),
    group("altimeter", "高度计", "wide_buoy_data", [compactField({ key: "w14", label: "高度计(m)", column: "w14", decimals: 2 })]),
    group("light", "光照数据", "wide_buoy_data", [compactField({ key: "q12", label: "光照(lux)", column: "q12", decimals: 0 })]),
    group("gps", "GPS信息", "wide_buoy_data", gpsFields())
  ],
  NB04: [
    group("water", "水质数据", "buoy_water_data", waterFields),
    group("meteo", "气象数据", "buoy_met_hydro_data", meteoFields),
    group("nutrient", "营养盐", "buoy_nutri_data", nutrientFields),
    group("altimeter", "高度计", "buoy_met_hydro_data", [compactField({ key: "water_depth", label: "高度计(m)", column: "water_depth", decimals: 2 })]),
    group("light", "光照数据", "buoy_met_hydro_data", [compactField({ key: "par", label: "光照(lux)", column: "par", decimals: 0 })]),
    group("gps", "GPS信息", "wide_buoy_data", gpsFields())
  ],
  NB05: [
    group("water", "水质数据", "wide_buoy_data", wideWaterFields),
    group("meteo", "气象数据", "wide_buoy_meteo_data", wideMeteoFields),
    group("nutrient", "营养盐", "buoy_nutri_data", nutrientFieldsWithoutTotal),
    group("altimeter", "高度计", "wide_buoy_data", [compactField({ key: "w14", label: "高度计(m)", column: "w14", decimals: 2 })]),
    group("light", "光照数据", "wide_buoy_data", [compactField({ key: "q12", label: "光照(lux)", column: "q12", decimals: 0 })]),
    group("battery", "电池电压", "wide_buoy_data", [compactField({ key: "v02", label: "电池电压(V)", column: "v02", decimals: 2 })]),
    group("gps", "GPS信息", "wide_buoy_data", gpsFields())
  ],
  NB06: [
    group("water", "水质数据", "wide_buoy_data", [
      { key: "w02", label: "温度(℃)", column: "w02", decimals: 2 },
      { key: "w03", label: "盐度(‰)", column: "w03", decimals: 2 },
      { key: "w07", label: "溶解氧(mg/L)", column: "w07", decimals: 2 },
      { key: "w09", label: "pH", column: "w09", decimals: 2 },
      { key: "w04", label: "电导率(mS/cm)", column: "w04", decimals: 3 }
    ]),
    group("altimeter", "高度计", "wide_buoy_data", [compactField({ key: "w14", label: "高度计(m)", column: "w14", decimals: 2 })]),
    group("oil", "油类监测数据", "wide_buoy_data", [compactField({ key: "w15", label: "化合物(ppm)", column: "w15", decimals: 3 })]),
    group("battery", "电池电压", "wide_buoy_data", [compactField({ key: "v02", label: "电池电压(V)", column: "v02", decimals: 2 })]),
    group("cod", "COD", "wide_buoy_data", [compactField({ key: "w17", label: "COD(mg/L)", column: "w17", decimals: 2 })]),
    group("gps", "GPS信息", "wide_buoy_data", gpsFields())
  ],
  NB07: [
    group("water", "水质数据", "buoy_water_data", waterFields),
    group("nutrient", "营养盐", "buoy_nutri_data", nutrientFields),
    group("altimeter", "高度计", "wide_buoy_data", [compactField({ key: "w14", label: "高度计(m)", column: "w14", decimals: 2 })]),
    group("battery", "电池电压", "wide_buoy_data", [compactField({ key: "v02", label: "电池电压(V)", column: "v02", decimals: 2 })]),
    group("cod", "COD", "wide_buoy_data", [compactField({ key: "w17", label: "COD(mg/L)", column: "w17", decimals: 2 })]),
    group("gps", "GPS信息", "wide_buoy_data", gpsFields())
  ],
  NB08: [
    group("water", "水质数据", "wide_buoy_data", [
      compactField({
        key: "w09o",
        label: "pH",
        column: "w09o",
        // NB08 的 pH 需要先查电压原始值 w09o，再按现场提供的公式换算为 pH。
        formatter: row => formatPhByVoltage(row.w09o)
      })
    ]),
    group("nutrient", "营养盐", "buoy_nutri_data", nutrientFields),
    group("altimeter", "高度计", "wide_buoy_data", [compactField({ key: "w14", label: "高度计(m)", column: "w14", decimals: 2 })]),
    group("battery", "电池电压", "wide_buoy_data", [compactField({ key: "v02", label: "电池电压(V)", column: "v02", decimals: 2 })]),
    group("cod", "COD", "wide_buoy_data", [compactField({ key: "w17", label: "COD(mg/L)", column: "w17", decimals: 2 })]),
    group("gps", "GPS信息", "wide_buoy_data", gpsFields())
  ]
}

export function getBuoyName(key: BuoyKey) {
  return buoyOptions.find(item => item.key === key)?.name ?? key
}

function group(key: string, label: string, tableName: string, fields: HistoryField[]): HistoryGroup {
  // GPS 分组额外显示围栏状态列，其他分组保持普通历史表格。
  // 这里统一加 locationStatus，比在每台浮标配置里重复写更不容易漏。
  return { key, label, tableName, fields, locationStatus: key === "gps" }
}

function gpsFields(): HistoryField[] {
  // GPS 原始字段使用海洋设备常见的 ddmm.mmmm 格式，展示时统一转成十进制度。
  return [
    compactField({ key: "g02", label: "GPS东经(°)", column: "g02", formatter: row => formatCoordinate(row.g02) }, 130),
    compactField({ key: "g03", label: "GPS北纬(°)", column: "g03", formatter: row => formatCoordinate(row.g03) }, 130)
  ]
}

function compactField(field: HistoryField, width: number | string = 120): HistoryField {
  // 字段较少的分组使用固定宽度靠左显示，避免整张表被少数列撑满。
  // 例如光照、GPS、电池电压这类 1-2 列数据，看起来会更像“数据项”而不是空表。
  return { ...field, width, align: "left" }
}

// eslint-disable-next-line unused-imports/no-unused-vars
function overrideFields(fields: HistoryField[], overrides: Record<string, Partial<HistoryField>>): HistoryField[] {
  // 设备级字段覆盖工具：用于在复用公共字段组时，只调整某台设备个别字段的阈值、宽度或 formatter。
  // 这里返回全新的字段对象，不会污染 waterFields、meteoFields 这类公共配置。
  return fields.map(field => ({
    ...field,
    ...overrides[field.key]
  }))
}

function formatTotal(row: HistoryRow, columns: string[], decimals: number) {
  // 合计项只对有效数字求和；任一字段缺失时不报错，仍能展示已有数据的合计。
  const values = columns.map(column => Number(row[column])).filter(value => Number.isFinite(value))
  if (!values.length) return "--"
  return values.reduce((sum, value) => sum + value, 0).toFixed(decimals)
}

function formatPhByVoltage(value: unknown) {
  if (value === null) return "--"
  // 现场给出的换算公式：pH = 3.896 * V - 4.065，V 为 w09o 的原始电压值。
  const voltage = Number(value)
  if (!Number.isFinite(voltage)) return "--"
  return calculatePhByVoltage(voltage).toFixed(2)
}

function calculatePhByVoltage(voltage: number) {
  return 3.896 * voltage - 4.065
}

function formatCoordinate(value: unknown) {
  // 历史库中的 GPS 可能不是十进制度，而是 ddmm.mmmm；这里仅负责表格展示，不改变原始行数据。
  if (value === null || value === undefined || value === "") return "--"
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) return `${value}`
  const absValue = Math.abs(numberValue)
  const degree = Math.floor(absValue / 100)
  const minutes = absValue - degree * 100
  const decimalDegree = degree + minutes / 60
  return (numberValue < 0 ? -decimalDegree : decimalDegree).toFixed(6)
}
