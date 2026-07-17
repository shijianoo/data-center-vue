import type { MapCoordinate } from "./types"
import maplibregl from "maplibre-gl"

/** Marker 悬浮提示使用原生 Popup，样式由页面的全局 popup class 接管。 */
export function showMarkerTooltip(
  mapInstance: maplibregl.Map | null,
  oldPopup: maplibregl.Popup | null,
  serialNumber: string,
  name: string,
  color: string,
  lngLat: MapCoordinate
) {
  // 每次 hover 前先移除旧 Popup，避免快速划过多个 Marker 时残留多个提示框。
  oldPopup?.remove()
  if (!mapInstance) return null

  // offset 上移到 Marker 顶部，箭头不会压住 Marker；className 用于接管默认 Popup 样式。
  return new maplibregl.Popup({
    closeButton: false,
    closeOnClick: false,
    anchor: "bottom",
    offset: [0, -42],
    className: "nb-device-popup",
    maxWidth: "none"
  })
    .setLngLat(lngLat)
    .setHTML(`
      <div class="nb-popup-inner" style="--accent:${escapeHtml(color)}">
        <span class="nb-popup-name">${escapeHtml(name)}</span>
        <span class="nb-popup-code">${escapeHtml(serialNumber)}</span>
      </div>
    `)
    .addTo(mapInstance)
}

export function hideMarkerTooltip(popup: maplibregl.Popup | null) {
  popup?.remove()
}

function escapeHtml(value: string) {
  // Popup 内容通过 setHTML 注入，必须转义设备名和编号，避免特殊字符破坏 DOM。
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;")
}
