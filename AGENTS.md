# 业务应用 AI 工作规则

当前 Buck 版本：2.0.0-11

这是独立上层业务应用仓库，不是 `buck` 框架源码仓库。业务 agent 只能通过发布依赖消费 Buck，不复制、不修改 Buck 源码；禁止业务 agent 读取、搜索、打开、修改、提交或推送 `buck` 源码仓库或本地 checkout。

## 开工读取路径

业务侧 Context Budget Gate 按 `docs/buck/2.0.0-11/business-context-budget.md` 执行。目标是读够当前阶段，不是一开始全量展开所有长文档。

本模板只承载稳定开工规则，不承载活跃 backlog、临时计划或临时评审结论。业务排期和过程性结论应放在业务 issue、MR、milestone 或 CI 证据中；需要沉淀为长期 Buck 规则时，回流 `buck` 并按 `docs/architecture/governance/document-complexity-governance.md` 判断资料面归属。

### 热入口必读

1. `README.ai.md`
2. `docs/buck/2.0.0-11/README.md`
3. `docs/buck/2.0.0-11/business-context-budget.md`
4. `docs/business/` 下定义当前需求、菜单、验收、CI 或模块采用的摘要文档

### 阶段触发读取

- 初始化或目录结构：`docs/buck/2.0.0-11/business-repository-startup-checklist.md`
- CI/CD、runner、部署或 release artifact：`docs/buck/2.0.0-11/business-ci-cd.md`
- 密钥、环境变量、真实数据库 smoke、Nexus、npm、镜像仓库或 K8s Secret：`docs/buck/2.0.0-11/secret-environment-governance.md`
- issue 分流、采用反馈、labels、milestone 或 Buck 通用缺口：`docs/buck/2.0.0-11/business-issue-collaboration.md`、`docs/buck/2.0.0-11/github-issue-governance.md`、`docs/buck/2.0.0-11/issue-templates/`
- 分支、MR、tag 或下一个需求排序：`docs/buck/2.0.0-11/git-branch-governance.md`
- 业务模块采用、页面或 API 设计：`docs/buck/2.0.0-11/upper-application-development-guide.md`、`docs/buck/2.0.0-11/business-module-adoption-reference.md`、`docs/buck/2.0.0-11/business-frontend-ui-reference.md`、`docs/buck/2.0.0-11/business-frontend-page-patterns.md`

### 按需读取

- `docs/buck/2.0.0-11/capabilities/README.md`
- `docs/buck/2.0.0-11/capabilities/capability-catalog.json`
- 直接相关业务源码、模板、规则、测试、API 片段、MR diff 和 CI 失败片段

## 资料包权威来源

业务仓库内的 `docs/buck/2.0.0-11/` 是唯一权威资料源。开始阅读资料包或实现前，先在业务仓库执行：

```bash
git fetch origin
git ls-tree --name-only origin/main:docs/buck
```

资料包读取优先级固定为：当前业务仓库工作区资料包 > 业务仓库远端指定分支资料包 > 经业务负责人明确授权下载并回填到业务仓库的 Buck 发布 artifact。

不要把 `buck` CI artifacts、临时下载目录或外部 release zip 作为优先资料源。确需下载发布 artifact 时，必须先回填到业务仓库 `docs/buck/2.0.0-11/`，同步 `AGENTS.md` / `README.ai.md`，再开始开发。禁止业务 agent 读取、搜索、打开、修改、提交或推送 `buck` 工作区；不得用 `rg`、`sed`、`cat`、`apply_patch`、`git add`、`git commit`、`git push` 等命令操作 `buck` 源码。

GitHub Release 是 Buck 默认发布日志和 release index。它只说明新版本可用，不代表本业务系统已经采用。逐业务仓库发布通知 Issue 只作为必要时的兜底渠道；业务开发仍以本仓库已提交的 `docs/buck/<version>/` 为权威来源。

如果用户给出的 Buck 版本与业务仓库实际资料包目录版本不一致，先报告准确版本差异并等待统一，不继续猜测。

## Context Budget Gate

业务侧上下文预算按 `docs/buck/2.0.0-11/business-context-budget.md` 执行。开始下一个业务需求、创建工作分支或准备 MR 前，先声明 Context Ledger、Quality Utility Tree、Tool Output Strategy 和 Business Follow-up；热入口必读，阶段触发读取，能力目录、模板、API、业务源码和日志按需读取。长日志写入 `/tmp/*.log`，成功只读尾部，失败按关键字读片段。

