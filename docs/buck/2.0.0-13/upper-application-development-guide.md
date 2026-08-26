# 上层业务应用开发指南

本文档面向独立上层业务应用的业务开发组和业务开发智能体。目标是让业务团队不阅读 `buck` 源码，也能完成业务系统创建、模块采用、业务切片开发和验证。

`buck` 是框架仓库。正式业务应用必须独立建仓，通过 Maven Central（`io.github.wu9007:buck-*` 与 `flyway-*`，可选 GitHub Packages / Nexus 兜底）和 npmjs `@wildbuck/*`（GitHub Release tarball 拖底，可选私有 npm）消费发布物，不复制框架源码，不通过 Gradle `project(...)`、`includeBuild` 或 npm workspace 直连框架源码。

## 阅读路径

业务开发者和业务开发智能体按这个顺序阅读：

1. 本文档：创建业务应用、接入 Buck、组织业务开发流程。
2. [business-module-adoption-reference.md](business-module-adoption-reference.md)：理解每个 core/module 的作用、依赖、公开扩展点、注解和配置项。
3. 当前版本发布资料包里的 `capabilities/README.md` 和 `capabilities/capability-catalog.json`：先读能力采用指南，再查 `BrickCapabilityCatalog` 的 `capabilityAdoption[]`、已发布模块、权限、页面、queryCode、optionCode 和 frontend exports。
4. [business-frontend-ui-reference.md](business-frontend-ui-reference.md)：理解前端包、模块页面、通用组件模式、Element Plus 和主题 token 复用。页面模式、动作位、筛选条和字段组件细则见 [business-frontend-page-patterns.md](business-frontend-page-patterns.md)。
5. [business-repository-startup-checklist.md](business-repository-startup-checklist.md)：把完整发布资料包交付给业务仓库，并补齐业务上下文。
6. 当前版本发布资料包里的 `dependencies/`、`templates/`、`examples/`、`rules/` 和 `compatibility/`。

## 业务仓库结构

推荐每个业务系统仓库至少包含：

```text
business-app/
  AGENTS.md
  README.md
  README.ai.md
  backend/
  frontend/
  docs/
    brick-next/
    business/
```

| 文件或目录 | 作用 |
| --- | --- |
| `AGENTS.md` | 给业务开发智能体的工作规则，声明只能通过发布依赖使用 Buck。 |
| `README.ai.md` | 当前业务系统短上下文：目标、业务模块、Buck 版本、验证命令、禁止事项。 |
| `backend/` | Spring Boot 业务后端，引用 `buck-bom`、`buck-starter-application` 和需要的 Buck 模块。 |
| `frontend/` | 业务前端壳，引用 `@wildbuck/*` 前端包和本业务自己的页面。 |
| `docs/buck/<version>/` | 当前 Buck 版本完整发布资料包。业务智能体应基于这里判断采用哪些 Buck 包。 |
| `docs/business/` | 本业务系统自己的需求、模块采用决策、权限、菜单、审计事件和外部系统边界。 |

业务仓库不应保存 `buck` 源码副本。业务侧命令禁止读取、搜索、打开、修改、提交或推送 `buck` 源码仓库或本地 checkout。需要理解框架细节时，看发布包文档、后端 `sourcesJar`、前端 npm 包里的 `README.md` / `.d.ts` / `src`。

业务侧不得把 `validation/security-console` 或本地调试壳里的临时实现当作正式能力来源复制到业务仓库。当前主体联系方式、MFA 发码目标、通知 provider、认证辅助规则等正式语义，必须来自正式 `core` / `modules` / SPI 和业务主数据；不能为了临时跑通用本地配置、硬编码目标或调试接口顶替正式来源。

发布资料包中的 `agent-skills/buck-business-agent/` 是业务侧 agent skill 的强制安装来源。业务 agent 开工前必须确认当前会话已使用或已安装 `buck-business-agent`；未安装时必须从当前采用版本的资料包安装。无法安装时停止实现，先报告阻断原因；业务仓库和业务 agent 不安装、复制或使用 `buck-next-maintainer`，也不得用 `rg`、`sed`、`cat`、`apply_patch`、`git add`、`git commit`、`git push` 等命令操作 `buck` 工作区。维护者 skill 只服务 Buck 维护闭环，不能进入业务资料包。

## 后端目录结构

业务后端先选择单模块或多模块结构。没有明确跨构件边界时，默认从单模块开始；已经存在多个可独立发布、独立迁移、独立协作的业务构件时，使用多模块结构。

### 单模块业务后端

默认结构：`backend/src/main/java/com/example/<app>/applet/<feature>/{controller,dto,repository,service,provider}`，迁移在 `src/main/resources/db_<app>/<database>/`。完整树见发布资料包 `templates/backend-minimal/` 与 [business-repository-startup-checklist.md](business-repository-startup-checklist.md)。

硬规则：

- 功能点边界是 `applet/<feature>`；`controller` 只做 HTTP/权限，业务在 service。
- OpenAPI 模块级根目录可用 `openapi/{controller,service,dto}`；DTO 包名保持 `com.xxx.openapi.dto`，**不要**改成 `com.xxx.applet.openapi.dto`。
- `repository`：MyBatis-Plus + `BrickBaseDao` + Buck `@Dao`，禁止运行时 JDBC/手写 SQL；主键 `String` + `IdType.ASSIGN_ID`（`string(20)`）。
- `@BrickPersistentEntity("显示名")` 只声明显示名/审计开关；结构约束来自 contract/Flyway。
- 功能点 `provider` 实现 `BrickOptionProvider`；单模块**不创建** `innerapi`。

### 多模块构件化后端

仅当存在多个可独立发布/迁移/协作的业务构件时使用：`<app>-module-common` + `<app>-module-<component>` + `<app>-boot`。common 只放契约；`innerapi` 仅多模块进程内协作；构件不互相调 service/Join 表；只有 boot 可运行。

