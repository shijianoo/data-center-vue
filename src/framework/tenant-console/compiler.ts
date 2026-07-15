import type { RouteRecordRaw } from "vue-router"
import type {
  CompiledRouteBundle,
  ConsoleContext,
  NavigationItem,
  RegisteredRouteContribution
} from "./types"
import { getConcreteScopeBase, getMatcherScopeBase, joinRoutePath } from "./address"

/** 编译单个 Contribution 时共享的名称、冲突检测与上下文状态。 */
interface CompileState {
  context: ConsoleContext
  contribution: RegisteredRouteContribution
  /** 原业务 route name -> 当前模块命名空间后的运行时 name。 */
  nameMap: Map<string, string>
  /** 未命名 RouteRecordRaw 也需要稳定的内部 name，不能依赖同级数组下标。 */
  recordNames: WeakMap<object, string>
  usedNames: Set<string>
  usedPaths: Set<string>
}

/**
 * 将已命中的 Manifest contribution 编译为可注册的 Vue Router bundle。
 *
 * 业务模块只写相对 path；这里把每个顶层 route 直接变成 TenantRoot 的精确 sibling，
 * 从而让 `/console/8888` 这类实例页面在 Vue Router 的排序中优先于 `:tenantKey` fallback。
 * 业务写出的 children 保持原样，因此嵌套路由仍遵循 Vue Router 的原生语义。
 */
export function compileConsoleBundle(
  context: ConsoleContext,
  contributions: RegisteredRouteContribution[]
): CompiledRouteBundle {
  const routes: RouteRecordRaw[] = []
  const navigation: NavigationItem[] = []
  const routeNames: string[] = []
  const usedNames = new Set<string>()
  const usedPaths = new Set<string>()

  for (const contribution of contributions) {
    // 先执行并校验完整业务路由树，避免注册阶段才发现深层绝对路径或同级重复 path。
    const rawRoutes = contribution.routes(context)
    validateRawRouteTree(rawRoutes, contribution.id)
    // 名称必须在递归编译前一次分配完，redirect 才能引用稍后出现的 sibling/child。
    const nameAllocation = createNameMap(contribution, rawRoutes)
    const state: CompileState = {
      context,
      contribution,
      nameMap: nameAllocation.nameMap,
      recordNames: nameAllocation.recordNames,
      usedNames,
      usedPaths
    }
    const matcherBase = getMatcherScopeBase(context, contribution.scope, contribution.matcher)
    const concreteBase = getConcreteScopeBase(context, contribution.scope)

    // 顶层记录加 scope matcher；业务显式 children 只改名称，不重复拼接 scope。
    routes.push(...rawRoutes.map(route => compileRoute(route, matcherBase, state, true)))
    // 菜单始终使用具体 URL，而不是 `:tenantKey(8888)` 一类 matcher path。
    navigation.push(...buildNavigation(rawRoutes, concreteBase, contribution, []))
    routeNames.push(...state.nameMap.values())
  }

  return {
    signature: createSignature(context, contributions, routes),
    context,
    routes,
    navigation,
    routeNames
  }
}

/**
 * 分配模块私有 route name。
 *
 * Vue Router 遇到同名 route 会静默替换旧记录，因此模块不能直接使用业务页的短 name。
 * 同时用 WeakMap 为匿名记录保存名称，避免嵌套匿名 route 因 sibling index 重复而编译失败。
 */
function createNameMap(contribution: RegisteredRouteContribution, routes: RouteRecordRaw[]) {
  const nameMap = new Map<string, string>()
  const recordNames = new WeakMap<object, string>()
  let anonymousIndex = 0

  const walk = (records: RouteRecordRaw[]) => {
    records.forEach((record) => {
      const original = typeof record.name === "string" ? record.name : `anonymous-${anonymousIndex++}`
      if (nameMap.has(original)) {
        throw new Error(`Duplicate module route name: ${contribution.id}:${original}`)
      }
      nameMap.set(original, `tenant-module:${contribution.moduleId}:${contribution.id}:${original}`)
      recordNames.set(record, original)
      if (record.children) walk(record.children)
    })
  }

  walk(routes)
  return { nameMap, recordNames }
}

/** 把一个业务 RouteRecordRaw 转为实际注册记录；只给顶层记录加 scope matcher。 */
function compileRoute(
  raw: RouteRecordRaw,
  matcherBase: string,
  state: CompileState,
  isTopLevel: boolean
): RouteRecordRaw {
  if (raw.path.startsWith("/")) {
    throw new Error(`Module routes must be relative: ${state.contribution.id}:${raw.path}`)
  }
  const originalName = state.recordNames.get(raw)
  const name = originalName ? state.nameMap.get(originalName) : undefined
  if (!name) throw new Error(`Unable to allocate route name: ${state.contribution.id}`)
  if (state.usedNames.has(name)) throw new Error(`Duplicate runtime route name: ${name}`)

  const path = isTopLevel ? joinRoutePath(matcherBase, raw.path) : raw.path
  if (isTopLevel) {
    // 同一 bundle 中两个模块不能声明同一个精确入口；不要让注册顺序决定页面。
    if (state.usedPaths.has(path)) throw new Error(`Duplicate exact route path: ${path}`)
    state.usedPaths.add(path)
  }

  state.usedNames.add(name)
  const record = {
    ...raw,
    path,
    name,
    // Shadow Router 通过此标记判断某一层是否已被扩展模块 claim。
    meta: {
      ...(raw.meta ?? {}),
      tenantFramework: {
        moduleId: state.contribution.moduleId,
        contributionId: state.contribution.id,
        scope: state.contribution.scope
      }
    },
    redirect: rewriteRedirect(raw.redirect, state.nameMap)
  } as unknown as RouteRecordRaw

  if (raw.children) {
    record.children = raw.children.map(child => compileRoute(child, matcherBase, state, false))
  }
  return record
}

