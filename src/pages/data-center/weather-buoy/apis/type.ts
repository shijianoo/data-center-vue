export interface BuoyData {
  /** 浮标数据接收时间 */
  receiveTime: string

  /** 观测日期 */
  observeDate: string

  /** 浮标类型 */
  buoyType: string

  /** 观测日期年 */
  observeYear: string

  /** 观测日期月 */
  observeMonth: string

  /** 观测日期日 */
  observeDay: string

  /** 观测时间时 */
  observeHour: string

  /** 观测时间分 */
  observeMinute: string

  /** 经度（单位：°） */
  longitude: string

  /** 经度半球 */
  longitudeHemisphere: string

  /** 纬度（单位：°） */
  latitude: string

  /** 纬度半球 */
  latitudeHemisphere: string

  /** 气温 00分（单位：°C） */
  airTemperature00: string

  /** 气温 10分（单位：°C） */
  airTemperature10: string

  /** 气温 20分（单位：°C） */
  airTemperature20: string

  /** 气温 30分（单位：°C） */
  airTemperature30: string

  /** 气温 40分（单位：°C） */
  airTemperature40: string

  /** 气温 50分（单位：°C） */
  airTemperature50: string

  /** 红外皮温 00分（单位：°C） */
  skinTemperature00: string

  /** 红外皮温 10分（单位：°C） */
  skinTemperature10: string

  /** 红外皮温 20分（单位：°C） */
  skinTemperature20: string

  /** 红外皮温 30分（单位：°C） */
  skinTemperature30: string

  /** 红外皮温 40分（单位：°C） */
  skinTemperature40: string

  /** 红外皮温 50分（单位：°C） */
  skinTemperature50: string

  /** 气压 00分（单位：hPa） */
  pressure00: string

  /** 气压趋势 00分（单位：hPa） */
  pressureTrend00: string

  /** 气压 30分（单位：hPa） */
  pressure30: string

  /** 气压趋势 30分（单位：hPa） */
  pressureTrend30: string

  /** 海温20厘米 00分（单位：°C） */
  seaTemperature20CM00: string

  /** 海温20厘米 15分（单位：°C） */
  seaTemperature20CM15: string

  /** 海温20厘米 30分（单位：°C） */
  seaTemperature20CM30: string

  /** 海温20厘米 45分（单位：°C） */
  seaTemperature20CM45: string

  /** 盐度 00分（单位：mS/cm） */
  salinity00: string

  /** 盐度 15分（单位：mS/cm） */
  salinity15: string

  /** 盐度 30分（单位：mS/cm） */
  salinity30: string

  /** 盐度 45分（单位：mS/cm） */
  salinity45: string

  /** 风速 00分（单位：m/s） */
  windSpeed00: string

  /** 风速 10分（单位：m/s） */
  windSpeed10: string

  /** 风速 20分（单位：m/s） */
  windSpeed20: string

  /** 风速 30分（单位：m/s） */
  windSpeed30: string

  /** 风速 40分（单位：m/s） */
  windSpeed40: string

  /** 风速 50分（单位：m/s） */
  windSpeed50: string

  /** 风向 00分（单位：°） */
  windDirection00: string

  /** 风向 10分（单位：°） */
  windDirection10: string

  /** 风向 20分（单位：°） */
  windDirection20: string

  /** 风向 30分（单位：°） */
  windDirection30: string

  /** 风向 40分（单位：°） */
  windDirection40: string

  /** 风向 50分（单位：°） */
  windDirection50: string

  /** 海温25厘米 00分（单位：°C） */
  seaTemperature25CM00: string

  /** 海温25厘米 30分（单位：°C） */
  seaTemperature25CM30: string

  /** 海温30厘米 00分（单位：°C） */
  seaTemperature30CM00: string

  /** 海温30厘米 30分（单位：°C） */
  seaTemperature30CM30: string

  /** 进水状态检测 */
  waterIngressStatus: string

  /** 主板温度（单位：°C） */
  boardTemperature: string

  /** 电源电压（单位：V） */
  supplyVoltage: string

  /** 姿态横滚角（单位：°） */
  attitudeRollAngle: string

  /** 姿态俯仰角（单位：°） */
  attitudePitchAngle: string

  /** 姿态方位角（单位：°） */
  attitudeBearingAngle: string

  /** 气压传感器状态（单位：AP） */
  airPressureSensorStatus: string

  /** 气温传感器状态（单位：AT） */
  airTemperatureSensorStatus: string

  /** 20cm海温/盐度传感器状态（单位：STSS） */
  seaTemperatureSalinity20CMSensorStatus: string

  /** 风向/风速传感器状态（单位：WIND） */
  windSpeedWindDirectionSensorStatus: string

  /** 红外皮温传感器状态（单位：IST） */
  skinTemperatureSensorStatus: string

  /** 25cm海温传感器状态（单位：STA） */
  seaTemperature25CMSensorStatus: string

  /** 30cm海温传感器状态（单位：STB） */
  seaTemperature30CMSensorStatus: string

  /** 水帆附着状态（单位：WS） */
  waterSailStatus: string

  /** 程序状态（单位：START） */
  startStatus: string

  /** 看门狗状态（单位：WDOG） */
  watchdogStatus: string

  /** 50分浮标浸没状态（单位：WE0） */
  buoyImmersionStatus50: string

  /** 40分浮标浸没状态（单位：WE1） */
  buoyImmersionStatus40: string

  /** 30分浮标浸没状态（单位：WE2） */
  buoyImmersionStatus30: string

  /** 20分浮标浸没状态（单位：WE3） */
  buoyImmersionStatus20: string

  /** 10分浮标浸没状态（单位：WE4） */
  buoyImmersionStatus10: string

  /** 00分浮标浸没状态（单位：WE5） */
  buoyImmersionStatus00: string

  /** 反馈信息 */
  feedback: string

  /** 波束6功率 */
  beam6: string

  /** 波束5功率 */
  beam5: string

  /** 波束4功率 */
  beam4: string

  /** 波束3功率 */
  beam3: string

  /** 波束2功率 */
  beam2: string

  /** 波束1功率 */
  beam1: string

  /** 电池电压状态 */
  batteryVoltageStatus: string

  /** 硬件状态 */
  hardwareStatus: string

  /** IC卡状态 */
  icCardStatus: string

  /** 姿态数据有效状态（单位：ATTI_Valid） */
  attitudeValidStatus: string

  /** 姿态数据接收状态（单位：ATTI_Rx） */
  attitudeReceiveStatus: string

  /** 有效接收卫星数量 */
  receiveSatelliteNumber: string

  /** GNSS数据有效状态（单位：Posi） */
  gnssDataValidStatus: string

  /** GNSS校时数据有效状态（单位：ChkDT） */
  gnssCheckTimeValidStatus: string

  /** 00分报警状态（单位：IS0） */
  alarm00Status: string

  /** 30分报警状态（单位：IS1） */
  alarm30Status: string

  /** 检验和 */
  checkSum: string

  /** 异或校验 */
  xorCheck: string
}

export interface CardData {
  id?: string
  cardNumber: string
  startDate: string
  endDate: string
  description: string
}
