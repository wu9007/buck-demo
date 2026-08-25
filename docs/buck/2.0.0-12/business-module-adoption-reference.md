# 业务模块采用参考

本文档面向业务开发组和业务开发智能体，说明 Buck 已发布 core/module 的作用、采用方式、扩展点、注解和配置项。它不是框架内部实现说明，只记录上层业务应用可以依赖的稳定表面。

## 后端依赖速查

| 能力 | Maven 坐标 |
| --- | --- |
| BOM | `io.github.wu9007:buck-bom:<version>` |
| 应用 starter | `io.github.wu9007:buck-starter-application` |
| IAM 模块 | `io.github.wu9007:buck-module-iam-backend` |
| 通知配置模块 | `io.github.wu9007:buck-module-notification-setting-backend` |
| 安全设置模块 | `io.github.wu9007:buck-module-security-setting-backend` |
| 审计模块 | `io.github.wu9007:buck-module-audit-backend` |
| 应用中心模块 | `io.github.wu9007:buck-module-application-center-backend` |
| AI 助手模块 | `io.github.wu9007:buck-module-ai-assistant-backend`（`released-candidate`） |
| 登录品牌模块 | `io.github.wu9007:buck-module-login-brand-backend`（`released-candidate`） |
| 身份联邦模块 | `io.github.wu9007:buck-module-identity-federation-backend`（`released-candidate`） |
| AI agent SPI | `io.github.wu9007:buck-core-ai-agent`，通常随 `modules:ai-assistant` 进入依赖图；只贡献工具且不装配助手模块时可按需单独引用 |
| MCP 服务端（外置 Agent 工具暴露） | `io.github.wu9007:buck-core-mcp`，**不**随 `buck-starter-application` 默认进入；需显式依赖，并启用 `brick.mcp.enabled=true` |
| 浏览器启动元数据 | `io.github.wu9007:buck-core-client-meta`，通过 `buck-starter-application` 默认进入依赖图 |
| Lombok | `org.projectlombok:lombok`，通过 `compileOnly` 和 `annotationProcessor` 引入，版本由 BOM 约束 |
| MapStruct | `org.mapstruct:mapstruct` 和 `org.mapstruct:mapstruct-processor`，processor 通过 `annotationProcessor` 引入，版本由 BOM 约束 |

## 前端包速查

| 包 | 作用 | 公开入口 |
| --- | --- | --- |
| `@wildbuck/core-api-frontend` | HTTP 客户端、错误类型、请求配置 | `.` |
| `@wildbuck/core-authentication-frontend` | 认证请求客户端、登录传输保护 | `.` |
| `@wildbuck/core-authorization-frontend` | 模块 route/permission/navigation 工具 | `.` |
| `@wildbuck/core-option-frontend` | 通过 `/brick/options/list` 加载 `BrickOptionProvider` 选项 | `.` |
| `@wildbuck/core-query-frontend` | 构造 `QueryCriteria` / `QueryFilter` / `QuerySorter` / `QueryPager` 前端 DSL | `.` |
| `@wildbuck/core-transport-frontend` | 请求摘要、传输 envelope | `.` |
| `@wildbuck/core-client-meta-frontend` | 读取 `/brick/client-meta` 并按 capability bootstrap Buck 前端运行时 | `.` |
| `@wildbuck/core-ui-frontend` | 控制台壳、菜单、顶部栏、头像下拉主题入口、主题切换和主题 token | `.`, `./shell`, `./theme`, `./theme.css` |
| `@wildbuck/module-iam-frontend` | IAM 页面、认证视图、当前主体和角色授权工作台 | `.`, `./auth-experience`, `./auth-state`, `./auth-view`, `./auth-workspace`, `./current-principal-workspace`, `./role-authorization-workspace`, `./page-registry` |
| `@wildbuck/module-notification-setting-frontend` | 通知配置页面和 route registry | `.`, `./page-registry`, `./i18n` |
| `@wildbuck/module-security-setting-frontend` | 安全配置页面、配置页样式和 route registry | `.`, `./page-registry`, `./settings-page.css` |
| `@wildbuck/module-audit-frontend` | 审计日志页面和 route registry | `.`, `./page-registry` |
| `@wildbuck/module-application-center-frontend` | 应用中心页面和 route registry | `.`, `./page-registry`, `./i18n` |
| `@wildbuck/module-ai-assistant-frontend` | AI 助手侧栏、控制台壳集成入口、会话页面和模块 route registry | `.`, `./assistant-panel`, `./shell-entry`, `./page-registry`, `./i18n` |
| `@wildbuck/module-login-brand-frontend` | 登录外观管理页与 route registry（`released-candidate`） | `.`, `./page-registry`, `./i18n` |
| `@wildbuck/module-identity-federation-frontend` | 身份源、同步中心、身份关联页（`released-candidate`） | `.`, `./page-registry`, `./i18n` |

只使用这些 `exports`。未列出的内部文件不是业务应用契约。

## 能力目录速查

发布资料包会随版本提供 `capabilities/capability-catalog.json` 和 `capabilities/README.md`。业务开发智能体写代码前先查这个 `BrickCapabilityCatalog`，再做能力命中判断和依赖选择。

目录中的关键字段：

- `modules[].frontend.packageName` / `exports`：模块前端包和公开入口，治理页面优先通过 `./page-registry` 装配。
- `modules[].permissions` / `menus` / `pages`：已发布权限、菜单和页面 route。
- `modules[].queryDefinitions.status` / `entries[].queryCodes`：静态可发现的 queryCode；`partial-static` 表示字段白名单、操作符、排序和分页上限仍由运行时 `BrickQueryDefinition` 校验。
- `modules[].optionProviders.status` / `entries[].code`：静态可发现的 optionCode；`partial-static` 表示选项值和扩展参数仍由运行时 `BrickOptionProvider` 提供。
- `coreFrontendPackages[].packageName` / `exports`：core 前端公开能力，例如 `@wildbuck/core-ui-frontend/patterns` 和 `@wildbuck/core-option-frontend`。
- `capabilityAdoption[]`：业务采用指南，把常见需求命中项映射到必须复用的 core、module 或 starter，并列出禁止自造的平行机制、场景化 `whenNot[]` 和资料入口。统一响应信封看 `core:api`，错误模型看 `core:error`，控制台壳看 `core:ui`。

如果业务需求命中 `capabilityAdoption[]` 或目录中已有权限、页面、queryCode、optionCode、frontend export，必须优先复用对应 Buck core/module/starter；缺口回流 `buck` Issues，不在业务仓库复制页面、静态选项数组或本地查询协议。

## Core 能力

