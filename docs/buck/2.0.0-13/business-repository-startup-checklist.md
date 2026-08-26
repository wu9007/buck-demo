# 业务仓库启动清单

本文档面向业务开发负责人和业务开发智能体，说明创建独立业务仓库后，如何交付 Buck 发布资料包和业务上下文。目标是让业务智能体在不读取 `buck` 源码仓库的情况下，可以判断应采用哪些 Buck 依赖，并开始业务系统开发。

## 交付原则

每个业务仓库都应获得一整套对应版本的 Buck 发布资料包，而不是只获得几份摘要文档。发布资料包回答“Buck 有什么、怎么用、不能怎么用”；业务仓库自己的文档回答“本系统要做什么、做到什么程度、如何验收”。

业务仓库不复制 `buck` 源码。需要查看实现细节时，业务智能体可以读取发布后的后端 `sourcesJar`、前端 npm 包中的 `.d.ts`、`README.md` 和公开 `exports` 下源码，但不能修改发布包内容。

## 推荐目录

```text
business-app/
  AGENTS.md / README.md / README.ai.md
  backend/  frontend/
  docs/buck/<brick-version>/   # 完整发布资料包
  docs/business/                     # requirements, backend-structure.md, module-adoption-decision.md, ...
```

资料包内至少含交付指南、采用/UI 参考、capabilities、agent-skills、templates、rules、compatibility。开工顺序：`AGENTS.md` → 资料包 → `docs/business/`。

## 发布资料包权威来源

业务智能体消费 Buck 时，业务仓库内 `docs/buck/<brick-version>/` 是唯一权威资料源。业务侧命令禁止读取、搜索、打开、修改、提交或推送 `buck` 源码仓库或本地 checkout；不得用 `rg`、`sed`、`cat`、`apply_patch`、`git add`、`git commit`、`git push` 等命令操作 `buck` 工作区。`buck` CI artifacts、临时下载目录和外部 release zip 只能作为发布交付来源，不能作为业务开发时的优先阅读来源。

资料源优先级固定为：

1. 当前业务仓库工作区里的 `AGENTS.md`、`README.ai.md` 和 `docs/buck/<brick-version>/`。
2. 业务仓库远端指定分支里的同路径资料包；未特别指定时默认检查 `origin/main`。
3. 经业务负责人明确授权下载的 `buck` 发布 artifact。下载后必须先回填到业务仓库 `docs/buck/<brick-version>/`，同步更新 `AGENTS.md` / `README.ai.md`，再基于业务仓库路径开发。

当用户、issue 评论、GitHub Release 或必要兜底通知说明 Buck 已修复或已发布新版本时，业务智能体开始阅读资料包或实现前，必须先在业务仓库执行同步检查：

```bash
git fetch origin
git ls-tree --name-only origin/main:docs/buck
```

如果当前工作区缺少业务仓库远端已有版本，应先从业务仓库远端同步或请业务负责人合并。不要绕过业务仓库，直接下载 `buck` CI artifacts 开发；也不要读取、搜索、打开、修改、提交或推送 `buck` 工作区。

如果用户给出的版本与业务仓库实际资料包目录版本不一致，先报告准确事实，例如“用户给出版本 `1.0.0-16`，业务仓库存在版本 `1.0.0-15`”，等待统一版本命名或资料包同步后再继续。

升级顺序：先读 GitHub Release → 记录 `release_publish` / artifact → `GET /repos/wu9007/buck/actions/runs/:run_id/artifacts` 下载 → 回填 `docs/buck/<version>/` → 同步 `AGENTS.md`/`README.ai.md`。请求头使用 `Authorization: Bearer` 或 `Authorization: Bearer <token>`。如果 tag 存在但没有对应 GitHub Release 记录，停止并回流 `buck` issue。

## labels 和 milestone 初始化

业务仓库开始第一个需求前，必须完成 `labels 和 milestone 初始化`。这不是文档建议，而是业务 agent 执行 Next-work triage gate、排序 issue、创建分支和准备 MR 的前置条件。

建议至少建立以下 label 维度：

- `type:*`：需求、bug、文档、CI/CD、Buck 采用、采用反馈等类型。
- `scope:*`：业务功能、Buck 采用、发布资料包、业务 agent、基础设施等范围。
- `priority:*`：P0/P1/P2/P3 或业务仓库自己的优先级层级。
- `status:*`：ready、blocked、in-progress、review、verify 等少量人工状态。

