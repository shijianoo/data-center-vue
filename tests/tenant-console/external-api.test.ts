import type { AxiosResponse } from "axios"
import { describe, expect, it, vi } from "vitest"
import {
  createTenantExternalApiClient,
  TenantExternalApiAccessError
} from "@/framework/tenant-console/external-api"

function successfulAdapter(config: AxiosResponse["config"]): Promise<AxiosResponse> {
  return Promise.resolve({ data: { ok: true }, status: 200, statusText: "OK", headers: {}, config })
}

describe("tenant external API client", () => {
  it("rejects a request before the adapter when the current tenant is not allowed", async () => {
    const adapter = vi.fn(successfulAdapter)
    const client = createTenantExternalApiClient({
      baseURL: "http://example.test/api",
      isTenantActive: () => false
    })

    await expect(client.get("records", { adapter })).rejects.toMatchObject({
      reason: "tenant-not-active"
    })
    expect(adapter).not.toHaveBeenCalled()
  })

  it("rejects a missing environment URL with a readable configuration error", async () => {
    const client = createTenantExternalApiClient({
      baseURL: " ",
      isTenantActive: () => true
    })
    await expect(client.get("records")).rejects.toBeInstanceOf(TenantExternalApiAccessError)
    await expect(client.get("records")).rejects.toMatchObject({ reason: "missing-base-url" })
  })

  it("passes through third-party responses and appends dynamic short-lived headers", async () => {
    const client = createTenantExternalApiClient({
      baseURL: "http://example.test/api",
      isTenantActive: () => true,
      getHeaders: () => ({ "X-Tenant-Ticket": "short-lived-ticket" })
    })
    const response = await client.get("records", { adapter: successfulAdapter })

    expect(response.data).toEqual({ ok: true })
    expect(response.config.headers.get("X-Tenant-Ticket")).toBe("short-lived-ticket")
  })
})
