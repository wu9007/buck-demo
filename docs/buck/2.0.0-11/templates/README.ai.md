# 业务应用 AI 短上下文

Buck 版本：2.0.0-11

## 当前目标

描述当前业务系统目标、第一阶段范围、边界、依赖模块、验证命令、CI/CD 目标和禁止事项。

本文件只保留稳定业务上下文和 Buck 采用入口，不承载活跃 backlog、临时计划或临时评审结论。业务排期、过程性结论和一次性 checklist 放在业务 issue、MR、milestone 或 CI 证据中；需要沉淀为长期 Buck 规则时，按 `docs/architecture/governance/document-complexity-governance.md` 回流。

## Buck 资料包

完整资料包应放在：

```text
docs/buck/2.0.0-11/
```

能力目录：

```text
docs/buck/2.0.0-11/capabilities/capability-catalog.json
docs/buck/2.0.0-11/capabilities/README.md
docs/buck/2.0.0-11/business-context-budget.md
docs/buck/2.0.0-11/business-issue-collaboration.md
docs/buck/2.0.0-11/git-branch-governance.md
docs/buck/2.0.0-11/secret-environment-governance.md
docs/buck/2.0.0-11/templates/local-secrets.env.example
docs/buck/2.0.0-11/agent-skills/buck-business-agent/
```

## 资料包权威来源

业务仓库内的 `docs/buck/2.0.0-11/` 是唯一权威来源。业务 agent 开始前先 `git fetch origin` 检查业务仓库远端指定分支，不把 `buck` CI artifacts、临时下载目录或外部 release zip 作为优先资料源。禁止业务 agent 读取、搜索、打开、修改、提交或推送 `buck` 源码仓库或本地 checkout。

如经业务负责人明确授权临时下载发布 artifact，必须先回填到业务仓库 `docs/buck/2.0.0-11/`，同步 `AGENTS.md` / `README.ai.md` 后再开发。版本不一致时先报告准确差异并等待统一。

GitHub Release 是 Buck 默认发布日志和 release index，只表示新版本可用，不表示业务已经采用。逐业务仓库发布通知 Issue 只是兜底通知方式；业务 agent 不从 GitHub Release、发布公告、发布通知或发布流水线成功推断采用版本。

业务侧 agent skill 的强制安装来源是 `docs/buck/2.0.0-11/agent-skills/buck-business-agent/`。业务 agent 开工前必须先确认当前会话已使用或已安装 `buck-business-agent`；未安装时必须从该目录安装。业务仓库不安装 `buck-next-maintainer`，也不直接操作 `buck` 分支、MR、tag 或 release；不得用 `rg`、`sed`、`cat`、`apply_patch`、`git add`、`git commit`、`git push` 等命令操作 `buck` 源码。无法安装时停止实现，并在交付证据中写明 `buck-business-agent skill 状态：无法安装`、安装来源和失败原因。

业务 agent 的首个输出、MR 描述、issue comment 或最终交付证据必须写明 `buck-business-agent skill 状态：已使用 / 已安装`。

业务 agent 必须先读能力目录说明 `capabilities/README.md`，再查能力目录 `capabilities/capability-catalog.json` 的 `capabilityAdoption[]`，完成 Buck 能力命中判断，并据此判断需要使用哪些 Maven 依赖和 npm 包。命中 IAM、通知配置、安全设置、审计或应用中心时，必须采用对应正式模块；不采用必须写入 `docs/business/module-adoption-decision.md` 并等待确认。

真实数据库、Nexus、私有 npm、镜像仓库、K8s、短信/邮件和第三方凭据按 `secret-environment-governance.md` 执行。本地开发从 `templates/local-secrets.env.example` 复制到仓库外 `~/.brick/<repo-name>/local-secrets.env`，CI/CD 使用 GitHub Actions secrets，运行态使用 K8s Secret、配置中心或团队批准的 secret 系统。不要在仓库、issue、MR、日志、截图、skill 或 release bundle 记录真实密码、token、client secret、连接串或生产 IP。

## Context Budget Gate

业务侧 Context Budget Gate 按 `docs/buck/2.0.0-11/business-context-budget.md` 执行。热入口必读；专题规则按阶段触发读取；源码、模板、API 和日志按需读取。长命令输出写入 `/tmp/*.log`，成功只读尾部，失败按关键字读片段。

开始下一个业务需求、创建工作分支或准备 MR 前，先确认业务仓库 labels 和 milestone 已初始化，并在方案或 MR 中说明 Context Ledger、Quality Utility Tree、Tool Output Strategy 和 Business Follow-up。

