# 生产排障观测

`core:observability` 提供轻量生产排障与最小 HTTP 指标底座。它随 `buck-starter-application` 默认装配，**不**替代审计、产品使用事件、完整 APM、日志中心或告警平台。

本文档固定 **本版本交付 / 明确不交付** 四类能力边界（#327 / ledger #161）。

## 本版本交付矩阵

| 能力 | 本版本状态 | 交付内容 | 明确不交付 |
| --- | --- | --- | --- |
| **链路（请求关联）** | **交付（进程内 HTTP）** | 请求级 `traceId` 解析/生成、MDC `traceId`、响应头回传、请求完成日志 | 跨服务分布式 Trace/Span、OpenTelemetry 绑定、异步任务默认传播 SPI |
| **指标** | **交付（可选注册表）** | 稳定 HTTP 计数与耗时指标（见下）；存在 `MeterRegistry` 时写入 | 强制 Actuator、固定 Prometheus 端口、业务自定义指标 SPI、按 path 高基数标签 |
| **日志采集** | **交付（约定）** | 完成日志字段白名单、脱敏禁项、与 usage-event/audit 分流、Logback pattern | 日志中心、采集 agent、ELK/Loki 绑定 |
| **告警** | **不交付** | 仅文档声明非目标 | 告警规则引擎、路由、值班、降噪 |

产品化评分：无跨服务链路、无告警、指标依赖上层装配 `MeterRegistry` 时，**可观测性维度保持 partial**。

## 1. 链路（进程内 HTTP）

### API / 协议

- 过滤器：`BrickObservabilityFilter`（最高优先级附近）
- 读取：`BrickTraceContext.currentTraceId()` / MDC key `traceId`
- 请求属性：`BrickTraceContext.REQUEST_ATTRIBUTE`
- 响应头默认：`trace-id`
- 请求头候选（默认）：`trace-id`、`traceId`、`x-trace-id`

### 配置

```properties
# 默认已启用；仅需关闭或扩展请求头兼容时再写配置
# brick.observability.enabled=false
# brick.observability.request-header-names[0]=x-request-id
```

### 上层接入

1. 使用 `buck-starter-application`（默认装配）。
2. 网关/前端需要透传时，在入站请求带上允许的 trace 头。
3. 业务日志需要关联时调用 `BrickTraceContext.currentTraceId()`，**禁止**自建 TraceIdFilter。

### 非目标

- 跨 JVM / 跨服务 span 传播
- 消息队列 / 定时任务默认 trace 上下文
- Vendor APM agent 配置

## 2. 指标（最小 HTTP）

### 稳定 metric 名（白名单）

| 名称 | 类型 | 标签（仅此三种） | 含义 |
| --- | --- | --- | --- |
| `brick.http.server.requests` | Counter | `method`, `status`, `outcome` | HTTP 请求次数 |
| `brick.http.server.request.duration` | Timer | `method`, `status`, `outcome` | HTTP 请求耗时 |

- `method`：规范化 HTTP 方法（非法值 → `UNKNOWN`）
- `status`：HTTP 状态码数字字符串
- `outcome`：`SUCCESS` / `CLIENT_ERROR` / `SERVER_ERROR` / `UNKNOWN`

**禁止标签**：path、uri、userId、token、query、header 值、业务主键。

实现类：`BrickHttpServerMetrics`；由 `BrickObservabilityFilter` 在请求结束时写入。

### 配置

```properties
brick.observability.metrics-enabled=true
```

- `true` 且容器中存在 `MeterRegistry` bean → 记录指标
- 无 `MeterRegistry` → 静默跳过（不强制 actuator）
- `false` → 永不记录

### 上层接入与抓取

1. 应用引入 Micrometer 注册表（示例，非强制）：

```gradle
implementation 'org.springframework.boot:spring-boot-starter-actuator'
implementation 'io.micrometer:micrometer-registry-prometheus'
```

2. 暴露端点（由业务/部署配置，不由 Buck 固定端口策略）：

```properties
management.endpoints.web.exposure.include=prometheus,health,info
```

3. 抓取 `brick.http.server.requests` / `brick.http.server.request.duration`。

可重复验证：`./gradlew :core:observability:test`（`SimpleMeterRegistry` 断言计数与无 path/token 标签）。

### 非目标

- Buck 内置 `/actuator` 安全策略（仍由业务授权配置）
- 业务域指标 SPI、Dashboard as code
- 用 path 做维度

## 3. 日志采集（约定）

### 请求完成日志字段（白名单）

`method`、`path`、`status`、`durationMs`、`traceId`。

### 脱敏与禁止

不记录：request/response body、token、密码、密钥、连接串、表单、附件、业务对象明文、`Authorization` 头。

### 与其它通道分流

| 通道 | 用途 | 格式 |
| --- | --- | --- |
| 主排障日志 | 运行、异常、请求完成 | pattern 含 `%X{traceId}` |
| usage-event | 产品使用 | `io.github.wu9007.buck.usage` JSON line，独立文件 |
| audit | 合规审计 | `core:audit` / `modules:audit`，非 Logback 拼装 |

Logback 模板：`templates/backend-minimal/src/main/resources/logback-spring.xml`。

## 4. 告警（本版本不交付）

- 不提供告警规则 DSL、通知渠道、值班路由或降噪策略。
- 上层可用外部 Prometheus Alertmanager / 云监控对接 **第 2 节指标**；Buck 不绑定厂商。
- 后续若产品化告警最小集，另开 issue，不得在业务仓库自造平行 observability 告警子系统冒充框架能力。

## 职责边界（总览）

- 负责：进程内 HTTP traceId 链、可选 HTTP 指标、完成日志与脱敏约定。
- 不负责：审计事实、usage-event 语义、分布式追踪平台、日志中心、告警中心。
- 不新增平台端、多租户或 vendor APM 唯一绑定。

## 禁止项

- 不自建 `TraceIdFilter`、`RequestLoggingFilter`、body logger 或本地 observability 子系统。
- 不把 path/token 打进 Buck 稳定 HTTP 指标标签。
- 不把 usage-event、审计与主排障日志混成一个协议。
- 不把“未交付的告警/跨服务链路”写成已实现能力。
