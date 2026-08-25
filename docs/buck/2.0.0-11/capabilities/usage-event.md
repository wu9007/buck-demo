# 使用事件采集

`core:usage-event` 面向产品使用分析，提供统一事件模型、前端模块级 tracker、可选后端采集入口和结构化 JSON line 日志输出。它默认关闭。浏览器端默认通过 `core:client-meta` 读取后端权威配置，不再由业务壳重复维护开关。Logback / 前后端代码片段见 [usage-event-examples.md](usage-event-examples.md)。

## 职责边界

- 负责：`BrickUsageEvent`、`BrickUsageEvents`、`BrickUsageEventPublisher`、`BrickUsageEventSink`、默认 `LoggingBrickUsageEventSink`、`/brick/usage-events/collect`、`BrickClientMetaContributor` 公开片段、`createModuleUsageTracker()` 和 `@wildbuck/core-usage-event-frontend`。
- 不负责：落库、查询、报表、看板、队列、ELK、ClickHouse、Kafka、Prometheus 或第三方分析平台绑定。
- 不替代：`core:observability` 的生产排障日志，也不替代 `core:audit` / `modules:audit` 的合规审计。
- 不新增平台端、租户或多租户逻辑。

## 配置

```properties
brick.usage-event.enabled=false
```

`enabled=false` 时 publisher 为 no-op，collect 入口返回 404；`enabled=true` 后写入结构化日志 sink，并固定暴露 `POST /brick/usage-events/collect`。浏览器端通过 `client-meta` 读取权威开关，不要在业务壳重复维护平行开关。

## 日志格式

- logger：`io.github.wu9007.buck.usage`
- marker：`BRICK_USAGE_EVENT`
- format：JSON line，一行一个事件

`LoggingBrickUsageEventSink` 只向该 logger 写 marker 为 `BRICK_USAGE_EVENT` 的 JSON line；最终输出到控制台、主日志还是独立文件取决于宿主日志配置。`core:usage-event` 不内置分析平台绑定。

必备字段：`schemaVersion`、`eventId`、`occurredAt`、`eventType`、`appCode`、`moduleCode`、`featureCode`、`pageCode`、`actionCode`、`result`、`traceId`。
可选字段：`durationMs`、`routeName`、`subjectHash`、`roleCodes`。

独立落文件、marker 分流和本地 `rg`/`grep` 验证见 [usage-event-examples.md](usage-event-examples.md)。无论是否单独落文件，业务应用都不要手写另一套 JSON line 格式、埋点 endpoint 或本地 usage-event logger 名称。

## 敏感字段

使用事件只接受字段白名单，不提供任意 `metadata`、`properties` 或 `context`。业务应用不得采集姓名、手机号、身份证号、token、密码、密钥、请求体、表单内容、附件内容或业务对象明文。前端 helper 会在发送前拒绝未知字段；后端 collect 入口也会拒绝白名单之外的字段。关联主体只提交不可逆的 `subjectHash`（例如 `sha256:<hex>`），不要提交主体明文。

## collect 接口边界

`POST /brick/usage-events/collect` 只在 `brick.usage-event.enabled=true` 时暴露。该接口默认复用业务应用的认证、鉴权、网关和传输安全链路；在 `core:authorization` 存在时，Buck 会显式注册 authenticated 访问规则。它不是匿名开放的日志采集入口，也不是第三方分析平台入口。

业务应用不要用 `@AnonymousAccess`、业务私有 `BrickAuthorizationRule.anonymous(...)` 或网关白名单把 collect 接口默认放开。当前版本不提供匿名采集语义。payload 大小由宿主 Web 容器、反向代理或网关限制承担。若宿主启用 `core:transport`，应按受保护 URL 策略保护 collect endpoint。前端 helper 对 collect 返回 `400`、`401`、`403`、`413` 或网络错误保持 fail-open：业务页面主流程不应被埋点失败阻断。

## 事件命名

业务模块和上层应用必须使用稳定 code 维度，不能把显示文案、表单值、对象名称或用户输入拼进事件 code。