| Core | 业务开发者应该怎么用 |
| --- | --- |
| `core:api` | 后端共享 `BrickPrincipal`、当前主体、数据源、会话、`BrickApiResponse` 和 `BrickDtoMapper` 等基础契约；前端使用 `configureHttp`、`request<T>`、`requestBlob`、`BrickHttpError`、`createBrickSessionErrorHandler()` 和 `isBrickSessionError()`，成功响应 envelope 由 `request<T>()` 解封，会话级错误由业务壳统一去重处理。 |
| `core:error` | 后端业务异常、默认异常响应和 `@BrickResponseResult` 响应包装。业务模块不要自己发明另一套错误或响应格式。 |
| `core:i18n` | 模块消息资源和 Spring messages 集成。 |
| `core:transport` | 请求摘要、传输信封、登录传输保护和 `TransportKeyWrapProvider` 扩展。 |
| `core:cipher` | 密码哈希、存储加密（v1 信封）、盲索引 HMAC、签名 provider 基础。业务敏感数据落库约定见发布资料包 / 架构文档 `capabilities/storage-encryption.md`。 |
| `core:datasource` | 数据源识别、多数据库模式和数据源注册。 |
| `core:orm-plus` | MyBatis-Plus、契约迁移、敏感字段（`@BrickSensitiveField` + typeHandler）、可查敏感盲索引列、签名字段、变更日志、关系映射和事务工具。 |
| `core:query` | 统一查询 DSL、查询能力定义、分页和排序执行；前端用 `@wildbuck/core-query-frontend` 构造 DSL，后端仍用 `BrickQueryDefinition` 兜底。 |
| `core:option` | 下拉、单选、多选、标签和枚举选项提供方；前端用 `@wildbuck/core-option-frontend` 调 `/brick/options/list`。 |
| `core:authorization` | Spring Security 鉴权链、授权规则、当前主体、JWT access/refresh token 和 token 撤销。 |
| `core:authentication` | 登录、验证码、MFA、登出、改密、登录安全策略和认证回调。 |
| `core:audit` | 审计事件模型、上下文、发布器和 sink SPI。 |
| `core:observability` | 生产排障 traceId、MDC、响应头回传和请求完成日志；通过 starter 默认装配。业务应用使用 release bundle 的 `templates/backend-minimal/src/main/resources/logback-spring.xml` 作为 Logback 基线，主日志 pattern 必须包含 `%X{traceId}`，不要继续使用历史 `%X{logRequestId}`。业务应用不要自建 `TraceIdFilter`、`RequestLoggingFilter` 或记录请求/响应体的本地日志子系统。 |
| `core:client-meta` | 浏览器启动公开运行时元数据聚合，暴露 `GET /brick/client-meta` 和 `BrickClientMetaContributor` SPI；通过 starter 默认装配。只返回公开能力开关、公开 schema 版本和公开 endpoint，不返回密钥、token、连接串、内部策略明文、请求体、表单内容或业务对象明文；不替代 `/transport/meta`。 |
| `core:usage-event` | 产品使用事件模型、后端语义构造器、publisher、字段白名单、可选 collect endpoint、前端模块级 tracker 和 JSON line 结构化日志输出；默认关闭。后端-only 动作使用 `BrickUsageEvents.action()` 构造事件，再通过 `BrickUsageEventPublisher` 显式发布；前端默认从 `client-meta` 自动 bootstrap，模块用 `createModuleUsageTracker()` 绑定事件矩阵，页面通过 `trackPage`、`trackOpen`、`trackAction(featureKey, actionCode, asyncFn)` 记录语义事件，动作结果已由页面流程确定时用 `trackActionResult(featureKey, actionCode, result)` 写入 `SUCCESS` / `FAILURE` / `CANCELLED` / `ABANDONED`，不重复写 payload 或 success/failure wrapper 分支。collect endpoint 复用业务认证、鉴权、网关和传输安全链路，不是匿名日志入口。事件命名和模块事件矩阵见发布资料包 `capabilities/usage-event.md`。业务应用不要自建平行埋点框架、日志格式或采集 endpoint，也不要前后端重复发布同一语义事件。 |
| `core:oauth2` | OAuth2 client / access scope 扩展原语。 |
| `core:openapi` | 机器访问、OpenAPI Scope 目录、scope 和访问日志扩展。 |
| `core:ai-agent` | Buck 自有 AI agent SPI，提供 `BrickAiModelProvider`、`BrickAiToolProvider`、`BrickAiToolExecutor`、工具执行策略和脱敏边界；不负责会话持久化、助手目录或业务工具实现。业务工具应调用本业务 service，不直接 JDBC、手写 SQL 或绕过正式权限。 |
| `core:mcp` | 外置 Agent 用的 MCP 服务端协议核（JSON-RPC `initialize` / `tools/*` / `resources/*` / `prompts/*`）。默认关闭；**不**装配控制台 AI 助手会话。推荐业务用 `BrickAiToolProvider` + `BrickAiToolExecutor` 贡献工具，classpath 有 `core:ai-agent` 时自动桥到 `/mcp`；也可实现 `BrickMcpToolProvider` 直贡献。生产必须 `allow-anonymous=false`。与 `modules:ai-assistant` 无官方集成路径。 |
| `core:module-contracts` | 模块 manifest、功能目录和模块元数据契约。 |
| `core:file-resource` | 文件资源引用、图片上传、内容读取和业务附件留存清理能力。 |

## 正式支持业务模块

| 模块标识 | 业务名称 |
| --- | --- |
| `modules:iam` | IAM |
| `modules:notification-setting` | 通知配置 |
| `modules:security-setting` | 安全设置 |
| `modules:audit` | 审计 |
| `modules:application-center` | 应用中心 |

## 已装配但未正式 released

生产默认等 `maturity: released`。试点须显式接受 `released-candidate` 风险。

| 模块标识 | 业务名称 |
| --- | --- |
| `modules:ai-assistant` | AI 助手（`released-candidate`） |
| `modules:login-brand` | 登录外观（`released-candidate`） |
| `modules:identity-federation` | 身份联邦（`released-candidate`） |

## 强制采用矩阵

业务开发智能体在实现前必须先做 Buck 能力命中判断。只要业务需求命中下表能力，就必须采用对应 core/module；如果决定不采用，必须在 `docs/business/module-adoption-decision.md` 写明不采用原因、替代方案、风险和待确认人，并等待业务负责人或架构负责人确认后才能实现。

`docs/business/module-adoption-decision.md` 不能只写一句“采用 Buck core/module”。至少要覆盖 IAM、通知配置、安全设置、审计、应用中心、`core:query`、`core:option`、`core:orm-plus` 的命中结论，并明确“命中/采用或不采用/原因或理由/确认人”。

能力命中后不能在业务仓库自造平行机制。业务侧发现 `core` 或正式模块能力不足时，必须向 `buck` Issues 提交中文问题，并把业务场景、缺口证据、期望能力、影响范围和建议归属模块写清楚；在框架侧明确给出新能力、扩展点或临时处置方案前，业务应用不得保留自建轮子。

