# BrickCapabilityCatalog 能力目录

版本：2.0.0-11

本目录把当前 Buck 发布物的静态能力索引随资料包交付给业务开发组和业务 agent。它回答“Buck 已经发布了什么能力、包、页面、权限、queryCode、optionCode 和 frontend exports”，不承担运行时配置、页面搭建或业务数据管理。

## 文件

- `capabilities/packs.json`：采用分组（runtime / identity / governance / agent-surface）。先读四包，再读命中包的 adoption 卡。
- `capabilities/query-option-index.json`：列表查询/选项白名单。incomplete 不得当完整字段契约。
- `capabilities/capability-catalog.json`：机器可读能力目录。
- `capabilities/tools.schema.json`：已声明 AI 工具的 toolCode / inputSchema / 执行策略 / 失败门。
- `capabilities/README.md`：字段说明和业务侧使用方法。

## 字段速查

- `schemaVersion`：能力目录结构版本。
- `modules[].moduleKey` / `displayName` / `maturity`：正式模块标识、展示名和成熟度。
- `modules[].aiReadme`：模块维护说明入口；业务 agent 需要理解模块职责和边界时先读发布资料包中的对应文件说明，不依赖聊天历史。
- `modules[].backend` / `contracts` / `dependsOn`：模块后端包、契约和依赖边界。
- `modules[].frontend.packageName` / `exports`：业务前端可安装的 npm 包和公开入口；治理模块页面优先从 `./page-registry` 装配。
- `modules[].permissions` / `menus` / `pages` / `features`：权限、菜单、route、功能点和页面 loader 索引。
- `modules[].queryDefinitions.status`：query 静态扫描状态；当前常见值为 `partial-static`，表示目录只列出贡献类和稳定 `queryCode`，字段白名单、操作符、排序和分页上限仍由运行时 `BrickQueryDefinition` 校验。
- `modules[].optionProviders.status`：option 静态扫描状态；当前常见值为 `partial-static`，表示目录只列出贡献类和稳定 `optionCode`，选项值、排序和扩展参数仍由运行时 `BrickOptionProvider` 提供。
- `coreFrontendPackages[]`：core 前端包和公开 exports，例如列表筛选工具条来自 `@wildbuck/core-ui-frontend/patterns`，选项加载来自 `@wildbuck/core-option-frontend`。
- `capabilityAdoption[]`：业务采用指南。它把常见需求命中项映射到必须复用的 core、module 或 starter，并列出禁止自造的平行机制、场景化 `whenNot[]` 和资料入口。统一响应信封看 `core:api`，错误模型看 `core:error`，控制台壳/模式/token 看 `core:ui`。

## 使用方法

1. 业务 agent 写代码前先读 `capabilities/packs.json` 选包，再读本文件的“能力采用指南”和命中包的 `capabilityAdoption[]`。
2. 需求命中治理模块页面时，优先采用对应 `@wildbuck/module-*-frontend` 包和 `./page-registry`，不要复制模块页面源码。
3. 需求命中列表筛选、分页或排序时，先查目录里的 `queryDefinitions.entries[].queryCodes`，业务侧新增列表协议必须走 `core:query`。
4. 需求命中下拉、单选、多选、标签或字典时，先查 `optionProviders.entries[].code`；已有 optionCode 直接用 `@wildbuck/core-option-frontend` 加载，缺少时实现 `BrickOptionProvider`，不要在 Vue 页面硬编码静态 `el-option` 或本地选项数组。
5. 需求命中已发布 core-ui 组件或模式时，优先使用 `@wildbuck/core-ui-frontend` 的公开 exports，例如 `./shell`、`./fields` 和 `./patterns`。
6. 如果目录显示 Buck 缺少通用能力，业务侧向 brick-next Issues 提交中文问题；不要在业务仓库自造平行机制。

## 能力采用指南

### `starter:application`：上层业务应用启动与默认装配

- 层级：`starter`
- 触发：
  - 新建或升级独立上层业务后端应用。
  - 业务应用需要获得 Buck 默认鉴权、传输、ORM、观测和模块自动装配；认证与 IAM 不随 starter 进入。
- 必须复用：
  - 后端依赖 io.github.wu9007:buck-starter-application 和 buck-bom。
  - 以发布资料包 templates/backend-minimal 为启动基线，再按业务采用决策开启正式模块。
- 禁止自造：
  - 通过 Gradle project/includeBuild 直连 brick-next 源码。
  - 复制 starter 自动配置或在业务仓库维护第二套启动壳。
- 何时不该调用：
  - 只改已有业务切片、不新建或升级独立后端应用时。
  - 验证壳或框架仓本身不是业务启动面。
- 资料入口：`README.md`、`dependencies/backend.md`、`templates/backend-minimal/build.gradle`

