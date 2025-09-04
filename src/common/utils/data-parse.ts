export function parseUploadChannel(rawValue: string | number): string {
  switch (rawValue.toString()) {
    case "1": return "4G"
    case "2": return "北斗"
    case "4": return "铱星"
    default: return "未知"
  }
}

export function parseLonHem(rawValue: number): "E" | "W" {
  return rawValue === 0 ? "E" : "W"
}

export function parseLatHem(rawValue: number): "N" | "S" {
  return rawValue === 0 ? "N" : "S"
}

export function parseUbatt(rawValue: number): number {
  return rawValue / 1000
}

export function parseLeakStatus(rawValue: number): string {
  switch (rawValue) {
    case 0: return "未进水"
    case 1: return "已进水"
    case 2: return "断路"
    case 3: return "短路"
    default: return "未知"
  }
}