`validation/security-console` 只证明 Buck 已发布能力能在业务应用形态下跑通，不是正式能力来源。不要复制验证壳中的调试 provider、临时 resolver、硬编码发码目标、本地配置兜底或其他“先跑通再说”的实现到业务仓库；当前主体联系方式、MFA 发码目标和通知通道路由都必须来自正式主数据与正式模块。

| 业务需求命中项 | 必须采用 | 禁止自造 |
| --- | --- | --- |
| 用户、员工、组织、岗位、角色、菜单、权限、权限分配、当前主体、在线会话、踢下线、账号解锁 | `modules:iam`、`core:authentication`、`core:authorization` | 自建 `UserController`、`RoleController`、`MenuController`、`PermissionController`、`SessionController` 或平行用户/角色/菜单表。 |
| 外部身份源、OAuth2/钉钉等联邦登录、通讯录同步、外部主体与本地员工关联 | `modules:identity-federation`（`released-candidate`）+ `modules:iam` 目录端口 + `core:oauth2`；登录入口白名单在 `modules:security-setting` | 把身份源/同步/关联写回 IAM；自建 OAuth 回调、同步中心或绑定表。生产默认等 `released`。 |
| 登录、登出、验证码、MFA、强制改密、初始密码、密码过期、管理员重置密码 | `core:authentication`，需要身份治理时同时采用 `modules:iam` | 自建登录 filter、本地 token 客户端、密码生命周期表或改密流程。 |
| 部署级产品品牌（系统名称、描述、Logo、背景、表单/品牌位置、按钮主色；**登录页 + 登录后壳侧栏/标签页/favicon**）、登录页展示业务应用版本 | `modules:login-brand`（管理端与库内配置，RC）、`core:client-meta`（`capabilities.loginBrand` + `appVersion`/`buildId`）、`@wildbuck/core-client-meta-frontend`（`resolveBrickShellBrand` / `applyBrickShellBrowserChrome`）、`@wildbuck/module-iam-frontend/auth-view`；版本号由业务 CI 写入 jar 身份，见 [business-ci-cd.md](business-ci-cd.md) | 整页重写登录并自造品牌配置表/平行 client-meta；业务壳 i18n 硬编码产品名/Logo；把版本号写进品牌表或要求业务手填 `application.properties`；把鉴权 `contentUrl` 当匿名 Logo；自造自由 CSS/像素布局注入。 |
| EMAIL/SMTP 提供方配置、邮件通道治理、发件人身份配置 | `modules:notification-setting`、`core:notification-mail` | 在业务仓库、验证壳或配置页里硬编码正式 SMTP provider、账号、发件地址或 provider 路由语义。 |
| 登录失败冻结、弱密码库、密码策略、MFA 策略、单点登录策略、设备校验策略、传输安全配置 | `modules:security-setting`、`core:authentication`、`core:transport` | 自建安全策略表、密码策略 controller、MFA 策略页面或传输安全配置页面。 |
| 审计日志落库、审计查询、审计详情、登录审计、安全审计、ORM 变更审计、业务动作审计查询页 | `core:audit`、`modules:audit` | 自建 `AuditLogEntity`、审计表、审计查询 controller 或审计页面。 |
| 生产排障 traceId、MDC、请求完成日志、响应头 `trace-id`、业务主日志 traceId pattern | `core:observability`；Logback 基线使用发布资料包 `templates/backend-minimal/src/main/resources/logback-spring.xml`，主日志保留 `%X{traceId}`，usage event 按 `io.github.wu9007.buck.usage` / `BRICK_USAGE_EVENT` 独立路由。 | 自建 `TraceIdFilter`、`RequestLoggingFilter`、请求/响应 body 日志、业务本地 observability 子系统；继续使用 `%X{logRequestId}`；把 usage event、审计事实和生产排障日志混成一个格式。 |
| 浏览器启动公开运行时元数据、Buck 前端能力开关、公开 endpoint bootstrap | `core:client-meta`、`@wildbuck/core-client-meta-frontend` | 自建平行 meta endpoint、配置中心或前端启动配置协议；通过 `client-meta` 返回 secret、token、password、credential、connection string、内部策略明文、请求体、表单内容或业务对象明文；用 `client-meta` 替代 `/transport/meta`。 |
| 产品使用事件、功能曝光/进入/动作完成/失败/放弃采集 | `core:usage-event`、`@wildbuck/core-usage-event-frontend`；前端默认从 `client-meta` bootstrap，模块级事件接入用 `createModuleUsageTracker()`，页面使用 `trackAction(featureKey, actionCode, asyncFn)` 或 `trackActionResult(featureKey, actionCode, result)` | 自建平行埋点框架、usage event endpoint、日志格式或本地 usage/event 子系统；匿名开放 `/brick/usage-events/collect`；重复维护 usage-event 前后端开关；在页面散落 payload 拼装或 success/failure wrapper 分支；采集姓名、手机号、身份证号、token、密码、密钥、请求体、表单内容、附件内容或业务对象明文。 |
| 头像、Logo、菜单图标、证照、人脸图片、调用记录图片、手写签名图或其他图片附件保存、引用、读取和到期清理 | `core:file-resource`、`@wildbuck/core-ui-frontend/fields`（图片用 `BrickImageUploadField`；手写签暂无正式 pad 组件，业务可自建画板但上传必须走 file-resource，业务表只存 resourceId） | 把图片/签名 Base64、大字段二进制或文件内容直接塞进业务列表/日志表；自建长期本地文件表、本地磁盘规则或平行资源引用协议；把 CA/UKey 国密签与手写签混成业务私有附件协议。 |
| 第三方应用、应用密钥、OAuth client、redirect uri、scope、OpenAPI Scope 目录、机器访问白名单 | 默认采用 `modules:application-center`、`core:oauth2`、`core:openapi`；如果业务已有组织接入功能点，先确认认证模型。OAuth2 `client_credentials` 通过业务组织接入模块实现 `BrickOAuth2ClientRegistrationResolver`、`BrickOAuth2ClientCredentialsAuthenticator`、`BrickOAuth2AccessScopeResolver` 提供 client、secret 和 scope。只有业务明确要求防重放/防篡改时，才额外实现 `OpenApiHmacIntegrityCredentialProvider` 提供签名密钥，通过 `OpenApiHmacIntegrityValidator` 做组织、场景和阈值等二次完整性校验；集群环境替换 `OpenApiHmacNonceStore`。多个 client 或签名密钥来源并存时必须保证 `clientId` 只命中一个 provider；重复命中是框架集成错误。 | 把应用接入塞进 IAM，或自建通用 HMAC Filter、签名 canonical 规则、防重放机制、scope 主校验和访问日志模型，或把 HMAC 当作 OAuth2 之外的直连认证。 |
| 业务 AI 助手、模型会话、助手侧栏、业务工具调用确认或工具执行 | `modules:ai-assistant`（`released-candidate`，生产默认等 `released`）、`core:ai-agent`、`@wildbuck/module-ai-assistant-frontend`。助手用 `BrickAiAssistantDefinitionProvider` 声明，工具用 `BrickAiToolProvider` 和 `BrickAiToolExecutor` 贡献，权限复用业务功能点权限；`ai-assistant:assistant:manage` 只用于助手配置治理。 | 不要在业务仓库创建通用 CRUD Agent、通用数据库 Agent 或通用 OpenAPI Agent；不要自建 AI 会话表、助手目录、工具调用状态机或前端助手清单；不要复制 `validation/security-console`；工具不得直接 JDBC、手写 SQL 或绕过业务 service。 |
| 外置 Agent / 独立助手进程通过标准 MCP 调用业务工具；业务应用需要对外暴露 `tools/list`、`tools/call` 等 MCP 服务端面 | `core:mcp`（显式依赖 `buck-core-mcp`）+ 工具贡献用 `core:ai-agent`（推荐 `BrickAiToolProvider` / `BrickAiToolExecutor`；有 ai-agent 时自动进 MCP）。需要平台安全/IAM/审计等能力时再命中对应正式模块。 | 不要自建平行 MCP 服务端、不要把管理端 CRUD 当 Agent 主路径、不要通用数据库/OpenAPI Agent、不要复制验证壳 `allow-anonymous=true` 到生产、不要把外置 Agent 协议面绑进 `modules:ai-assistant` 会话。 |
| 列表筛选、分页、排序、条件查询 DSL | `core:query` | 每个接口自定义分页、排序、筛选协议。 |
| 下拉、单选、多选、标签、枚举选项、字典选项 | `core:option`、`BrickOptionProvider` | 在页面或业务 controller 里散落枚举接口。 |
| 业务实体持久化、迁移、逻辑删除、敏感字段、签名字段、变更日志 | contract、MyBatis-Plus、`core:orm-plus`、标准 Flyway 迁移产物；表必须有单一 `string(20)` 主键，实体主键使用 `IdType.ASSIGN_ID`；软删表业务唯一索引必须包含 `data_status`。敏感字段按 `capabilities/storage-encryption.md`：仅机密用信封列；可查敏感另建 `*_blind` 盲索引列与 `@BrickSensitiveField(searchable=true, blindIndexColumn=...)`；配置 `crypto-key` 与 `blind-index-pepper` 分离且生产覆盖默认值。 | 运行时代码手写 SQL、直接 JDBC、无主键表、复合主键默认建模、自建存储加密/固定 IV/自创密文格式/平行盲索引/签名/变更日志机制；对随机 IV 密文列做等值查询。 |