| 字段 | 规则 |
| --- | --- |
| `eventId` | 非空字符串，最长 128 字符。 |
| `eventType` | `PAGE_VIEW`、`FEATURE_ENTER`、`ACTION`。 |
| `appCode` | 小写 kebab-case，最长 64，例如 `business-app`。 |
| `moduleCode` | 与正式模块边界一致，小写 kebab-case，最长 64。 |
| `featureCode` | 与 feature registry / 功能点一致，小写 kebab-case，最长 64。 |
| `pageCode` | 与页面语义一致，默认 `<featureCode>-page`。 |
| `actionCode` | 优先 `view`、`enter`、`search`、`open-detail`、`open-config`、`create`、`update`、`save`、`enable`、`disable`、`authorize`、`rotate-secret`、`force-offline`、`export`、`cancel`、`abandon`。 |
| `result` | `SUCCESS`、`FAILURE`、`CANCELLED`、`ABANDONED`。 |
| `traceId` | 非空，最长 128；前端可省略，collect 优先用当前请求 traceId。 |
| `routeName` | 可选，小写字母数字点号短横线，最长 128。 |
| `subjectHash` | 可选，只允许不可逆摘要，不得提交账号/姓名/手机号明文。 |
| `roleCodes` | 可选，最多 32 项；单项最长 64。 |

页面和抽屉进入优先由 `@wildbuck/core-usage-event-frontend` 采集。模块页面优先通过 `createModuleUsageTracker(moduleCode, matrix)` 绑定稳定事件矩阵，再使用 `trackPage`、`trackOpen`、`trackAction` 和 `trackActionResult`。`trackAction` 执行业务 async 函数并按成功/异常发布 `ACTION/SUCCESS` 或 `ACTION/FAILURE`。页面仍负责 toast、表单和错误文案，不再创建模块本地 success/failure wrapper。只有后端才能可靠判断结果、或动作不经前端时，才用 `BrickUsageEvents` + `BrickUsageEventPublisher`。前端和后端不能为同一个用户动作重复发布同一语义事件。

## 模块事件矩阵

下表是正式模块首版矩阵基线。模块接入时可以补充更细功能点，但不得改变已有 code 的语义，也不得采集禁止字段。没有对应动作时不要为了满足矩阵新造空 UI。