- 共享功能不得使用某个业务域命名空间（如应用 `open-platform.*`，不用 `face.*`）。
- IAM/安全/审计/通知/AI/`client-meta`/`usage-event` 等由 boot 外层装配，不藏进业务构件间接依赖。

### 不创建的默认目录

以下目录不作为业务应用默认结构：

| 目录 | 结论 | 正确做法 |
| --- | --- | --- |
| `query/` | 不创建 | 列表、筛选、分页、排序走 `core:query`。查询能力来自 DO/持久化元数据、显式 `BrickQueryDefinition`、字段白名单和操作符白名单。 |
| `audit/` | 不创建 | 数据变更审计来自 DO 上的 `@BrickPersistentEntity`、`@BrickChangeLogField` 和 ORM 生命周期；业务动作审计在 service 发布 `BrickAuditEvent`。审计落库和查询优先采用 `modules:audit`。 |
| `integration/` | 不创建 | 外部系统调用使用明确的 `client/` 或 `remote/`；对外开放 API 使用 `openapi/`；构件间协作在多模块结构下使用 `innerapi` 和事件。 |

### 迁移脚本目录

路径：`src/main/resources/db_<app-or-component>/<database>/V<business-version>_<seq>__<description>.sql`。版本映射**业务**系统版本；多模块只维护本构件表，禁止跨构件外键/DML/同步脚本。无业务迁移生成器时允许评审过的 Flyway DDL 落标准目录；运行时代码仍禁止 JDBC/手写 SQL。

### appMode、路径和运行时菜单

多模块业务应用如果提供 `face`、`esign`、`suite` 等 appMode，前后端 appMode 必须一致。每个声明的 appMode 都应有成对启动命令、空库后端启动验证、前端 check/build 验证和核心菜单/权限检查；`suite` 通过不能替代单模块模式通过。

业务 Controller path 使用真实业务域语义，不默认加 `/admin`，也不包含前端代理前缀 `/api`。例如电子签配置使用 `/esign/beijing-ca-config`、`/esign/hebei-ca-config`；共享组织接入使用 `/open-platform/orgs`。是否可访问由 Buck authentication/authorization 和权限点决定，不靠路径前缀表达权限边界。

采用 IAM 的业务系统，运行时左侧导航应以 IAM 当前主体菜单投影为源头。前端 route registry / module routes 只负责组件加载、可执行页面注册和 path 绑定，不决定侧栏显示结构、名称、排序、分组、启停和当前主体可见性。

## 发布资料包协同机制

业务仓库内 `docs/buck/<version>/` 是唯一权威资料源。业务智能体不能把 `buck` CI artifacts、临时下载目录或外部 release zip 作为优先阅读来源；这些只能作为发布交付来源。业务侧命令禁止读取、搜索、打开、修改、提交或推送 `buck` 源码仓库或本地 checkout。

如果业务团队需要更新业务侧 agent skill，应从当前采用资料包的 `docs/buck/<version>/agent-skills/buck-business-agent/` 安装或更新安装副本。该目录只包含 business audience 内容；如果资料包中出现 `buck-next-maintainer`，应视为发布资料包缺陷并向 `buck-issues` 提交 issue。业务 agent 的首个输出、MR 描述、issue comment 或最终交付证据必须写明 `buck-business-agent skill 状态：已使用 / 已安装`；无法安装时写明安装来源和失败原因，并停止实现。业务 agent 不得用业务侧命令操作 `buck` 工作区。

当用户、issue 评论、GitHub Release 或必要兜底通知说明 Buck 已修复或已发布新版本时，业务智能体开始阅读资料包或实现前，先在业务仓库执行：

```bash
git fetch origin
git ls-tree --name-only origin/main:docs/buck
```

人工要求升级时，先读目标 tag 的 GitHub Release：`gh release view <tag> -R wu9007/buck`，或 `GET https://api.github.com/repos/wu9007/buck/releases/tags/<tag>`（请求头 `Authorization: Bearer <token>`）。不要先猜共享目录路径。从 description 取 pipeline、`release_publish` job 与资产名；经业务负责人明确授权后再 `gh release download <tag> -R wu9007/buck -p 'buck-*.zip'`。解压根目录是 `buck-<version>/`。如果 tag 存在但没有对应 GitHub Release 记录，停止升级并回流公开仓 https://github.com/wu9007/buck-issues/issues。

资料包读取优先级固定为：

1. 当前业务仓库工作区的 `docs/buck/<version>/`。
2. 业务仓库远端指定分支的 `docs/buck/<version>/`；未指定时默认检查 `origin/main`。
3. 经业务负责人明确授权下载的 `buck` 发布 artifact。优先 `gh release download <tag> -R wu9007/buck -p 'buck-*.zip'`；认证头用 `Authorization: Bearer <token>`。解压根目录是 `buck-<version>/`，必须先回填到业务仓库 `docs/buck/<version>/`，同步 `AGENTS.md` 和 `README.ai.md`，再开始业务开发。

如果用户给出的 Buck 版本与业务仓库实际资料包目录版本不一致，业务智能体必须报告准确版本差异并等待统一，不继续猜测或自行切换资料源。

GitHub Release 是 Buck 默认发布日志和 release index，只说明新版本可用。业务仓库完成 Buck 版本升级、提交 `docs/buck/<version>/`、更新 Maven BOM / npm `@wildbuck/*` / `AGENTS.md` / `README.ai.md` 并验证通过后，应由业务侧主动向 `buck-issues` 创建采用反馈 Issue：`Buck 采用反馈：<business-code> 已采用 <brick-version>`。反馈正文写明业务仓库、采用提交、资料包路径和验证命令。Buck 维护侧只根据该反馈或可验证业务仓库状态更新采用登记，不从 GitHub Release 或发布通知推断业务已采用。