### `core:api`：统一响应信封、DTO 映射与前端 request<T>()

- 层级：`core`
- 触发：
  - HTTP API 需要统一成功/失败信封、BrickApiResponse 或生成 SDK 解封成功载荷。
  - 前后端需要共享 BrickPrincipal、BrickDtoMapper 或日期时间序列化出口。
- 必须复用：
  - 后端使用 BrickApiResponse / BrickResponseResult，不要另造 envelope。
  - 前端使用 @wildbuck/core-api-frontend 的 request<T>() 解封成功载荷，会话级错误走统一 handler。
- 禁止自造：
  - 在业务仓再包一层成功响应信封，或让前端解析未解封的 {success,data}。
  - 在 controller / mapper 里把日期时间提前格式化成 String。
- 何时不该调用：
  - 不要另造响应 envelope，或在 request<T>() 已解封后再包一层成功载荷。
  - 纯内部非 HTTP 批任务、不暴露 Buck API 时。
- 资料入口：`business-module-adoption-reference.md`、`business-frontend-ui-reference.md`、`capabilities/README.md`

### `core:error`：统一错误模型、异常响应与 error-catalog

- 层级：`core`
- 触发：
  - 业务异常需要稳定错误码、HTTP 状态、recovery 或默认异常响应。
  - 前端需要展示服务端已本地化的错误文案，而不是裸状态码。
- 必须复用：
  - 通过 starter 装配 core:error；模块错误码写在 contract/errors.yaml，由 error-catalog 与生成枚举进入响应链。
  - 用户可见文案使用服务端 message / i18n，不要把裸 HTTP status 当提示。
- 禁止自造：
  - 在业务模块自造平行错误协议、魔法字符串错误码或本地异常包装。
  - 把 token、密码或请求体明文写入异常日志。
- 何时不该调用：
  - 不要把裸 HTTP status 或异常类名当作用户文案。
  - 不要在前端硬编码错误码译文替代 contract/errors.yaml 与 error-catalog。
- 资料入口：`business-module-adoption-reference.md`、`capabilities/README.md`

### `core:query`：列表筛选、分页、排序和查询 DSL

- 层级：`core`
- 触发：
  - 页面或 API 调用方需要传入筛选、分页、排序或条件查询 DSL。
  - 业务列表需要稳定 queryCode、字段白名单、操作符白名单和排序边界。
- 必须复用：
  - 后端注册 BrickQueryDefinition，并通过 QueryCriteria 和 BrickQueryExecutor 执行。
  - 前端使用 @wildbuck/core-query-frontend 构造查询 DSL，筛选工具条布局复用 @wildbuck/core-ui-frontend/patterns。
- 禁止自造：
  - 每个接口自定义分页、排序、筛选协议。
  - 在 Controller 或 Service 中用 MyBatis-Plus wrapper 接收前端可控 like/orderBy/selectPage。
- 何时不该调用：
  - 单条详情、命令型写接口，或调用方不传筛选、分页、排序时。
- 资料入口：`business-module-adoption-reference.md`、`business-frontend-ui-reference.md`、`capabilities/README.md`

### `core:option`：下拉、单选、多选、标签和字典选项

- 层级：`core`
- 触发：
  - 页面或 API 需要下拉、单选、多选、标签、枚举或字典选项。
  - 选项值需要由后端统一提供、排序或扩展参数。
- 必须复用：
  - 后端实现 BrickOptionProvider 并发布稳定 optionCode。
  - 前端使用 @wildbuck/core-option-frontend 加载 /brick/options/list，不在页面写静态选项数组。
- 禁止自造：
  - 在 Vue 页面硬编码静态 el-option。
  - 在业务 controller 中散落枚举选项接口。
- 何时不该调用：
  - 纯自由文本、数值或日期输入，不是下拉、单选、多选或标签时。
- 资料入口：`business-module-adoption-reference.md`、`business-frontend-ui-reference.md`、`capabilities/README.md`

### `core:ui`：控制台壳、字段模式、页面模式和主题 token

- 层级：`core`
- 触发：
  - 控制台需要 shell、页眉、筛选条、列表动作位、抽屉或主题 token。
  - 模块页面需要复用已发布字段模式或页面模式，而不是复制验证壳。
- 必须复用：
  - 前端依赖 @wildbuck/core-ui-frontend 的 ./shell、./fields、./patterns 和 theme.css。
  - 页眉、筛选条、密钥复制、图片上传和抽屉先扩 core-ui，再让模块消费。
- 禁止自造：
  - 复制 validation/security-console 壳实现，或平行 ConsolePageHeader / ConsoleMetricCard / ConsoleFilterBar。
  - 在 modules 内再造 shared/console 页面方言。
- 何时不该调用：
  - 不要复制 validation 壳或平行 Console* 组件。
  - 非控制台页面、不需要 shell、页眉、筛选条或主题 token 时。
