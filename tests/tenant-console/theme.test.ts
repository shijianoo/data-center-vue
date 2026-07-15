import { describe, expect, it } from "vitest"
import { resolveTenantThemeStyle } from "@/framework/tenant-console/theme"

describe("tenant theme", () => {
  it("falls back completely when the configured color is invalid", () => {
    const style = resolveTenantThemeStyle("not-a-color") as Record<string, string>
    expect(style["--tenant-header-bg"]).toBe("#1e293b")
    expect(style["--el-color-primary"]).toBe("#1e293b")
  })

  it("chooses WCAG-friendly foregrounds and emits Element Plus derived colors", () => {
    const light = resolveTenantThemeStyle("#ffffff") as Record<string, string>
    const dark = resolveTenantThemeStyle("#000000") as Record<string, string>
    expect(light["--tenant-on-primary"]).toBe("#111111")
    expect(dark["--tenant-on-primary"]).toBe("#ffffff")
    expect(dark["--el-color-primary-light-9"]).toMatch(/^#[0-9a-f]{6}$/)
    expect(dark["--el-color-primary-dark-2"]).toMatch(/^#[0-9a-f]{6}$/)
  })
})
