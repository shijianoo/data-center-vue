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
  expiresAt?: string
  maxRetryCount?: number
  description?: string
}

export interface DeviceCommandExtra {
  ackTime: string
  responseTime: string
  failedTime: string
  canceledTime: string
  expiredTime: string
  response: string
  failureReason: string
  retryCount: string
}

export interface DeviceCommand {
  id: string
  createdAt: string
  deviceId: string
  correlationId: string
  displayName?: string
  command: string
  parameter?: string
  dispatchMode: number
  dispatchTarget?: string
  requiresAck: boolean
  requiresResponse: boolean
  maxRetryCount?: number
  expiresAt?: string
  status: number
  sentTime?: string
  completedTime?: string
  description?: string
  isActive: boolean
  sortOrder: boolean
  extra: DeviceCommandExtra
}