| `moduleCode` | `featureCode` | `pageCode` | 事件 | `eventType` | `actionCode` | `result` | 禁止采集补充 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `iam` | `employee` | `employee-page` | 员工列表进入 | `PAGE_VIEW` | `view` | `SUCCESS` | 员工姓名、手机号、身份证号、头像内容、表单内容 |
| `iam` | `employee` | `employee-page` | 员工查询 | `ACTION` | `search` | `SUCCESS` / `FAILURE` | 查询关键字明文、筛选输入原文 |
| `iam` | `employee` | `employee-page` | 员工新增、编辑、启用、停用 | `ACTION` | `create` / `update` / `enable` / `disable` | `SUCCESS` / `FAILURE` | 员工资料明文、表单内容 |
| `iam` | `organization` | `organization-page` | 组织列表进入和查询 | `PAGE_VIEW` / `ACTION` | `view` / `search` | `SUCCESS` / `FAILURE` | 组织名称输入原文、表单内容 |
| `iam` | `organization` | `organization-page` | 组织新增、编辑、启用、停用 | `ACTION` | `create` / `update` / `enable` / `disable` | `SUCCESS` / `FAILURE` | 组织对象明文 |
| `iam` | `role` | `role-page` | 角色列表进入和查询 | `PAGE_VIEW` / `ACTION` | `view` / `search` | `SUCCESS` / `FAILURE` | 角色名称输入原文 |
| `iam` | `role-authorization` | `role-authorization-page` | 角色授权进入和保存 | `FEATURE_ENTER` / `ACTION` | `enter` / `authorize` | `SUCCESS` / `FAILURE` | 权限明细对象、菜单树对象 |
| `iam` | `menu` | `menu-page` | 菜单列表进入、查询和维护 | `PAGE_VIEW` / `ACTION` | `view` / `search` / `create` / `update` / `enable` / `disable` | `SUCCESS` / `FAILURE` | 菜单对象明文、表单内容 |
| `iam` | `session` | `session-page` | 会话列表进入、查询和强制下线 | `PAGE_VIEW` / `ACTION` | `view` / `search` / `force-offline` | `SUCCESS` / `FAILURE` | token、主体姓名、手机号、会话明文 |
| `security-setting` | `password-policy` | `password-policy-page` | 密码策略页进入、打开配置、保存 | `PAGE_VIEW` / `FEATURE_ENTER` / `ACTION` | `view` / `open-config` / `save` | `SUCCESS` / `FAILURE` | 密码规则具体值、弱口令内容、表单内容 |
| `security-setting` | `login-security` | `login-security-page` | 登录安全页进入、打开配置、保存 | `PAGE_VIEW` / `FEATURE_ENTER` / `ACTION` | `view` / `open-config` / `save` | `SUCCESS` / `FAILURE` | 登录策略对象明文、表单内容 |
| `security-setting` | `transport-security` | `transport-security-page` | 传输安全页进入、查看配置、保存 | `PAGE_VIEW` / `FEATURE_ENTER` / `ACTION` | `view` / `open-detail` / `save` | `SUCCESS` / `FAILURE` | 密钥、token、传输配置对象明文 |
| `security-setting` | `mfa-policy` | `mfa-policy-page` | MFA 策略进入和保存 | `PAGE_VIEW` / `ACTION` | `view` / `save` | `SUCCESS` / `FAILURE` | MFA 策略表单内容 |
| `application-center` | `application` | `application-page` | 应用列表进入、查询、新增、编辑、启停 | `PAGE_VIEW` / `ACTION` | `view` / `search` / `create` / `update` / `enable` / `disable` | `SUCCESS` / `FAILURE` | 应用对象明文、表单内容 |
| `application-center` | `client` | `client-page` | 客户端列表进入、查询、新增、编辑、启停 | `PAGE_VIEW` / `ACTION` | `view` / `search` / `create` / `update` / `enable` / `disable` | `SUCCESS` / `FAILURE` | client secret、redirect uri 输入原文、表单内容 |
| `application-center` | `secret` | `client-page` | secret 查看入口和轮转 | `FEATURE_ENTER` / `ACTION` | `open-detail` / `rotate-secret` | `SUCCESS` / `FAILURE` | secret 值、密钥、token |
| `application-center` | `scope` | `scope-page` | OAuth/OpenAPI scope 授权进入和保存 | `FEATURE_ENTER` / `ACTION` | `enter` / `authorize` | `SUCCESS` / `FAILURE` | 授权明细对象、scope 列表明文 |
| `notification-setting` | `email-smtp` | `email-smtp-page` | EMAIL/SMTP 配置页进入、查看、保存 | `PAGE_VIEW` / `FEATURE_ENTER` / `ACTION` | `view` / `open-config` / `save` | `SUCCESS` / `FAILURE` | SMTP 密码、token、密钥、收件人、邮件正文、provider 配置对象明文 |
| `notification-setting` | `email-smtp` | `email-smtp-page` | 测试发送入口和结果 | `FEATURE_ENTER` / `ACTION` | `enter` / `save` | `SUCCESS` / `FAILURE` | 收件人、邮件正文、错误响应明文 |
| `audit` | `audit-log` | `audit-log-page` | 审计日志列表进入和查询 | `PAGE_VIEW` / `ACTION` | `view` / `search` | `SUCCESS` / `FAILURE` | 审计日志正文、请求体、响应体、筛选输入原文 |
| `audit` | `audit-detail` | `audit-detail-page` | 审计日志详情打开 | `FEATURE_ENTER` | `open-detail` | `SUCCESS` | 审计详情内容、主体姓名、手机号、业务对象明文 |
| `audit` | `audit-log` | `audit-log-page` | 审计日志导出入口 | `ACTION` | `export` | `SUCCESS` / `FAILURE` | 导出内容、查询条件明文 |

## 前端使用

正常业务接入优先从 `client-meta` bootstrap。后端 `brick.usage-event.enabled` 是权威源；当前端无法读取或校验 `client-meta` 时，helper 使用安全默认值保持 disabled。业务模块优先维护事件矩阵并创建模块级 tracker，页面不要直接拼 `moduleCode`、`featureCode`、`pageCode` 和成功/失败 payload。`configureUsageEvents(...)` 仅用于测试、迁移或特殊部署覆盖。发送失败默认不抛出。完整 tracker 片段见 [usage-event-examples.md](usage-event-examples.md)。
