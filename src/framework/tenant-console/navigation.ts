import type { NavigationItem } from "./types"

/** 规范化 URL，保证 Header 的激活态不受重复或末尾斜杠影响。 */
export function normalizeNavigationPath(path: string) {
  return path.replace(/\/+/g, "/").replace(/\/+$/, "") || "/"
}

/**
 * 查找当前地址对应的最具体导航项。
 *
 * exact 匹配优先于 prefix；多个 prefix 同时命中时选择路径更长的项，桌面和移动端
 * 共用此规则，避免两个 Header 对同一深层页面出现不同高亮结果。
 */
export function findActiveNavigationHref(items: NavigationItem[], path: string) {
  const currentPath = normalizeNavigationPath(path)
  let matchedHref: string | undefined
  let matchedScore = -1

  const visit = (entries: NavigationItem[]) => {
    entries.filter(entry => !entry.hidden).forEach((entry) => {
      const href = normalizeNavigationPath(entry.href)
      const exact = currentPath === href
      const prefix = entry.activeMatch === "prefix" && currentPath.startsWith(`${href}/`)
      const score = exact ? 10_000 + href.length : prefix ? href.length : -1
      if (score > matchedScore) {
        matchedHref = href
        matchedScore = score
      }
      visit(entry.children ?? [])
    })
  }

  visit(items)
  return matchedHref
}
