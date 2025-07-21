export interface Entity<T> {
  id: T
  createdAt: string
  updatedAt: string
}

export interface QueryResult<T> {
  items: T[]
  total: number
}