运行在达梦 DM 的业务后端按需加入 `runtimeOnly 'com.dameng:DmJdbcDriver18'`，版本由 `buck-bom` 约束。数据库连接信息从运行环境注入，不写入仓库；DM 迁移仍使用标准 `db_<app-or-component>/dm` Flyway 迁移产物，不能把 SQL 放进 Controller、Service、Repository、Mapper XML 或启动脚本。

列表能力的强制边界按“调用方是否在定义筛选/分页/排序协议”判断。面向页面或 API 调用方的列表接口必须注册 `BrickQueryDefinition`，用 `QueryCriteria` 表达筛选、分页和排序，并通过 `BrickQueryExecutor` 执行。Controller/Service 中不要用 `LambdaQueryWrapper`、`QueryWrapper` 或 `Wrappers.lambdaQuery` 加 `selectList` / `selectPage` 手写 `like`、`orderBy`、page/size 或前端可控筛选。内部按主键、唯一键或固定外键做精确读取、唯一性校验和删除前引用检查可以继续使用 MyBatis-Plus，例如 `selectById`、`selectOne` 或只含固定 `eq` 条件的内部 `selectList`；这类查询不能变成页面列表协议。

面向 HTTP 契约的日期时间字段保持 `LocalDateTime`、`LocalDate`、`LocalTime`、`Instant` 等强类型，统一交给 `core:api` 的日期时间格式配置序列化。不要在 `controller`、`service`、`service/mapper` MapStruct mapper 或 `provider` 里用 `DateTimeFormatter`、`SimpleDateFormat`、`temporal.toString()` 或 `@Mapping(expression = "java(...toString())")` 提前把时间转成 `String` 再返回前端。

### 登录外观与登录页版本（业务采用）

业务需要**可运营的部署级产品品牌**（机构名、Logo、背景、布局、按钮主色；登录页与登录后控制台壳同源）时，采用 `modules:login-brand`（当前 `released-candidate`）：

| 步骤 | 说明 |
| --- | --- |
| 后端 | BOM 下依赖 `io.github.wu9007:buck-module-login-brand-backend`；starter 扫描自动装配；Flyway 跑模块迁移 `db_login-brand` |
| 前端管理端 | 依赖 `@wildbuck/module-login-brand-frontend`，把 `page-registry` 并入业务 route loaders；权限 `login-brand:appearance:view` / `manage` 由模块 function catalog + IAM bootstrap 吸收 |
| 登录壳 | 默认复用 `@wildbuck/module-iam-frontend/auth-view`：会读 `/brick/client-meta` 的 `capabilities.loginBrand` 与 `appVersion`；**不要**自建平行登录品牌配置中心。`1.0.0-140+` 的 auth-view 在无预取时会先占位再拉 meta（防默认布局闪屏）；推荐仍在壳启动时预取并传 `:initial-login-brand`（与 validation 一致） |
| 登录后壳 | 启动时 `loadBrickClientMeta` → `resolveBrickShellBrand` → `applyBrickShellBrowserChrome`，并把 `brickShellBrandToConsoleProps` 传给 `BrickConsoleShell`，同时缓存 `capabilities.loginBrand` 作为 auth 的 `initialLoginBrand`；**不要**用业务 i18n 写死产品名/Logo |
| 公开资源 | Logo/背景走 `GET /login-brand/public/logo`、`/login-brand/public/background`（匿名）；业务壳鉴权规则须允许这两条 GET；禁止把鉴权 `contentUrl` 当登录页 `<img src>` |
| 文件存储 | 登录 Logo/背景走 `core:file-resource` 本地盘；生产必须配置**绝对路径** `brick.file-resource.storage-root` 并挂持久卷，否则重启后库表有 resourceId、磁盘无文件，图片 404（见 [file-resource.md](../capabilities/file-resource.md)） |
| 主色 | 管理端可选「跟随系统主题」或自定义 hex；空 `primaryColor` = 跟随控制台主题 token |
| 布局 | 仅受控预设（极简居中 / 政务分栏 / 表单左品牌右 等）；不开放自由 CSS |
| 应用版本 | **不**写在品牌表；业务 CI 在 `bootJar` 后写入 `META-INF/brick-app-identity.properties`（见 [business-ci-cd.md](business-ci-cd.md)），登录页脚展示 |