## 分支和协作

开始下一个业务需求、创建工作分支或准备 MR 前，先执行 `docs/buck/2.0.0-11/git-branch-governance.md` 的 Next-work triage gate，刷新业务仓库 open issues，读取正文和 comments，确认优先级、状态和 milestone，再说明当前最高优先级选择原因。

业务分支统一使用 `<type>/issue-<iid>-<slug>` 短分支，通过 MR 合入 `dev`；业务发布 tag 只能从 `main` 上已合并 commit 创建，不能从 `dev`、`test` 或短分支直接创建。业务 agent 禁止自行合并 `dev -> test`、`test -> main` 或打业务 tag，必须等待业务负责人在当前会话中明确指示。禁止直接向 `dev`、`test`、`main` push，禁止短分支直接进入 `test` 或 `main`。任何 `git add`、`git commit`、`git push`、整理本地未提交和未推送代码、准备 MR 或收尾工作前，先执行 `git status -sb`、`git branch --show-current` 和 `git log --oneline origin/main..HEAD`；当前分支是 `main` 且存在未提交改动时不直接提交，当前分支是 `main` 且存在 ahead commits 时不允许直接 push。发现 Buck 通用缺口时链接或创建 `buck` issue，但禁止业务 agent 读取、搜索、打开、修改、提交或推送 `buck` 工作区，不在 `buck` 开分支、MR、tag 或 release。

业务侧 Issue、Labels、Milestone、GitHub Release、兜底通知和采用反馈按 `docs/buck/2.0.0-11/business-issue-collaboration.md` 执行：业务私有需求留在业务仓库 issue，通用框架缺口创建或关联 `buck` issue，业务 milestone 表达业务交付或 Buck 采用窗口，不从 GitHub Release 或发布通知推断业务采用。

## 业务上下文

至少维护：

- `docs/business/requirements.md`
- `docs/business/backend-structure.md`
- `docs/business/module-adoption-decision.md`
- `docs/business/permissions.md`
- `docs/business/menus.md`
- `docs/business/audit-events.md`
- `docs/business/external-systems.md`
- `docs/business/ci-cd.md`
- `docs/business/acceptance.md`

## 禁止事项

