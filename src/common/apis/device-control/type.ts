export interface CreateOrUpdateDeviceCommand {
  id?: string
  deviceId: string
  displayName?: string
  command: string
  parameter?: string
  dispatchMode: number
  dispatchTarget?: string
  requiresAck: boolean
  requiresResponse: boolean
  expiredTime?: string
  maxRetryCount?: number
  description?: string
}

export interface DeviceCommand {
  id: string
  createdAt: string
  deviceId: string
  displayName?: string
  command: string
  parameter?: string
  dispatchMode: number
  dispatchTarget?: string
  status: number
  sentTime: string
  requiresAck: boolean
  ackTime: string
  requiresResponse: boolean
  responseTime: string
  response: string
  expiredTime?: string
  maxRetryCount?: number
  description?: string
}