/**
 * 保持字符串/function redirect 不变；仅将模块内部 `{ name }` redirect 改为命名空间 name。
 * 这样 legacy route factory 可以继续使用旧的短 name 写 redirect。
 */
function rewriteRedirect(redirect: unknown, nameMap: Map<string, string>) {
  if (!redirect || typeof redirect === "string" || typeof redirect === "function") return redirect
  if (typeof redirect === "object") {
    const redirectRecord = redirect as { name?: unknown }
    if (typeof redirectRecord.name === "string") {
      const mapped = nameMap.get(redirectRecord.name)
      return mapped ? { ...redirectRecord, name: mapped } : redirectRecord
    }
  }
  return redirect
}

/**
 * 从原始相对路由树生成 Header 菜单。
 *
 * 不使用已编译 route.path，因为那会泄露 constrained matcher；这里由 concrete scope base
 * 和业务相对 segment 组合出可直接点击的 href。
 */
function buildNavigation(
  routes: RouteRecordRaw[],
  concreteBase: string,
  contribution: RegisteredRouteContribution,
  parentSegments: string[]
): NavigationItem[] {
  const items: NavigationItem[] = []
  routes.forEach((route, index) => {
    const segment = route.path || ""
    const segments = segment ? [...parentSegments, segment] : parentSegments
    const href = [concreteBase, ...segments].filter(Boolean).join("/").replace(/\/+/g, "/")
    const children = route.children
      ? buildNavigation(route.children, concreteBase, contribution, segments)
      : undefined
    const label = typeof route.meta?.title === "string" ? route.meta.title : ""
    const hidden = Boolean(route.meta?.hidden)
    // 无标题且没有可承载子菜单的记录是纯技术 route，不显示在 Header。
    if (!label && !children?.length) return

    items.push({
      id: `${contribution.moduleId}:${contribution.id}:${index}`,
      label: label || contribution.id,
      href,
      activeMatch: route.meta?.activeMatch === "prefix" ? "prefix" : "exact",
      hidden,
      order: index,
      icon: route.meta?.svgIcon,
      children
    })
  })
  return items
}

/**
 * 只把影响注册结果的内容放进 signature。相同 signature 表示当前活跃 bundle 已可复用；
 * 实体切换、URL key 切换、Manifest revision 或 path/name/redirect 改变都会触发替换。
 */
function createSignature(
  context: ConsoleContext,
  contributions: RegisteredRouteContribution[],
  routes: RouteRecordRaw[]
) {
  const payload = {
    address: context.address,
    tenantId: context.tenant.id,
    projectId: context.project?.id,
    deviceId: context.device?.id,
    contributions: contributions.map(item => ({
      moduleId: item.moduleId,
      moduleRevision: item.moduleRevision,
      id: item.id,
      scope: item.scope,
      matcher: item.matcher
    })),
    routes: routes.map(serializeRoute)
  }
  return JSON.stringify(payload)
}

/** 所有层级都必须是相对路径，同一父级下也不能依赖注册顺序解决重复 path。 */
function validateRawRouteTree(routes: RouteRecordRaw[], contributionId: string) {
  const paths = new Set<string>()
  routes.forEach((route) => {
    if (route.path.startsWith("/")) {
      throw new Error(`Module routes must be relative: ${contributionId}:${route.path}`)
    }
    if (paths.has(route.path)) {
      throw new Error(`Duplicate sibling route path: ${contributionId}:${route.path}`)
    }
    paths.add(route.path)
    if (route.children) validateRawRouteTree(route.children, contributionId)
  })
}

/** 递归记录会影响匹配和导航的结构，降低遗漏 revision 更新带来的陈旧 bundle 风险。 */
function serializeRoute(route: RouteRecordRaw): Record<string, unknown> {
  return {
    path: route.path,
    name: route.name,
    redirect: normalizeRedirect(route.redirect),
    meta: route.meta
      ? {
          title: route.meta.title,
          hidden: route.meta.hidden,
          activeMatch: route.meta.activeMatch,
          svgIcon: route.meta.svgIcon,
          logoTitle: route.meta.logoTitle,
          browserTitle: typeof route.meta.browserTitle === "function" ? "[function]" : route.meta.browserTitle
        }
      : undefined,
    children: route.children?.map(serializeRoute)
  }
}

/** 函数 redirect 无法稳定序列化，因此只记录可比较的字符串/name redirect。 */
function normalizeRedirect(redirect: RouteRecordRaw["redirect"]) {
  if (typeof redirect === "string") return redirect
  if (redirect && typeof redirect === "object" && "name" in redirect) {
    const location = redirect as { name?: unknown }
    return typeof location.name === "string" ? location.name : undefined
  }
  return undefined
}