- 资料入口：`business-frontend-ui-reference.md`、`business-frontend-page-patterns.md`、`business-module-adoption-reference.md`

### `core:i18n`：国际化 locale 协议与消息解析

- 层级：`core`
- 触发：
  - 业务壳需要统一语言偏好、前端文案 runtime 或与后端 MessageSource 对齐。
  - API 需要按请求 locale 返回错误文案或其它本地化内容。
- 必须复用：
  - 后端通过 starter 装配 core:i18n：MessageSource、BrickAcceptHeaderLocaleResolver（优先 X-Brick-Locale，再 Accept-Language）、BrickMessageResolver。
  - 前端使用 @wildbuck/core-i18n-frontend 的 createBrickI18nRuntime、normalizeBrickLocale，并用 configureHttp({ localeProvider }) 注入 Accept-Language 与 X-Brick-Locale。
  - 用户偏好本里程碑使用 appearance.locale 本机真源；词条由 core/module 分层 registerMessages，业务错误正文优先展示服务端已本地化 message。
- 禁止自造：
  - 在 validation 或业务页自造第二套 i18n 库或平行 locale 协议。
  - 前后端各维护一套业务错误码译文并长期双源漂移。
  - 仅改 Element Plus locale 却宣称全站多语言已完成。
- 何时不该调用：
  - 确认单语种且不需要对齐前后端 locale 协议时。
- 资料入口：`core/i18n/README.md`、`core/i18n/frontend/README.md`、`business-frontend-ui-reference.md`

### `core:observability`：生产排障 traceId、MDC、请求完成日志与最小 HTTP 指标

- 层级：`core`
- 触发：
  - 业务需要请求链路 traceId、响应头 trace-id、MDC 或请求完成日志。
  - 排查生产问题需要在业务日志中读取当前请求 traceId。
  - 需要稳定低基数 HTTP 请求计数与耗时指标（brick.http.server.*）。
- 必须复用：
  - 通过 starter 默认装配 core:observability。
  - 业务代码只在需要时读取 BrickTraceContext.currentTraceId()。
  - 业务后端日志配置采用 release bundle 的 logback-spring.xml 模板，主日志 pattern 保留 %X{traceId}。
  - 需要抓取指标时由上层装配 MeterRegistry（如 Actuator + Prometheus），使用 brick.http.server.requests / request.duration。
- 禁止自造：
  - 自建 TraceIdFilter、RequestLoggingFilter 或请求/响应 body 日志。
  - 在业务仓库维护本地 observability 子系统。
  - 继续使用历史 %X{logRequestId} 作为 Buck 请求标识。
  - 为 Buck HTTP 指标增加 path/token 等高基数标签。
- 何时不该调用：
  - 本地一次性脚本，或不需要生产排障 traceId 时。
- 资料入口：`capabilities/observability.md`、`templates/backend-minimal/src/main/resources/logback-spring.xml`、`business-module-adoption-reference.md`、`upper-application-development-guide.md`、`rules/forbidden-patterns.md`

### `core:client-meta`：浏览器启动公开运行时元数据

- 层级：`core`
- 触发：
  - 业务前端壳需要统一读取 Buck core 能力的浏览器公开启动配置。
  - 前端需要知道 usage-event 等能力是否启用、公开 schema 版本和公开 endpoint。
- 必须复用：
  - 后端通过 starter 获得 core:client-meta，GET /brick/client-meta 聚合 BrickClientMetaContributor 公开片段。
  - 前端使用 @wildbuck/core-client-meta-frontend 的 loadBrickClientMeta 和 bootstrapBrickClient，再由具体 core 前端包完成能力初始化。
  - usage-event 前端默认通过 client-meta bootstrap，不在业务壳重复维护 enabled/appCode/endpoint。
- 禁止自造：
  - 在业务仓库自建平行 client meta endpoint、配置中心或前端启动配置协议。
  - 通过 client-meta 返回 secret、token、password、credential、connection string、内部策略明文、请求体、表单内容或业务对象明文。
  - 用 client-meta 替代 /transport/meta 传输安全预检兼容接口。
- 何时不该调用：
  - 纯后端批任务、没有浏览器启动壳时。
- 资料入口：`business-module-adoption-reference.md`、`business-frontend-ui-reference.md`、`capabilities/README.md`

### `core:usage-event`：产品使用事件采集和结构化日志

- 层级：`core`
- 触发：
  - 业务需要观察功能是否被看到、进入、动作完成、失败或放弃。
  - 产品运营分析需要稳定 usage event code 维度和 JSON line 离线导入格式。