开始实现前必须确认业务仓库 labels 和 milestone 已初始化；至少存在 `type:*`、`scope:*`、`priority:*`、`status:*` 四类标签，并有业务交付或 Buck 采用 milestone。开工时先检查 assignee 和 `status:in-progress`，未被认领时用二者认领，已被认领时不要重复开发。未确认 `labels 和 milestone 已初始化` 时，先补业务仓库治理 issue 或初始化动作，不要直接进入代码实现。

## Agent skill（工具无关）

当前资料包只向业务侧提供 `docs/buck/2.0.0-11/agent-skills/buck-business-agent/`。必须先确认当前会话已使用或已安装 `buck-business-agent`；未安装时必须从这个目录安装。不要安装、复制或使用 `buck-next-maintainer`，也不要让业务 agent 读取、搜索、打开、修改、提交或推送 `buck` 工作区、分支、MR、tag 或 release。

业务 agent 的首个输出、MR 描述、issue comment 或最终交付证据必须写明 `buck-business-agent skill 状态：已使用 / 已安装`。无法安装时停止实现，报告安装来源、失败原因和业务影响，不能只按资料包手动 fallback。

完成 Buck 升级并验证通过后，业务侧必须主动在 brick-next 创建采用反馈 Issue，标题格式为 `Buck 采用反馈：<business-code> 已采用 <brick-version>`，正文写明业务系统、Buck 版本、业务仓库、采用提交、资料包路径、后端/前端依赖版本和验证命令，并按 `docs/buck/2.0.0-11/business-issue-collaboration.md`、`docs/buck/2.0.0-11/github-issue-governance.md` 和 `docs/buck/2.0.0-11/issue-templates/brick-adoption-feedback.md` 建议 labels、milestone 和关闭证据。Buck 维护侧只根据该反馈或可验证业务仓库状态更新 `business-adoption-registry.json`，不会从 GitHub Release 或发布通知推断业务已采用。

## 密钥与环境变量

真实数据库、Nexus、私有 npm、镜像仓库、K8s、短信/邮件、OAuth/OpenAPI 等变量按 `docs/buck/2.0.0-11/secret-environment-governance.md` 执行。团队共享变量名、用途、加载命令和验证证据，不共享明文密钥文件。

本地开发从 `docs/buck/2.0.0-11/templates/local-secrets.env.example` 复制到仓库外 `~/.brick/<repo-name>/local-secrets.env`，目录权限 `700`、文件权限 `600`。CI/CD 使用 GitHub Actions secrets，运行态注入使用 K8s Secret、配置中心或团队批准的 secret 系统。issue、MR、日志、截图、skill 和 release bundle 不记录真实密码、token、client secret、连接串或生产 IP。

## 分支、MR 和 tag 协作

- 开始下一个业务需求、创建工作分支或准备 MR 前，先执行 `docs/buck/2.0.0-11/git-branch-governance.md` 的 Next-work triage gate：刷新业务仓库 open issues，读取正文和 comments，确认优先级、状态和 milestone，再说明当前最高优先级选择原因。
- Next-work triage gate 必须同时确认业务仓库 labels 和 milestone 已初始化；没有初始化时，先处理治理初始化，不把未排序 issue 直接推进实现。
- 业务分支统一使用 `<type>/issue-<iid>-<slug>`，`type` 只使用 `feat`、`fix`、`refactor`、`docs`、`test`、`chore`；不使用 `codex/`、`human/`、`dev/<name>/` 或 `improve/`。
- 任何 `git add`、`git commit`、`git push`、整理本地未提交和未推送代码、准备 MR 或收尾工作前，先执行 `git status -sb`、`git branch --show-current` 和 `git log --oneline origin/main..HEAD`。
- 当前分支是 `main` 且存在未提交改动时，不直接提交；当前分支是 `main` 且存在 ahead commits 时，不允许直接 push，先报告 ahead 提交并选择 issue 分支迁移、MR 或有记录的紧急流程。
- 不直接提交业务仓库 `main`；MR pipeline 通过后合并，合并后删除 source branch。
- 业务发布 tag 只能从 `main` 上已合并 commit 创建，不从 feature/fix/refactor/docs/test/chore 分支直接打 tag。
- 业务侧发现 Buck 通用缺口时链接或创建 `buck` issue，但禁止业务 agent 读取、搜索、打开、修改、提交或推送 `buck` 工作区，不在 `buck` 开分支、MR、tag 或 release。

## Buck 使用边界

