export interface HistoryPoint {
  time: string
  value: number
}

export interface TelemetryDataQuery {
  modelNumber: string
  version: number
  dataType: number
}

export interface TelemetryData {
  serialNumber: string
  modelNumber: string
  data: any
}
