import type { ConsoleScope, TenantModuleManifest, TenantRouteContribution } from "./types"

const scopes = new Set<ConsoleScope>(["tenant", "project", "device", "history"])

/**
 * 校验静态模块注册表。
 *
 * 模块入口在应用启动时执行这项检查，使重复模块 ID、遗漏版本等配置问题在开发和构建
 * 阶段即可发现，而不是等到某个租户首次访问时才静默覆盖路由。
 */
export function assertTenantModuleRegistry(manifests: TenantModuleManifest[]) {
  // Set 只保存稳定模块 ID；同一模块不同 revision 也不能同时注册。
  const ids = new Set<string>()
  manifests.forEach((manifest) => {
    if (!manifest.id?.trim()) throw new Error("Tenant module requires a non-empty id")
    if (ids.has(manifest.id)) throw new Error(`Duplicate tenant module id: ${manifest.id}`)
    ids.add(manifest.id)

    if (!manifest.revision?.trim()) throw new Error(`Tenant module ${manifest.id} requires a revision`)
    if (typeof manifest.matches !== "function") throw new Error(`Tenant module ${manifest.id} requires matches(context)`)
    if (typeof manifest.contributions !== "function") {
      throw new TypeError(`Tenant module ${manifest.id} requires contributions(context)`)
    }
  })
}

/**
 * 校验已命中的模块输出。
 *
 * contribution 会依赖实时实体上下文，因此在导航准备阶段检查。ID 在单个模块内唯一，
 * 由 Compiler 再负责检查不同模块输出的精确路径是否冲突。
 */
export function assertTenantModuleContributions(
  manifest: TenantModuleManifest,
  contributions: TenantRouteContribution[]
) {
  // Contribution ID 只要求在当前 Manifest 内唯一，最终 route 冲突由 Compiler 检查。
  const ids = new Set<string>()
  contributions.forEach((contribution) => {
    if (!contribution.id?.trim()) throw new Error(`Tenant module ${manifest.id} has a contribution without id`)
    if (ids.has(contribution.id)) {
      throw new Error(`Duplicate contribution id in ${manifest.id}: ${contribution.id}`)
    }
    ids.add(contribution.id)

    if (!scopes.has(contribution.scope)) {
      throw new Error(`Invalid contribution scope in ${manifest.id}:${contribution.id}`)
    }
    if (typeof contribution.routes !== "function") {
      throw new TypeError(`Contribution ${manifest.id}:${contribution.id} requires routes(context)`)
    }

    const matcher = contribution.matcher
    if (matcher && matcher.mode !== "literal" && matcher.mode !== "constrained") {
      throw new Error(`Invalid matcher mode in ${manifest.id}:${contribution.id}`)
    }
  })
}
