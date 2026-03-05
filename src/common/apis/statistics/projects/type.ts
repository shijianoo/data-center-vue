export interface DeviceStatisticsDto {
  id: string
  deviceCode: string
  serialNumber: string
  deviceName?: string
  displayName?: string
  uploadInterval?: string
  lastUploadTime?: string
  isOnline: boolean
  description?: string
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