未装配 `login-brand` 时：壳与标签页回退中性「Buck」；登录页仍可用 IAM props；可用 classpath `META-INF/brick-login-brand.properties` 做**应急**配置（`brick.client-meta.login-brand.*` Spring 绑定已删除）。正式运营配置以模块管理端为准。

### 业务 AI 助手扩展

业务需要开发自己的 AI 助手时，先采用 `modules:ai-assistant`，再在业务模块中贡献助手定义和工具。后端依赖使用 BOM 约束下的 `io.github.wu9007:buck-module-ai-assistant-backend`；只做底层工具贡献时可以按需引用 `io.github.wu9007:buck-core-ai-agent`。前端使用 `@wildbuck/module-ai-assistant-frontend`；标准控制台壳入口优先用 `@wildbuck/module-ai-assistant-frontend/shell-entry`，已有自定义右侧宿主时再用 `@wildbuck/module-ai-assistant-frontend/assistant-panel`，完整页面 route 用 `@wildbuck/module-ai-assistant-frontend/page-registry`。

助手声明只通过 `BrickAiAssistantDefinitionProvider`。业务 provider 声明稳定 assistant code、名称、模型服务 code 或默认模型、系统提示词、`permissionCodes` 和 `toolCodes`；`permissionCodes` 复用业务功能点权限，普通用户能否看到助手由当前主体权限决定。`ai-assistant:assistant:manage` 是助手配置管理权限，不要把它当成所有业务助手的使用权限。

工具声明走 `core:ai-agent`：用 `BrickAiToolProvider` 发布工具 code、名称、权限码、风险等级、执行策略和 JSON schema，用 `BrickAiToolExecutor` 调用本业务 service 执行。工具代码仍然遵守业务模块边界：不直接 JDBC，不手写运行时 SQL，不绕过 `core:authorization`，不把 controller/repository 当成工具入口。写操作默认需要人工确认；服务端工具策略是最终边界，前端访问模式不能放大工具权限。

业务前端不得硬编码助手列表、模型列表、工具列表或会话历史。`@wildbuck/module-ai-assistant-frontend` 必须从后端读取当前主体可用助手、会话和待确认工具调用；本地视觉预览不能替代真实后端验证。不要复制 `validation/security-console` 的验证壳实现，`validation/security-console` 只证明 Buck 发布物可以被外部应用装配，不是业务 AI 助手实现来源。

不要在业务仓库创建通用 CRUD Agent、通用数据库 Agent 或通用 OpenAPI Agent。确实需要让助手访问业务数据时，先把可复用业务行为沉到明确的业务 service 和受控 tool schema；确实需要调用外部系统时，按 `core:openapi` / 业务外部 client 边界建模，不能让模型获得任意 API 或数据库自由访问权。

### 外置 Agent MCP 宿主（业务应用暴露工具）

业务应用需要让**独立进程的外置 Agent**（仓库外助手服务）通过标准 MCP 调用本系统受控能力时，采用 `core:mcp` 做 MCP **服务端宿主**。这与控制台 `modules:ai-assistant` **无关**：不共享会话、不共享 toolCall 确认状态机、不要求装配助手前端。

#### 依赖

在 BOM 约束下显式增加：

```xml
<dependency>
  <groupId>io.github.wu9007.buck.core</groupId>
  <artifactId>buck-core-mcp</artifactId>
</dependency>
```

需要平台能力时再按命中矩阵引入正式模块（如 `security-setting`、`iam`、`audit`）。只贡献业务域工具时，至少再具备 `core:ai-agent`（可随正式模块进入依赖图，也可单独引用 `buck-core-ai-agent`）。

`buck-starter-application` **默认不**引入 `core:mcp`。

#### 配置

```yaml
brick:
  mcp:
    enabled: true
    # allow-anonymous 默认 false，生产勿开启
```

端点：固定 `POST {业务应用 origin}/mcp`，`Content-Type: application/json`，载荷为 JSON-RPC 2.0。

#### 推荐：用 AI 工具桥贡献业务工具

1. 在业务模块实现 `BrickAiToolProvider`：声明 `toolCode`、展示名、描述、`inputSchema`、业务 `permissionCode`、风险等级、是否写操作。  
2. 实现 `BrickAiToolExecutor`（或统一 execution service + 多 executor bean）：`toolCode()` 与 provider 一致，内部只调本业务 **service**。  
3. 宿主启用 MCP 且 classpath 有 `core:ai-agent` 时，框架**自动**把这些工具暴露到 `tools/list` / `tools/call`（无配置开关）。  
4. 写工具必须 `writeOperation=true` 且执行策略不得为 `ALLOW`（框架约束）；外置 Agent 侧仍应有确认流程，服务端权限与业务规则是最终边界。

同一套 `BrickAiTool*` 也可被控制台 AI 助手复用；是否装配 `modules:ai-assistant` 由业务另做命中，**不是** MCP 宿主的前置条件。

#### 备选：直贡献 MCP 工具

仅当工具不应进入 AI 助手工具目录时，实现 `BrickMcpToolProvider`：

- `listTools()` 返回 `BrickMcpToolDescriptor`（name、title、description、inputSchema）  
- `call(name, arguments)` 对本工具返回 `Optional` 结果；不处理则 `Optional.empty()`  
- 仍必须走业务 service 与鉴权，禁止在 provider 内 JDBC / 手写 SQL / 旁路权限  

#### 协议最小面（外置 Agent 侧）

| method | 用途 |
| --- | --- |
| `initialize` | 能力协商 |
| `tools/list` | 工具目录 |
| `tools/call` | `params.name` + `params.arguments` |
| `ping` | 存活 |
| `resources/*` / `prompts/*` | 可选；Buck 内置 usage-guide 等资源 |

`tools/call` 成功时 `result.content[].text` 多为 JSON 文本（含 `status` / `summary` / `result`）；以运行时为准。工具集合随装配模块变化，**验收以 `tools/list` 为准**。

#### 安全与禁止

- 生产禁止 `brick.mcp.allow-anonymous=true`。  
- `core:mcp` 自动桥接的写工具 / `ASK` 工具不会直接执行，返回 `REQUIRES_CONFIRMATION`；不要假设 MCP `tools/call` 等于已确认。
- 禁止把管理端 CRUD 当外置 Agent 主路径。  
- 禁止通用数据库 Agent、任意 OpenAPI 自由调用 Agent。  
- 禁止在业务仓自建长期平行 MCP 服务端替代 `core:mcp`。  
- 不要把外置 Agent 产品私有协议写进 Buck delivery；业务只负责宿主采用与工具贡献，外置 Agent 客户端集成留在业务/助手项目。

#### 验收

