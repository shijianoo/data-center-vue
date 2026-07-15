# 前端公共框架维护说明

本说明补充 Console V2 使用手册，覆盖平台动态菜单、会话、请求、主题、数据查询和交付校验。租户业务实现位于 `src/tenant-modules/**/implementation/`，本轮框架重构不修改其中内容；框架升级应优先改动 `src/framework/`、`src/router/`、`src/pinia/`、`src/layouts/` 和 `src/common/`。

## 1. 核心边界

- `src/router/routes.ts` 声明稳定的 `/console` 父路由 `TenantRoot` 和四级通用兜底 Entry；`index.ts` 仅负责组装 Router，`dynamic-runtime.ts` 管理平台后台动态路由的 remover。
- `src/framework/tenant-console/` 是唯一能编译、注册和移除租户运行时路由的地方。业务模块不得自行调用 `router.addRoute()`。
- `src/tenant-modules/*/manifest.ts` 是业务接入点；没有显式 Manifest 路由时，才进入 `TenantEntry.vue`、`ProjectEntry.vue`、`DeviceEntry.vue` 或 `HistoryEntry.vue`。
- `implementation/` 是业务实现胶囊。迁移文件时必须整体移动相对导入闭包，并执行 `pnpm verify:business-content`。

详细的租户、项目、设备、历史路由写法、嵌套路由布局和 Header 菜单配置见 [tenant-console-v2-usage-guide.md](tenant-console-v2-usage-guide.md)。
租户调用独立第三方后端时，使用 [tenant-external-api-guide.md](tenant-external-api-guide.md) 中的隔离客户端和环境配置方式。

## 2. 一次 Console 导航的运行顺序

1. `router/guard.ts` 识别 `/console/...`，调用 `prepareConsoleNavigation()`。
2. Orchestrator 根据 URL 确保当前租户会话，再按 tenant → project → device/history 逐层解析实体。
3. 每一层先在 Shadow Router 中判断上一层 Manifest 是否已声明该地址；若已声明，不再把例如 `projects/settings` 误请求为项目 `settings`。
4. Registry 选中 Manifest，Validator 检查模块 ID、版本、Contribution ID、scope 和 matcher；Compiler 输出精确 sibling route 与 Header 菜单模型。
5. `TenantRouteRuntime` 原子替换 `TenantRoot` 下的运行时路由。若路由表有冲突，会恢复上一套可用 bundle。
6. 新 bundle 首次注册时，guard `replace` 同一 URL 触发 Vue Router 重匹配；第二次通过时才提交 `TenantFrameworkSnapshot`。因此不会出现新 Header 与旧 Entry 页面短暂错配。

`TenantLayout` 是稳定 Shell，不再使用 `route.fullPath` 强制重建页面。若某个页面确实必须在 query 改变时重建，应由该页面自行 watch query，或以后按需定义明确的 `meta.remountOnQuery`，不要恢复全局强制 key。

## 3. 平台动态菜单

入口是 `src/common/utils/menu-builder.ts`。后端菜单类型的规则如下：

| 类型 | 作用 | 路由行为 |
| --- | --- | --- |
| `1` | 目录 | 生成含 children 的目录路由 |
| `2` | 页面 | 仅当组件可由 `import.meta.glob` 解析时注册 |
| `3` | 外链 | 使用 `external/<menuId>` 内部路径，真实 URL 存在 `meta.externalUrl` |
| `4` | 重定向 | 使用 `routePath` 与 `redirect`，不再误当外链 |

页面组件配置兼容以下格式：`users/index`、`pages/users/index.vue`、`@/pages/users/index.vue`、`/src/pages/users/index.vue`。迁移到 `tenant-modules` 的历史路径会统一映射，旧菜单数据不必立即迁移。

外链必须填写 `externalUrl`，可选 `target`（例如 `_self`）。侧栏和搜索菜单都读取 `meta.externalUrl` 打开链接，因此 URL 不会被 Vue Router 当成嵌套路由。组件不存在、外链地址缺失或重定向字段不完整时，菜单会被跳过并在控制台给出明确警告，不会产生空白页面。

如需新增一个平台后台页面：

