import type { ConsoleContext } from "@/framework/tenant-console/types"
import { describe, expect, it } from "vitest"
import { getMatcherScopeBase, parseConsoleAddress } from "@/framework/tenant-console/address"

describe("consoleAddressParser", () => {
  it("识别四级 Console 地址", () => {
    const address = parseConsoleAddress("/console/8888/projects/P100/devices/D001/history/detail")
    expect(address).toMatchObject({
      tenantKey: "8888",
      projectKey: "P100",
      deviceCode: "D001",
      scope: "history",
      tail: ["detail"]
    })
  })

  it("为 legacy 页面生成保留 tenantKey 的精确 matcher", () => {
    const context = {
      address: parseConsoleAddress("/console/8888/projects/P100"),
      tenant: { id: "tenant-1" }
    } as ConsoleContext

    expect(getMatcherScopeBase(context, "project", {
      mode: "constrained",
      exposeParams: ["tenantKey"]
    })).toBe(":tenantKey(8888)/projects/P100")
  })
})