- 不复制或修改 Buck 发布包。
- 不在业务运行时代码手写 SQL/JDBC；迁移 DDL 只能作为评审过的 Flyway 迁移产物放在标准迁移目录。
- 不创建无主键业务表；业务实体主键统一使用 `@TableId(value = "...", type = IdType.ASSIGN_ID)`，不要改成 `IdType.INPUT`。
- 不删除模板里的 Lombok、MapStruct 和 annotationProcessor 依赖；Spring 组件用 `@RequiredArgsConstructor`，Entity/DO 用 Lombok，Entity/DTO/Command 转换用 `@Mapper(componentModel = "spring")` 并放在 `service/mapper`，由 service 持有。
- 不删除后端 Bean Validation 入口；Controller 的 `@RequestBody` 入参必须用 `@Valid` / `@Validated`，Request/Command/Query DTO 的关键字段必须使用 `jakarta.validation.constraints`。
- DTO、Command、Query、Request、Response、Page 和 Detail 等 HTTP 契约类型默认放 `applet/<feature>/dto`；若业务把对外 OpenAPI 接口作为模块级根目录 `openapi/` 边界组织，则该边界的契约类型允许放 `openapi/dto`，不要把 `com.xxx.openapi.dto` 误改成 `com.xxx.applet.openapi.dto`。不要在 service 中声明 public nested 契约 record，也不要让 Controller 返回 `FaceXxxService.*` 或 `.service` 包类型；Controller 不依赖 `BrickDtoMapper`、`service/mapper` mapper 或 `repository` Entity/DO。
- 采用默认 `/api` rewrite 时，业务后端 Controller 不带 `/api` 前缀。
- 启动前端调试前必须先启动真实后端，并确认 `BUSINESS_API_BASE_URL` 或 `127.0.0.1:8080` 可访问；前端不得自己构造 mock 后端、mock 菜单、mock 权限或 mock 业务数据。菜单、权限、审计、OpenAPI、调用记录和清理配置等链路必须记录真实后端验证命令和结果。临时视觉预览必须单独标注，不能替代验收。
- 前端壳、侧栏、顶部栏、主题切换和侧边抽屉复用 `@wildbuck/core-ui-frontend`；默认 `blue` 是浅色主题，`night` 是全暗主题，深色侧栏主题不等于全暗主题。顶部栏只保留全局操作和当前主体头像下拉，不展示系统信息、环境说明或当前菜单标题；刷新、菜单引导和通知按钮由业务壳通过 `topbar-actions` slot 提供，正式全局动作使用 `ElButton` 或同等公开组件语义，不在 `topbar-actions` 中直接放原生 `<button>`。系统身份放侧栏品牌区（`brand-mark`），菜单快速检索用 `sidebar-searchable`，侧栏整体折叠和菜单分组折叠都使用 `BrickConsoleShell`；侧栏菜单图标正式主源是 IAM 菜单上传图（`iconUrl`），线图标仅兜底，不复制官方侧栏；编辑详情抽屉优先用 `BrickConsoleDrawer`，不要传固定像素 `size`。
- 保存型编辑/配置表单必须显式标明 `（必填）` / `（选填）`，必填项只渲染一套红色星号；保存前优先使用 `validateBrickRequiredFields`，保存成功/失败优先使用 `showBrickStatus`。表单、配置卡片和抽屉底部动作统一使用 `BrickActionBar`，危险确认统一使用 `BrickRiskConfirm`。
- `@wildbuck/core-ui-frontend/patterns` 的 block/action 只是代码化页面模式；不要做低代码运行时平台，不允许后端返回筛选控件布局、组件类型、按钮结构或运行时 UI schema。查询仍走 `core:query`，选项仍走 `core:option`，权限语义仍由模块或业务页面判断。
- 页面向导虽然由业务侧实现具体步骤，但必须遵循 Buck 统一规范：入口放顶部栏 `topbar-actions`，目标元素使用稳定 `data-guide-id`，步骤配置、遮罩层、按钮文案、完成态存储 key 和抽屉内定位规则以 `business-frontend-ui-reference.md` 为准。
- 已在 `docs/business/requirements.md`、`docs/business/menus.md`、`docs/business/acceptance.md` 或同等业务文档中定义为正式能力的页面，不接受本地示例数据页、占位列表页或 mock 记录作为完成态。
- 不自造登录、鉴权、查询、选项、传输或审计平行机制。
- 不在前端页面硬编码静态 `<el-option>` 或本地 `xxxOptions = [{ label, value }]`；选项先由后端 `BrickOptionProvider` 提供，前端用 `@wildbuck/core-option-frontend` 加载并 `v-for` 渲染。
- 不自造用户、角色、菜单、权限、会话、安全策略、审计日志、OAuth client 或 OpenAPI 白名单等 Buck 已发布治理能力。
- 只使用标准白名单目录；单模块默认使用 `applet/<feature>`，多模块才使用 `innerapi`。
- CI 必须执行 `node docs/buck/2.0.0-11/rules/check-business-structure.mjs .`。检查失败时先修目录或采用 Buck 能力；如果是 Buck 能力缺口，提交中文 Issue，不能在业务仓库造轮子。
- CI/CD 必须从 `docs/buck/2.0.0-11/templates/github-actions.yml` 和 `templates/docker/` 建立；保留规则检查、后端测试、前端检查、开发环境自动部署、测试环境自动部署和 tag 制品发布。短分支通过 MR 合入 `dev`，业务 agent 禁止自行合并 `dev -> test`、`test -> main` 或打业务 tag，禁止直接向 `dev`、`test`、`main` push。业务仓库默认复用组级变量，不提交真实凭据，不让发布或部署绕过验证阶段。测试环境使用 `TEST_DEPLOY_BRANCH=test`、`${NAMESPACE}-test`、独立 `BUSINESS_TEST_DB_URL` / `BUSINESS_TEST_DB_USERNAME` / `BUSINESS_TEST_DB_PASSWORD`、独立 K8s Secret 和 `*.example.com` 域名。tag 制品必须包含后端 jar、后端 `version.txt`、非 local 的 yml 配置文件、`logback-spring.xml`、兼容 `logback.xml`、前端 tarball 和前端 `version.txt`。接入前必须确认 runner executor、JDK17/Gradle 分发源、可达 JDK17 镜像、Nginx 固定端点代理、K8s runtime Secret 和 DNS 注册策略。

## Buck 演进闭环

开发中发现 Buck 缺少基础能力、已发布功能存在 bug、文档模糊、功能不符合业务开发预期，或资料包 / 业务 agent skill 有完善空间时，提交到：

https://github.com/wu9007/buck/issues

Issue 使用中文标题和正文；错误日志、类名、接口名和配置键可以保留原文。Issue 至少写明类型、业务系统、Buck 版本、触发场景、期望行为、实际行为或缺口、影响范围、临时绕行方案、建议归属模块和验证方式。
