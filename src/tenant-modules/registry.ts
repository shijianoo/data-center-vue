import type { TenantModuleManifest } from "@/framework/tenant-console/types"
import { assertTenantModuleRegistry } from "@/framework/tenant-console/validator"
import sob10 from "./device-models/sob10/manifest"
import sob23bs from "./device-models/sob23bs/manifest"
import tianjin from "./project-profiles/tianjin/manifest"
import ningboHKY from "./tenants/ningbo-hky/manifest"

/**
 * 模块入口保持显式，方便构建期发现重复 id，也避免业务实现被 eager import。
 * 新模块只需在此导出一次；后续可以切换为 import.meta.glob 自动发现。
 */
/**
 * 已发布 Console 扩展模块的唯一入口。
 *
 * 这里故意使用显式 import 而不是自动 glob：接入一个新模块必须经过代码评审，模块 ID
 * 冲突可在构建时发现，同时 Manifest 不会 eager 执行业务组件的动态 import。
 */
export const tenantModules: TenantModuleManifest[] = [
  ningboHKY,
  tianjin,
  sob10,
  sob23bs
]

// 在启动阶段立即暴露注册表配置错误，而不是等到用户访问目标租户时才失败。
assertTenantModuleRegistry(tenantModules)
