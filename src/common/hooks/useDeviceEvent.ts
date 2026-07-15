import type { HubConnection } from "@microsoft/signalr"
import { HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr"
import { onMounted, onUnmounted } from "vue"

const INITIAL_RETRY_DELAY = 3000

/**
 * 订阅设备型号的 SignalR 数据流。
 *
 * SignalR 的 automatic reconnect 只处理“曾经连上后再断开”的情况；首次建立连接失败
 * 时，由本 Hook 定时重试。卸载时无论退订是否失败都会停止连接，避免连接泄漏。
 */
export function useDeviceEvent(deviceModelId: string, onDataReceived: (id: string, data: any) => void) {
  let connection: HubConnection | null = null
  let retryTimer: ReturnType<typeof setTimeout> | undefined
  let disposed = false
  const isDisconnected = ref(true)
  const isReconnecting = ref(false)

  function clearRetryTimer() {
    if (retryTimer === undefined) return
    clearTimeout(retryTimer)
    retryTimer = undefined
  }

  async function subscribe() {
    if (!connection || connection.state !== HubConnectionState.Connected) return
    await connection.invoke("SubscribeModel", deviceModelId)
  }

  function scheduleInitialRetry() {
    if (disposed || retryTimer !== undefined) return
    retryTimer = setTimeout(() => {
      retryTimer = undefined
      void start()
    }, INITIAL_RETRY_DELAY)
  }

  async function start() {
    if (disposed || !connection || connection.state !== HubConnectionState.Disconnected) return
    try {
      await connection.start()
      if (disposed) return
      await subscribe()
      isDisconnected.value = false
      isReconnecting.value = false
    } catch (error) {
      if (disposed) return
      isDisconnected.value = true
      isReconnecting.value = false
      console.error("SignalR 初始连接失败，将在稍后重试", error)
      scheduleInitialRetry()
    }
  }

  async function stop() {
    disposed = true
    clearRetryTimer()
    const activeConnection = connection
    connection = null
    if (!activeConnection) return

    try {
      if (activeConnection.state === HubConnectionState.Connected) {
        await activeConnection.invoke("UnsubscribeModel", deviceModelId)
      }
    } catch (error) {
      // 退订失败不应阻止 stop，否则组件卸载后连接仍会保留在浏览器中。
      console.warn("SignalR 退订失败，仍将停止连接", error)
    } finally {
      activeConnection.off("DeviceDataReceived")
      try {
        await activeConnection.stop()
      } catch (error) {
        console.warn("SignalR 停止连接失败", error)
      }
      isDisconnected.value = true
      isReconnecting.value = false
    }
  }

  onMounted(() => {
    const baseUrl = import.meta.env.VITE_DATA_CENTER_BASE_URL
    const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`
    connection = new HubConnectionBuilder()
      .withUrl(`${cleanBaseUrl}device-events`)
      .configureLogging(LogLevel.None)
      .withAutomaticReconnect()
      .build()

    connection.on("DeviceDataReceived", (id, data) => onDataReceived(id, data))
    connection.onreconnecting((error) => {
      isReconnecting.value = true
      isDisconnected.value = false
      console.warn("SignalR 连接中断，正在自动重连", error)
    })
    connection.onreconnected(async (connectionId) => {
      try {
        await subscribe()
        isReconnecting.value = false
        isDisconnected.value = false
      } catch (error) {
        console.error(`SignalR 重连后订阅失败（连接 ${connectionId}）`, error)
      }
    })
    connection.onclose((error) => {
      if (disposed) return
      isDisconnected.value = true
      isReconnecting.value = false
      console.warn("SignalR 连接已关闭，将尝试重新建立", error)
      scheduleInitialRetry()
    })

    void start()
  })

  onUnmounted(() => void stop())

  return {
    isDisconnected,
    isReconnecting
  }
}