- 写代码前必须先查能力目录：先读 `docs/buck/2.0.0-11/capabilities/README.md`，再查 `docs/buck/2.0.0-11/capabilities/capability-catalog.json`。先用 `capabilityAdoption[]` 判断必须复用的 core/module/starter，再用 `modules[].permissions`、`modules[].pages`、`modules[].frontend.exports`、`queryDefinitions.entries[].queryCodes`、`optionProviders.entries[].code` 和 `coreFrontendPackages[].exports` 判断 Buck 已发布能力，最后决定 Maven/npm 依赖和业务实现边界。
- 写代码前必须完成 Buck 能力命中判断；命中正式模块时必须采用对应 Buck 后端依赖和前端包。
- 通用能力命中后必须复用 Buck：查询走 `core:query`，选项走 `core:option`，认证走 `core:authentication`，鉴权走 `core:authorization`，生产排障走 `core:observability`，浏览器启动公开运行时元数据走 `core:client-meta`，产品使用事件走 `core:usage-event`，图片和业务附件资源走 `core:file-resource`，持久化代码走契约、MyBatis-Plus 和 `core:orm-plus`。
- 面向页面或 API 调用方的列表筛选、分页、排序必须注册 `BrickQueryDefinition`，用 `QueryCriteria` 表达条件，并通过 `BrickQueryExecutor` 执行；不要在 Controller/Service 中用 `LambdaQueryWrapper`、`QueryWrapper` 或 `Wrappers.lambdaQuery` 加 `selectList/selectPage` 手写 `like`、`orderBy`、page/size 或前端可控筛选。内部按主键、唯一键或固定外键做精确读取、唯一性校验和删除前引用检查可以保留 MyBatis-Plus，但不能扩展成页面列表协议。
- 业务私有匿名入口、仅登录入口或权限入口通过 `BrickAuthorizationRuleContributor` 注册；路径模式支持 `{id}` 单段变量和 `**` 多段通配，例如 `BrickAuthorizationRule.anonymous("POST", "/openapi/face/**")`。
- 业务持久化表必须有且只有一个 `string(20)` 主键；生产 DO/Entity 使用 `@TableId(value = "...", type = IdType.ASSIGN_ID)` 和 `String` 主键字段。需要固定 ID 时插入前显式赋值，不改成 `IdType.INPUT`。
- 生产排障 traceId、MDC、响应头 `trace-id` 和请求完成日志走 `core:observability`；业务仓库不得自建 `TraceIdFilter`、`RequestLoggingFilter`，不得记录请求/响应 body。
- 浏览器启动公开运行时元数据走 `core:client-meta` 和 `@wildbuck/core-client-meta-frontend`；业务壳启动时读取 `/brick/client-meta`，不自建平行 meta endpoint、配置中心或前端启动配置协议，不返回密钥、token、连接串、内部策略明文、请求体、表单内容或业务对象明文；`/transport/meta` 仍是传输安全预检兼容接口。
- 产品使用事件、功能曝光/进入/动作完成/失败/放弃采集走 `core:usage-event`；前端使用 `@wildbuck/core-usage-event-frontend` 从 client-meta 自动 bootstrap，模块级事件接入用 `createModuleUsageTracker()` 绑定稳定矩阵，页面用 `trackAction(featureKey, actionCode, asyncFn)` 自动记录成功/失败，动作结果已由页面流程确定时用 `trackActionResult(featureKey, actionCode, result)` 写入 `SUCCESS` / `FAILURE` / `CANCELLED` / `ABANDONED`；后端-only 动作使用 `BrickUsageEvents.action()` 构造并通过 `BrickUsageEventPublisher` 显式发布，前后端不要重复发布同一语义事件；不要自建埋点 endpoint、日志格式或本地 usage/event 子系统；不得匿名开放 `/brick/usage-events/collect`；不得采集姓名、手机号、身份证号、token、密码、密钥、请求体、表单内容、附件内容或业务对象明文。
- 图片、头像、Logo、菜单图标、证照、人脸图片和业务附件资源走 `core:file-resource`；业务页面使用 `BrickImageUploadField`，业务表保存 resourceId、分类、大小和 expireAt，不把 Base64 或二进制内容塞进业务表、日志表、列表接口或审计 payload。业务附件图片分类使用 `BUSINESS_ATTACHMENT`，留存清理时先禁用资源引用，再删除业务记录。
- ORM Plus 物理映射只复用 MyBatis-Plus：表名来自 `@TableName`，列名来自 `@TableId/@TableField` 或字段名推导，主键来自 `@TableId`。`@BrickPersistentEntity("显示名")` 只声明实体显示名和审计开关，不再提供表名；字段长度、可空、索引和约束来自 contract/Flyway，不使用 Buck 字段级结构注解。
- 业务后端强制使用 Lombok、MapStruct 和 Bean Validation。Spring 组件优先 `@RequiredArgsConstructor` 注入依赖，Entity/DO 使用 `@Getter`、`@Setter`、`@Accessors(chain = true)`，Entity 与 DTO/Command/Response 转换使用 `@Mapper(componentModel = "spring")`；Controller 的 `@RequestBody` 入参使用 `@Valid` / `@Validated`，Request/Command/Query DTO 关键字段使用 `jakarta.validation.constraints`。
- MapStruct mapper 放在 `applet/<feature>/service/mapper` 并由 service 持有；MyBatis-Plus 持久化接口统一命名为 `Dao`，放在 `repository`，继承 `BrickBaseDao<T>` 并标注 `@Dao`。不要把 MapStruct mapper 放到 `controller` 或 `repository`，也不要手写重复 setter 转换来绕过 mapper。
- DTO、Command、Query、Request、Response、Page 和 Detail 等 HTTP 契约类型默认放在 `applet/<feature>/dto`；若业务把对外 OpenAPI 接口作为模块级根目录 `openapi/` 边界组织，则该边界的契约类型允许放在 `openapi/dto`，不要把 `com.xxx.openapi.dto` 误改成 `com.xxx.applet.openapi.dto`。service 禁止暴露 public nested 契约 record，Controller 禁止返回 `.service` 包类型，也禁止依赖 `BrickDtoMapper`、`service/mapper` mapper 或 `repository` Entity/DO。功能点同时存在 `dto` 和 repository Entity/DO 时，必须提供 `service/mapper` 下的 MapStruct mapper。
- Buck 基础能力不足时，必须向 brick-next 提交中文 Issue；不能在业务仓库临时或长期自造平行机制。
- 不复制 `buck` 源码，不通过 Gradle `project(...)`、`includeBuild` 或 npm workspace 直连框架源码。
- 不深度引入 `@wildbuck/*` 未通过 `exports` 暴露的内部文件。
- 前端壳必须代理 `/transport/**` 和 `/brick/**` 固定端点；`configureHttp({ baseUrl })` 不能替代登录和传输代理。
- 采用发布包默认 `/api` rewrite 时，`/api` 只是前端代理前缀；业务后端 Controller 映射使用后端真实路径，例如 `@RequestMapping("/face-archives")`，不要写成 `/api/face-archives`。
- 启动前端调试前必须先启动真实后端，并确认 `BUSINESS_API_BASE_URL` 或 `127.0.0.1:8080` 可访问；前端不得自己构造 mock 后端、mock 菜单、mock 权限或 mock 业务数据。IAM 菜单、权限、审计、OpenAPI、调用记录、清理配置等链路必须用真实后端和数据库验证。确需临时视觉预览时，交付证据必须单独标为“临时视觉预览”，不能写成“真实后端验证”。
- 前端菜单、侧栏、顶部栏和主题切换必须复用 `@wildbuck/core-ui-frontend`；默认主题建议用 `blue`，`night` 才是全暗主题，`green` / `orange` / `guard` 是深色侧栏加浅色内容区的品牌主题。
- 前端列表查询 DSL 使用 `@wildbuck/core-query-frontend`，选项加载使用 `@wildbuck/core-option-frontend`；不要在页面硬编码静态 `<el-option>` 或本地 `xxxOptions = [{ label, value }]`，也不要用前端字段配置替代后端 `BrickQueryDefinition`。
- 标准筛选工具条使用 `@wildbuck/core-ui-frontend/patterns` 暴露的 `BrickFilterToolbar`。它只负责页面筛选布局和动作区，字段白名单、操作符、排序和分页上限仍由后端 `core:query` 的 `BrickQueryDefinition` 控制；不要从 `shell` 引入页面模式组件。Element Plus `daterange` / `datetimerange` 字段把 `brick-filter-toolbar__field--range` 加在直接 grid item 上后会跨两列，小屏占满整行；如果外层包了 `el-form-item` 或 wrapper，就把该 class 放在外层直接 grid item 上。
- `BrickFilterToolbar` 内每个筛选字段必须提供中文 placeholder、可见 label 或明确 `aria-label`；中文后台前端入口必须把 Element Plus locale 配为 `zh-cn`，不要依赖 Element Plus 默认英文 `Select`。
- `@wildbuck/core-ui-frontend/patterns` 只沉淀代码化 block/action 页面模式，例如 `BrickFilterToolbar`、`BrickPageBlock`、`BrickEmptyState`、`BrickActionBar` 和 `BrickRiskConfirm`。core-ui 不是查询引擎、选项源或权限引擎；不要把运行时 UI schema、后端返回筛选控件布局、组件类型、业务文案、权限语义或业务数据调用塞进 UI 组件。
- 顶部栏默认不配置左侧标题、说明或面包屑，不拆 Shell、不自造 Topbar。顶部栏是贴住浏览器顶部和侧栏顶部的扁平全局操作条，不做内容区浮动卡片；只保留刷新、帮助、通知、当前主体头像下拉等全局操作入口，不展示系统信息、环境说明、菜单搜索或页面标题。系统名称和环境说明放侧栏品牌区，菜单搜索放侧栏菜单上方，当前页面上下文由侧栏 active 状态和页面标题区表达。
- 侧栏整体折叠通过 `BrickConsoleShell` 的 `v-model:sidebar-collapsed`、`sidebar-collapsible` 和 `brand-mark`；菜单分组折叠通过 `v-model:sidebar-collapsed-group-keys`、`sidebar-group-collapsible`、分组 `defaultCollapsed` 和 `collapsible: false`。菜单快速检索使用 `sidebar-searchable`，route 可补充 `keywords/searchKeywords`；额外筛选才使用 `sidebar-nav-before` slot。侧栏菜单图标正式主源是 IAM 菜单管理上传图（`iconResourceId` → 运行时 `iconUrl`）；渲染优先级为上传图 `iconUrl` > 业务组件 icon > 线图标兜底。字符串 `MenuBindingDescriptor.icon` 不是自动图标资源，最多作为线图标名；业务壳用 Buck/IAM 正式 helper 合并当前主体菜单，不要自建图标同步。`abbr/iconText` 仅作搜索与辅助文案。不要复制 `BrickConsoleSidebar`。运行时可执行页面仍以 `navigationGroups` 与模块 `brickRoutes` / `page-registry` 为准。
- 顶部栏刷新、菜单引导和通知按钮由业务壳通过 `topbar-actions` slot 提供，Buck 提供布局、主题和头像下拉；按钮顺序建议为刷新、菜单引导、通知、当前主体。正式全局动作使用 `ElButton` 或同等公开组件语义，不在 `topbar-actions` 中直接放原生 `<button>`、ASCII 符号按钮或局部自造样式。
- 页面向导由业务侧按统一规范实现：入口放顶部栏 `topbar-actions` 的菜单引导按钮，步骤目标使用稳定 `data-guide-id`，步骤配置包含 `target/title/body/placement`，遮罩、按钮文案、完成态 key 和抽屉内目标定位必须遵循 `business-frontend-ui-reference.md`，不要各页面自定义一套浮层语义。
- 列表页编辑和详情侧边抽屉优先使用 `@wildbuck/core-ui-frontend/shell` 暴露的 `BrickConsoleDrawer`，保存型表单、配置卡片和抽屉底部动作统一使用 `BrickActionBar`；短确认仍使用 `ElDialog`；删除、重置、强制下线、密钥轮换和全局配置保存这类危险确认使用 `@wildbuck/core-ui-frontend/patterns` 的 `BrickRiskConfirm`。不要在业务仓库复制验证壳抽屉样式、`.filter-bar` / `.query-toolbar` 本地筛选条样式，也不要给标准抽屉传固定像素 `size`。
- 保存型编辑/配置表单必须显式标明 `（必填）` / `（选填）`，必填项只渲染一套红色星号；保存前优先使用 `validateBrickRequiredFields`，保存成功/失败优先使用 `showBrickStatus`。
- 已在 `docs/business/requirements.md`、`docs/business/menus.md`、`docs/business/acceptance.md` 或同等业务文档中定义为正式能力的页面，不接受本地示例数据页、占位列表页或 mock 记录作为完成态。
- 治理模块页面必须通过 `@wildbuck/module-*-frontend/page-registry` 装配，IAM 页面异常时先运行 `validateIamPageRegistry()`。
- 业务仓库 CI/CD 必须从 `docs/buck/2.0.0-11/templates/github-actions.yml` 建立，保留 `policy -> verify -> build -> image -> deploy/release` 门禁；`dev` 分支自动部署 K8s，tag 自动上传到 `https://github.com/wu9007/buck/releases/{业务项目名称}/{tag}`。
- 发布制品必须包含后端 jar、后端 `version.txt`、非 local 的 yml 配置文件、`logback-spring.xml`、兼容 `logback.xml`、前端 tarball 和前端 `version.txt`；禁止把 `*-local.yml` 打入发布制品。
- 接入 CI/CD 前必须识别实际 runner executor。shell runner 下不要依赖 GitHub `image/services`；宿主 Java 不满足 JDK17 时打开 `CI_BACKEND_VERIFY_IN_DOCKER` 和 `CI_BACKEND_BUILD_IN_DOCKER`，使用可达的 JDK17 镜像。Gradle wrapper 不能访问公网时，把业务仓库 `gradle-wrapper.properties` 切到可访问的 Gradle 分发镜像。
- 业务仓库默认复用 GitHub 分组变量 `FS_URL`、`REGISTRY_URL`、`DOCKER_USER`、`DOCKER_PASS`、`NAMESPACE`、可选 Nexus 和 npm 凭据；不得把真实凭据提交到仓库。
- 前端生产 Nginx 必须代理 `/transport/**`、`/brick/**` 和 `/api/**` 到后端服务；发布包模板会把 `/api` 去掉后再转发，业务后端 Controller 仍使用真实业务路径。
- 业务仓库一律维护 `dev` / `test` / `main`：短分支与升级分支从 `dev` 拉出并经 MR 合入 `dev`；开发环境部署由 `DEV_DEPLOY_BRANCH=dev` 触发，禁止把 `DEV_DEPLOY_BRANCH` 设为 `main`。
- 提测阶段使用 `TEST_DEPLOY_BRANCH=test` 触发测试环境部署，部署到 `$NAMESPACE-test`，使用独立 K8s Secret、`BUSINESS_TEST_DB_URL` / `BUSINESS_TEST_DB_USERNAME` / `BUSINESS_TEST_DB_PASSWORD` 和 `*.example.com` 域名；`notify_test_deploy_success` 必须显示 `Test 部署成功通知`。
- 业务开发必须从 GitHub issue 出发，使用 `<type>/issue-<iid>-<slug>` 短分支开发，并通过 MR 合入 `dev`；业务 agent 禁止直接把短分支合入 `test` 或 `main`。 `dev -> test`、`test -> main` 和业务 tag 都必须等待业务负责人在当前会话中明确指示；没有明确指示时，业务 agent 只能准备 MR 和验证证据，禁止自行执行合并或打 tag。
- 后端运行库连接信息通过 GitHub Actions secrets 和 K8s Secret 注入，不能写入仓库；需要模板创建 Secret 时使用 `CI_CREATE_RUNTIME_SECRET=true`。DNS 注册按 `business-ci-cd.md` 使用业务自有 DNS API，不要把内网地址写进仓库。
- 流水线失败时先修业务代码、目录、依赖、测试或 Buck 能力采用问题；不得删除 `verify_brick_rules`、不得把验证改成手工任务、不得让 tag 发布或 dev 部署绕过验证阶段。
- 缺少通用能力时记录为 Buck 框架扩展需求，不在业务仓库自造平行机制。