业务侧 Issue、Labels、Milestone、GitHub Release、兜底通知和采用反馈协作规则见 [business-issue-collaboration.md](business-issue-collaboration.md)。业务私有需求留在业务仓库 issue；通用框架缺口创建或关联 `buck` issue；业务 milestone 表达业务交付或 Buck 采用窗口，不替代 Buck tag 和发布流水线。

## 创建后端项目

业务后端从 `buck-bom` 和 `buck-starter-application` 起步。权威脚手架见发布资料包 `templates/backend-minimal/` 与 `dependencies/backend.md`；必须使用 BOM 锁定版本，并保留 Lombok / MapStruct 的 `compileOnly` 与 `annotationProcessor` 平台依赖。

需要治理模块时显式添加对应 `buck-module-*-backend` 坐标（见 [business-module-adoption-reference.md](business-module-adoption-reference.md)）。最小壳默认只装配 starter 与按需命中的 `released` 治理模块；**不要**把 `modules:ai-assistant` 写进默认依赖。`buck-starter-application` 不默认包含 IAM 或登录提供方；只承载业务 API、认证由统一 IAM 服务独立提供的业务系统，可以只引用 starter 和本业务需要的 core 能力。

## 后端编码强制规范

业务后端统一使用 Lombok 和 MapStruct，这不是可选风格。

- Spring 组件使用构造器注入，优先写 `@RequiredArgsConstructor`，不要手写重复构造器。
- Entity/DO 使用 `@Getter`、`@Setter`、`@Accessors(chain = true)` 承载持久化对象样板代码。
- Entity 与 DTO、Command、Response 之间的重复字段转换使用 MapStruct，可继承 `BrickDtoMapper<ENTITY, DTO>`，并声明 `@Mapper(componentModel = "spring")`。
- MapStruct mapper 固定放在 `applet/<feature>/service/mapper`。它属于服务层转换边界，不属于 `controller` 或 `repository`。
- 当功能点同时存在 `dto` 和 `repository` Entity/DO 时，必须提供 `service/mapper` 下的 MapStruct mapper；不要在 service 中写 `toDetail(...)`、散落 setter 或 public nested DTO record 绕过转换边界。
- Controller 的公共方法只能返回所属边界 `dto` 包中的请求/响应/分页/详情类型。功能点边界使用 `applet/<feature>/dto`，模块级 OpenAPI 边界使用 `openapi/dto`；不要把 `com.xxx.openapi.dto` 误改成 `com.xxx.applet.openapi.dto`。禁止返回 `FaceXxxService.*` 或任何 `.service` 包类型；Controller 不注入、不继承、不调用 `BrickDtoMapper` 或 `service/mapper` mapper，也不直接使用 `repository` Entity/DO。
- `repository` 只承载 DO、MyBatis-Plus 持久化 Dao、仓储对象和持久化适配；业务仓库持久化接口命名为 `FaceArchiveDao extends BrickBaseDao<FaceArchiveEntity>`，并标注 Buck `@Dao`，减少与 MapStruct `@Mapper` 的命名混淆。不要把 MapStruct mapper 放入 `repository`，也不要用散落 setter 代码绕过转换边界。
- Controller 的 `@RequestBody` 入参必须使用 `@Valid` 或 `@Validated`，Request/Command/Query DTO 字段使用 `jakarta.validation.constraints` 声明空值、长度、格式和范围约束；跨对象和业务规则仍放 service。
- Lombok、MapStruct、Bean Validation 和 annotationProcessor 依赖必须保留在业务后端构建文件中，版本由 `buck-bom` / Spring Boot 依赖管理约束。

## 创建前端项目

业务前端通过 npmjs 消费 `@wildbuck/*`（GitHub Release tarball 拖底）。权威脚手架见发布资料包 `templates/frontend-minimal/` 与 `dependencies/frontend.md`；依赖版本与 `@wildbuck/*` 坐标以当前发布资料包为准。

业务前端只能使用 `package.json` 中 `exports` 暴露的入口。禁止深度引入 `node_modules/@wildbuck/.../src/features/...` 这类未公开路径。

### 登录与传输代理

业务前端壳必须把 Buck 登录和传输端点代理到后端，不要只配置业务 API 前缀。`@wildbuck/core-authentication-frontend` 使用固定公开路径；`configureHttp({ baseUrl })` 只影响 `@wildbuck/core-api-frontend` 的业务请求。

| 前端路径 | 归属 | 说明 |
| --- | --- | --- |
| `/transport/meta` | `core:transport` | 获取传输安全元数据。 |
| `/brick/captcha` | `core:authentication` | 获取验证码。 |
| `/brick/login` | `core:authentication` | 登录。 |
| `/brick/logout` | `core:authentication` | 登出。 |
| `/brick/mfa/**` | `core:authentication` | MFA 校验和挑战。 |
| `/brick/password/change` | `core:authentication` | 首次登录或策略触发的改密。 |
| `/api/**` | 业务前端壳 | 业务 API 前缀，可 rewrite 到后端根路径。 |

采用下面默认 rewrite 时，`/api` 只是前端代理前缀。业务代码调用 `request('/face-archives')` 后，浏览器请求 `/api/face-archives`，代理转发给后端 `/face-archives`。因此业务 Controller 使用 `@RequestMapping("/face-archives")` 或业务真实路径，不写 `@RequestMapping("/api/face-archives")`。

启动前端调试前必须先启动真实后端，并确认 `BUSINESS_API_BASE_URL` 或默认 `127.0.0.1:8080` 可访问。前端不得自己构造 mock 后端、mock 菜单、mock 权限或 mock 业务数据；IAM 菜单、权限、审计、OpenAPI、调用记录和清理配置等链路必须记录真实后端验证命令和结果。业务仓库不得保留 `mock:backend`、`mock-backend` 或 `frontend/scripts/mock-backend.*` 这类入口；确需临时视觉预览时，交付证据必须单独标注，不能替代真实后端验证。

