# 端到端业务切片 Recipe

本 recipe 面向业务开发智能体，说明如何用 Buck 2.0.0-11 实现一个业务切片。示例以“人脸档案”为占位业务域，正式业务系统应替换为自己的实体、权限和页面。

## 1. 先做采用决策

在 `docs/business/module-adoption-decision.md` 记录：

- 是否需要 `modules:iam` 承载身份治理。
- 是否需要 `modules:notification-setting` 承载 EMAIL/SMTP 提供方配置和邮件通道治理。
- 是否需要 `modules:security-setting` 承载安全策略。
- 是否需要 `modules:audit` 承载审计查询和落库。
- 是否需要 `modules:application-center` 承载 OpenAPI / OAuth client。

先完成能力命中判断。命中下列能力时必须采用对应模块；不采用必须写明原因、替代方案、风险和确认人，并等待确认：

| 业务需求命中项 | 必须采用 |
| --- | --- |
| 用户、员工、组织、角色、菜单、权限、会话 | `modules:iam` |
| EMAIL/SMTP 提供方配置、邮件通道治理、发件人身份配置 | `modules:notification-setting` |
| 登录安全、密码策略、弱密码库、MFA、传输安全配置 | `modules:security-setting` |
| 审计日志落库、查询、详情页 | `modules:audit` |
| 生产排障 traceId、MDC、请求完成日志、响应头 trace-id | `core:observability` |
| 浏览器启动公开运行时元数据 | `core:client-meta`、`@wildbuck/core-client-meta-frontend` |
| 产品使用事件、功能曝光/进入/动作完成/失败/放弃采集 | `core:usage-event`、`@wildbuck/core-usage-event-frontend` |
| 图片资源、业务附件图片、资源引用、内容预览和到期清理 | `core:file-resource`、`@wildbuck/core-ui-frontend/fields` |
| OAuth client、OpenAPI、scope、应用动作白名单 | 默认 `modules:application-center`；业务已有组织接入功能点时先确认认证模型，OAuth2 client credentials 实现 `core:oauth2` SPI，需要防重防篡改时再实现 `core:openapi` HMAC integrity SPI |
| 列表查询、分页、排序 | `core:query` |
| 下拉、单选、多选、标签选项 | `core:option` / `BrickOptionProvider` |
| 持久化、迁移、敏感字段、签名、变更日志 | contract、MyBatis-Plus、`core:orm-plus` |

如果对外 OpenAPI 入口需要匿名穿过后台 JWT 鉴权，使用 `BrickAuthorizationRuleContributor` 注册匿名入口；路径模式支持 `{id}` 单段变量和 `**` 多段通配，例如：

```java
registry.register(BrickAuthorizationRule.anonymous("POST", "/openapi/face/**"));
```

授权主模型使用 `actionId`，例如 `face.record.import`；`method + path` 只用于运行时匹配接口，业务场景码只做业务二次校验。业务已有组织接入功能点时，OAuth2 client credentials 通过 `core:oauth2` SPI 接入；需要防重放/防篡改时，只实现 `core:openapi` 的 `OpenApiHmacIntegrityCredentialProvider` 和 `OpenApiHmacIntegrityValidator`，集群环境替换 `OpenApiHmacNonceStore`；接口调用记录实现一个 `OpenApiAccessLogSink` 即可接收 Bearer 认证失败、HMAC 失败、Scope 拒绝、业务响应和业务异常，不复制通用 HMAC Filter、认证失败 Filter、签名 canonical 规则、防重放机制或访问日志模型。

## 2. 定义业务边界

在 `docs/business/requirements.md` 写清：

- 业务目标。
- 实体和字段。
- 列表、详情、新增、修改、删除等动作。
- 明确不做的功能。

在 `docs/business/backend-structure.md` 写清后端结构：