- 必须复用：
  - 后端-only 动作使用 BrickUsageEvents.action() 构造事件，再通过 BrickUsageEventPublisher 显式发布，默认 LoggingBrickUsageEventSink 输出 JSON line。
  - 前端使用 @wildbuck/core-usage-event-frontend 从 client-meta 自动 bootstrap；模块优先用 createModuleUsageTracker() 绑定事件矩阵，再调用 trackPage、trackOpen、trackAction 或 trackActionResult，不直接拼日志格式、payload 或 success/failure wrapper 分支。
- 禁止自造：
  - 在业务仓库自建平行埋点框架、日志格式或采集 endpoint。
  - 把姓名、手机号、身份证号、token、密码、密钥、请求体、表单内容、附件内容或业务对象明文写入 usage event。
  - 把 usage event 当作审计日志或生产排障日志替代。
- 何时不该调用：
  - 需要审计检索或请求完成排障日志时，应走 core:audit / core:observability。
- 资料入口：`capabilities/README.md`、`capabilities/usage-event.md`、`business-module-adoption-reference.md`、`rules/forbidden-patterns.md`

### `core:file-resource`：图片和业务附件资源引用

- 层级：`core`
- 触发：
  - 业务需要保存头像、Logo、菜单图标、证照、人脸图片或其他图片附件。
  - 业务记录只应保存 resourceId、分类、大小和 expireAt，并按业务附件留存清理周期删除记录与资源引用。
  - 页面需要上传图片并复用统一预览、清除和大小/类型校验。
- 必须复用：
  - 后端通过 starter 获得 core:file-resource，图片上传使用 POST /file-resources/images?category=BUSINESS_ATTACHMENT，读取使用 GET /file-resources/{resourceId}/content。
  - 业务后端可注入 FileResourceService 保存图片资源，注入 FileResourceReferenceService 校验引用或在清理任务中 disableIfUnreferenced。
  - 前端上传控件复用 @wildbuck/core-ui-frontend/fields 的 BrickImageUploadField。
- 禁止自造：
  - 把图片 Base64、大字段二进制或文件内容直接塞进业务列表/日志表。
  - 在业务仓库自建长期本地文件表、本地磁盘规则或平行资源引用协议。
  - 绕过 core:file-resource 的大小、MIME 和分类约束。
- 何时不该调用：
  - 没有图片或业务附件，或不需要 resourceId 引用时。
- 资料入口：`business-module-adoption-reference.md`、`business-frontend-ui-reference.md`、`capabilities/README.md`

### `core:openapi`：OAuth2 机器访问、OpenAPI 动作、scope 和 HMAC-SM3 完整性

- 层级：`core`
- 触发：
  - 第三方系统或设备需要通过 OAuth2 client credentials、scope 或 action 调用业务 OpenAPI。
  - 业务已有组织接入功能点，需要接入统一机器访问校验、可选防重放/防篡改和访问日志。
- 必须复用：
  - OAuth2 client credentials、scope/action 主校验和访问日志归 core:oauth2/core:openapi。
  - 一个 OpenApiAccessLogSink 覆盖 Bearer 认证失败、HMAC 失败、Scope 拒绝、业务响应和业务异常。
  - 业务组织接入模块先实现 core:oauth2 SPI；只有明确需要防重放/防篡改时，才实现 OpenApiHmacIntegrityCredentialProvider、OpenApiHmacIntegrityValidator，并在集群环境替换 OpenApiHmacNonceStore。
- 禁止自造：
  - 自建长期 OpenAPI HMAC Filter、签名 canonical 规则或防重放机制。
  - 把 HMAC 当作 OAuth2 之外的直连认证路径。
  - 删除 Buck 鉴权链来绕过匿名 OpenAPI 入口。
- 何时不该调用：
  - 浏览器用户会话调用，而不是第三方或设备机器访问时。
- 资料入口：`business-module-adoption-reference.md`、`examples/business-slice-recipe.md`、`rules/forbidden-patterns.md`

### `core:authentication`：登录、登出、会话与密码生命周期执行

- 层级：`core`
- 触发：
  - 用户名密码登录、验证码登录、登出、改密、MFA 第二步或登录失败冻结。
  - 需要认证执行链，而不是自建登录 controller。
- 必须复用：
  - 显式依赖 buck-core-authentication，不随 buck-starter-application 进入；登录入口走 Spring Security filter。
  - 策略数据来自 modules:security-setting；账号主数据来自 modules:iam。token 签发与撤销走 core:authorization。
- 禁止自造：
  - 在业务模块暴露登录 controller 或自建认证 filter。
  - 把 JWT 签发、验签或 refresh 写进认证模块或业务模块。
- 何时不该调用：
  - 资源服务只验 token，不承载登录、登出或改密时。
- 资料入口：`business-module-adoption-reference.md`、`capabilities/README.md`

### `core:authorization`：当前主体、权限校验、token 验签与撤销