最小 Vite 代理须覆盖 `/transport`、`/brick`，以及带 rewrite 的 `/api`（去掉 `/api` 前缀）；脚手架见 `templates/frontend-minimal/`。先验收 `GET /transport/meta`、`GET /brick/captcha`、`POST /brick/login`、`POST /brick/logout`。

## 业务切片开发流程

每个业务切片按以下顺序推进：

1. 确认业务目标和不做什么。
2. 先读发布资料包里的 `capabilities/README.md`，再查 `capabilities/capability-catalog.json` 的 `capabilityAdoption[]`、已发布模块、权限、页面、queryCode、optionCode 和 frontend exports。
3. 查 [business-module-adoption-reference.md](business-module-adoption-reference.md) 的“强制采用矩阵”，完成 Buck 能力命中判断。
4. 查 [business-frontend-ui-reference.md](business-frontend-ui-reference.md) 与 [business-frontend-page-patterns.md](business-frontend-page-patterns.md)，确认页面壳、模块页面、样式 token 和组件模式。
5. 在 `docs/business/module-adoption-decision.md` 记录命中项、采用模块、依赖清单；命中但不采用时必须写明理由并等待确认。
6. 在业务仓库记录本切片的实体、API、权限、菜单、审计事件和外部系统边界。
7. 后端先写业务契约和服务边界，命中的通用能力必须复用 Buck。
8. 前端必须复用 Buck 请求、认证、权限、模块页面 registry、Element Plus 和 console token。
9. 跑聚焦测试，再跑业务仓库总检查命令。

业务开发智能体拿到任务时，如果缺少 Buck 版本、业务权限、菜单、测试账号、数据库或验证命令，应先补齐上下文，不能靠猜测实现。

## 业务 AI 助手扩展

最小业务壳（`templates/backend-minimal` / `templates/frontend-minimal`）默认不装配控制台助手：前端以 `@wildbuck/core-ui-frontend` 与 IAM `auth-view` 为基线。助手是可选扩展，不是官方最小产品。

业务需要自己的 AI 助手时，先按发布资料包命中 `modules:ai-assistant` 和 `core:ai-agent`。后端采用 `buck-module-ai-assistant-backend`，助手通过 `BrickAiAssistantDefinitionProvider` 声明 assistant code、名称、系统提示词、业务 `permissionCodes` 和 `toolCodes`；工具通过 `BrickAiToolProvider` 声明描述，通过 `BrickAiToolExecutor` 调用本业务 service 执行。权限复用业务功能点权限，`ai-assistant:assistant:manage` 只用于助手配置治理。

前端采用 `@wildbuck/module-ai-assistant-frontend`；标准控制台壳入口优先用 `@wildbuck/module-ai-assistant-frontend/shell-entry`，已有自定义右侧宿主时再用 `@wildbuck/module-ai-assistant-frontend/assistant-panel`，页面 route 用 `@wildbuck/module-ai-assistant-frontend/page-registry`。助手列表、模型列表、会话历史和待确认工具调用都从真实后端读取；不要硬编码前端助手清单，也不要用 mock 菜单、mock 权限或 mock 会话作为验收证据。

工具不得直接 JDBC、手写 SQL、越过业务 service 或放大当前主体权限。不要在业务仓库创建通用 CRUD Agent、通用数据库 Agent 或通用 OpenAPI Agent；不要复制 `validation/security-console` 的验证壳实现作为正式业务 AI 助手来源。能力不足时向 `buck-issues` 提中文 issue，说明业务场景、期望工具、权限和验证方式。

## 外置 Agent MCP 宿主

业务应用需要让**独立进程的外置 Agent**通过标准 MCP 调用本系统能力时，采用 `core:mcp` 作为 MCP **服务端**，而不是自建平行 Agent 网关，也不是把外置 Agent 绑进控制台 `modules:ai-assistant`。

### 与控制台 AI 助手的关系

| | 控制台 AI 助手 | 外置 Agent MCP 宿主 |
| --- | --- | --- |
| 采用 | `modules:ai-assistant` + `core:ai-agent` | `core:mcp` + 工具贡献（推荐 `core:ai-agent`） |
| 入口 | 浏览器侧栏 / 会话 API | `POST /mcp`（可配置 path）JSON-RPC |
| 会话 | Buck 持久化会话与 toolCall 确认 | 无助手会话；外置 Agent 自管对话 |
| 工具 | `BrickAiToolProvider` / `Executor` | 同一套工具在 classpath 有 ai-agent 时自动桥到 MCP；或 `BrickMcpToolProvider` 直贡献 |

两套能力可同应用装配，**无官方互调路径**。是否同时采用由业务命中决定。

### 步骤

1. **命中判断**：需求涉及「外置 Agent / 独立助手进程调业务工具 / MCP tools」时，在 [business-module-adoption-reference.md](business-module-adoption-reference.md) 命中 `core:mcp`，并记入 `docs/business/module-adoption-decision.md`。  
2. **依赖**：BOM 下增加 `io.github.wu9007:buck-core-mcp`；按需引入 `security-setting` / `iam` / `audit` 等正式模块。  
3. **配置**：

```yaml
brick:
  mcp:
    enabled: true
```

4. **贡献业务工具（推荐）**：在业务模块实现 `BrickAiToolProvider` + `BrickAiToolExecutor`，内部只调业务 service；启用 MCP 且 classpath 有 ai-agent 时工具自动进入 `tools/list`。  
5. **鉴权**：生产禁止匿名 MCP；使用已认证主体或业务明确的机器身份方案，不要照抄验证壳联调配置。  
6. **验收**：`initialize` 成功；`tools/list` 含业务 tool code；至少一条只读 `tools/call` 通过。