## 后端结构规则

- 默认使用单模块 `backend/src/main/java/com/example/<app>/applet/<feature>/...`。
- 只有存在多个业务构件并需要进程内构件协作时，才使用多模块 `<app>-module-common`、`<app>-module-<component>`、`<app>-boot`。
- 单模块不创建 `innerapi`；多模块只在 common 契约和构件实现中使用 `innerapi`。
- 只能使用标准白名单目录；`query/`、`audit/`、`integration/` 等未列入标准结构的目录不得新增。Query 来自 DO 元数据和 `core:query` 定义；审计来自 DO 注解、ORM 生命周期、`core:audit` 和 `modules:audit`；外部系统和对外 API 使用明确命名的 `client/remote/openapi`。
- 迁移目录使用 `src/main/resources/db_<app-or-component>/<database>/V<business-version>_<seq>__<description>.sql`。当前资料包未发布业务仓库迁移生成器时，允许经过评审的 Flyway DDL 迁移产物只放在该目录；建表 DDL 必须声明 primary key，业务运行时代码仍禁止直接 JDBC 或手写 SQL。
- CI 必须保留并通过 `node docs/buck/2.0.0-11/rules/check-business-structure.mjs .`；检查失败时不能删除 job、改宽脚本或绕过。

## CI/CD 规则

