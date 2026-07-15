# 多租户数据管理平台前端

基于 Vue 3、TypeScript、Vite、Pinia、Vue Router 和 Element Plus 的多租户数据管理平台。项目同时支持平台后台动态菜单，以及租户、项目、设备、历史四级 Console 定制路由。

## 开发

要求 Node.js 22.16+、pnpm 10+。

```bash
pnpm install --frozen-lockfile
pnpm dev
```

生产构建与本地预览：

```bash
pnpm build
pnpm preview
```

## 质量检查

```bash
pnpm typecheck
pnpm lint:check
pnpm test --run
pnpm verify:business-content
pnpm build
pnpm verify:generated-types
```

`types/auto/**` 和 `types/vue-router.d.ts` 是需要提交的确定性生成产物；修改组件、自动导入或路由后执行生产构建并提交生成差异。`.env*.local`、`.cursor/` 和日志属于本机配置，不应提交。

## 架构文档

- [Console V2 完整使用手册](docs/tenant-console-v2-usage-guide.md)：目录结构、执行流程、Header 菜单、四级定制页面、子路由和布局。
- [公共框架维护说明](docs/framework-maintenance-guide.md)：会话、HTTP、动态菜单、主题、分页、质量门禁和生成文件约定。
- [租户专属第三方 API 指南](docs/tenant-external-api-guide.md)：环境隔离、当前租户保护、类型封装和认证边界。
- [架构升级与迁移记录](docs/architecture/tenant-routing-v2-refactor-plan.md)：设计决策、边界和迁移依据。
- [再次审查与重构临界值](docs/architecture/refactor-review-thresholds.md)：哪些问题应重构、哪些应保持简单。

租户业务实现集中在 `src/tenant-modules/**/implementation/`，路由接入集中在相邻的 `manifest.ts`。没有显式注册定制路由时，系统才进入对应的 `*Entry.vue` 通用兜底页。