### 禁止

- 自建长期平行 MCP Server、平行 tool registry 或「Agent 专用 CRUD 门面」。  
- 通用数据库 Agent、任意 OpenAPI 自由调用。  
- 工具内 JDBC、手写 SQL、绕过 service 与权限。  
- 生产 `brick.mcp.allow-anonymous=true`。

细则、参数与安全约定见 [business-module-adoption-reference.md](business-module-adoption-reference.md)「外置 Agent MCP 宿主」专节。协议方法名与 JSON-RPC 形状以运行时 `core:mcp` 行为为准；外置 Agent 客户端集成文档由业务/助手项目自行维护，不进入本 delivery 目录。

## 强制执行规则

业务应用必须把发布资料包里的业务规则检查接入 CI，而不是只把目录结构和能力复用当成口头约定。业务仓库 `.github/workflows/ci.yml` 必须先执行：

```bash
node docs/buck/<version>/rules/check-business-structure.mjs .
```

检查失败时，业务开发智能体不能通过删除检查、绕过 CI、改宽规则或在业务仓库保留平行实现来继续开发。正确动作是：

1. 如果是业务目录不规范，按 [business-repository-startup-checklist.md](business-repository-startup-checklist.md) 调整为单模块或多模块标准结构。
2. 如果是自建了 Buck 已提供的基础能力，删除业务侧平行实现，改为采用对应 `core` 或正式模块。
3. 如果 Buck 基础能力确实不足，停止业务侧造轮子，在 `buck` Issues 创建中文问题，写明业务场景、缺口证据、期望能力和建议归属模块。

以下行为在业务仓库中视为阻断项：

- 自建登录、token、权限、用户、角色、菜单、会话、安全策略、审计日志、OpenAPI 网关签名规则、查询协议、选项协议或 JDBC 持久化能力。
- 新建标准白名单外的后端目录，例如 `query/`、`audit/`、`integration/`。
- 单模块业务后端新建 `innerapi`。
- 采用默认 `/api` rewrite 时，业务 Controller 在 Spring 映射中写 `/api` 前缀。
- `controller`、`service`、`repository`、`dto` 不在 `applet/<feature>/` 下。

## 业务 CI/CD

业务仓库必须从发布资料包 `templates/github-actions.yml` 建立流水线，并参考 [business-ci-cd.md](business-ci-cd.md) 保持以下边界：

- 业务仓库与旧验证壳项目在同一 GitHub 分组时，`FS_URL`、`REGISTRY_URL`、`DOCKER_USER`、`DOCKER_PASS`、`NAMESPACE`、可选 Nexus 和 npm 凭据默认走 GitHub Actions secrets，不在业务仓库提交真实凭据。
- 接入模板前先确认实际 runner executor、JDK17/Gradle 分发源、可达 JDK17 基础镜像、前端 Nginx 固定端点代理、K8s runtime Secret 和 DNS 注册策略；shell runner 下不要依赖 `image/services`。
- `DEV_DEPLOY_BRANCH` 固定为 `dev`，该分支自动验证、构建镜像并部署到 `${NAMESPACE}-dev` K8s 开发环境。部署前必须经过 `verify_brick_rules`、后端测试和前端检查。
- `TEST_DEPLOY_BRANCH` 分支自动验证、构建镜像并部署到 `${NAMESPACE}-test` K8s 测试环境，默认是 `test`；测试环境必须使用独立 K8s Secret、`BUSINESS_TEST_DB_URL` / `BUSINESS_TEST_DB_USERNAME` / `BUSINESS_TEST_DB_PASSWORD` 和 `*.example.com` 域名。`BRICK_TOKEN_SECRET` 可以按产品共识共用；除非业务负责人明确覆盖 IAM bootstrap 行为，否则不要求配置 `BRICK_IAM_ADMIN_INITIAL_PASSWORD`。
- tag 自动验证、构建后端 jar、后端 `version.txt`、非 local 的 yml 配置文件、`logback-spring.xml`、兼容 `logback.xml`、前端 dist 包和前端 `version.txt`，并上传到 `${FS_URL}/releases/${CI_PROJECT_NAME}/${GITHUB_REF_NAME}/`；制品库对外地址为 `https://github.com/wu9007/buck/releases/{业务项目名称}/{tag}`。禁止把 `*-local.yml` 打入发布制品。
- 业务仓库可按项目覆盖 `svcport`、`frontend_svcport`、`ingress`、`prefix`、`dev_profile`、`replicas` 和 `release_group`，但不能让发布或部署绕过验证阶段。
- 业务初始化时应把发布资料包 Docker/K8s 模板复制到 `backend/docker/` 和 `frontend/docker/`，再按业务端口、域名、profile 和资源限制调整。

业务仓库一律维护 `dev`、`test`、`main` 受保护晋级分支：短分支与 Buck 升级分支只能从 `dev` 拉出，并通过 MR 合入 `dev`；禁止业务 agent 直接把短分支合入 `test` 或 `main`；禁止直接向 `dev`、`test`、`main` push；禁止业务 agent 在没有业务负责人明确指示时合并 `dev -> test`、合并 `test -> main` 或创建业务发布 tag。

业务开发智能体发现流水线模板不能支撑业务仓库时，应向 `buck-issues` Issues 提交中文问题，说明业务仓库、Buck 版本、缺失变量或失败阶段，不允许在业务仓库复制一套长期平行发布机制。

## Buck 模块采用门禁

业务开发智能体在写代码前必须先完成能力命中判断。只要业务需求涉及用户、员工、组织、角色、菜单、权限、会话、登录治理、安全策略、审计日志、生产排障、应用接入、OpenAPI、OAuth client、列表查询、选项或持久化治理，就必须先映射到 [business-module-adoption-reference.md](business-module-adoption-reference.md) 的强制采用矩阵。