- 初始化业务仓库时，把 `templates/github-actions.yml` 复制为根目录 `.github/workflows/ci.yml`，把 `templates/docker/backend/*` 复制到 `backend/docker/`，把 `templates/docker/frontend/*` 复制到 `frontend/docker/`。
- 业务仓库与旧验证壳项目在同一 GitHub 分组时，优先使用分组级 CI/CD Variables；只在业务仓库覆盖 `svcport`、`frontend_svcport`、`ingress`、`prefix`、`dev_profile`、`replicas` 和 `release_group` 等非敏感项目参数。
- 接入模板前先确认 runner 类型。shell executor 不会生效 `image/services`；需要 JDK17 容器时使用 `CI_BACKEND_VERIFY_IN_DOCKER`、`CI_BACKEND_BUILD_IN_DOCKER`、`CI_BACKEND_TEST_IMAGE`、`CI_BACKEND_BUILD_IMAGE` 和 `CI_POSTGRES_IMAGE`，并优先使用可达 JDK17 镜像。
- `DEV_DEPLOY_BRANCH` 固定为 `dev`，该分支流水线必须在规则检查、后端测试和前端检查通过后，构建后端/前端镜像并自动部署到 `$NAMESPACE-dev`。
- `TEST_DEPLOY_BRANCH` 分支流水线必须在规则检查、后端测试、前端检查和镜像构建通过后，自动部署到 `$NAMESPACE-test` K8s 测试环境，使用独立 K8s Secret、`BUSINESS_TEST_DB_URL` / `BUSINESS_TEST_DB_USERNAME` / `BUSINESS_TEST_DB_PASSWORD` 和 `*.example.com` 域名；测试环境部署成功通知必须显示 `Test 部署成功通知`。
- 业务 agent 禁止直接把短分支合入 `test` 或 `main`；`dev -> test`、`test -> main` 和业务 tag 必须等待业务负责人在当前会话中明确指示，未获指示时只能准备 MR 和验证证据。
- tag 流水线必须在规则检查、后端测试和前端检查通过后，把后端 jar、后端 `version.txt`、非 local 的 yml 配置文件、`logback-spring.xml`、兼容 `logback.xml`、前端 dist 包和前端 `version.txt` 上传到 `$FS_URL/releases/$GITHUB_REPOSITORY/$GITHUB_REF_NAME/`。
- 前端 Nginx 模板必须保留 `/transport/**`、`/brick/**`、`/api/**` 代理；如后端 Service 名称或端口不同，覆盖 `BACKEND_SERVICE_NAME` 和 `BACKEND_SERVICE_PORT`。
- image、deploy 和 release job 必须保留 build artifacts 依赖；前端 image job 从 `frontend/build/brick/frontend/*.tar.gz` 解出 dist，不依赖工作区残留。
- 开发环境运行库通过 GitHub Actions secrets -> K8s Secret 注入；DNS 注册使用业务自有 DNS API。
- 如果 runner、K8s、GitHub Release 或镜像仓库变量缺失，应记录为业务仓库环境问题或向 brick-next 提交模板改进 Issue；不能在业务代码里写死凭据或维护第二套长期流水线。

