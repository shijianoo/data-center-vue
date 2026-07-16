# EcoCenter 前端 API 对接说明

本文档面向前端开发，说明当前服务全部公开 HTTP API、WebSocket 接口及其关键数据约定。开发环境还可访问 `/docs` 查看实时 OpenAPI；本文档用于说明业务含义、页面交互顺序和非普通 JSON 接口。

## 1. 通用约定

- API 根路径：`/api/v1`。
- JSON 字段使用 camelCase；所有枚举使用字符串名称，例如 `"Monitoring"`、`"Passed"`。
- 64 位 ID 在 JSON 中以字符串传输，例如 `"123"`；请求中传 JSON 数字或数字字符串均可。
- 时间使用 ISO 8601。未带时区（如 `2026-07-14T08:00:00`）按服务端本地时间解释；带 `Z` 或偏移量时先换算为服务端本地时间。
- `from` 为包含边界、`to` 为不包含边界，所有区间均要求 `from < to`。
- 成功删除返回 `204 No Content`。创建通常返回 `201 Created`，其余查询或修改通常返回 `200 OK`。
- 失败统一为 `application/problem+json`，结构示例：

```json
{
  "title": "业务请求失败",
  "status": 422,
  "detail": "HJ212报文未被接受。",
  "errorCode": "UnknownMn",
  "traceId": "0H..."
}
```

常用状态：`400` 请求格式/字段错误，`404` 资源不存在，`409` 冲突或不能删除，`422` 业务规则不接受，`500` 服务端异常。前端应显示 `detail`，并在反馈问题时保留 `traceId`。

## 2. HJ212 数据接收

### `POST /api/v1/hj212/messages`

接收单条 HJ212 报文。支持 `Content-Type: text/plain`（请求体直接为报文）或 `application/json`（请求体为 JSON 字符串）。单条报文最大 10 MiB。

普通报文示例：

```text
QN=202607140001;CN=2011;MN=BUOY-01;Flag=0;CP=&&DataTime=20260714090000;060-Rtd=1.25,060-Flag=N&&
```

正常完成响应：

```json
{
  "status": "Accepted",
  "messageId": "101",
  "mn": "BUOY-01",
  "qn": "202607140001",
  "commandCode": "2011",
  "observedAt": "2026-07-14T09:00:00",
  "pointCount": 1,
  "receivedPackageCount": 0,
  "expectedPackageCount": 0,
  "warnings": []
}
```

`status` 可能为：

| 值          | 含义                                               |
| ----------- | -------------------------------------------------- |
| `Accepted`  | 已入库新的数据点。                                 |
| `Duplicate` | 数据点已存在且内容一致。                           |
| `Conflict`  | 同一业务时间的数据点已存在但内容不同，未覆盖旧值。 |
| `Pending`   | 已留存当前物理分包，尚未收齐，不会执行审核或入库。 |

#### HJ212 分包规则

HJ212 的 Flag 从 bit0 开始编号；当第二位 bit1（掩码 `0b0000_0010`，十进制值 `2`）为 `1` 时，报文必须包含：

- `QN`：同一逻辑报文的唯一关联号；缺少时返回 `PackageQnMissing`。
- `PNUM`：总包数，正整数。
- `PNO`：当前包号，范围 `1..PNUM`。

服务以 `MN + QN + CN` 关联分包，允许乱序到达，按 `PNO` 拼接 CP 原文；即使一个参数值刚好被分在两包中也能正确恢复。每个物理分包都会立即保存原文；只有收齐后才执行一次解析、自动审核和数据点入库。未收齐的组在 `Hj212PackageReassembly:ExpirationSeconds`（默认 600 秒）后释放。

等待其余分包时示例：

```json
{
  "status": "Pending",
  "messageId": "102",
  "mn": "BUOY-01",
  "qn": "202607140002",
  "commandCode": "2011",
  "pointCount": 0,
  "receivedPackageCount": 1,
  "expectedPackageCount": 2,
  "warnings": []
}
```

分包的最后一包收齐后返回正常 `Accepted`/`Duplicate`/`Conflict`，并带 `receivedPackageCount` 与 `expectedPackageCount`。发送端重传同一 `PNO` 且 CP 内容完全一致时按幂等包处理；同一包号内容不同则返回 `PackageSequenceConflict`。

分包元数据不合法或冲突返回 `422`；若未完成组数量已达到 `MaximumPendingMessages`，返回 `503` 和 `PackageBufferFull`，调用方应在稍后重新发送完整分包组。