命中正式模块时，业务智能体必须采用对应 Buck 后端依赖和前端包。决定不采用时，必须在 `docs/business/module-adoption-decision.md` 写出不采用原因、替代方案、风险和待确认人，并等待业务负责人或架构负责人确认。未确认前禁止实现平行机制。

## 通用能力使用边界

| 需求 | 应复用 | 禁止做法 |
| --- | --- | --- |
| 登录、MFA、验证码、改密、登出 | `core:authentication`、`@wildbuck/core-authentication-frontend`、IAM auth 子路径（`auth-view` / `auth-workspace`） | 自建登录过滤器、自建本地 token 客户端 |
| 登录页品牌（名称/Logo/背景/布局/主色）、登录页业务版本号 | `modules:login-brand`（管理端，RC）、`core:client-meta`（`loginBrand` + `appVersion`）、`@wildbuck/module-iam-frontend/auth-view`；版本由 CI 写入 jar 身份（见 business-ci-cd） | 自造登录品牌配置中心；整页重写登录壳；手填版本 properties；鉴权 content 当匿名 Logo |
| 权限校验、当前主体、token 验签、匿名入口规则 | `core:authorization`、`@wildbuck/core-authorization-frontend`、`BrickAuthorizationRuleContributor` | 自建 token filter、绕过权限注解、用业务 Filter 替代 Buck 鉴权链 |
| 列表筛选、分页、排序 | `core:query`、`@wildbuck/core-query-frontend` | 每个接口自定义一套分页筛选协议 |
| 下拉、单选、多选、标签选项 | `core:option`、`BrickOptionProvider`、`@wildbuck/core-option-frontend`；`POST /brick/options/list` **默认需登录后鉴权**，token 就绪后再 `loadBrickOptions` | 在页面或业务 controller 里写散落枚举接口；为消未登录 401 在前端写死业务枚举；默认假定 options 与 `client-meta` 同级匿名 |
| 持久化、迁移、敏感字段、签名、审计变更 | contract、MyBatis-Plus、`core:orm-plus`、标准 Flyway 迁移产物 | 运行时代码手写 SQL、直接 JDBC、业务模块自建加密存储 |
| 审计采集和审计查询 | `core:audit`、`modules:audit` | 业务模块直接写审计表或吞掉审计失败 |
| 生产排障 traceId、MDC、请求完成日志 | `core:observability` | 自建 `TraceIdFilter`、`RequestLoggingFilter` 或记录请求/响应体 |
| 浏览器启动公开运行时元数据 | `core:client-meta`、`@wildbuck/core-client-meta-frontend`；推荐**非阻塞** `loadBrickClientMeta`（先 mount 再异步 bootstrap，失败安全默认） | 自建平行 meta endpoint、配置中心或前端启动配置协议，返回 secret、token、连接串、内部策略明文、请求体、表单内容或业务对象明文；用 `await loadBrickClientMeta()` 阻塞整页 mount 导致白屏 |
| 产品使用事件、功能曝光/进入/动作完成/失败/放弃采集 | `core:usage-event`、`@wildbuck/core-usage-event-frontend`；前端从 `client-meta` bootstrap，模块级事件接入用 `createModuleUsageTracker()`，页面使用 `trackAction(featureKey, actionCode, asyncFn)` 或 `trackActionResult(featureKey, actionCode, result)` | 自建平行埋点框架、usage event endpoint、日志格式、重复维护前后端开关、页面散落 payload 拼装或 success/failure wrapper 分支，或采集敏感明文 |
| 业务 AI 助手、模型会话、助手侧栏和工具调用确认 | `modules:ai-assistant`、`core:ai-agent`、`@wildbuck/module-ai-assistant-frontend`；助手用 `BrickAiAssistantDefinitionProvider`，工具用 `BrickAiToolProvider` 和 `BrickAiToolExecutor` | 自建 AI 会话表、助手目录、前端助手清单、通用 CRUD Agent、通用数据库 Agent、通用 OpenAPI Agent，或复制 `validation/security-console` |
| 外置 Agent / 独立助手进程通过 MCP 调用业务工具 | `core:mcp`（`buck-core-mcp`）+ 推荐 `core:ai-agent` 工具贡献（自动桥到 MCP）；需要平台能力时再命中 security/iam/audit 等正式模块 | 自建平行 MCP 服务端、把管理 CRUD 当 Agent 主路径、生产匿名开放 `/mcp`、通用数据库/OpenAPI Agent、把外置 Agent 绑进 ai-assistant 会话 |
| 请求摘要和传输信封 | `core:transport`、`@wildbuck/core-transport-frontend` | 页面单独实现摘要 canonical 规则 |
| 应用接入、OAuth client、OpenAPI Scope 授权 | 默认 `modules:application-center`、`core:oauth2`、`core:openapi`；业务已有组织接入功能点时，先确认业务认证模型。当前推荐模型是 OAuth2 `client_credentials`：业务模块实现 `BrickOAuth2ClientRegistrationResolver`、`BrickOAuth2ClientCredentialsAuthenticator`、`BrickOAuth2AccessScopeResolver` 提供 client、secret 和 scope。接口通过 `@Scope` 声明所需 Scope 以及 `groupName/interfaceName` 元数据。只有业务明确要求防重放/防篡改时，才额外实现 `OpenApiHmacIntegrityCredentialProvider` 提供签名密钥，通过 `OpenApiHmacIntegrityValidator` 做组织、场景和阈值等二次完整性校验，集群环境替换 `OpenApiHmacNonceStore`。多个 client 或签名密钥来源并存时，`clientId` 必须唯一命中一个 provider，重复命中应失败。 | 塞进 IAM、自建通用 HMAC Filter、复制签名 canonical 规则或防重放机制、把 HMAC 当作 OAuth2 之外的直连认证 |