## Buck 能力命中门禁

- 用户、员工、组织、角色、菜单、权限、会话、权限分配命中 `modules:iam`。
- IAM bootstrap 默认初始化运维账号、维护角色、注册权限目录、注册菜单目录、最小根组织和运维员工档案，并把注册权限授予维护角色；菜单由权限关联的功能点推导，不直接授予角色。默认运维图谱属于 IAM 模块内置种子，业务仓库只保留开关和初始密码配置，不在配置文件重复维护组织名、员工名、角色 ID、员工 ID 等主数据。
- 正式 EMAIL/SMTP 提供方配置、邮件通道治理和发件人身份配置命中 `modules:notification-setting`。
- 登录安全、密码策略、弱密码库、MFA 策略、传输安全配置命中 `modules:security-setting`。
- 审计日志落库、审计查询、审计详情页命中 `modules:audit`。
- 生产排障 traceId、MDC、请求完成日志和响应头 `trace-id` 命中 `core:observability`。
- 浏览器启动公开运行时元数据命中 `core:client-meta`。
- 产品使用事件、功能曝光/进入/动作完成/失败/放弃采集命中 `core:usage-event`。
- 图片资源、业务附件图片、资源引用、内容预览和到期清理命中 `core:file-resource`。
- OAuth client、scope、OpenAPI 动作目录、机器访问白名单默认命中 `modules:application-center`；业务已有组织接入功能点时，先确认业务认证模型，不能因为 Buck 发布了 capability 或示例就并行启用无需求功能。OAuth2 `client_credentials` 通过业务模块实现 `BrickOAuth2ClientRegistrationResolver`、`BrickOAuth2ClientCredentialsAuthenticator`、`BrickOAuth2AccessScopeResolver` 接入。只有业务明确要求防重放/防篡改时，才额外实现 `OpenApiHmacIntegrityCredentialProvider`、`OpenApiHmacIntegrityValidator`，集群环境替换 `OpenApiHmacNonceStore`。
- OpenAPI 入口如果需要匿名穿过后台 JWT 鉴权，匿名放行仍通过 `core:authorization` 的 `BrickAuthorizationRuleContributor` 声明，不删除 Buck 鉴权链。通用签名验证、timestamp、nonce、防重放、scope/action 主校验和访问日志归 `core:openapi`；一个 `OpenApiAccessLogSink` 覆盖 Bearer 认证失败、HMAC 失败、Scope 拒绝、业务响应和业务异常，业务仓库不得自建长期 OpenAPI HMAC Filter、认证失败 Filter 或访问日志模型；HMAC 只能作为 OAuth2 Bearer 后置完整性扩展，不得作为直连认证路径。
- 命中但决定不采用时，必须在 `docs/business/module-adoption-decision.md` 写明不采用原因、替代方案、风险和确认人，并等待确认。

