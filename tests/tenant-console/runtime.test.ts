import type { Router } from "vue-router"
import type { CompiledRouteBundle } from "@/framework/tenant-console/types"
import { describe, expect, it, vi } from "vitest"
import { TenantRouteRuntime } from "@/framework/tenant-console/runtime"

function createBundle(): CompiledRouteBundle {
  return {
    signature: "next",
    context: {} as CompiledRouteBundle["context"],
    navigation: [],
    routeNames: ["first", "second"],
    routes: [
      { path: "first", name: "first", component: {} },
      { path: "second", name: "second", component: {} }
    ]
  }
}

describe("tenantRouteRuntime", () => {
  it("removes routes already registered when a later registration fails", () => {
    const removeFirst = vi.fn()
    let calls = 0
    const router = {
      hasRoute: () => false,
      addRoute: () => {
        calls++
        if (calls === 2) throw new Error("registration failed")
        return removeFirst
      }
    } as unknown as Router
    const runtime = new TenantRouteRuntime()

    expect(() => runtime.replace(router, createBundle())).toThrow("registration failed")
    expect(removeFirst).toHaveBeenCalledOnce()
    expect(runtime.signature).toBeNull()
  })
})
