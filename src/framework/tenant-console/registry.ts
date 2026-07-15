import type {
  ConsoleContext,
  RegisteredRouteContribution,
  TenantModuleManifest
} from "./types"
import { assertTenantModuleContributions, assertTenantModuleRegistry } from "./validator"

/**
 * 从显式 Registry 中选出适用于当前实体上下文的所有模块，并把 Manifest 身份附着到
 * Contribution。Compiler 不直接依赖模块目录或业务组件，只依赖这个标准化结果。
 *
 * 同一上下文允许多个 Manifest 同时命中，例如一个租户模块加一个设备型号模块；若它们
 * 声明同一个精确顶层 path，Compiler 会明确报冲突，不依赖数组顺序覆盖。
 */
export function getMatchedContributions(
  context: ConsoleContext,
  manifests: TenantModuleManifest[]
): RegisteredRouteContribution[] {
  // Registry 是显式静态数组，先整体校验可在任何 matches 执行前发现重复模块 ID。
  assertTenantModuleRegistry(manifests)
  return manifests.flatMap((manifest) => {
    // matches 必须是无副作用的纯判断；未命中的模块不会加载其 routes 定义。
    if (!manifest.matches(context)) return []
    const contributions = manifest.contributions(context)
    // Contribution 依赖实时实体，只能在取得当前 context 后校验。
    assertTenantModuleContributions(manifest, contributions)
    // 附加模块身份供 Compiler 生成全局唯一 route name 和 bundle signature。
    return contributions.map(contribution => ({
      ...contribution,
      moduleId: manifest.id,
      moduleRevision: manifest.revision
    }))
  })
}