### `POST /api/v1/hj212/messages/batch`

请求体为 HJ212 字符串数组，最多 1000 条。每一项独立处理；同一 MN 在本批次中按业务时间串行，不同 MN 可并行。

```json
[
  "QN=202607140001;CN=2011;MN=BUOY-01;Flag=0;CP=&&DataTime=20260714090000;060-Rtd=1.25&&",
  "QN=202607140002;CN=2011;MN=BUOY-01;Flag=0;CP=&&DataTime=20260714100000;060-Rtd=1.35&&"
]
```

返回 `{ batchId, total, succeeded, failed, items }`；`items` 与输入数组同索引，元素字段与单条响应一致并额外带 `index`、`errorCode`。`Pending` 代表分包已正确接收，不计入 `failed`。

## 3. 数据查询、下载与统计

### `GET /api/v1/stations/{mn}/measurements/latest`

返回站点当前绑定参数及历史出现过参数的最新一个数据点。用于站点总览。

响应：`{ mn, stationName, groupName, parameters }`，每个 `parameters` 元素为：

```json
{
  "parameter": {
    "code": "060",
    "kind": "Monitoring",
    "name": "水温",
    "unit": "℃",
    "decimalPlaces": 2,
    "dataType": "Decimal",
    "groupId": "10",
    "groupName": "水质",
    "reportIntervalMinutes": 15,
    "sortOrder": 1
  },
  "point": {
    "id": "1001",
    "observedAt": "2026-07-14T09:00:00",
    "receivedAt": "2026-07-14T09:00:03",
    "reportedValueText": "1.25",
    "effectiveValueText": "1.25",
    "effectiveNumericValue": 1.25,
    "metrics": { "Rtd": "1.25", "Flag": "N" },
    "autoReviewStatus": "Passed",
    "autoReviewResultsJson": "[]",
    "manualReview": { "currentLevel": 0 }
  }
}
```

`point` 可为 `null`，表示参数已经配置但尚无数据。

### `POST /api/v1/measurements/query`

查询一个站点内可时间对齐的审核数据表，不分页。必须在 `parameterGroupId` 与 `parameterDefinitionIds` 中二选一；所有最终字段必须属于同一站点参数组、同一种类且具有相同上报周期。

```json
{
  "stationId": "1",
  "parameterGroupId": "10",
  "parameterDefinitionIds": null,
  "from": "2026-07-01T00:00:00",
  "to": "2026-07-02T00:00:00",
  "granularity": "Raw"
}
```

`granularity`：`Raw` 原始点、`Hour` 时均值、`Day` 日均值、`Month` 月均值。

响应为 `{ stationId, stationName, parameterGroupId, parameterGroupName, reportIntervalMinutes, granularity, columns, rows }`：

- `columns`：列定义，含 `parameterDefinitionId`、`code`、`name`、`unit`、`decimalPlaces`、`kind`。
- `rows[].time`：原始业务时间或聚合桶起始时间。
- `rows[].values`：以参数 `code` 为键；无该时间点的数据为 `null`。
- 单元格字段为 `pointId`（聚合时为 `null`）、`valueText`、`numericValue`、`receivedAt`、自动审核状态、人工审核状态和 `sampleCount`。
- 此接口用于审核表格；前端可通过原始粒度单元格的 `pointId` 调用人工审核或有效值修正接口。

### `POST /api/v1/measurements/series`

查询历史曲线或运动轨迹的紧凑数值序列。请求体与 `/measurements/query` 完全相同，但仅允许数值参数（`Decimal`、`Integer`、`Longitude`、`Latitude`），不返回点 ID、接收时间、审核状态、值文本或 metrics JSON。

响应：`{ stationId, stationName, parameterGroupId, parameterGroupName, reportIntervalMinutes, granularity, columns, rows }`。

- `columns` 只出现一次，字段为 `parameterDefinitionId`、`code`、`name`、`unit`、`decimalPlaces`、`dataType`。
- `rows` 是紧凑数组；第 0 项为时间，后续第 N 项与 `columns[N-1]` 对齐，缺失值为 `null`。
- 单参数曲线行示例：`["2026-07-14T09:00:00", 1.25]`。
- 经纬度轨迹行示例：`["2026-07-14T09:00:00", 114.3012, 30.5123]`。

轨迹应将经度和纬度配置为两个独立参数（数据类型分别为 `Longitude`、`Latitude`），并绑定到同一个参数组且使用相同上报周期。若坐标只是其他参数 `metrics` JSON 内的附属字段而没有独立参数绑定，本接口不会返回该 JSON；应调整入库映射为独立经纬度参数。