业务应用运行在达梦 DM 时，在后端加入 `runtimeOnly 'com.dameng:DmJdbcDriver18'` 即可，版本由 `buck-bom` 约束；数据库 URL、用户名和密码通过运行环境注入。DM 不改变持久化边界：模块迁移仍走标准 Flyway 迁移产物和 `core:orm-plus`，业务运行时代码仍禁止手写 SQL 或直接 JDBC。

列表接口不要在 Controller/Service 中用 `LambdaQueryWrapper`、`QueryWrapper` 或 `Wrappers.lambdaQuery` 加 `selectList` / `selectPage` 手写 `like`、`orderBy`、page/size 或前端可控筛选。页面列表的后端边界是 `BrickQueryDefinition` + `QueryCriteria` + `BrickQueryExecutor`。前端如果需要直接提交统一 DSL，使用 `@wildbuck/core-query-frontend` 构造 `QueryCriteria`；后端仍必须通过 `BrickQueryDefinition` 校验字段、操作符、排序和分页上限。内部按主键、唯一键或固定外键做精确读取、唯一性校验和删除前引用检查可以保留 MyBatis-Plus，例如 `selectById`、`selectOne` 或只含固定 `eq` 条件的内部 `selectList`，但不能把这类内部查询扩展成页面列表协议。

## 业务模块采用

| 模块 | 业务作用 | 典型使用方式 |
| --- | --- | --- |
| `modules:iam` | 员工、组织、角色、菜单、当前主体、会话运维和认证数据适配 | 业务系统需要内置身份治理和管理后台时引入。 |
| `modules:notification-setting` | EMAIL/SMTP 提供方配置和邮件通道治理 | 业务系统需要正式管理 SMTP 配置、EMAIL MFA 通道或其他邮件通知发件配置时引入。 |
| `modules:security-setting` | 登录安全、密码策略、弱密码库、MFA、传输安全配置 | 业务系统需要运营安全策略时引入。 |
| `modules:audit` | 审计日志落库、查询、详情和展示 | 业务系统需要统一审计查询页面或审计 API 时引入。 |
| `modules:application-center` | 应用、OAuth client、redirect uri、scope、OpenAPI Scope 授权 | 业务系统需要通用第三方应用治理时引入；业务已有组织接入功能点时不强制迁入，但必须通过 `core:oauth2` SPI 复用 OAuth2 client credentials 机器访问能力；明确需要防重放/防篡改时再接入 `core:openapi` HMAC integrity SPI，并保证与应用中心的 `clientId` 来源不重复。 |

模块的权限、菜单、前端 `exports` 和扩展点见 [business-module-adoption-reference.md](business-module-adoption-reference.md)。

## 前端复用边界

业务前端默认使用 `Vue 3 + Element Plus`。业务壳优先引入 `@wildbuck/core-ui-frontend/theme.css`，并使用 `BrickConsoleShell`、`BrickConsoleDrawer`、`BrickUserMenu`、`BrickAppearanceSettingsDialog`、`BrickChangePasswordDialog`、`BrickAppearanceSwitcher`、`buildBrickConsoleNavigationGroups()` 和 `createBrickConsoleThemePresets()`。`BrickConsoleShell` 默认通过顶部栏头像下拉里的“个性化设置”打开主题弹窗，并通过「修改密码」打开**壳内改密弹窗**（业务壳传入 `:change-password-submit` 接到 IAM `changeOwnPassword`，复用 `POST /brick/password/change`；不要自建改密客户端，也不要为自愿改密整页跳转登录流）；业务应用不要自造一套头像下拉、主题弹窗、顶部栏或抽屉样式来替代 core-ui。模块页面和业务页面都应复用 Buck 的 console CSS token：

- 颜色：`--console-title`、`--console-text`、`--console-muted`、`--console-primary`、`--console-success`、`--console-warning`、`--console-danger`
- 容器：`--console-page-bg`、`--console-card-bg`、`--console-card-border`、`--console-card-radius`、`--console-card-shadow`
- 间距：`--console-space-1` 到 `--console-space-6`、`--console-page-gap`
- 字号：`--console-body-size`、`--console-label-size`、`--console-caption-size`，其中 `data-font-size="xlarge"` 是适老档，正文基线为 18px
- 控件：`--console-control-height`、`--console-field-radius`、`--console-pill-radius`、`--console-table-row-height`、`--console-table-cell-y`、`--console-drawer-padding`

主题切换必须通过 `BrickConsoleShell` 或外层壳设置 `data-theme`、`data-density`、`data-font-size` 后让 CSS token 级联生效。默认主题建议使用 `blue` 浅色主题；`night` 才是全暗主题，`green`、`orange`、`guard` 是深色侧栏加浅色内容区的品牌主题。不要在业务页面写死一套独立主题色。`system` 只是偏好值：用 `createBrickConsoleAppearanceRuntime()` 解析出 `resolvedTheme` 再写 `data-theme` 与 Shell `:theme`；禁止 `data-theme="system"`。详见 [business-frontend-page-patterns.md](business-frontend-page-patterns.md)「跟随系统主题接入」。

侧栏整体折叠使用 `BrickConsoleShell` 的 `v-model:sidebar-collapsed` 和 `sidebar-collapsible`；菜单分组折叠使用 `v-model:sidebar-collapsed-group-keys`、`sidebar-group-collapsible`、分组 `defaultCollapsed` 和 `collapsible: false`。折叠态 logo 用 `brand-mark` 或 `sidebar-brand-mark` slot；菜单快速检索用 `sidebar-searchable`，route 可补充 `keywords/searchKeywords`；额外筛选才用 `sidebar-nav-before` slot。侧栏菜单图标的正式主源是 IAM 菜单管理上传的图片（`iconResourceId` → 运行时 `iconUrl`）；渲染优先级为上传图 `iconUrl` > 业务组件 icon > 线图标兜底（`iconName` / 推断 / 通用 `menu`）。字符串 `MenuBindingDescriptor.icon` 不是自动图标资源，最多作为线图标名；业务壳必须用 Buck/IAM 正式 helper 合并当前主体菜单，不要自建图标同步或硬编码侧栏图标表。`abbr`/`iconText` 仅作搜索与辅助文案，不再作为默认折叠态主视觉。右侧上下文顶栏（如 AI 助手）使用 `BrickConsoleContextHeader`，与主顶栏共用 `--shell-topbar-height`。

