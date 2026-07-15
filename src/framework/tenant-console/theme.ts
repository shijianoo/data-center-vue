import type { CSSProperties } from "vue"

/** 没有合法租户主题色时的稳定回退，确保 Header 和图表变量始终有值。 */
const DEFAULT_HEADER_BG = "#1e293b"

/**
 * 从租户 themeColor 生成 Shell 及公共组件共同使用的 CSS token。
 *
 * 不直接把颜色写进 Header，是为了让菜单图标、图表和 Element Plus 同时继承同一主题。
 * 对浅色主题计算深色文字，避免仅改变背景导致可读性下降。
 */
export function resolveTenantThemeStyle(themeColor?: string): CSSProperties {
  const configuredColor = themeColor?.trim() || ""
  const configuredRgb = parseColor(configuredColor)
  const rgb = configuredRgb ?? parseColor(DEFAULT_HEADER_BG)!
  // 无效配置必须连 CSS 值一起回退，不能只用默认色计算、却继续写入非法 background。
  const background = configuredRgb ? rgbToHex(configuredRgb) : DEFAULT_HEADER_BG
  const foreground = getAccessibleForeground(rgb)
  const isDarkForeground = foreground === "#111111"
  const primary = background

  return {
    "--tenant-primary": primary,
    "--tenant-primary-rgb": `${rgb.r}, ${rgb.g}, ${rgb.b}`,
    "--tenant-on-primary": foreground,
    "--tenant-header-bg": background,
    "--tenant-header-text": foreground,
    "--tenant-header-text-muted": isDarkForeground ? "rgba(17, 17, 17, 0.66)" : "rgba(255, 255, 255, 0.72)",
    "--tenant-header-hover-bg": isDarkForeground ? "rgba(17, 17, 17, 0.08)" : "rgba(255, 255, 255, 0.1)",
    "--tenant-header-active-bg": isDarkForeground ? "rgba(17, 17, 17, 0.12)" : "rgba(255, 255, 255, 0.14)",
    "--tenant-header-border": isDarkForeground ? "rgba(17, 17, 17, 0.14)" : "rgba(255, 255, 255, 0.12)",
    "--primary": primary,
    "--accent": primary,
    "--el-color-primary": primary,
    "--el-color-primary-rgb": `${rgb.r}, ${rgb.g}, ${rgb.b}`,
    "--el-color-primary-light-3": mixColor(rgb, { r: 255, g: 255, b: 255 }, 0.3),
    "--el-color-primary-light-5": mixColor(rgb, { r: 255, g: 255, b: 255 }, 0.5),
    "--el-color-primary-light-7": mixColor(rgb, { r: 255, g: 255, b: 255 }, 0.7),
    "--el-color-primary-light-8": mixColor(rgb, { r: 255, g: 255, b: 255 }, 0.8),
    "--el-color-primary-light-9": mixColor(rgb, { r: 255, g: 255, b: 255 }, 0.9),
    "--el-color-primary-dark-2": mixColor(rgb, { r: 0, g: 0, b: 0 }, 0.2)
  } as CSSProperties
}

/**
 * 将同一组 token 镜像到 documentElement。
 *
 * Element Plus 的 Dialog、Message 等组件会 Teleport 到 body，无法继承 TenantLayout 的 CSS
 * 变量。返回的恢复函数必须在主题切换或离开 Console 时调用，以免污染后台管理页面主题。
 */
export function applyTenantThemeToDocument(style: CSSProperties) {
  if (typeof document === "undefined") return () => {}

  const root = document.documentElement.style
  const previous = new Map<string, string>()
  Object.entries(style).forEach(([name, value]) => {
    if (!name.startsWith("--") || value == null) return
    previous.set(name, root.getPropertyValue(name))
    root.setProperty(name, String(value))
  })

  return () => {
    previous.forEach((value, name) => {
      if (value) root.setProperty(name, value)
      else root.removeProperty(name)
    })
  }
}

/** 仅接受 hex/rgb(a)；未知格式安全回退到默认主题，不把无效值写入 CSS。 */
function parseColor(color: string) {
  const hex = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i)?.[1]
  if (hex) {
    const normalized = hex.length === 3
      ? hex.split("").map(char => char + char).join("")
      : hex.slice(0, 6)
    return {
      r: Number.parseInt(normalized.slice(0, 2), 16),
      g: Number.parseInt(normalized.slice(2, 4), 16),
      b: Number.parseInt(normalized.slice(4, 6), 16)
    }
  }

  const rgb = color.match(/^rgba?\((\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i)
  if (!rgb) return null
  return {
    r: Math.min(Number(rgb[1]), 255),
    g: Math.min(Number(rgb[2]), 255),
    b: Math.min(Number(rgb[3]), 255)
  }
}

/** 采用 sRGB 相对亮度判定文字应使用深色还是浅色。 */
function getLuminance({ r, g, b }: { r: number, g: number, b: number }) {
  const channels = [r, g, b].map((value) => {
    const channel = value / 255
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

function rgbToHex({ r, g, b }: { r: number, g: number, b: number }) {
  return `#${[r, g, b].map(value => Math.round(value).toString(16).padStart(2, "0")).join("")}`
}

function mixColor(
  source: { r: number, g: number, b: number },
  target: { r: number, g: number, b: number },
  weight: number
) {
  return rgbToHex({
    r: source.r + (target.r - source.r) * weight,
    g: source.g + (target.g - source.g) * weight,
    b: source.b + (target.b - source.b) * weight
  })
}

/** 按 WCAG 对比度在近黑与白色中选择可读性更高的一种。 */
function getAccessibleForeground(background: { r: number, g: number, b: number }) {
  const luminance = getLuminance(background)
  const whiteContrast = 1.05 / (luminance + 0.05)
  const darkLuminance = getLuminance({ r: 17, g: 17, b: 17 })
  const darkContrast = (luminance + 0.05) / (darkLuminance + 0.05)
  return darkContrast >= whiteContrast ? "#111111" : "#ffffff"
}