- 层级：`core`
- 触发：
  - 资源接口需要当前主体、权限码校验、Bearer token 验签或 refresh。
  - 登录成功后需要签发、轮换或撤销 access/refresh token。
- 必须复用：
  - 资源服务依赖 core:authorization 或 buck-starter-application 本地验签。
  - 权限声明用框架注解与 modules:iam 权限码；不在业务模块自建 token 过滤器。
- 禁止自造：
  - 自建 JWT 过滤器、权限拦截器或把鉴权写进 IAM Dao。
  - 让 core:authorization 依赖 core:authentication。
- 何时不该调用：
  - 纯内部批任务，且不暴露需要鉴权的 HTTP 资源时。
- 资料入口：`business-module-adoption-reference.md`、`capabilities/README.md`

### `core:oauth2`：OAuth2 客户端与机器访问 SPI

- 层级：`core`
- 触发：
  - 第三方应用、OAuth client、redirect URI、scope 或机器访问。
  - 需要在正式模块实现 OAuth2 客户端治理，而不是自建协议。
- 必须复用：
  - 默认采用 modules:application-center 承载 OAuth client/scope；core:oauth2 只提供 SPI。
  - 业务已有组织接入功能点时，在该模块实现 core:oauth2 SPI，不平行再造一套。
- 禁止自造：
  - 把 OAuth client 或 scope 塞进 IAM。
  - 自建 OAuth 回调、client 表或平行 token 协议。
- 何时不该调用：
  - 只有人机登录，没有第三方 client 或机器访问时。
- 资料入口：`business-module-adoption-reference.md`、`capabilities/README.md`

### `core:transport`：请求响应传输封装与传输安全执行

- 层级：`core`
- 触发：
  - 需要统一请求/响应封装、传输安全策略执行或前端 HTTP 客户端。
  - 安全设置里的传输安全策略需要落到实际请求链。
- 必须复用：
  - 通过 starter 装配 core:transport；前端使用 @wildbuck/core-transport-frontend。
  - 传输策略由 modules:security-setting 治理，执行仍在 core:transport。
- 禁止自造：
  - 自建平行 HTTP 封装、签名客户端或绕过 starter 传输链。
  - 在业务模块重写传输安全 filter。
- 何时不该调用：
  - 纯内部非 HTTP 调用，或不走浏览器传输链时。
- 资料入口：`business-module-adoption-reference.md`、`business-frontend-ui-reference.md`

### `core:audit`：审计事件模型与发布 SPI

- 层级：`core`
- 触发：
  - 登录、安全、ORM 或业务动作需要发布可落库的审计事件。
  - 需要统一审计事件模型，而不是模块私有日志表。
- 必须复用：
  - 业务动作通过 BrickAuditPublisher 发布 core:audit 标准事件。
  - 落库、搜索和详情页采用 modules:audit，不在业务模块再建审计表。
- 禁止自造：
  - 自建审计事件模型或把采集规则写进业务模块。
  - 把认证/ORM 内部采集回流到业务仓。
- 何时不该调用：
  - 只要产品使用分析或请求完成日志，不需要可检索审计事件时。
- 资料入口：`business-module-adoption-reference.md`、`capabilities/README.md`

### `core:notification-mail`：SMTP 邮件通知 provider

- 层级：`core`
- 触发：
  - 需要通过 EMAIL/SMTP 发送通知、验证码或 MFA 邮件。
  - 邮件发送运行时需要正式通道，而不是业务仓直连 SMTP。
- 必须复用：
  - 发送运行时用 core:notification-mail；正式 SMTP 配置由 modules:notification-setting 治理。
  - 通过 core:notification 路由，不在业务模块写 JavaMailSender。
- 禁止自造：
  - 业务模块直连 SMTP 或硬编码 spring.mail.* 作为正式通道。
  - 把发件人治理或通道配置写进通知运行时。
- 何时不该调用：
  - 不发送邮件，或只使用测试 mock、不接真实 SMTP 时。
- 资料入口：`business-module-adoption-reference.md`、`capabilities/README.md`

### `core:ai-agent`：Buck AI 工具 SPI、执行策略与脱敏边界

- 层级：`core`
- 触发：
  - 业务工具需要声明 toolCode、权限、执行策略或 JSON schema。
  - AI 助手或 MCP 需要同一套工具执行门，而不是通道各自放行。
- 必须复用：
  - 模块通过 BrickAiToolProvider / BrickAiToolExecutor 贡献工具。
  - 写工具默认 ASK；可见性与执行走 BrickAiToolGuard。FULL_ACCESS 不能跳过确认。MCP 必须复用同一执行门。
- 禁止自造：
  - 自建工具注册表、绕过 Guard 直调 executor，或让 FULL_ACCESS 覆盖 ASK。
  - 创建通用 CRUD/数据库/任意 OpenAPI Agent，或工具内 JDBC/手写 SQL。
