# Buck 2.0.0-11 业务应用禁止事项

- 禁止复制 `buck` 源码到业务仓库。
- 禁止业务 agent 读取、搜索、打开、修改、提交或推送 `buck` 源码仓库或本地 checkout。
- 禁止通过 Gradle `project(...)`、`includeBuild` 或 npm workspace 直连框架源码。
- 禁止把 `buck` CI artifacts、临时下载目录或外部 release zip 作为业务开发优先资料源；确需下载 artifact 时，必须先回填到业务仓库 `docs/buck/2.0.0-11/`。
- 禁止深度引入 `@wildbuck/*` 包未导出的内部文件。
- 禁止把 `@wildbuck/core-ui-frontend/patterns` 的 block/action 当成低代码运行时平台；不得存储运行时 UI schema，不得由后端返回筛选控件布局、组件类型、按钮结构或页面文案。
- 禁止在业务运行时代码手写 SQL 或直接使用 JDBC；Flyway DDL 迁移产物只能放在标准 `db_<app-or-component>/<database>` 目录。
- 禁止创建无主键业务表；生产 DO/Entity 主键必须使用 `@TableId(value = "...", type = IdType.ASSIGN_ID)`，不要使用 `IdType.INPUT`。
- 禁止删除后端模板里的 Lombok、MapStruct 和 annotationProcessor 依赖；版本由 `buck-bom` 统一约束。
- 禁止删除后端 Bean Validation 入口；保留 `buck-starter-application` 或显式依赖 `spring-boot-starter-validation`，业务 `@RequestBody` 入参必须使用 `@Valid` / `@Validated`，Request/Command/Query DTO 关键字段必须声明 `jakarta.validation.constraints` 约束。
- 禁止把 Entity/DTO/Command 重复转换写成散落 setter 代码；业务转换统一用 `@Mapper(componentModel = "spring")`。
- 禁止把 MapStruct mapper 放到 `controller`、`repository` 或业务根级 `mapper` 目录；MapStruct mapper 放 `applet/<feature>/service/mapper`，由 service 持有，MyBatis-Plus 持久化 Dao 才属于 `repository` 边界。
- 禁止在 service 中暴露 public nested DTO/Command/Query/Request/Response/Page/Detail record；这些 HTTP 契约类型默认放在 `applet/<feature>/dto`，采用模块级 `openapi/` 接口边界时允许放在 `openapi/dto`。
- 禁止业务 Controller 公共接口返回 `FaceXxxService.*`、泛型中的 service 嵌套类型或任何 `.service` 包类型。
- 禁止业务 Controller 依赖 `BrickDtoMapper`、`service/mapper` MapStruct mapper 或 `repository` Entity/DO；DTO 与持久化对象转换只在 service 层编排。
- 禁止业务 Controller 把前端代理前缀 `/api` 写入 Spring 映射；采用默认 rewrite 时后端映射使用真实业务路径。
- 禁止在业务应用自造登录、鉴权、查询、选项、传输或审计平行机制。
- 禁止用本地 mock 后端、本地 mock 菜单、本地 mock 权限或本地 mock 业务数据作为调试和验收依据；业务仓库不得保留 `mock:backend`、`mock-backend` 或 `frontend/scripts/mock-backend.*` 这类入口。前端调试前必须先启动真实后端并代理真实后端，临时视觉预览不得替代真实后端验证。
- 禁止自建 `TraceIdFilter`、`RequestLoggingFilter`、请求/响应 body 日志或本地 observability 子系统；生产排障 traceId、MDC 和请求完成日志走 `core:observability`。
- 禁止沿用历史 `%X{logRequestId}` 作为 Buck 请求标识；业务 Logback 主日志 pattern 必须包含 `%X{traceId}`，并且不要把 usage event JSON line、审计事实和生产排障日志混成一个格式。
- 禁止自建平行 client meta endpoint、配置中心或前端启动配置协议；浏览器启动公开运行时元数据走 `core:client-meta` 和 `@wildbuck/core-client-meta-frontend`，不得返回密钥、token、连接串、请求体、表单内容或业务对象明文，不替代 `/transport/meta`。
- 禁止自建平行埋点框架、usage event endpoint、日志格式或本地 usage/event 子系统；产品使用事件走 `core:usage-event`，不得匿名开放 `/brick/usage-events/collect`，不得采集姓名、手机号、身份证号、token、密码、密钥、请求体、表单内容、附件内容或业务对象明文。
- 禁止把图片 Base64、大字段二进制或文件内容写入业务表、日志表、审计 payload 或列表接口；图片和业务附件资源走 `core:file-resource`，业务附件图片分类使用 `BUSINESS_ATTACHMENT`，留存清理时先禁用资源引用，再删除业务记录。
- 禁止在 Controller/Service 中用 `LambdaQueryWrapper`、`QueryWrapper` 或 `Wrappers.lambdaQuery` 加 `selectList/selectPage` 手写页面列表筛选、分页或排序；页面列表走 `core:query`，内部精确读取才可保留 MyBatis-Plus。
- 禁止前端页面硬编码静态 `<el-option label="..." value="...">` 或本地 `xxxOptions = [{ label, value }]` 选项数组；下拉、单选、多选、标签和字典选项先由后端 `BrickOptionProvider` 提供，前端通过 `@wildbuck/core-option-frontend` 加载后 `v-for` 渲染。
- 禁止在 Buck 基础能力不足时先在业务仓库造轮子；必须向 brick-next 提交中文 Issue。
- 禁止删除或绕过 `rules/check-business-structure.mjs` CI 门禁。
- 禁止创建标准白名单外目录；`query/`、`audit/`、`integration/` 只是典型例子，不是单独黑名单。
- 查询能力必须复用 `core:query`、DO 元数据和显式查询定义。
- 内部按主键、唯一键或固定外键精确读取不等于页面列表；一旦出现 `like`、`orderBy`、`selectPage`、手写 page/size 或前端可控排序字段，必须改为 `core:query`。
- 审计采集走 DO 注解、ORM 生命周期和 `core:audit`，审计查询优先采用 `modules:audit`。
- 生产排障 traceId、MDC、响应头 `trace-id` 和请求完成日志走 `core:observability`。
- 浏览器启动公开运行时元数据走 `core:client-meta` 和 `@wildbuck/core-client-meta-frontend`；业务壳读取 `/brick/client-meta`，不重复维护各 core 能力的前端开关和 endpoint。
- 产品使用事件采集走 `core:usage-event` 和 `@wildbuck/core-usage-event-frontend`，默认关闭，业务需要产品分析时由后端配置和 client-meta 统一驱动前端 bootstrap；模块级事件接入用 `createModuleUsageTracker()`，页面用 `trackAction(featureKey, actionCode, asyncFn)` 自动记录成功/失败，动作结果已由页面流程确定时用 `trackActionResult(featureKey, actionCode, result)` 写入 `SUCCESS` / `FAILURE` / `CANCELLED` / `ABANDONED`；后端-only 动作使用 `BrickUsageEvents.action()` 构造并显式发布，不能和前端重复发布同一语义事件；collect endpoint 复用业务认证、鉴权、网关和传输安全链路，不是匿名日志入口。
- 图片和业务附件资源走 `core:file-resource`；业务页面使用 `BrickImageUploadField`，业务表只保存 resourceId、分类、大小和 expireAt，留存清理先禁用资源引用再删除业务记录。
- 外部系统用 `client/remote`，对外 API 用 `openapi`，多模块内部协作用 `innerapi`。
- 禁止单模块业务后端创建 `innerapi`；只有多模块构件化结构才保留 `innerapi`。
- 禁止自建 `UserController`、`RoleController`、`MenuController`、`PermissionController`、`SessionController` 来替代 IAM。
- 禁止自建 SMTP 提供方配置表、邮件通道配置页、发件人身份配置或正式 EMAIL provider 路由语义来替代 `modules:notification-setting`。
- 禁止自建 `AuditLogEntity`、审计表、审计查询 controller 或审计页面来替代审计模块。
- 禁止自建密码策略表、MFA 策略表、登录安全配置页来替代安全设置模块。
- 禁止自建 OAuth client、scope、应用动作白名单来替代应用中心模块。
- 禁止自建长期 OpenAPI HMAC Filter、认证失败 Filter、签名 canonical 规则、timestamp 校验、nonce 防重放、scope/action 主校验或访问日志模型；业务组织接入的 OAuth2 client credentials 通过 `core:oauth2` SPI 接入，接口调用记录通过一个 `OpenApiAccessLogSink` 接收 Bearer 认证失败、HMAC 失败、Scope 拒绝、业务响应和业务异常。HMAC 只能作为 Bearer 后置完整性扩展，通过 `OpenApiHmacIntegrityCredentialProvider` 提供签名密钥，通过 `OpenApiHmacIntegrityValidator` 做业务二次完整性校验，集群环境替换 `OpenApiHmacNonceStore`，不得作为直连认证路径。
- 禁止复制 `BrickConsoleSidebar`、自建 Topbar 或把菜单搜索放进一套局部壳层；菜单快速检索使用 `sidebar-searchable`，顶部栏全局动作使用 `topbar-actions`。
- 禁止复制本地 `.filter-bar`、`.query-toolbar` 或 `.universal-query-toolbar` 筛选工具条样式；业务筛选区使用 `@wildbuck/core-ui-frontend/patterns` 的 `BrickFilterToolbar`。
- 禁止在删除、重置、强制下线、密钥轮换或全局配置保存中直接使用 `ElMessageBox.confirm` 自造危险确认；危险确认使用 `@wildbuck/core-ui-frontend/patterns` 的 `BrickRiskConfirm`。
- 禁止给标准 `BrickConsoleDrawer` 传固定像素 `size`，例如 `size="520px"`；默认使用 Buck 响应式宽度，确需例外时写入业务决策文档。
- 禁止各业务页面自造不同语义的蒙版向导；向导由业务侧实现具体步骤，但入口、`data-guide-id`、步骤配置、完成态和抽屉内目标定位必须遵循 Buck 统一规范。

发现 Buck bug、缺少基础能力、文档模糊、功能不符合预期，或业务 agent skill / 资料包有完善空间时，不要只在业务应用中长期绕行；提交到：

https://github.com/wu9007/buck/issues

Issue 使用中文标题和正文；错误日志、类名、接口名和配置键可以保留原文。
