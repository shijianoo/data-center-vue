export interface DeviceStatisticsDto {
  id: string
  deviceCode: string
  serialNumber: string
  deviceName?: string
  displayName?: string
  isOnline: boolean
}

export interface DeviceModelStatistics {
  id: string
  productCode: string
  modelNumber: string
  modelName?: string
  displayName?: string
  description?: string
  devices: DeviceStatisticsDto[]
}