1. 启用后 `POST /mcp` + `initialize` 成功。  
2. `tools/list` 含本业务贡献的 tool code（及已装配正式模块工具）。  
3. 至少一条只读 `tools/call` 返回业务数据且不落库。  
4. 若有写工具：无权限或非法参数失败可预期；成功路径有审计或业务可追溯记录。  
5. 生产配置确认 `allow-anonymous=false`。

### core:file-resource 业务附件留存清理

`core:file-resource` 默认随 starter 进入依赖图；坐标 `io.github.wu9007:buck-core-file-resource`。公开表面：图片上传 → 业务表只存 `resourceId` → 内容读取 → 到期 `disableIfUnreferenced`。不是对象存储管理台。

| 场景 | 契约 |
| --- | --- |
| 上传 | `POST /file-resources/images?category=<category>`，字段 `file`，返回 `resourceId`/`contentUrl` |
| 读取 | `GET /file-resources/{resourceId}/content`（**鉴权**；不可直接作 `<img src>`） |
| 管理端预览 | 前端 `@wildbuck/core-ui-frontend/fields`：`createBrickLocalImagePreview`（未保存）/ `loadBrickImageResourcePreviewUrl`（已保存 blob 预览） |
| 匿名公开呈现 | 仅业务功能点提供的 public 路径（如 `modules:login-brand` 的 `/login-brand/public/logo\|background`），不把鉴权 content 端点放行给匿名 |

`category`：`APPLICATION_LOGO`、`EMPLOYEE_AVATAR`、`MENU_ICON`、`BUSINESS_ATTACHMENT`、`LOGIN_BRAND_LOGO`、`LOGIN_BRAND_BACKGROUND`。仅图片 MIME，默认 ≤2MB；上传与 content 读取复用业务认证链路（非匿名入口）。业务表不落 Base64/字节；列表只查元数据。清理时资源不存在可视为清理成功；分类不匹配或禁用失败则保留业务记录待重试。完整 service 注入与定时清理流程见发布资料包 `capabilities/` 与 `examples/`；预览契约见 `business-frontend-page-patterns.md`「图片上传字段」。

### core:query 最小示例

1. 功能点 `provider`/`config` 注册 `BrickQueryDefinition`（`queryCode`、字段白名单、操作符、排序、分页上限）。
2. Service 组装 `QueryCriteria`，交给 `BrickQueryExecutor` 执行。
3. 禁止用 `LambdaQueryWrapper`/`selectPage` 把页面筛选协议写进 Service。
4. 前端可用 `@wildbuck/core-query-frontend` 构造 DSL；后端仍按 definition 校验。

可执行样例见发布资料包 `examples/` 与 `capabilities/query.md`。

### core:option 最小示例

功能点 `provider` 实现 `BrickOptionProvider`（稳定 `code` + `options()`）。前端用 `@wildbuck/core-option-frontend` 的 `loadBrickOptions` / `createOptionRequest` 渲染；禁止静态 `<el-option>` 或本地 `statusOptions` 数组。

## 业务后端结构和元数据边界

业务应用后端默认按功能点组织，不按通用能力另起目录：

```text
backend/src/main/java/com/example/<app>/applet/<feature>/
  controller/
  dto/
  repository/
  service/
  provider/
```

只有业务系统已经拆成多个业务构件，并且构件之间需要进程内协作时，才使用 `<app>-module-common`、`<app>-module-<component>`、`<app>-boot` 的多模块结构。此时 `innerapi` 只放在 common 契约和构件实现中，不能让调用方依赖对方实现模块。

如果业务把对外 OpenAPI 接口作为模块级根目录 `openapi/` 边界组织，则可在该边界下放 `openapi/controller`、`openapi/service` 和 `openapi/dto`；其中 DTO 保持 `com.xxx.openapi.dto` 包名，不要误迁成 `com.xxx.applet.openapi.dto`。

业务后端目录按标准白名单强制执行。下面这些目录不在白名单内，因此不能作为业务目录新增：

| 目录 | 不创建原因 | 业务开发方式 |
| --- | --- | --- |
| `query/` | 万能查询不是业务功能点。 | DO/持久化元数据、显式 `BrickQueryDefinition`、字段白名单、操作符白名单和 `core:query` 承载查询边界。 |
| `audit/` | 审计不是业务本地表和本地页面。 | DO 标注 `@BrickPersistentEntity`、`@BrickChangeLogField` 触发 ORM 变更审计；业务动作在 service 发布 `BrickAuditEvent`；落库和查询用 `modules:audit`。 |
| `integration/` | 名称过泛，容易混放外部系统、内部调用和适配层。 | 调外部系统用 `client/remote`，对外开放 API 用 `openapi`，多模块内部协作用 `innerapi` 和事件。 |

迁移脚本目录使用：

```text
src/main/resources/db_<app-or-component>/<database>/V<business-version>_<seq>__<description>.sql
```

迁移版本映射业务系统版本；多模块时每个构件只维护自己的 `db_<component>`，不能修改其他构件表。当前发布资料包未提供业务仓库迁移生成器时，允许业务应用把评审过的 Flyway DDL 作为迁移产物放在标准迁移目录。

迁移产物不允许扩散到运行时代码：controller、service、repository、Mapper XML、启动脚本和初始化 runner 仍禁止直接 JDBC 或手写 SQL。业务侧如果需要“实体/契约生成迁移”的可执行入口，应向 `buck` 提交基础能力需求，不能在业务仓库自建一套平行生成器。

发布资料包提供 `rules/check-business-structure.mjs` 作为业务仓库 CI 阻断检查。业务应用必须执行该检查，不能只靠文档约定目录结构和能力复用。

## 业务后端编码强制规范

业务后端默认使用 Lombok 和 MapStruct，业务仓库不能删除发布模板中的依赖和 annotationProcessor 配置。

| 场景 | 强制做法 | 边界 |
| --- | --- | --- |
| Spring component 依赖注入 | 使用 `@RequiredArgsConstructor` 和 `final` 字段 | 不手写重复构造器，不用字段注入。 |
| Entity/DO 样板代码 | 使用 `@Getter`、`@Setter`、`@Accessors(chain = true)` | Entity/DO 仍按 `repository` 边界组织，并遵守 `string(20)` 主键和 `IdType.ASSIGN_ID`。 |
| Entity 与 DTO/Command/Response 转换 | 使用 MapStruct，可继承 `BrickDtoMapper<ENTITY, DTO>`，声明 `@Mapper(componentModel = "spring")` | mapper 放 `applet/<feature>/service/mapper`，由 Spring 注入到 service；Controller 不依赖 mapper 或 Entity/DO。 |
| MyBatis-Plus 持久化 Dao/repository | 放 `repository` | 业务仓库持久化接口命名为 Dao，标注 Buck `@Dao` 并继承 `BrickBaseDao<T>`；不要直接使用 MyBatis-Plus `BaseMapper` 作为业务 Dao。不要把 MapStruct mapper 放进 `repository`，避免转换边界和持久化边界混淆。 |
| Controller 入参校验 | `@RequestBody` 参数使用 `@Valid` 或 `@Validated`，Request/Command/Query DTO 字段使用 `jakarta.validation.constraints` | 空值、长度、格式、范围等 HTTP 契约约束在 DTO 上声明；跨对象和业务规则仍放 service。 |