### `POST /api/v1/exports`

请求体与 `/measurements/query` 相同，另可传 `fileName`。最长查询/导出范围为一个月；服务先在 `ExportFiles:RootDirectory` 生成 Excel，再以 `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` 下载响应返回。前端以文件流下载并读取 `Content-Disposition` 文件名即可。

```json
{
  "stationId": "1",
  "parameterGroupId": "10",
  "from": "2026-07-01T00:00:00",
  "to": "2026-07-02T00:00:00",
  "granularity": "Day",
  "fileName": "buoy-01-water-quality"
}
```

### `GET /api/v1/data-rates`

计算每个参数独立的获取率和有效率。参数组只用于展开多个参数，返回仍是一组逐参数结果。

查询参数：

| 参数                      | 必填   | 说明                                                                                                              |
| ------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------- |
| `mn`                      | 是     | 站点 MN。                                                                                                         |
| `from`、`to`              | 是     | 统计区间。                                                                                                        |
| `parameterCode`           | 二选一 | 单个协议参数编码；可加 `parameterKind=Monitoring` 或 `System` 消除歧义。                                          |
| `parameterGroupId`        | 二选一 | 自动展开该站点参数组中的全部参数。                                                                                |
| `validAutoReviewStatuses` | 否     | 可重复传入，例如 `?validAutoReviewStatuses=Passed&validAutoReviewStatuses=NoRule`。不传时只有 `Passed` 计为有效。 |

每项响应：`{ parameter, expectedCount, receivedCount, validCount, missingCount, duplicateCount, acquisitionRate, validityRate }`。

- `acquisitionRate = receivedCount / expectedCount`。
- `validityRate = validCount / expectedCount`，缺失数据不会被忽略。
- 分母为 0 时比例为 `null`。

## 4. 人工审核和有效值修正

### `PUT /api/v1/measurement-points/{pointId}/reviews/{level}`

提交单点人工审核。`level` 为 1、2 或 3，必须按级别顺序；高等级已经存在时不能被低等级覆盖。

```json
{ "status": "Valid", "reviewer": "张三", "comment": "现场核对通过" }
```

`status` 可为：`Valid`、`Invalid`、`Fault`、`Suspect`、`AboveUpperLimit`、`BelowLowerLimit`。返回 `{ pointId, currentLevel, currentStatus }`。

### `DELETE /api/v1/measurement-points/{pointId}/reviews/{level}?operatorName=张三`

撤销指定级别及所有更高级别审核，返回同上。

### `PUT /api/v1/measurement-points/{pointId}/effective-value`

只修正当前有效主值，不重新自动审核，也不触发其他连带操作。

```json
{ "effectiveValueText": "1.26" }
```

返回 `{ pointId, effectiveValueText, effectiveNumericValue }`。

### `GET /api/v1/manual-reviews/progress`

查询人工审核完成率。参数：`from`、`to`（必填），`stationId`、`parameterCode`、`parameterGroupId`（可选），`granularity=Day|Month`（默认 `Day`），`manualStatuses`（可重复传入，用于限定当前人工结论）。

返回总计和 `buckets`：每个对象均含 `totalCount`、`level1Completed`、`level2Completed`、`level3Completed`、对应 `level*Rate`，以及 `unreviewedCount`、`level1OnlyCount`、`level2Count`、`level3Count`。

## 5. 站点、参数与审核规则配置

以下配置接口均为 JSON；创建/更新成功会返回对应当前模型，删除为 `204`。页面可按“目录分组 → 参数定义 → 站点 → 参数组 → 参数绑定 → 审核规则绑定”的顺序维护。

### 5.1 站点

| 方法与路径                     | 用途           | 请求/查询字段                                                                            |
| ------------------------------ | -------------- | ---------------------------------------------------------------------------------------- |
| `GET /api/v1/stations`         | 分页查询站点   | `keyword`、`groupName`、`status`、`pageNumber`（默认1）、`pageSize`（默认50，最大200）。 |
| `GET /api/v1/stations/{mn}`    | 获取站点       | `mn` 为站点协议标识。                                                                    |
| `POST /api/v1/stations`        | 创建站点       | 下方 `SaveStation`，创建时必须给 `mn`。                                                  |
| `PUT /api/v1/stations/{mn}`    | 修改站点       | 下方 `SaveStation`，请求体中的 `mn` 被忽略。                                             |
| `DELETE /api/v1/stations/{mn}` | 删除无引用站点 | 有历史数据或配置引用时返回 `409`。                                                       |