- 何时不该调用：
  - 不向 AI 暴露业务工具、纯人工控制台时。
- 资料入口：`business-module-adoption-reference.md`、`capabilities/README.md`

### `modules:ai-assistant`：业务 AI 助手、会话、工具调用确认和侧栏入口（released-candidate）

- 层级：`module`
- 触发：
  - 业务需要提供可对话的 AI 助手、模型会话、助手侧栏或多助手入口。
  - 业务需要让 AI 调用业务功能、读取业务摘要、生成建议或在人工确认后执行高风险动作。
- 必须复用：
  - 后端采用 buck-module-ai-assistant-backend，并通过 BrickAiAssistantDefinitionProvider 声明业务助手 code、名称、模型服务、系统提示词、业务权限和 toolCodes。
  - 业务工具通过 core:ai-agent 的 BrickAiToolProvider 声明工具描述，通过 BrickAiToolExecutor 执行业务服务逻辑。
  - 前端采用 @wildbuck/module-ai-assistant-frontend；标准控制台壳优先用 @wildbuck/module-ai-assistant-frontend/shell-entry，已有自定义右侧宿主时再用 @wildbuck/module-ai-assistant-frontend/assistant-panel，完整页面用 ./page-registry，从后端读取当前主体可用助手和会话，不硬编码助手列表。
- 禁止自造：
  - 在业务仓库自建 AI 会话表、助手目录、工具调用状态机或前端助手清单。
  - 创建通用 CRUD Agent、通用数据库 Agent、任意 OpenAPI Agent 或让工具直接 JDBC/手写 SQL 访问数据。
  - 复制 validation/security-console 的验证壳实现作为正式 AI 助手来源。
- 何时不该调用：
  - 只要外置 Agent MCP 面、不要控制台助手侧栏时。
  - 未接受 released-candidate 风险时。
- 资料入口：`business-module-adoption-reference.md`、`upper-application-development-guide.md`、`modules/ai-assistant/README.ai.md`、`capabilities/README.md`

### `core:mcp`：外置 Agent MCP 服务端宿主与工具暴露

- 层级：`core`
- 触发：
  - 独立进程的外置 Agent 或助手服务需要通过标准 MCP 调用本业务系统受控能力。
  - 业务应用需要对外提供 tools/list、tools/call 等 MCP 服务端面，而不是侧栏 AI 助手会话。
- 必须复用：
  - 显式依赖 buck-core-mcp，启用 brick.mcp.enabled=true；生产保持 allow-anonymous 默认 false，勿照抄验证壳。
  - 推荐用 core:ai-agent 的 BrickAiToolProvider 与 BrickAiToolExecutor 贡献业务工具；classpath 有 ai-agent 时由框架自动桥接到 MCP。写工具/ASK 工具经 BrickAiToolGuard，未经确认返回 REQUIRES_CONFIRMATION，不直接执行。
  - 仅当工具不应进入 AI 助手目录时，再实现 BrickMcpToolProvider 直贡献。
  - 工具只调用业务 service，复用业务功能点权限；平台安全/IAM/审计等能力命中对应正式模块。
- 禁止自造：
  - 自建长期平行 MCP 服务端、平行 tool registry 或把管理端 CRUD 当外置 Agent 主路径。
  - 创建通用数据库 Agent、任意 OpenAPI 自由调用 Agent，或工具内 JDBC/手写 SQL。
  - 生产复制验证壳 allow-anonymous=true；把外置 Agent 协议面绑进 modules:ai-assistant 会话。
- 何时不该调用：
  - 只要控制台 AI 侧栏会话、不要外置 Agent 协议面时。
- 资料入口：`business-module-adoption-reference.md`、`upper-application-development-guide.md`、`capabilities/README.md`

### `modules:identity-federation`：外部身份联邦、目录同步与身份关联（released-candidate）

- 层级：`module`
- 触发：
  - 需要 OAuth2、钉钉等外部身份源登录。
  - 需要把外部通讯录同步到本地员工/组织，或把外部主体关联到本地员工。
- 必须复用：
  - 采用 buck-module-identity-federation-backend 与 @wildbuck/module-identity-federation-frontend/page-registry。
  - 本地主数据仍走 modules:iam 目录端口；登录入口白名单在 modules:security-setting。
- 禁止自造：
  - 把身份源、同步中心或身份关联写回 IAM。
  - 自建 OAuth 回调、同步任务表或平行绑定协议。
- 何时不该调用：
  - 只有本地账号登录、不接外部身份源时。
  - 未接受 released-candidate 风险时。
- 资料入口：`business-module-adoption-reference.md`、`modules/identity-federation/README.ai.md`