- 默认单模块：`backend/src/main/java/com/example/<app>/applet/<feature>/controller,dto,repository,service,provider`。
- 如果业务把对外 OpenAPI 接口作为模块级根目录 `openapi/` 边界组织，在结构说明里明确写出 `openapi/controller`、`openapi/service` 和 `openapi/dto` 属于该边界的合法目录，不要把 `com.xxx.openapi.dto` 迁成 `com.xxx.applet.openapi.dto`。
- 只有多个业务构件需要进程内协作时才使用多模块：`<app>-module-common`、`<app>-module-<component>`、`<app>-boot`。
- 单模块不创建 `innerapi`；多模块才使用 common 中的 `innerapi` 契约和构件实现。
- 只使用标准白名单目录；`query/`、`audit/`、`integration/` 等未列入标准结构的目录不得新增。
- 保留 CI 门禁：`node docs/buck/2.0.0-11/rules/check-business-structure.mjs .`。

## 3. 规划权限、菜单和审计

```text
权限：
- face:archive:list
- face:archive:edit

菜单：
- code: face.archive
- path: /face/archives

审计：
- category: FACE_ARCHIVE
- action: CREATE / UPDATE / DISABLE
```

## 4. 后端实现

- Controller 使用 `@PreAuthorize`。
- Controller 的 `@RequestBody` 入参使用 `@Valid` / `@Validated`，Request/Command/Query DTO 在关键字段上声明 `jakarta.validation.constraints`。
- 查询、分页、排序来自 DO 元数据、显式 `BrickQueryDefinition`、字段白名单和 `core:query`，不写业务本地万能查询框架。
- 生产排障 traceId、MDC、响应头和请求完成日志来自 `core:observability`，不写业务本地 TraceIdFilter 或 RequestLoggingFilter。
- 浏览器启动公开运行时元数据来自 `core:client-meta` 和 `@wildbuck/core-client-meta-frontend`，业务壳读取 `/brick/client-meta`，不自建平行 meta endpoint。
- 产品使用事件来自 `core:usage-event`，业务页面使用 `@wildbuck/core-usage-event-frontend` 从 client-meta 自动 bootstrap，模块级事件接入用 `createModuleUsageTracker()`，页面用 `trackAction(featureKey, actionCode, asyncFn)` 或 `trackActionResult(featureKey, actionCode, result)`，后端-only 动作使用 `BrickUsageEvents.action()` 构造后通过 `BrickUsageEventPublisher` 发布；不要本地拼 JSON line、日志 marker、采集 endpoint、payload 或页面 success/failure wrapper 分支，也不要匿名开放 `/brick/usage-events/collect`。
- 前端需要提交统一查询 DSL 时使用 `@wildbuck/core-query-frontend`；后端仍用 `BrickQueryDefinition` 做最终边界校验。
- 页面列表接口用 `QueryCriteria` 调 `BrickQueryExecutor`；不要在 Controller/Service 中用 MyBatis-Plus wrapper 直接 `selectList/selectPage` 手写 `like`、`orderBy`、page/size 或前端可控筛选。内部精确读取、唯一性校验和删除前引用检查可以保留 `selectById`、`selectOne` 或固定 `eq` 查询。
- 选项在功能点 `provider` 中实现 `BrickOptionProvider`；前端使用 `@wildbuck/core-option-frontend` 加载，不在 Vue 页面硬编码选项。
- DO 上的 `@BrickPersistentEntity` / `@BrickChangeLogField` 承载数据变更审计元数据；业务动作审计在 service 使用 `BrickAuditPublisher`。
- 持久化代码走契约、MyBatis-Plus 和 `core:orm-plus`，不在运行时代码写 SQL/JDBC。
- 建表 DDL 必须声明 primary key；业务表主键统一为 `string(20)`，生产 DO/Entity 使用 `@TableId(value = "...", type = IdType.ASSIGN_ID)` 和 `String` 主键字段。
- ORM Plus 物理映射来自 MyBatis-Plus，Buck 注解只补审计、敏感和签名元数据；不要重复维护表名、列名、主键、字段长度或可空性，结构约束以 contract/Flyway 为准。
- 业务后端强制使用 Lombok 和 MapStruct。Spring 组件优先 `@RequiredArgsConstructor`，Entity/DO 使用 `@Getter`、`@Setter`、`@Accessors(chain = true)`，Entity 与 DTO/Command/Response 的重复转换放到 `@Mapper(componentModel = "spring")`。
- MapStruct mapper 放在 `applet/<feature>/service/mapper` 并由 service 持有；MyBatis-Plus 持久化接口统一命名为 `Dao`，放在 `repository`，继承 `BrickBaseDao<T>` 并标注 `@Dao`，不能混用包名或让 Controller 依赖 mapper/Entity 来绕过边界。
- 当前资料包未发布业务仓库迁移生成器时，建表和字段变更允许作为评审过的 Flyway DDL 迁移产物放在 `src/main/resources/db_<app-or-component>/<database>/V<business-version>_<seq>__<description>.sql`；不要把这类 SQL 放进 controller、service、repository、Mapper XML 或启动脚本。
- 如果切片涉及用户、角色、菜单、权限、会话、安全策略、审计查询或应用接入治理，不要在业务仓库新建平行 controller/entity/page，先采用对应 Buck 模块。