业务 issue 开工前优先设置 GitHub assignee，并把状态调整为 `status:in-progress`。如果没有权限设置 assignee，必须在 issue comment 中写明当前会话、分支和认领原因。看到已有 assignee 或 `status:in-progress` 时，不要重复开发；需要接手时先取得业务负责人或原处理人的明确要求，并在 comment 中说明接手原因。

业务 milestone 只表达业务交付或 Buck 采用窗口，例如：

```text
business-app adopt brick v<version>
business-app release 2026-06
```

业务 agent 收尾时必须检查是否存在 `已完成但仍 active 的 milestone`。Buck 采用窗口的 issue、MR、main pipeline、资料包清理和采用反馈证据都闭环后，应及时关闭对应 adoption milestone；业务交付 milestone 只有在该 milestone 内的业务验收也完成后才能关闭。

如果业务仓库尚未初始化 labels 或 milestone，业务 agent 先创建治理初始化 issue 或把初始化动作列入当前首个 MR 的独立治理段落，说明原因、影响面和验证方式。不要在缺少 labels/milestone 的情况下开始下一个业务需求。

## 启动步骤

1. 创建业务仓库，例如 `business-app`。
2. 选择 Buck 版本，版本必须来自正式 tag 发布资料包，例如 `1.0.0-3`。
3. 从 GitHub Release 下载 `buck-<version>.zip`（`gh release download <tag> -R wu9007/buck -p 'buck-*.zip'`），解压根目录是 `buck-<version>/`，把它完整复制到业务仓库 `docs/buck/<version>/`。不要按 `build/release/` 去找（那是 CI 内部路径）。
4. 从资料包 `templates/AGENTS.md` 和 `templates/README.ai.md` 生成业务仓库根目录文件，并补充业务系统名称、目标、验证命令和禁止事项。
5. 开工前必须先确认当前 AI 开发会话已使用或已安装 `buck-business-agent`。未安装时，必须从当前资料包 `agent-skills/buck-business-agent/` 安装；业务仓库不安装、复制或使用 `buck-next-maintainer`，也不读取或修改 `buck` 工作区。无法安装时停止实现，先向业务负责人和 `buck` 反馈阻断原因，不能只按资料包手动 fallback。
6. 在 `docs/business/backend-structure.md` 确认后端使用单模块还是多模块。默认单模块；只有存在多个业务构件并需要进程内构件协作时，才使用多模块。
7. 从 `templates/backend-minimal/` 和 `templates/frontend-minimal/` 初始化 `backend/`、`frontend/`。最小壳默认不装配 `modules:ai-assistant`；只有命中助手能力并接受 `released-candidate` 风险后再追加。`backend-minimal` 默认数据源是 PostgreSQL（`BUSINESS_DB_URL` / `BUSINESS_DB_USERNAME` / `BUSINESS_DB_PASSWORD` / `BUSINESS_DB_DRIVER`）；H2 不在已发布 dialect 允许列表，不能用于 `test` / `bootRun`。本地先准备 PostgreSQL，或从 `templates/local-secrets.env.example` 覆盖。
8. 后端单模块使用 `backend/src/main/java/com/example/<app>/applet/<feature>/...`；多模块使用 `<app>-module-common`、`<app>-module-<component>`、`<app>-boot`。
9. 后端构建文件必须保留 Lombok、MapStruct、Bean Validation 和 annotationProcessor 依赖；Spring 组件用 `@RequiredArgsConstructor`，Entity/DO 用 Lombok，Entity 与 DTO/Command/Response 转换用 `@Mapper(componentModel = "spring")`，可继承 `BrickDtoMapper<ENTITY, DTO>`，MapStruct mapper 放 `applet/<feature>/service/mapper` 并由 service 持有。Controller 的 `@RequestBody` 入参必须使用 `@Valid` / `@Validated`，Request/Command/Query DTO 的关键字段必须声明 `jakarta.validation.constraints`；Controller 不依赖 `BrickDtoMapper`、`service/mapper` mapper 或 `repository` Entity/DO。
10. 从 `templates/github-actions.yml` 生成业务仓库 `.github/workflows/ci.yml`，并按 [business-ci-cd.md](business-ci-cd.md) 确认组级变量、runner executor、JDK17/Gradle 分发源、可达 JDK17 镜像、`DEV_DEPLOY_BRANCH`、`TEST_DEPLOY_BRANCH`、K8s runtime Secret、dev 自动部署、test 自动部署和 tag 制品发布；test 环境必须使用 `${NAMESPACE}-test`、独立 Secret、`BUSINESS_TEST_DB_URL` / `BUSINESS_TEST_DB_USERNAME` / `BUSINESS_TEST_DB_PASSWORD` 和 `*.example.com` 域名；其中 `verify_brick_rules` 必须保留在 `policy` stage，执行 `node docs/buck/<version>/rules/check-business-structure.mjs .`，不得改成 `if: false` 或 `continue-on-error: true`。
11. 把 `templates/docker/backend/*` 复制到 `backend/docker/`，把 `templates/docker/frontend/*` 复制到 `frontend/docker/`，再按业务端口、域名、profile、资源限制和 ingress 调整 K8s 模板；前端 Nginx 模板必须保留 `/transport/**`、`/brick/**` 和 `/api/**` 代理。
12. 在 `docs/business/requirements.md` 写清第一阶段业务范围和不做什么。
13. 先查 `docs/buck/<version>/capabilities/capability-catalog.json`，确认已发布模块、权限、页面、queryCode、optionCode 和 frontend exports；再在 `docs/business/module-adoption-decision.md` 完成 Buck 能力命中判断，并至少覆盖 IAM、通知配置、安全设置、审计、应用中心、`core:query`、`core:option`、`core:orm-plus` 的命中结论，写明命中/采用或不采用/原因或理由/确认人。
14. 在 `docs/business/permissions.md`、`menus.md`、`audit-events.md` 记录业务权限、菜单和审计事件初稿。
15. 让业务智能体先输出 `buck-business-agent skill 状态：已使用 / 已安装`、后端结构选择、模块采用决策、CI/CD 采用检查和开发切片，再开始实现。
16. 如果采用 IAM，只保留 `brick.iam.bootstrap.admin.initial-password` 这类必要运行配置；不要在业务仓库写账号初始化脚本，也不要在配置文件重复维护组织名、员工名、角色 ID、员工 ID 等默认种子主数据。
17. 如果采用 IAM 登录页，前端 dev proxy 和网关必须确认 `GET /transport/meta`、`GET /brick/captcha`、`POST /brick/login`、`POST /brick/logout`、`/brick/mfa/**` 和 `/brick/password/change` 原样转发到后端；采用发布包默认 `/api/**` rewrite 时，`/api` 只是前端代理前缀，业务 Controller 不带 `/api`。
18. 启动前端调试前必须先启动真实后端，并确认 `BUSINESS_API_BASE_URL` 或 `127.0.0.1:8080` 可访问；前端不得自己构造 mock 后端、mock 菜单、mock 权限或 mock 业务数据。IAM 菜单、权限、审计、OpenAPI、调用记录、清理配置等链路必须以真实后端和数据库返回为准。业务仓库不得保留 `mock:backend`、`mock-backend` 或 `frontend/scripts/mock-backend.*` 这类入口；确需临时视觉预览时，交付证据必须单独标注为“临时视觉预览”，不能替代真实后端验证。
19. 多模块业务应用必须声明每个 appMode 的后端模块集合、前端模块集合、迁移目录和验收命令。前后端 appMode 必须一致，例如都使用 `esign` 或都使用 `suite`；不能前端单模块、后端 suite 混跑。每个 appMode 都应能从空库启动，迁移目录不得引用其他业务模块表。
20. 采用 IAM 时，运行时左侧导航必须以 IAM 当前主体菜单投影为源头。前端 route metadata / module routes 只用于组件加载、路由注册和 path 绑定，不作为菜单名称、排序、分组、启停或可见性的事实源。
21. IAM 首次验收时，登录账号、内置维护角色、权限目录、菜单目录、根组织和运维员工档案应由 bootstrap 自动初始化。默认运维图谱完成初始化后，重启不得再次回写这组主数据；后续菜单名称、层级、图标、排序和启用状态应以菜单管理维护值为准。默认运维账号登录必须能拿到员工档案，否则视为接入不合格。
22. 临时设计、实施计划、Context Ledger、Quality Utility Tree、Tool Output Strategy 和验证计划写入业务 GitHub issue comment 或 MR 描述，不写入 `docs/superpowers/plans/**`、`docs/superpowers/specs/**` 或同类过程性文档。`docs/business/` 只保留稳定业务事实、模块边界、菜单、权限、审计、CI/CD、验收和采用决策。
23. 开发中发现 Buck 缺少基础能力、已发布功能存在 bug、文档模糊、功能不符合业务开发预期、资料包或业务 agent skill 有完善空间时，在公开仓 `buck-issues` 提交闭环问题：<https://github.com/wu9007/buck-issues/issues>。Issue 使用中文标题和正文；错误日志、类名、接口名和配置键可以保留原文。
24. 按 [business-issue-collaboration.md](business-issue-collaboration.md) 区分业务仓库 issue 和 `buck` issue：业务私有需求留在业务仓库 issue，通用框架缺口创建或关联 `buck` issue，业务 milestone 表达业务交付或 Buck 采用窗口。
25. GitHub Release 是 Buck 默认发布日志和 release index，只说明新版本可用；逐业务仓库发布通知 Issue 只作为必要时的兜底方式。
26. 当业务仓库完成 Buck 升级、提交 `docs/buck/<version>/`、更新后端/前端依赖并验证通过后，在 `buck` Issues 主动提交“Buck 采用反馈：<business-code> 已采用 <brick-version>”，写明业务提交号、资料包路径和验证命令。Buck 维护侧不从 GitHub Release 或发布通知推断采用版本。