### `modules:login-brand`：登录页品牌、系统名称、Logo 与背景（released-candidate）

- 层级：`module`
- 触发：
  - 需要管理登录页系统名称、描述、Logo、背景或布局位置。
  - 需要登录页品牌跟随控制台主题或使用受控模板。
- 必须复用：
  - 采用 buck-module-login-brand-backend 与 @wildbuck/module-login-brand-frontend/page-registry。
  - 公开呈现走 core:client-meta 的 capabilities.loginBrand，图片走 core:file-resource。
- 禁止自造：
  - 把登录页品牌合成写回 IAM。
  - 自造多租户品牌表或任意 CSS/像素拖拽。
  - 把正式品牌配置沉到 validation。
- 何时不该调用：
  - 使用默认登录文案且不管理 Logo 或背景时。
  - 未接受 released-candidate 风险时。
- 资料入口：`business-module-adoption-reference.md`、`modules/login-brand/README.ai.md`

### `modules:iam`：IAM 身份、角色、权限、菜单和会话

- 层级：`module`
- 触发：
  - 用户、员工、组织、角色、菜单、权限、权限分配、当前主体或在线会话治理。
  - 需要管理员重置密码、强制下线或主体授权画像。
- 必须复用：
  - 后端采用 buck-module-iam-backend，前端治理页面通过 @wildbuck/module-iam-frontend/page-registry 装配。
  - 上层应用通过 brick.iam.bootstrap.* 配置初始化管理员、组织和员工档案。
- 禁止自造：
  - 自建 UserController、RoleController、MenuController、PermissionController 或 SessionController 替代 IAM。
  - 业务模块直接引入 IAM Dao 初始化主数据。
- 何时不该调用：
  - 纯匿名公开页，不治理账号、角色或会话目录时。
- 资料入口：`business-module-adoption-reference.md`、`modules/iam/README.ai.md`、`capabilities/README.md`

### `modules:notification-setting`：EMAIL/SMTP 提供方配置与邮件通道治理

- 层级：`module`
- 触发：
  - 业务需要正式管理 SMTP 主机、端口、账号、密码、发件地址或发件人名称。
  - EMAIL MFA 或其他邮件通知需要复用统一正式通道，而不是只靠本地私有 spring.mail.*。
- 必须复用：
  - 后端采用 buck-module-notification-setting-backend，前端页面通过 @wildbuck/module-notification-setting-frontend/page-registry 装配。
  - 邮件发送运行时仍由 core:notification-mail 承担，本模块只治理正式配置来源。
- 禁止自造：
  - 在验证壳、业务页面或仓库配置里硬编码正式 SMTP provider、账号、发件地址或 provider 路由语义。
  - 把用户邮箱主数据、MFA 策略或短信通道配置塞进通知配置模块。
- 何时不该调用：
  - 不发送邮件，或不需要运行时治理正式 SMTP 时。
- 资料入口：`business-module-adoption-reference.md`、`business-frontend-ui-reference.md`、`capabilities/README.md`

### `modules:security-setting`：登录安全、密码策略、MFA 和传输安全配置

- 层级：`module`
- 触发：
  - 登录失败冻结、弱密码库、密码策略、MFA 策略、单点登录策略或传输安全配置。
  - 需要运行时治理认证安全策略，而不是写死配置。
- 必须复用：
  - 后端采用 buck-module-security-setting-backend，前端页面通过 @wildbuck/module-security-setting-frontend/page-registry 装配。
  - 认证执行仍由 core:authentication 和 core:transport 负责，安全设置模块只治理策略。
- 禁止自造：
  - 自建安全策略表、密码策略 controller、MFA 策略页面或传输安全配置页。
  - 把登录认证 filter 或 controller 放进业务安全设置代码。
- 何时不该调用：
  - 资源服务不承载登录安全、密码、MFA 或传输策略治理时。
- 资料入口：`business-module-adoption-reference.md`、`modules/security-setting/README.ai.md`、`capabilities/README.md`

### `modules:audit`：审计日志落库、查询和详情页

- 层级：`module`
- 触发：
  - 审计日志存储、审计搜索、审计详情页、登录审计、安全审计、ORM 变更审计或业务动作审计查询。
  - 需要把 core:audit 发布的事件落库并提供统一查询入口。
- 必须复用：
  - 业务动作发布 core:audit 标准事件，审计落库和查询采用 modules:audit。
  - 前端审计页面通过 @wildbuck/module-audit-frontend/page-registry 装配。
- 禁止自造：
  - 自建 AuditLogEntity、审计表、审计查询 controller 或审计页面替代审计模块。
  - 把认证、ORM 拦截器内部采集规则回流到审计模块或业务模块。
- 何时不该调用：
  - 只要请求完成日志或 usage-event，不需要审计检索页时。
