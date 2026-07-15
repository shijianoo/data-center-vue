import type { MenuTree } from "@/common/apis/menus/type"
import { describe, expect, it } from "vitest"
import { convertMenuToRoutes } from "@/common/utils/menu-builder"

function createMenu(overrides: Partial<MenuTree>): MenuTree {
  return {
    id: "menu-1",
    createdAt: "",
    scope: 0,
    title: "菜单",
    type: 1,
    isSystem: false,
    isActive: true,
    sortOrder: 0,
    createdByUserId: "system",
    ...overrides
  }
}

describe("dynamic menu builder", () => {
  it("uses a synthetic path and meta for external links", () => {
    const [route] = convertMenuToRoutes([
      createMenu({
        id: "external-docs",
        type: 3,
        externalUrl: "https://example.com/docs",
        target: "_self"
      })
    ])

    expect(route).toMatchObject({
      path: "external/external-docs",
      name: "backend-menu:external-docs",
      meta: {
        externalUrl: "https://example.com/docs",
        externalTarget: "_self"
      }
    })
  })

  it("creates redirects from routePath rather than treating them as external links", () => {
    const [route] = convertMenuToRoutes([
      createMenu({
        id: "legacy-home",
        type: 4,
        routePath: "legacy-home",
        redirect: "/admin/home"
      })
    ])

    expect(route).toMatchObject({
      path: "legacy-home",
      redirect: "/admin/home"
    })
    expect(route.meta?.externalUrl).toBeUndefined()
  })

  it("skips page routes whose configured component cannot be loaded", () => {
    const routes = convertMenuToRoutes([
      createMenu({
        type: 2,
        routePath: "missing",
        component: "not-found/NoSuchPage.vue"
      })
    ])

    expect(routes).toEqual([])
  })

  it("rejects absolute paths and unsafe external protocols", () => {
    const routes = convertMenuToRoutes([
      createMenu({ id: "absolute", routePath: "/login" }),
      createMenu({ id: "script", type: 3, externalUrl: "javascript:alert(1)" })
    ])
    expect(routes).toEqual([])
  })

  it("keeps menu ids unique across the whole tree", () => {
    const routes = convertMenuToRoutes([
      createMenu({ id: "duplicate", routePath: "first" }),
      createMenu({ id: "duplicate", routePath: "second" })
    ])
    expect(routes).toHaveLength(1)
    expect(routes[0].path).toBe("first")
  })
})