DTO、Command、Query、Request、Response、Page 和 Detail 等 HTTP 契约类型默认放在 `applet/<feature>/dto`。如果业务把对外 OpenAPI 接口作为模块级根目录 `openapi/` 边界组织，则该边界的 HTTP 契约类型允许放在 `openapi/dto`；不要把 `com.xxx.openapi.dto` 误改成 `com.xxx.applet.openapi.dto`。service 不暴露 public nested DTO/Command/Response/Page/Detail record；Controller 不返回 `FaceXxxService.*` 或 `.service` 包类型，也不注入、不继承、不调用 `BrickDtoMapper`、`service/mapper` mapper 或 `repository` Entity/DO。功能点同时存在 `dto` 和 `repository` Entity/DO 时，Entity 与 DTO 转换必须通过 `applet/<feature>/service/mapper` 下的 MapStruct mapper 完成。

模块权限、菜单、引入条件和边界以本节之前的强制采用矩阵、能力目录 `capabilityAdoption[]` 和各模块 `README.ai.md` 为准，下面只保留业务智能体最容易漏的入口。

IAM 前端入口：`@wildbuck/module-iam-frontend/page-registry`；认证默认复用模式用 `@wildbuck/module-iam-frontend/auth-view` + `@wildbuck/module-iam-frontend/auth-workspace`；整页自定义模式用 `@wildbuck/module-iam-frontend/auth-state`（`state.authScreen`）+ `@wildbuck/module-iam-frontend/auth-workspace`。登录外观管理用 `@wildbuck/module-login-brand-frontend/page-registry`。生产覆盖 `brick.iam.bootstrap.admin.initial-password`。

安全设置把数据库策略交给 `BrickLoginSecurityPolicyProvider` / `BrickPasswordPolicyProvider` / `TransportSecuritySettingProvider`（`TransportKeyWrapProvider` 仍在 `core:transport`）。通知配置只治理 EMAIL/SMTP。审计落库用 `BrickAuditSink`；业务动作发 `BrickAuditEvent`。应用中心与业务组织接入是并列 OAuth/HMAC provider，必须保证 `clientId` 唯一命中。

## 常用扩展点

| 扩展点 | 所属能力 | 业务应用何时实现 |
| --- | --- | --- |
| `BrickOptionProvider` | `core:option` | 需要给页面或 API 提供下拉、单选、多选、标签选项。 |
| `CurrentSubjectProvider` | `core:api` / `core:authorization` | 需要把当前主体暴露给业务服务或 ORM 自动填充。通常 starter 已提供。 |
| `BrickLoginSecurityPolicyProvider` | `core:authentication` | 需要从业务配置源提供登录安全策略。通常由安全设置模块提供。 |
| `BrickPasswordPolicyProvider` | `core:authentication` | 需要从业务配置源提供密码策略和弱密码库。通常由安全设置模块提供。 |
| `BrickPasswordLifecycleStateResolver` | `core:authentication` | 需要认证核心识别初始密码、周期到期或管理员重置。通常由 IAM 提供。 |
| `BrickPasswordCredentialManager` | `core:authentication` | 需要接入正式改密、密码历史和密码落库。通常由 IAM 提供。 |
| `BrickVerificationCodeSender` | `core:authentication` | 需要真实短信/邮箱发码。 |
| `BrickVerificationCodeUserDetailsService` | `core:authentication` | 需要验证码登录时把手机号/邮箱解析成主体。 |
| `BrickMfaVerificationTargetResolver` | `core:authentication` | 需要 MFA 时把当前主体解析成发码目标。 |
| `BrickLoginDeviceChecker` | `core:authentication` | 需要登录设备校验或设备绑定策略。 |
| `BrickAuthorizationRuleContributor` | `core:authorization` | 需要为业务私有入口补充匿名、仅登录或权限规则。路径模式支持 `{id}` 单段变量和 `**` 多段通配，例如 `/openapi/face/**`。 |
| `BrickTokenRevocationEventPublisher` | `core:authorization` | 多节点部署时需要同步 token 撤销事件。 |
| `BrickAuditSink` | `core:audit` | 需要额外审计落地方式，例如外部审计平台。 |
| `BrickTraceContext.currentTraceId()` | `core:observability` | 业务日志需要读取当前请求 traceId；不要因此自建请求日志 filter。 |
| `BrickClientMetaContributor` | `core:client-meta` | 需要向浏览器公开非敏感启动元数据时贡献能力片段；只能返回公开开关、schema 版本和 endpoint，不返回 secret、token、连接串、内部策略明文或业务对象。 |
| `BrickUsageEvents` / `BrickUsageEventPublisher` | `core:usage-event` | 需要后端发布产品使用事件；后端-only 动作先用 `BrickUsageEvents.action()` 构造并复用 validator，再通过 publisher 显式发布；默认关闭，开启后输出结构化 JSON line，不替代审计；浏览器 collect endpoint 默认走认证/鉴权链路，不做匿名采集。 |
| `TransportKeyWrapProvider` | `core:transport` | 需要接入密码机或 HSM 进行会话密钥包装。 |
| `TransportSecuritySettingProvider` | `core:transport` | 需要从数据库或配置中心读取传输安全配置。 |
| `OpenApiScopeCatalogProvider` | `core:openapi` | 需要把业务开放 API 的 Scope 目录登记给应用中心。 |
| `OpenApiAccessPolicyResolver` | `core:openapi` | 需要根据 `method + path` 解析接口所需 Scope。 |
| `OpenApiRequiredScopeResolver` | `core:openapi` | 需要动态解析接口要求的 Scope。 |
| `OpenApiAccessLogSink` | `core:openapi` | 需要保存机器访问日志；同一 sink 接收 Bearer 缺失、空 token、无效/过期/撤销、HMAC 拒绝、Scope 拒绝、业务响应和业务异常事件。业务不要为 OpenAPI 认证失败自建 Filter 或访问日志模型。 |
| `BrickStorageCipherProvider` | `core:api` / `core:orm-plus` | 需要自定义存储加密提供方。 |
| `BrickStorageSignatureProvider` | `core:api` / `core:orm-plus` | 需要自定义存储签名提供方。 |
| `BrickCrudLifecycleHook` | `core:orm-plus` | 需要在通用 CRUD 生命周期中挂业务钩子。 |
| `BrickObjectReferenceChecker` | `core:orm-plus` | 删除前需要检查对象是否被引用。 |

## 注解速查