`SaveStation`：

```json
{
  "mn": "BUOY-01",
  "name": "1号浮标",
  "groupName": "东湖",
  "longitude": 114.3,
  "latitude": 30.5,
  "status": "Active",
  "address": "东湖水域",
  "metadataJson": "{}"
}
```

`status`：`Disabled`、`Active`、`Maintenance`、`Offline`。查询返回 `PageResult`：`{ items, total, pageNumber, pageSize }`；站点模型额外包含 `id`、`lastSeenAt`。

### 5.2 参数目录与参数定义

| 方法与路径                                             | 用途                                                         |
| ------------------------------------------------------ | ------------------------------------------------------------ |
| `GET/POST /api/v1/parameter-catalog-groups`            | 查询/创建参数目录分组。                                      |
| `GET/PUT/DELETE /api/v1/parameter-catalog-groups/{id}` | 获取、修改、删除分组。                                       |
| `GET /api/v1/parameter-definitions`                    | 分页查询参数定义，参数 `keyword`、`pageNumber`、`pageSize`。 |
| `GET/PUT/DELETE /api/v1/parameter-definitions/{id}`    | 获取、修改、删除定义。                                       |
| `POST /api/v1/parameter-definitions`                   | 创建参数定义。                                               |

目录分组请求：`{ parentId, name, parameterKind, sortOrder }`。

参数定义请求：

```json
{
  "code": "060",
  "name": "水温",
  "parameterKind": "Monitoring",
  "catalogGroupId": "1",
  "dataType": "Decimal",
  "unit": "℃",
  "decimalPlaces": 2,
  "primaryMetricSuffix": "Rtd",
  "sortOrder": 1,
  "description": "水温实时值"
}
```

`parameterKind`：`Monitoring`、`System`。`dataType`：`Decimal`、`Integer`、`Boolean`、`String`、`DateTime`、`Longitude`、`Latitude`、`Enum`。

### 5.3 站点参数组、参数绑定与维护期

| 方法与路径                                                  | 用途                      |
| ----------------------------------------------------------- | ------------------------- |
| `GET/POST /api/v1/stations/{mn}/parameter-groups`           | 查询/创建该站点参数组。   |
| `PUT/DELETE /api/v1/stations/{mn}/parameter-groups/{id}`    | 修改/删除组。             |
| `GET/POST /api/v1/stations/{mn}/parameter-bindings`         | 查询/创建该站点参数绑定。 |
| `PUT/DELETE /api/v1/stations/{mn}/parameter-bindings/{id}`  | 修改/删除绑定。           |
| `GET/POST /api/v1/stations/{mn}/maintenance-periods`        | 查询/创建维护期。         |
| `PUT/DELETE /api/v1/stations/{mn}/maintenance-periods/{id}` | 修改/删除维护期。         |

参数组请求：`{ name, groupKind, reportIntervalMinutes, sortOrder }`。

参数绑定请求：`{ parameterDefinitionId, stationParameterGroupId, displayNameOverride, unitOverride, decimalPlacesOverride, sortOrder }`。

维护期请求：

```json
{
  "maintenanceType": "Routine",
  "startAt": "2026-07-14T00:00:00",
  "endAt": "2026-07-15T00:00:00",
  "reason": "例行维护"
}
```

`maintenanceType`：`AnnualOverhaul`、`Emergency`、`Routine`、`Other`。

### 5.4 自动审核规则与站点绑定

| 方法与路径                                        | 用途                             |
| ------------------------------------------------- | -------------------------------- |
| `GET/POST /api/v1/review-rules`                   | 查询/创建全局规则定义。          |
| `GET/PUT /api/v1/review-rules/{id}`               | 获取/修改规则定义。              |
| `GET /api/v1/review-rule-bindings?stationId={id}` | 查询规则绑定；`stationId` 可选。 |
| `POST /api/v1/review-rule-bindings`               | 创建站点规则绑定。               |
| `PUT/DELETE /api/v1/review-rule-bindings/{id}`    | 修改/删除绑定。                  |

规则定义请求：

```json
{
  "code": "water-temperature-range",
  "name": "水温范围",
  "implementationKey": "Range",
  "parameterDefinitionId": "101",
  "defaultConfigJson": "{\"minimum\":0,\"maximum\":40}",
  "configSchemaJson": "{\"type\":\"object\"}",
  "description": "超出范围自动审核失败"
}
```

规则绑定请求：`{ ruleDefinitionId, stationId, configOverrideJson, priority }`。`configOverrideJson` 未设置时传 `{}`。

