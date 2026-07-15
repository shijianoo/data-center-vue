import type { ConsoleContext, TenantModuleManifest } from "@/framework/tenant-console/types"
import { describe, expect, it } from "vitest"
import { parseConsoleAddress } from "@/framework/tenant-console/address"
import { getMatchedContributions } from "@/framework/tenant-console/registry"
import { assertTenantModuleRegistry } from "@/framework/tenant-console/validator"

const context = {
  address: parseConsoleAddress("/console/8888"),
  tenant: { id: "tenant-1", tenantCode: "8888" }
} as ConsoleContext

function createManifest(overrides: Partial<TenantModuleManifest> = {}): TenantModuleManifest {
  return {
    id: "tenant:8888",
    revision: "1",
    matches: () => true,
    contributions: () => [{
      id: "home",
      scope: "tenant",
      routes: () => []
    }],
    ...overrides
  }
}

describe("tenant module validator", () => {
  it("rejects duplicate module identifiers before runtime registration", () => {
    expect(() => assertTenantModuleRegistry([createManifest(), createManifest()]))
      .toThrow("Duplicate tenant module id")
  })

  it("rejects duplicate contribution identifiers in a matched module", () => {
    const manifest = createManifest({
      contributions: () => [
        { id: "home", scope: "tenant", routes: () => [] },
        { id: "home", scope: "tenant", routes: () => [] }
      ]
    })
    expect(() => getMatchedContributions(context, [manifest]))
      .toThrow("Duplicate contribution id")
  })
})