## 强制检查

业务仓库必须保留发布资料包里的结构和基础能力检查：

```bash
node docs/buck/<version>/rules/check-business-structure.mjs .
```

该检查属于业务仓库 CI 的阻断门禁，不是建议项。检查失败时：

- 目录结构不符合单模块或多模块标准，必须调整目录。
- 命中标准结构白名单外目录、单模块 `innerapi`、根级 `controller/service/repository/dto` 等违规结构，必须删除或迁移。`query/`、`audit/`、`integration/` 只是白名单外目录的典型例子，不是单独维护的黑名单。
- 命中自建 IAM、认证、鉴权、审计、查询、选项、应用接入或 JDBC 持久化实现，必须改为采用 Buck `core` 或正式模块。
- 命中缺少 Lombok/MapStruct/Bean Validation 构建依赖、MapStruct mapper 未放 `service/mapper`、未声明 `componentModel = "spring"`、Controller 返回 `.service` 包类型、Controller 依赖 `BrickDtoMapper` / `service/mapper` mapper / `repository` Entity/DO、service 暴露 public nested DTO/Command/Response/Page/Detail record、Controller `@RequestBody` 缺少 `@Valid` / `@Validated`、Request/Command/Query DTO 缺少字段约束，必须按后端编码强制规范修复；MapStruct mapper 可继承 `BrickDtoMapper`，但只能由 service 持有，不要误判为 MyBatis-Plus 持久化 Mapper。
- 面向接口的日期时间字段禁止在 `controller` / `service` / `service/mapper` MapStruct mapper / `provider` 里手写 `DateTimeFormatter`、`SimpleDateFormat`、`temporal.toString()` 或 `@Mapping(expression = "java(...toString())")` 转成 `String`；保持 `LocalDateTime`、`LocalDate`、`LocalTime`、`Instant` 等强类型，由 `core:api` 统一序列化。
- 软删表的业务唯一索引必须包含 `data_status`；`BrickBaseDao.deleteById()` 是逻辑删除，删除行仍占用原业务键。
- 命中静态 `<el-option>` 或本地 `xxxOptions = [{ label, value }]` 选项数组，必须改成后端 `BrickOptionProvider` + 前端 `@wildbuck/core-option-frontend` 加载。
- `docs/business/module-adoption-decision.md` 必须使用标准矩阵覆盖正式模块和核心能力命中结论，不能只写一句“采用 Buck core/module”。
- `verify_brick_rules` 必须自动执行；不允许删除 job、不允许改成 `if: false`、不允许设为 `continue-on-error: true`。
- 业务仓库不得保留 `mock:backend`、`mock-backend` 或 `frontend/scripts/mock-backend.*` 入口；启动前端调试前必须先启动真实后端，mock 后端、mock 菜单、mock 权限和 mock 业务数据不得写入调试或验收通过证据。
- 业务仓库不得保留 `docs/superpowers/plans/**`、`docs/superpowers/specs/**` 或同类过程性计划文档；过程计划写入业务 issue/MR，稳定事实才进入 `docs/business/`。
- 业务 Controller path 不默认使用 `/admin`，也不包含 `/api` 代理前缀；使用真实业务域路径，权限边界由 Buck authentication/authorization 和权限点表达。
- 多模块迁移目录不得通过外键、`alter table`、DML 修补或同步脚本引用其他业务模块表。
- 运行时左侧导航必须以 IAM 当前主体菜单投影为源头，route metadata 只负责路由和组件绑定。
- 如果 Buck 确实缺少基础能力，业务开发智能体必须向 `buck-issues` 创建中文问题，等待框架侧演进；不能在业务仓库长期或临时自造平行机制。