## 禁止自造治理能力

- 不自建 `UserController`、`RoleController`、`MenuController`、`PermissionController`、`SessionController` 来替代 IAM。
- 不自建 SMTP 提供方配置表、邮件通道配置页、发件人身份配置或正式 EMAIL provider 路由语义来替代通知配置模块。
- 不自建 `AuditLogEntity`、审计表、审计查询 controller 或审计页面来替代审计模块。
- 不自建密码策略表、MFA 策略表、登录安全配置页来替代安全设置模块。
- 不自建 OAuth client、scope、应用动作白名单来替代应用中心模块。
- 不自建 `TraceIdFilter`、`RequestLoggingFilter`、请求/响应 body 日志或本地 observability 子系统来替代 `core:observability`。
- 不自建平行 client meta endpoint、配置中心或前端启动配置协议来替代 `core:client-meta`；`/brick/client-meta` 只返回公开浏览器启动配置，不返回密钥、token、连接串、内部策略明文、请求体、表单内容或业务对象明文，也不替代 `/transport/meta`。
- 不自建平行埋点框架、usage event endpoint、日志格式或本地 usage/event 子系统来替代 `core:usage-event`；后端-only 动作使用 `BrickUsageEvents.action()` 构造并显式发布，不直接手写长 record 作为常规业务接入方式；不得匿名开放 `/brick/usage-events/collect`；使用事件只提交白名单 code 维度，不提交敏感明文。
- 不把图片 Base64、大字段二进制或文件内容写入业务表、日志表、审计 payload 或列表接口；不自建长期本地文件表、本地磁盘规则或平行资源引用协议来替代 `core:file-resource`。
- 不把列表查询写成业务本地万能查询框架，不把审计写成本地审计子系统，不新增标准白名单外目录承载平行边界。