1. 在 `src/pages/` 或框架允许的 `src/tenant-modules/` 下创建 Vue 组件。
2. 在后台菜单中配置 type `2`、相对 `routePath` 和 `component`。
3. 菜单 `id` 必须全树唯一；框架使用稳定的 `backend-menu:<id>` 作为 route name。
4. 执行 `pnpm test --run`，其中 `tests/menu-builder.test.ts` 覆盖外链、重定向和缺失组件场景。

## 4. 会话与请求约定

### 租户切换

`useUserStore().switchTenantByKey()` 使用单调递增 revision。快速从 A 切到 B 再切到 C 时，只有 C 能写入 token、refresh token、当前租户和成员资料；旧请求返回后会被丢弃。最新切换失败才恢复切换前会话，登出会使所有未结束切换失效。

新代码不要直接写 `activeTenant` 或 cookie token；登录使用 `userStore.setCredentials()`，租户切换使用 `switchTenantByKey()`，退出使用 `logout()`。`session-manager.ts` 是 Cookie、刷新请求和 Store 响应式凭据之间的唯一提交边界。

### HTTP 错误处理

`src/http/axios.ts` 统一使用 `ApiError`：

```ts
try {
  await request(...)
} catch (error) {
  if (isApiError(error) && (error.code ?? error.status) === 404) {
    // 处理资源不存在
  }
}
```

所有并发 401 在同一 session revision 内共用一个刷新 token 请求；刷新成功后原请求只重试一次，刷新失败或重试仍为 401 才统一登出。页面要自行显示错误时传入 `silent: true`，避免拦截器和页面重复 toast。新增请求客户端时应复用 `createRequest` 的模式，不要重新复制一套拦截器。

## 5. 主题、Header 与异步数据

- `TenantLayout.vue` 通过 `framework/tenant-console/theme.ts` 同时写入 Shell 与 `document.documentElement` 的主题变量，因此 Teleport 到 body 的 Dialog、Message 和公共图表会使用当前租户主题。离开 Console 时自动恢复。
- Header 仅读取已提交的 Snapshot。桌面与移动菜单共用 `framework/tenant-console/navigation.ts`，精确匹配优先，多个 prefix 匹配时选择最具体路径。
- 数据分页 Hook `useHistoryDataQuery`、`useDeviceDataPagination`、`useAnchorPagination` 与 `useDeviceStatusQuery` 都使用请求 revision；旧响应不能覆盖新筛选条件，失败也不会错误增加页码。
- `useDeviceEvent` 覆盖首次连接失败的定时重试；卸载时即使退订失败仍会停止连接，避免 SignalR 泄漏。

## 6. 开发、质量门禁与发布

本地交付前执行：

```bash
pnpm typecheck
pnpm lint:check
pnpm test --run
pnpm verify:business-content
pnpm build
pnpm verify:generated-types
```

- `lint:check` 忽略文档、构建产物、coverage 和自动生成类型文件；提交时只格式化 JS/TS/Vue 源码。
- `types/auto/**` 与 `types/vue-router.d.ts` 是提交到仓库的生成文件。组件、自动导入或路由变化后运行 `pnpm build`，再用 `pnpm verify:generated-types` 确认没有遗漏；`.cursor/`、`*.local` 和日志是本机文件，已统一忽略。
- 生产构建最后执行 `tools/check-bundle-budget.mjs`：入口同步加载的 JS 上限为 350 KiB、CSS 上限为 100 KiB；普通异步 chunk 上限为 750 KiB，MapLibre 独立 vendor chunk 上限为 1100 KiB。
- `.github/workflows/quality.yml` 在 PR 和非 main 推送中执行完整质量门禁；`deploy.yml` 在 main 部署前执行同一套校验，并使用 frozen lockfile。

如果修改了 Manifest、Compiler、Runtime、Orchestrator 或菜单构造器，至少新增或更新对应 Vitest 测试。当前关键覆盖位于：

- `tests/tenant-console/address.test.ts`
- `tests/tenant-console/compiler.test.ts`
- `tests/tenant-console/validator.test.ts`
- `tests/tenant-console/navigation.test.ts`
- `tests/menu-builder.test.ts`

不要手动恢复 `.env.development`、业务实现目录或自动生成类型文件；它们可能包含当前环境或用户尚未提交的有效变更。