发布包不再提供可复制的业务后端样板代码，避免业务仓库把示例返回、示例表或示例 service 当成验收依据。后端实现以本 recipe、`templates/backend-minimal`、`rules/check-business-structure.mjs` 和业务需求文档为准。

## 5. 迁移产物和验收

当前资料包没有发布业务仓库迁移生成器时，迁移按业务系统版本建立在后端资源目录：

```text
backend/src/main/resources/db_face/pg/V1.0.0_01__create_face_archive_table.sql
backend/src/main/resources/db_face/mysql/V1.0.0_01__create_face_archive_table.sql
```

规则：

- 迁移文件只放 DDL/DML 迁移产物，不放业务初始化脚本、账号初始化脚本或运行时代码 SQL。
- 如果业务系统声明支持多个数据库，同一版本迁移要在对应数据库目录下同时补齐。
- 新增或修改迁移后至少运行后端测试和发布资料包规则检查。

```bash
(cd backend && gradle test)
node docs/buck/2.0.0-11/rules/check-business-structure.mjs .
```

## 6. 前端实现

- 请求统一走 `@wildbuck/core-api-frontend` 的 `request()`；默认代理下调用 `request('/face-archives')`，浏览器请求 `/api/face-archives`，后端真实路径仍是 `/face-archives`。
- 页面列表查询条件可用 `@wildbuck/core-query-frontend` 构造 `QueryCriteria`；下拉、单选、多选、标签选项使用 `@wildbuck/core-option-frontend`，不要在页面里硬编码选项。
- 页面使用 Element Plus。
- 样式使用 `--console-*` token。
- 模块治理页面通过 `@wildbuck/module-*-frontend/page-registry` 装配。

可参考：

- `examples/frontend-shell/src/pages/FaceArchiveList.vue`

## 7. 验证

至少运行：

```bash
cd backend && gradle test
cd frontend && npm ci && npm run check
```

如果业务仓库增加契约或生成物，还必须运行自己的生成和生成物检查命令。

业务仓库 CI 必须先运行：

```bash
node docs/buck/2.0.0-11/rules/check-business-structure.mjs .
```

该检查失败时，先修目录或采用 Buck 基础能力；如果是 Buck 能力缺口，向 brick-next 提交中文 Issue，不能在业务仓库造轮子。

## 8. Buck 演进闭环

如果开发中发现 Buck bug、缺少基础能力、文档模糊、功能不符合预期，或业务 agent skill / 资料包有完善空间，不要只在业务仓库绕行。请在 brick-next Issues 创建问题：

https://github.com/wu9007/buck/issues

Issue 使用中文标题和正文；错误日志、类名、接口名和配置键可以保留原文。Issue 至少包含：类型、业务系统、Buck 版本、业务场景、当前阻塞、期望行为或修复点、实际行为或缺口、影响范围、临时绕行方案、建议归属模块和验证方式。