- 资料入口：`business-module-adoption-reference.md`、`modules/audit/README.ai.md`、`capabilities/README.md`

### `modules:application-center`：应用中心、OAuth client、scope 和动作白名单

- 层级：`module`
- 触发：
  - 第三方应用、应用密钥、OAuth client、redirect uri、scope、OpenAPI 动作目录或机器访问白名单治理。
  - 业务需要治理应用实例和应用到 OpenAPI 动作的授权关系。
- 必须复用：
  - 默认采用 buck-module-application-center-backend 和 @wildbuck/module-application-center-frontend/page-registry。
  - 业务已有组织接入功能点时，可在该业务模块实现 core:oauth2 SPI；明确需要防重放/防篡改时再实现 core:openapi HMAC integrity SPI。
- 禁止自造：
  - 把应用接入塞进 IAM。
  - 自建 OAuth client、scope、应用动作白名单或访问日志模型替代应用中心。
- 何时不该调用：
  - 没有第三方应用、OAuth client 或 OpenAPI 动作白名单治理时。
- 资料入口：`business-module-adoption-reference.md`、`modules/application-center/README.ai.md`、`capabilities/README.md`

### `core:orm-plus`：业务持久化、迁移、逻辑删除、敏感字段和签名字段

- 层级：`core`
- 触发：
  - 业务实体持久化、Flyway 迁移、逻辑删除、敏感字段、签名字段、变更日志或主键策略。
  - 需要把 Entity/DO、契约、迁移产物和 MyBatis-Plus 映射保持一致。
- 必须复用：
  - 业务持久化走 contract、标准 Flyway 迁移产物、MyBatis-Plus 和 core:orm-plus。
  - 业务表有且只有一个 string(20) 主键，Entity 使用 @TableId(type = IdType.ASSIGN_ID)。
- 禁止自造：
  - 运行时代码手写 SQL、直接 JDBC、无主键表或复合主键默认建模。
  - 自建存储加密、签名或变更日志机制。
- 何时不该调用：
  - 纯前端包或无持久化的模块时。
- 资料入口：`business-module-adoption-reference.md`、`upper-application-development-guide.md`、`rules/forbidden-patterns.md`

## 当前模块快照

- `ai-assistant`：前端包 `@wildbuck/module-ai-assistant-frontend`，权限 2 个，页面 2 个，query `ai-assistant.assistant.list`, `ai-assistant.model-service.list`, `ai-assistant.tool-call.pending`，option none。
- `application-center`：前端包 `@wildbuck/module-application-center-frontend`，权限 3 个，页面 1 个，query `application-center.application.list`, `application-center.call-record.list`，option `application_center_application_type`, `application_center_call_record_result`。
- `audit`：前端包 `@wildbuck/module-audit-frontend`，权限 2 个，页面 1 个，query `audit.log.list`，option `audit_log_category`, `audit_log_result`。
- `iam`：前端包 `@wildbuck/module-iam-frontend`，权限 14 个，页面 5 个，query `iam.employee.list`, `iam.role.list`, `iam.session.list`，option `iam_session_authentication_mode`, `iam_session_status`。
- `identity-federation`：前端包 `@wildbuck/module-identity-federation-frontend`，权限 8 个，页面 3 个，query `iam.authsource.list`，option `iam_identity_source_type`, `iam_identity_source_verification_status`, `iam_identity_sync_run_status`。
- `login-brand`：前端包 `@wildbuck/module-login-brand-frontend`，权限 2 个，页面 1 个，query none，option none。
- `notification-setting`：前端包 `@wildbuck/module-notification-setting-frontend`，权限 2 个，页面 1 个，query none，option none。
- `security-setting`：前端包 `@wildbuck/module-security-setting-frontend`，权限 8 个，页面 4 个，query none，option `security_setting_login_mfa_mode`, `security_setting_password_lifecycle_action`, `security_setting_transport_digest_algorithm`。

## 当前 core 前端包

- `@wildbuck/core-api-frontend`：`.`
- `@wildbuck/core-authentication-frontend`：`.`
- `@wildbuck/core-authorization-frontend`：`.`
- `@wildbuck/core-client-meta-frontend`：`.`
- `@wildbuck/core-i18n-frontend`：`.`
- `@wildbuck/core-option-frontend`：`.`
- `@wildbuck/core-query-frontend`：`.`
- `@wildbuck/core-transport-frontend`：`.`
- `@wildbuck/core-ui-frontend`：`.`, `./appearance`, `./download`, `./fields`, `./i18n`, `./list-panel.css`, `./patterns`, `./pwa`, `./session-recovery-ui`, `./settings-page.css`, `./shell`, `./shell-navigation`, `./status`, `./theme`, `./theme.css`, `./workspace-profile`
- `@wildbuck/core-usage-event-frontend`：`.`
