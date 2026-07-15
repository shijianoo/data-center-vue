# 租户专属第三方 API 接入指南

本文适用于“某个租户的定制页面需要调用平台现有后端之外的 API”。目标是隔离第三方协议、区分开发和生产地址，并减少其他租户误调用的可能；它不引入远程插件或额外状态管理。

## 1. 文件放在哪里

API 封装和对应页面应放在同一个租户模块内：

```text
src/tenant-modules/tenants/acme/
├─ manifest.ts
└─ implementation/
   ├─ Home.vue
   └─ apis/
      ├─ client.ts
      ├─ index.ts
      └─ type.ts
```

`manifest.ts` 继续只声明路由。第三方客户端由使用它的页面异步加载，因此不会进入其他租户的首屏代码。不要把单租户 API 放进 `src/common/apis/`，否则依赖边界会暗示它可以被全平台复用。

## 2. 开发和生产环境地址

Vite 会按运行模式加载不同文件：

| 命令 | 推荐配置位置 | 是否提交 |
| --- | --- | --- |
| `pnpm dev` | `.env.development.local` | 否 |
| `pnpm build` | CI/CD 环境变量或 `.env.production.local` | 否 |
| 公共非敏感示例 | 文档或 `.env.example` | 是 |

开发机：

```dotenv
# .env.development.local
VITE_TENANT_ACME_API_BASE_URL=http://localhost:9206/acme/query
```

生产部署变量：

```dotenv
VITE_TENANT_ACME_API_BASE_URL=http://third-party.internal/acme/query
```

在 `types/env.d.ts` 增加对应类型：

```ts
interface ImportMetaEnv {
  readonly VITE_TENANT_ACME_API_BASE_URL?: string
}
```

`VITE_*` 会被写入浏览器产物，只能保存公开地址和非敏感开关，不能保存第三方 secret、私钥、数据库密码或永久 API Key。需要秘密凭据、请求签名、IP 白名单或规避浏览器 CORS 时，应由平台后端增加 BFF/反向代理，浏览器只调用平台后端。

## 3. 创建当前租户专属客户端

`implementation/apis/client.ts`：

```ts
import { createTenantExternalApiClient } from "@/framework/tenant-console/external-api"
import { pinia } from "@/pinia"
import { useTenantContextStore } from "@/pinia/stores/tenantContext"

export const acmeApiClient = createTenantExternalApiClient({
  baseURL: import.meta.env.VITE_TENANT_ACME_API_BASE_URL,

  // 每次真正发送请求前重新读取实体，切换到其他租户后旧页面即使残留异步任务也会被拒绝。
  isTenantActive: () => {
    const tenant = useTenantContextStore(pinia).currentTenant
    return tenant?.tenantCode === "8888"
  },

  timeout: 15_000
})
```

建议依据接口返回的租户实体 `tenantCode` 或稳定 `id` 判断，不要只判断当前 URL，因为同一个租户可能通过 ID、slug 或自定义域名进入。

客户端不会自动携带平台 Access Token，也不会执行平台的 401 refresh。这是有意隔离：默认把平台 Token 发给其他域名存在凭据泄漏风险，而且第三方响应通常不遵循平台的 `{ code, data, message }` 协议。

## 4. 定义类型和业务 API

`implementation/apis/type.ts`：

```ts
export interface StationRecord {
  time: string
  temperature: number | null
  salinity: number | null
}

export interface StationRecordPage {
  items: StationRecord[]
  total: number
}
```

`implementation/apis/index.ts`：

```ts
import type { StationRecordPage } from "./type"
import { acmeApiClient } from "./client"

export async function getStationRecords(
  serialNumber: string,
  page: number,
  pageSize: number,
  signal?: AbortSignal
) {
  const response = await acmeApiClient.get<StationRecordPage>("station/records", {
    // 使用 params 交给 Axios 编码，不手工拼接查询字符串。
    params: { serialNumber, page, pageSize },
    signal
  })
  return response.data
}
```

页面在卸载或条件变化时可以取消旧请求：

```ts
let controller: AbortController | undefined

async function loadRecords() {
  controller?.abort()
  controller = new AbortController()
  records.value = await getStationRecords(sn.value, 1, 20, controller.signal)
}

onUnmounted(() => controller?.abort())
```

## 5. 第三方需要临时认证时

最佳方案是页面先向平台后端申请一个短期、租户绑定的 ticket，再通过 `getHeaders` 动态加入：

```ts
export const acmeApiClient = createTenantExternalApiClient({
  baseURL: import.meta.env.VITE_TENANT_ACME_API_BASE_URL,
  isTenantActive: () => useTenantContextStore(pinia).currentTenant?.tenantCode === "8888",
  getHeaders: async () => {
    const ticket = await getAcmeShortLivedTicketFromPlatform()
    return { "X-Tenant-Ticket": ticket }
  }
})
```

不要把平台 Refresh Token 传给第三方，也不要把永久 Key 写进前端。`isTenantActive` 只是防止前端代码误用，不能阻止用户在浏览器外直接请求第三方地址；服务端仍必须校验 ticket、租户和资源权限。

## 6. 错误处理

```ts
import axios from "axios"
import { TenantExternalApiAccessError } from "@/framework/tenant-console/external-api"

try {
  await getStationRecords("SN001", 1, 20)
} catch (error) {
  if (error instanceof TenantExternalApiAccessError) {
    // missing-base-url 或 tenant-not-active：属于本地配置/调用边界错误。
    ElMessage.error(error.message)
  } else if (axios.isAxiosError(error)) {
    // 按第三方真实的 HTTP 状态和响应结构处理。
    ElMessage.error(error.response?.data?.message ?? "第三方服务暂不可用")
  }
}
```

第三方错误不进入平台统一 `ApiError`，避免错误地按平台业务 code 解析或触发平台登出。

## 7. 现有租户迁移方式

当前天津和宁波业务胶囊已有独立 `axios.create()`，但地址仍硬编码。由于业务实现内容被冻结，本次不直接迁移。以后有对应业务需求时，可以只做以下机械替换：

1. 把硬编码地址移到各环境变量。
2. 用 `createTenantExternalApiClient()` 替换原 `axios.create()`。
3. 保留原导出函数名、参数和返回值，页面无需修改。
4. 为“错误租户不发请求、缺配置、正常响应”补测试。

当第三方接口开始被三个以上租户以相同协议复用时，再把类型和 API 封装提升到共享模块；只有一个或两个租户使用时，不增加 provider/adapter/plugin 层。
