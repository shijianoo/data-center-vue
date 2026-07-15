import type { NavigationItem } from "@/framework/tenant-console/types"
import { describe, expect, it } from "vitest"
import { findActiveNavigationHref } from "@/framework/tenant-console/navigation"

const navigation: NavigationItem[] = [{
  id: "management",
  label: "管理",
  href: "/console/8888/management",
  activeMatch: "prefix",
  hidden: false,
  order: 0,
  children: [{
    id: "users",
    label: "用户",
    href: "/console/8888/management/users",
    activeMatch: "prefix",
    hidden: false,
    order: 0
  }]
}]

describe("tenant header navigation", () => {
  it("prefers the most specific matching item", () => {
    expect(findActiveNavigationHref(navigation, "/console/8888/management/users/42"))
      .toBe("/console/8888/management/users")
  })

  it("does not let a prefix menu match a similar sibling path", () => {
    expect(findActiveNavigationHref(navigation, "/console/8888/management-users"))
      .toBeUndefined()
  })
})