业务开发智能体不得删除 `verify_brick_rules` job、不得改宽检查脚本、不得通过本地跳过检查来交付业务代码。

## 必备业务上下文

| 文件 | 必填内容 |
| --- | --- |
| `requirements.md` | 系统目标、第一阶段业务范围、明确不做的功能、关键业务实体和主要用户角色。 |
| `backend-structure.md` | 后端选择单模块还是多模块、包名、业务功能点、迁移目录和目录白名单约束。 |
| `module-adoption-decision.md` | 覆盖 `modules:iam`、`modules:notification-setting`、`modules:security-setting`、`modules:audit`、`modules:application-center`、`core:query`、`core:option`、`core:orm-plus` 的命中结论，以及对应 Maven/npm 依赖、原因/理由和确认人。 |
| `permissions.md` | 权限 code、权限名称、所属菜单、对应 API 或页面。 |
| `menus.md` | 菜单 code、路径、标题、层级、需要权限。 |
| `audit-events.md` | 需要审计的业务动作、审计类型、审计对象和敏感字段处理方式。 |
| `external-systems.md` | 外部系统、接口方向、认证方式、失败处理和是否需要 OpenAPI / OAuth client。 |
| `acceptance.md` | 本业务仓库总检查命令、聚焦测试命令、人工验收入口和测试账号。 |