## 6. TCP 网关管理、文件透传与实时桥接

### `GET /api/v1/tcp-servers`

一次返回当前全部监听 Server 以及各自在线客户端，供调试页面和前端管理页直接渲染。Server 字段包括 `name`、`source`（`Configuration` 或 `Database`）、`listenAddress`、`port`、`state`、`clientCount`、`clients` 等；客户端包括 `clientId`、`defaultClientId`、`isRegistered`、远端地址/端口、连接时间、收发字节数和当前前端桥接数。

### `POST /api/v1/tcp-servers`

创建并持久化数据库来源的监听服务，立即尝试启动：

```json
{
  "name": "water-quality-backup",
  "listenAddress": "0.0.0.0",
  "port": 9102,
  "allowMultipleFrontendConnections": false,
  "description": "水质设备备用端口"
}
```

`name` 长度 1–100，`port` 为 1–65535。返回完整 Server 快照。名称或监听地址端口冲突返回 `409`。

### `DELETE /api/v1/tcp-servers/{serverName}`

停止并删除数据库来源的监听服务。配置文件来源的服务不可通过 API 删除，返回 `409`。

### `POST /api/v1/tcp-servers/{serverName}/clients/{clientId}/file`

将 HTTP 请求体原样流式转发给指定在线 TCP 客户端，不保存本地文件、不做 UTF-8 转换、不追加 CRLF。

- 请求 `Content-Type` 必须为 `application/octet-stream`。
- 直接上传二进制请求体。
- 客户端不存在或已离线：`404`；超出大小：`413`；超时：`408`。
- 返回：`{ serverName, clientId, transferredBytes }`。

### `GET /ws/tcp-bridge`（WebSocket）

前端与一个在线 TCP 客户端建立原始双向二进制桥接。连接地址示例：

```text
wss://host/ws/tcp-bridge?serverName=water-quality-primary&clientId=MN001
```

- 建连时必须且只能声明子协议：`ecocenter.tcp-bridge`。
- `serverName` 与 `clientId` 必须各出现一次并进行 URL 编码。
- 只接受和发送二进制 WebSocket 消息；TCP → 前端按 TCP 已接收 CRLF 包逐包发送。
- 前端 → TCP 的字节完全原样透传，不追加 CRLF。
- 目标不存在/离线时 HTTP 升级前返回 `404`。若该 Server 不允许多个前端桥接且已有桥接，返回 `409`。

浏览器示例：

```js
const socket = new WebSocket(
  `wss://${location.host}/ws/tcp-bridge?serverName=${encodeURIComponent(serverName)}&clientId=${encodeURIComponent(clientId)}`,
  "ecocenter.tcp-bridge"
)
socket.binaryType = "arraybuffer"
socket.onmessage = event => renderBytes(new Uint8Array(event.data))
socket.send(new Uint8Array([0x01, 0x02]).buffer)
```

## 7. 运维与调试入口

| 路径                                     | 说明                                                                                          |
| ---------------------------------------- | --------------------------------------------------------------------------------------------- |
| `GET /health/live`                       | 进程存活检查，不依赖数据库。                                                                  |
| `GET /health/ready`                      | 就绪检查，验证数据库结构及本地导出目录可用性。                                                |
| `GET /tcp-gateway`                       | TCP 网关调试页面；启用时受 `TcpGateway:DebugUi:BasicAuthentication` 的 HTTP Basic Auth 保护。 |
| `GET /docs`（仅 Development）            | Scalar OpenAPI 页面。                                                                         |
| `GET /openapi/v1.json`（仅 Development） | 可供代码生成或前端工具读取的 OpenAPI JSON。                                                   |

## 8. 前端页面实现建议

1. 初始化先加载站点、参数目录、参数定义和站点参数组；参数绑定页面依赖前四者。
2. 趋势和导出页面优先让用户选择参数组；只有特殊场景才选择多个参数定义 ID，前端应提示它们必须属于同一参数组和相同上报周期。
3. HJ212 HTTP 调试页面收到 `Pending` 后应展示 `receivedPackageCount / expectedPackageCount`，继续发送其他 `PNO`；不要把 `Pending` 当失败重试。
4. TCP 管理页定时调用 `GET /tcp-servers` 刷新快照；点击连接客户端前，先从该快照确认对应 `clientId` 存在。
5. WebSocket 关闭或收到异常后，重新拉取 TCP 快照再决定是否允许用户重连，避免对离线客户端盲目重试。