顶部栏默认不配置左侧标题、说明或面包屑，是贴住浏览器顶部和侧栏顶部的扁平全局操作条，不做内容区浮动卡片；只保留刷新、菜单引导、通知、当前主体头像下拉等全局操作入口。刷新、菜单引导和通知按钮由业务壳通过 `topbar-actions` slot 接入，Buck 提供动作区样式和头像下拉，不默认实现业务刷新、通知中心或具体向导步骤；正式全局动作使用 `ElButton` 或同等公开组件语义，不在 `topbar-actions` 中直接放原生 `<button>`。系统名称和环境说明放侧栏品牌区；菜单搜索放侧栏菜单上方；当前页面上下文由侧栏 active 状态和页面标题区表达。列表页创建、编辑和详情侧边抽屉优先使用 `BrickConsoleDrawer`，它统一标题、说明、正文、底部操作区和主题 token；保存型表单、配置卡片和抽屉底部动作统一使用 `BrickActionBar`，危险确认统一使用 `BrickRiskConfirm`；短确认使用 `ElDialog`，标准抽屉不要传固定像素 `size`。页面向导虽然由业务侧实现具体步骤，但必须使用稳定 `data-guide-id`、统一步骤字段、Buck 主题 token 和完成态 key 规则。不要复制 `validation/security-console` 的局部 CSS 来追视觉效果，业务视觉基线以 `@wildbuck/core-ui-frontend` 公开组件和 `theme.css` 为准。已在业务文档中定义为正式能力的页面，不接受本地示例数据页、占位列表页或 mock 记录作为完成态。

治理模块页面通过各模块 `page-registry` 装配。IAM 页面装配后可运行 `validateIamPageRegistry()` 自检路由、组件 loader 和权限配置；发现缺失时修业务前端壳的 registry 装配或授权菜单，不要复制 IAM 页面源码。

完整前端规则见 [business-frontend-ui-reference.md](business-frontend-ui-reference.md) 与 [business-frontend-page-patterns.md](business-frontend-page-patterns.md)。

## 业务应用 `AGENTS.md`

业务仓库 `AGENTS.md` 的权威全文来自发布资料包 `templates/AGENTS.md`（初始化时复制到业务仓根目录）。本指南**不维护第二份全文**，避免与模板漂移。

业务 `AGENTS.md` 必须与上文一致地声明：

- 业务仓库内 `docs/buck/<version>/` 是唯一权威资料源；经业务负责人明确授权下载 artifact 后须先回填再开发。
- 禁止业务 agent 操作 `buck` 源码工作区。
- 能力命中、强制采用、`docs/business/module-adoption-decision.md` 与禁止自造 `UserController` / `AuditLogEntity` 等规则。
- 前端壳、`topbar-actions`、保存型表单、`BrickActionBar` / `BrickRiskConfirm`、CI 与回流 issue 规则。

同步维护：发布资料包 `templates/README.ai.md`、本指南「强制执行规则 / 通用能力使用边界 / 框架演进闭环」。

## 框架演进闭环

以下情况应回流到 `buck`，不应只在业务应用里临时解决：

- Buck 缺少业务系统应复用的基础能力、SPI、配置项、发布入口、项目模板或示例代码。
- 已发布功能存在 bug，或实际行为与文档、契约、配置说明、示例代码不一致。
- 文档表述模糊、边界不清、缺少用法细节，导致业务 agent 只能猜测、深度读取内部实现或自造平行机制。
- 功能可以运行，但不符合正常业务开发预期，例如扩展点不足、诊断信息不足、验收路径不闭环。
- 业务 agent skill、业务 `AGENTS.md` 模板、启动清单或资料包组织方式存在改进空间，影响业务 agent 正确采用 Buck。
- 多个业务模块都会用到的查询、选项、鉴权、认证、传输、文件、审计、生产排障或 ORM 能力。
- 需要扩展 Buck 模块发布表面，例如新增 npm `exports`、Maven 依赖、权限码或菜单元数据。
- 需要改变 `buck-starter-application` 默认装配。
- 需要新增或修改 Buck 契约、manifest、持久化迁移或生成器。
- 业务应用为了完成需求不得不深度读取 Buck 内部实现。

业务开发 agent 发现上述情况时，必须在公开仓 `buck-issues` 创建问题，而不是写到私有源码仓 `wu9007/buck`，也不是只写在业务仓库提交说明、聊天记录或本地 TODO 里：

```text
https://github.com/wu9007/buck-issues/issues
```

Issue 使用中文标题和正文；错误日志、类名、接口名和配置键可以保留原文。Issue 至少说明：类型（bug / 基础能力需求 / 文档问题 / 功能预期偏差 / skill 改进）、业务系统、Buck 版本、触发场景、复现步骤或缺口证据、期望行为、实际行为、影响范围、业务侧是否存在临时绕行方案、建议归属模块，以及建议验证方式。

## 完成标准

业务切片交付前至少满足：

- 只通过发布依赖使用 Buck。
- 没有复制 Buck 源码或深度引入未导出前端文件。
- 通用能力复用了 `core` 或正式模块。
- 权限、菜单、审计和错误处理有明确边界。
- 页面复用 Element Plus 和 Buck console token。
- 聚焦测试通过。
- 业务应用约定的总检查命令通过。