| 注解 | 所属能力 | 用法 |
| --- | --- | --- |
| `@AnonymousAccess` | `core:authorization` | 标记 controller 或方法允许匿名访问。默认业务接口不应匿名。 |
| `@PreAuthorize` | Spring Security / `core:authorization` | 业务 controller 的受保护接口必须声明权限表达式。 |
| `@Scope` | `core:openapi` | 声明访问接口需要的 Scope，以及 `groupName`、`interfaceName`、`description` 元数据。 |
| `@BrickPersistentEntity("显示名")` | `core:orm-plus` | 声明持久化实体显示名和是否记录增删改查审计事实，不声明物理表名。 |
| `@TableId(value = "...", type = IdType.ASSIGN_ID)` | MyBatis-Plus / `core:orm-plus` | 业务实体主键统一策略。字段类型为 `String`，表主键为 `string(20)`；需要固定 ID 时插入前赋值，不改成 `IdType.INPUT`。 |
| `@BrickSensitiveField` | `core:orm-plus` | 标记敏感字段，交给存储加密/查询加密处理。 |
| `@BrickSignatureField` | `core:orm-plus` | 标记签名字段。 |
| `@BrickExcludeWithSign` | `core:orm-plus` | 标记签名明文中排除字段。 |
| `@BrickChangeLogField` | `core:orm-plus` / `core:audit` | 标记变更日志字段名称、敏感策略、字典和格式化方式。 |
| `@BrickLogicTableScan` | `core:orm-plus` | 显式声明逻辑表扫描范围。 |
| `@BrickJoin`、`@BrickJoinField`、`@BrickJoinTable(s)` | `core:orm-plus` | 声明 Join 查询元数据。 |
| `@BrickOneToOne`、`@BrickOneToMany`、`@BrickManyToOne`、`@BrickManyToMany` | `core:orm-plus` | 声明关系映射和级联读取/写入。 |

## ORM Plus 元数据来源优先级

业务实体不要重复维护两套物理映射元数据。默认规则：

- 物理表名来自 `@TableName`，字段名来自 `@TableId` / `@TableField` / Java 字段名驼峰转下划线，主键来自 `@TableId`。
- `@BrickPersistentEntity("显示名")` 只声明实体显示名和审计开关，不再声明 `tableName`。
- 不使用 `@BrickColumn`。字段类型交给 MyBatis-Plus、Java 类型和类型处理器体系；字段长度、可空、索引和约束来自 contract/Flyway 迁移产物。
- `@BrickChangeLogField` 只负责审计展示语义，不负责表名、列名、类型、长度或主键。
- 敏感存储用 `@BrickSensitiveField`，签名字段用 `@BrickSignatureField`，签名排除用 `@BrickExcludeWithSign`，不要用本地注解替代。
- DDL 约束仍来自 contract / Flyway 迁移产物；Java 注解只是 ORM Plus 运行时和审计/签名/敏感元数据，不替代迁移。

最小实体：`@TableName` + `@BrickPersistentEntity("显示名")` + `@TableId(..., IdType.ASSIGN_ID)` + 需要审计的字段加 `@BrickChangeLogField`。完整样例见发布资料包 `examples/`。

## 配置项速查

| 前缀 | 典型配置 | 说明 |
| --- | --- | --- |
| `brick.security.login` | `username-case-sensitive`、`password-crypto-mode`、`password-form-mode`、`step-up-ttl-seconds`、`home-page`、`external-login-page` 等 | 登录行为。**路径固定** `/brick/login`、`/brick/logout`、`/brick/captcha`、改密与 step-up，不可配置。 |
| `brick.security.account` | （已退场为部署配置） | 登录验证码/冻结/MFA/单点/设备校验等由 `modules:security-setting` 管理页维护；POJO 默认值仅作无模块时的 bootstrap。 |
| `brick.security.password.lifecycle` | （已退场为部署配置） | 密码生命周期动作由密码策略管理页维护。 |
| `brick.security.token` | **`base64-secret`（必填）** | 仅密钥为部署配置。access/refresh/remember-me TTL 与过期策略由安全设置「会话令牌」页维护（remember-me 不暴露在页上但落库）。静默续期与 refresh 轮换（成功后作废旧 RT）为产品安全基线，**不可配置关闭**。刷新路径固定 `/brick/token/refresh`。 |
| `brick.iam.bootstrap` | `enabled`、`catalog-enabled`、`admin.enabled`、`admin.initial-password`、`admin.grant-registered-permissions` | IAM 启动时无脚本初始化功能/权限/菜单目录和内置维护图谱。生产至少覆盖初始密码。 |
| `brick.authorization` | `web.enabled` | 鉴权 Web 开关。MFA 路径固定 `/brick/mfa/verification-code/*`。 |
| `brick.transport` | `request-digest.enabled`、`digest.algorithm`、`encryption.enabled`、`encryption.provider-type`、`encryption` 时钟/防重放、`protected-url-regexes` | 传输摘要与信封 fallback（有 security-setting 时以 DB 为准）。**header 名与登录链放行规则为产品常量**，不可配置。 |
| `brick.orm` | `optimize`、`block-attack`、`id-conversion.*`、`sensitive.*`、`change-log.*` | MyBatis-Plus 增强。逻辑删除字段固定 `dataStatus` / `#id` / `1`。 |
| `brick.mcp` | `enabled`、`allow-anonymous` | 外置 Agent MCP。路径固定 `/mcp`；生产 `allow-anonymous` 保持默认 false。 |
| `brick.usage-event` | `enabled` | 使用事件采集部署开关。启用后固定暴露 `POST /brick/usage-events/collect`；不提供安全设置管理页。 |
| `brick.openapi.hmac` | `enabled`、`max-timestamp-skew` | OpenAPI HMAC。请求头名称为产品协议常量。 |
| `brick.observability` | `enabled`、`request-completion-log-enabled`、`metrics-enabled`、`request-header-names` | 观测链。响应头固定 `trace-id`。 |
| `brick.api.datetime` | `zone-id` | API 时区。JSON 日期时间格式为产品契约固定。 |

业务应用可以覆盖配置，但不要改变 core/module 职责边界。需要新增通用配置时，优先回流到 `buck`，并在 `buck` Issues 提交业务场景、期望配置项和兼容性影响：<https://github.com/wu9007/buck/issues>。

## 禁止事项

- 不复制或修改 Buck 发布包。
- 不深度引入 `@wildbuck/*` 未导出的前端内部文件。
- 不在业务运行时代码手写 SQL 或直接使用 JDBC；Flyway DDL 迁移产物只能放在标准迁移目录。
- 不自建登录 filter、token filter、分页协议、选项协议、传输摘要规则或审计表。
- 不自建用户、员工、组织、角色、菜单、权限、会话、安全策略、应用接入等 Buck 已正式发布的治理能力。
- 不把应用中心能力塞进 IAM，不把 IAM 主数据塞进应用中心。
- 业务应用与 Buck 扩展只采用已发布 core/modules 能力与明确 SPI，不自造平行框架能力。
