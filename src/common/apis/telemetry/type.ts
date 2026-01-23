export interface HistoryPoint {
  time: string
  value: number
}

export interface LatestTelemetryDataQuery {
  modelNumber: string
  serialNumber: string[]
}

export interface TelemetryData<T> {
  serialNumber: string
  modelNumber: string
  data: T
}

export interface WaveBuoyLatestTelemetryData {
  lon: number
  lat: number
  csq: number
  ubatt: number
  hm: number
  tm: number
  h13: number
  t13: number
}