## Buck 演进闭环

开发中发现以下情况时，必须在 brick-next Issues 提交，不能只写在业务仓库提交说明、聊天记录或本地 TODO 里：

- Buck 缺少业务系统应复用的基础能力、SPI、配置项、发布入口、项目模板或示例代码。
- 已发布功能存在 bug，或实际行为与文档、契约、配置说明、示例代码不一致。
- 文档表述模糊、边界不清、缺少用法细节，导致业务 agent 只能猜测、深度读取内部实现或自造平行机制。
- 功能可以运行，但不符合正常业务开发预期，例如扩展点不足、诊断信息不足、验收路径不闭环。
- 业务 agent skill、业务 `AGENTS.md` 模板、启动清单或资料包组织方式存在改进空间，影响业务 agent 正确采用 Buck。
- Issue 使用中文标题和正文；错误日志、类名、接口名和配置键可以保留原文。

https://github.com/wu9007/buck/issues

Issue 至少说明：类型（bug / 基础能力需求 / 文档问题 / 功能预期偏差 / skill 改进）、业务系统、Buck 版本、触发场景、复现步骤或缺口证据、期望行为、实际行为、影响范围、业务侧是否存在临时绕行方案、建议归属模块，以及建议验证方式。

## 验证规则

- 先跑本次改动相关聚焦测试。
- 涉及契约、持久化或生成物时，运行生成和生成物检查。
- 声称完成前运行业务仓库约定的总检查命令。
