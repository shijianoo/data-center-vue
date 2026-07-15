import type { ConsoleContext, RegisteredRouteContribution } from "@/framework/tenant-console/types"
import { describe, expect, it } from "vitest"
import { createMemoryHistory, createRouter } from "vue-router"
import { parseConsoleAddress } from "@/framework/tenant-console/address"
import { compileConsoleBundle } from "@/framework/tenant-console/compiler"

describe("routeBundleCompiler", () => {
  const context = {
    address: parseConsoleAddress("/console/8888"),
    tenant: { id: "tenant-1", tenantCode: "8888" }
  } as ConsoleContext

  it("将首页和子页编译为 TenantRoot 的同级精确路由", () => {
    const contribution: RegisteredRouteContribution = {
      moduleId: "tenant:8888",
      moduleRevision: "1",
      id: "pages",
      scope: "tenant",
      matcher: { mode: "constrained", exposeParams: ["tenantKey"] },
      routes: () => [
        { path: "", name: "home", component: {}, meta: { title: "首页" } },
        { path: "settings", name: "settings", component: {}, meta: { title: "设置" } }
      ]
    }

    const bundle = compileConsoleBundle(context, [contribution])
    expect(bundle.routes.map(route => route.path)).toEqual([
      ":tenantKey(8888)",
      ":tenantKey(8888)/settings"
    ])
    expect(bundle.navigation.map(item => item.href)).toEqual([
      "/console/8888",
      "/console/8888/settings"
    ])
  })

  it("重写模块内部的 redirect name", () => {
    const contribution: RegisteredRouteContribution = {
      moduleId: "tenant:8888",
      moduleRevision: "1",
      id: "history",
      scope: "tenant",
      matcher: { mode: "constrained", exposeParams: ["tenantKey"] },
      routes: () => [{
        path: "history",
        name: "history",
        component: {},
        redirect: { name: "leaf" },
        children: [{
          path: "leaf",
          name: "leaf",
          component: {}
        }]
      }]
    }

    const bundle = compileConsoleBundle(context, [contribution])
    expect(bundle.routes[0].redirect).toMatchObject({
      name: "tenant-module:tenant:8888:history:leaf"
    })
  })

  it("精确实例路由覆盖已存在的四级 fallback，并保留 legacy params", () => {
    const contribution: RegisteredRouteContribution = {
      moduleId: "tenant:8888",
      moduleRevision: "1",
      id: "home",
      scope: "tenant",
      matcher: { mode: "constrained", exposeParams: ["tenantKey"] },
      routes: () => [{ path: "", name: "home", component: {} }]
    }
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{
        path: "/console",
        name: "TenantRoot",
        component: {},
        children: [{ path: ":tenantKey", name: "TenantIndex", component: {} }]
      }]
    })

    const bundle = compileConsoleBundle(context, [contribution])
    bundle.routes.forEach(route => router.addRoute("TenantRoot", route))

    const resolved = router.resolve("/console/8888")
    expect(resolved.name).toBe("tenant-module:tenant:8888:home:home")
    expect(resolved.params.tenantKey).toBe("8888")
  })

  it("为嵌套匿名路由分配稳定且不重复的运行时名称", () => {
    const contribution: RegisteredRouteContribution = {
      moduleId: "tenant:8888",
      moduleRevision: "1",
      id: "anonymous-layout",
      scope: "tenant",
      matcher: { mode: "literal" },
      routes: () => [{
        path: "management",
        component: {},
        children: [
          { path: "users", component: {} },
          { path: "roles", component: {} }
        ]
      }]
    }

    const bundle = compileConsoleBundle(context, [contribution])
    const children = bundle.routes[0].children ?? []
    const names = [bundle.routes[0].name, ...children.map(route => route.name)]
    expect(new Set(names).size).toBe(3)
    expect(names.every(Boolean)).toBe(true)
  })

  it("拒绝任意层级的绝对路径", () => {
    const contribution: RegisteredRouteContribution = {
      moduleId: "tenant:8888",
      moduleRevision: "1",
      id: "unsafe-child",
      scope: "tenant",
      routes: () => [{
        path: "management",
        component: {},
        children: [{ path: "/login", component: {} }]
      }]
    }
    expect(() => compileConsoleBundle(context, [contribution])).toThrow("Module routes must be relative")
  })

  it("拒绝同一父级下的重复 path", () => {
    const contribution: RegisteredRouteContribution = {
      moduleId: "tenant:8888",
      moduleRevision: "1",
      id: "duplicate-child",
      scope: "tenant",
      routes: () => [{
        path: "management",
        component: {},
        children: [
          { path: "users", component: {} },
          { path: "users", component: {} }
        ]
      }]
    }
    expect(() => compileConsoleBundle(context, [contribution])).toThrow("Duplicate sibling route path")
  })
})
