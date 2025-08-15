import type { HubConnection } from "@microsoft/signalr"
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr"
import { onMounted, onUnmounted } from "vue"

export function useDeviceEvent(deviceModelId: string, onDataReceived: (id: string, data: any) => void) {
  let connection: HubConnection | null = null
  const isDisconnected = ref(false)
  const isReconnecting = ref(false)

  onMounted(async () => {
    const baseUrl = import.meta.env.VITE_DATA_CENTER_BASE_URL
    const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`
    const path = "device-events"
    const fullUrl = `${cleanBaseUrl}${path}`

    connection = new HubConnectionBuilder()
      .withUrl(fullUrl)
      .configureLogging(LogLevel.None)
      .withAutomaticReconnect()
      .build()

    connection?.on("DeviceDataReceived", (id, data) => {
      onDataReceived(id, data)
    })

    connection.onreconnecting((error) => {
      isReconnecting.value = true
      isDisconnected.value = false
      console.warn("SignalR 连接中断. 正在尝试重新连接...", error)
    })

    connection.onreconnected(async (connectionId) => {
      isReconnecting.value = false
      isDisconnected.value = false
      console.warn(`SignalR 连接已重新建立. 连接 ID: ${connectionId}`)
      await connection?.invoke("SubscribeModel", deviceModelId)
    })

    connection.onclose((error) => {
      isDisconnected.value = true
      isReconnecting.value = false
      console.warn("SignalR 连接已关闭", error)
    })

    await start()
  })

  async function start() {
    try {
      console.log("正在建立SignalR连接...")
      await connection?.start()
      isDisconnected.value = false
      isReconnecting.value = false
      console.log("SignalR连接已建立")
      await connection?.invoke("SubscribeModel", deviceModelId)
    } catch (err) {
      isDisconnected.value = true
      isReconnecting.value = false
      console.log("SignalR 连接失败:", err)
    }
  }

  onUnmounted(async () => {
    if (connection) {
      console.log("正在停止SignalR连接...")
      await connection.invoke("UnsubscribeModel", deviceModelId)
      connection.off("DeviceDataReceived")
      connection.off("onreconnecting")
      connection.off("onreconnected")
      connection.off("onclose")
      await connection.stop()
      isDisconnected.value = true
      isReconnecting.value = false
      console.log("SignalR连接已停止")
    }
  })

  return {
    isDisconnected,
    isReconnecting
  }
}
