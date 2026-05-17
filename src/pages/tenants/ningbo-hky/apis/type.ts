export interface HistoryQuery {
  tableName: string
  serialNumber: string
  selectColumns: string[]
  startTime: string
  endTime: string
  sortDirection?: string
}

export interface HistoryLocationQuery {
  serialNumber: string
  startTime: string
  endTime: string
}