缺少这些上下文时，业务智能体不应靠猜测落代码。它应先补齐业务上下文，或把不确定项写入 `module-adoption-decision.md` 的待确认区。

## 后端结构决策模板

在 `docs/business/backend-structure.md` 写明：业务系统、包名前缀、单模块/多模块与理由。

- 单模块：`applet/<feature>/{controller,dto,repository,service,provider}`  
- 多模块：`<app>-module-common` / `<app>-module-<component>` / `<app>-boot`  
- 白名单外目录（如 `query/`、`audit/`、`integration/`）禁止新增；查询走 `core:query`，审计走 `core:audit`/`modules:audit`  
- 迁移：`db_<app|component>/<database>/V<business-version>_<seq>__<description>.sql`；主键 `string(20)`  

完整骨架见 [upper-application-development-guide.md](upper-application-development-guide.md) 与 `templates/backend-minimal/`。

## 模块采用决策模板

在 `docs/business/module-adoption-decision.md` 用矩阵覆盖至少：IAM、通知配置、安全设置、审计、应用中心、登录品牌（`modules:login-brand`，若需要可运营登录外观）、`core:query`、`core:option`、`core:orm-plus`，以及 observability / client-meta / usage-event（Logback 基线 `templates/backend-minimal/src/main/resources/logback-spring.xml`，主日志 `%X{traceId}`，勿用 `%X{logRequestId}`；不把 usage event、审计事实和生产排障日志混成一个格式）。**命中正式模块但决定不采用**时必须写明原因、替代方案、风险和确认人；未确认前禁止平行实现。坐标见 [business-module-adoption-reference.md](business-module-adoption-reference.md)。登录页版本号走 jar 身份注入，见 [business-ci-cd.md](business-ci-cd.md)。

## 业务智能体首个任务

先 `git fetch` 并核对 `docs/buck/<version>/`；**不要先写代码**。输出：能力命中、catalog 采用决策、依赖清单、后端结构、切片拆分、缺失上下文。缺能力时向 <https://github.com/wu9007/buck-issues/issues> 提中文 Issue。完整话术见发布资料包 `agent-skills/buck-business-agent` 与 `templates/AGENTS.md`。

## 完成标准

- 完整资料包、`AGENTS.md`/`README.ai.md`、发布依赖、`docs/business/` 必备文件齐全  
- `.github/workflows/ci.yml` 保留 `verify_brick_rules` + `check-business-structure.mjs`  
- dev/test 可部署；tag 制品路径按 [business-ci-cd.md](business-ci-cd.md)  
- 升级后提交 Buck 采用反馈 Issue（或负责人明确暂缓）
