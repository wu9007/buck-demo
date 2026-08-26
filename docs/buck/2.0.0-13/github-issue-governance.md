# GitHub Issue 治理规范

本文档定义 Buck 使用 GitHub Issue、Labels 和 Milestone 管理需求、缺陷、优先级、版本窗口、必要兜底通知和业务采用反馈的长期规则。它不记录活跃 backlog，也不替代具体 issue、MR、tag pipeline、GitHub Release 或业务采用登记。

## 目标

- 让 Buck 维护者、Buck 维护智能体和业务侧 agent 对需求归属、优先级、版本窗口和关闭证据使用同一套判断规则。
- 把活跃切片放在 GitHub Issue / Milestone，而不是写入 `docs/architecture/*`、聊天历史或本地 TODO。
- 让 Labels 表达类型、范围、优先级和少量处理状态，避免把 GitHub open/closed、MR、pipeline 状态再复制成大量标签。
- 让 Issue comment 承载根因、采用方案、未采用方案、质量效用树、提交号、验证命令、发布影响、GitHub Release / 兜底通知影响和业务采用证据。

## Issue 职责

Issue 用于承载需求、缺陷、框架缺口、发布资料包缺口、业务采用反馈和 CI/发布问题。优先放入 `buck` 的 issue 类型包括：

| 类型 | 归属 | 说明 |
| --- | --- | --- |
| 框架 bug | `buck` | 已发布 core/module/starter/tools/validation 行为不符合契约、文档或安全边界。 |
| 通用 feature | `buck` | 多个业务仓库可复用的能力、SPI、规则、模板或组件。 |
| 文档缺口 | `buck` | 架构、交付、发布资料包或业务 agent 资料源表达不清。 |
| 发布资料包缺口 | `buck` | 业务仓库需要的模板、规则、示例、兼容说明或能力目录缺失。 |
| CI/发布问题 | `buck` | GitHub Actions runner、Maven Central、npmjs、GitHub Packages、可选 Nexus/Verdaccio、release artifact、发布验证或 tag 流水线异常。 |
| 业务采用反馈 | `buck` | 业务系统完成 Buck 升级并验证通过，申请更新业务采用登记。 |

业务私有需求留在业务仓库。业务侧新开的框架缺口、已发布缺陷和采用反馈一律写到公开仓 `https://github.com/wu9007/buck-issues/issues`。源码仓 `wu9007/buck` 保持 private，只承载实现、PR 和维护内部 issue。维护者 triage 时先读 `buck-issues` 与已登记业务仓 issue。

## Labels

每个非临时 issue 应尽量具备一个类型标签、一个或多个范围标签、一个优先级标签，以及最多一个处理状态标签。

### 类型标签

```text
type:bug
type:feature
type:docs
type:release
type:adoption
type:ci
type:security
type:governance
```

使用规则：

- `type:bug`：已交付行为缺陷或回归。
- `type:feature`：新增框架能力、模块能力、SPI、模板或公开组件。
- `type:docs`：长期文档、发布资料包说明或业务使用指南。
- `type:release`：版本、发布资料包、通知、Maven Central、npmjs、GitHub Packages、可选 Nexus/Verdaccio 或 tag 流水线。
- `type:adoption`：业务系统采用反馈、采用登记更新或升级通知证据。
- `type:ci`：GitHub Actions、Runner、缓存、构建、测试或发布 job。
- `type:security`：认证、鉴权、审计、传输安全、密码、密钥或合规安全。
- `type:governance`：流程、规则、质量基线、issue 标签或维护闭环。

### 范围标签

```text
scope:core-query
scope:core-option
scope:core-ui
scope:core-authentication
scope:core-authorization
scope:core-audit
scope:core-openapi
scope:module-iam
scope:module-audit
scope:module-application-center
scope:module-security-setting
scope:release-bundle
scope:validation
scope:business-agent
scope:docs
```

范围标签表达主要受影响的能力边界。一个 issue 可有多个 scope，但不要用 scope 标签复制文件路径。无法归入已有 scope 时，先在 issue 中说明候选归属，不急着创建新标签。

### 优先级标签

```text
priority:p0
priority:p1
priority:p2
priority:p3
```

| 标签 | 含义 | 响应口径 |
| --- | --- | --- |
| `priority:p0` | 阻断发布、破坏安全底线、造成已登记业务系统不可用或严重数据风险。 | 立即处理；必要时中断当前普通排期。 |
| `priority:p1` | 阻断当前版本主线能力、业务采用或验证闭环。 | 当前 milestone 内优先处理。 |
| `priority:p2` | 明确有价值但不阻断当前发布，可按能力线安排。 | 排入后续 milestone 或作为当前版本可选项。 |
| `priority:p3` | 低风险改进、文案增强、未来方向或待观察问题。 | 保持 open 或等待更多业务证据。 |

优先级不是紧急情绪标签。判断时优先看安全、发布阻断、业务采用阻断、重复绕行成本和验证缺口。

### 状态标签

```text
status:triage
status:ready
status:in-progress
status:blocked
status:verifying
```

状态标签只表达少量人工判断：

- `status:triage`：需要确认归属、影响、优先级或复现证据。
- `status:ready`：边界清楚、验收标准清楚，可以实现。
- `status:in-progress`：已有明确处理人并开始开发、文档调整或发布处理。
- `status:blocked`：等待业务证据、外部系统、凭据、环境或上游发布。
- `status:verifying`：已提交修复，正在等待本地、MR pipeline、tag pipeline 或业务验证。

认领 issue 时优先设置 GitHub assignee，并把状态从 `status:ready` 调整为 `status:in-progress`。如果没有权限设置 assignee，至少在 issue comment 中写明当前会话、分支和认领原因。开始开发、创建分支或准备 MR 前，如果 issue 已有 assignee 或 `status:in-progress`，默认不得重复处理；只有用户明确要求接手或原处理人交接时，才允许继续，并必须在 comment 中说明接手原因和影响范围。

不要创建 `status:open`、`status:closed`、`status:merged`、`status:pipeline-success`、`status:claimed` 等复制 GitHub 原生状态或与 assignee 重叠的标签。

## Milestone

Milestone 只表达计划窗口，不替代 Git tag、MR、release pipeline、`release_publish` 结果或业务采用登记。

Buck 仓库 milestone 推荐命名：

```text
brick-next v1.0.0-63 - modules 同标尺治理第一批
brick-next v1.0.0-64 - 权限菜单审计与能力目录
brick-next v1.1.0-1 - 认证安全主线增强
```

业务仓库 milestone 推荐命名：

```text
business-app adopt brick v1.0.0-62 - 框架资料包升级
business-app release 2026-06
```

规则：

- Buck milestone 表达“计划在哪个 Buck 版本窗口交付”，实际可用版本仍以 Git tag 和 `release_publish` 成功结果为准。
- Buck milestone 标题必须包含版本窗口和短目标，不能只有版本号；详细范围、发布证明和注意事项放 milestone description。
- 业务采用 milestone 表达“业务计划在哪个窗口采用”，实际采用仍以业务采用反馈 issue 或可验证业务仓库状态为准。
- 业务 milestone 标题也应包含业务系统、窗口和短目标，避免只用日期或版本号导致列表不可扫描。
- 一个 issue 如果影响当前发布资料包、业务采用和后续框架能力，优先挂当前最接近的 Buck milestone，在评论里说明后续跟进 issue。
- 已合并但未发布的问题可以关闭，但发布影响必须在 comment 中说明是否需要后续 tag 发布。
- Buck milestone 完成后要及时关闭：对应版本 tag 已存在、tag pipeline / `release_publish` 已成功、必要 GitHub Release 已创建或更新，且该 milestone 下没有 open issue 时，应在发版收口或下一次 Next-work triage gate 中关闭 milestone。
- 如果某个 milestone 仍有 open issue，但这些 issue 已明确延期、拆分或迁移到后续 milestone，应先在 issue comment 说明原因并调整 milestone，再关闭已完成的旧 milestone。

## 排序时机

分支、MR 和 tag 的执行规则见 `docs/architecture/governance/git-branch-governance.md`。其中 Next-work triage gate 是开始下一个需求、创建工作分支或准备 MR 前的必经检查点：

1. 拉取公开仓 `wu9007/buck-issues` 的 open issues，以及 `business-adoption-registry.json` 中已登记业务系统的 open issues。业务回流不进私有源码仓 `wu9007/buck`。
2. 读取 issue 正文和全部 comments/notes，不能只看标题或初始正文。
3. 更新或确认 `type:*`、`scope:*`、`priority:*`、必要的 `status:*` 和 milestone，并确认 milestone 标题包含版本窗口和短目标。
4. 检查已发布完成且无 open issue 的旧 milestone，并及时关闭。
5. 明确当前最高优先级 issue 以及选择原因，然后再创建 `<type>/issue-<iid>-<slug>` 分支。

`priority:p0` 可以立即插队处理；其余工作默认在 Next-work triage gate 中重新排序。

## Issue 模板

仓库内 issue 模板统一放在 `.github/ISSUE_TEMPLATE`。模板只负责让新 issue 具备足够上下文，不替代本治理规范、架构文档、MR、commit、pipeline 或业务仓库证据。

| 模板 | 场景 | 默认标签方向 |
| --- | --- | --- |
| `brick-framework-gap.md` | Buck 框架能力、SPI、模板、规则或公开组件缺口 | `type:feature`、相关 `scope:*`、`priority:*` |
| `brick-bug-ci-release.md` | 已发布行为缺陷、CI、Runner、Maven Central、npmjs、GitHub Packages、可选 Nexus/Verdaccio、release artifact 或 `release_publish` 问题 | `type:bug` / `type:ci` / `type:release` |
| `brick-docs-release-bundle-gap.md` | 长期文档、发布资料包、业务指南、模板、规则脚本或示例缺口 | `type:docs`、`scope:docs` / `scope:release-bundle` |
| `brick-business-feedback.md` | 业务侧反馈 Buck 已发布能力 bug、资料包缺口、通用规则缺口或可复用能力缺失 | `type:bug` / `type:feature` / `type:docs` |
| `brick-adoption-feedback.md` | 业务系统完成 Buck 升级并验证通过后的采用反馈 | `type:adoption`、`scope:business-agent` / `scope:release-bundle` |
| `brick-release-notice.md` | Buck 维护侧在必要时向已登记业务系统补发版本兜底通知 | `type:release`、`scope:release-bundle` / `scope:business-agent` |

发布资料包会把这些模板复制到 `issue-templates/`，供业务 agent 在不读取 `buck` 源码的情况下创建反馈 issue 或采用反馈 issue。

## Issue comment 和关闭证据

关闭 issue 前必须有可追溯证据。最小 comment 内容：

```md
处理结果：已修复 / 已文档化 / 已判定业务私有 / 已拆分后续 issue
根因：<问题为什么发生，缺失的是代码、文档、测试、规则还是 skill>
质量效用树：<可扩展性 / 性能 / 可靠性 / 易用性 / 灵活性 / 可维护性 / 兼容性 / 业务影响的取舍>
采用方案：<最终方案和理由>
未采用方案：<被放弃的方案和理由>
提交号：<commit-sha 或 MR merge commit>
验证命令：
- <command>：通过
日志压缩：<长输出写入 /tmp/*.log；成功读尾部，失败按关键字读片段>
影响面：
- <core/module/docs/release-bundle/business-agent/validation>
业务跟进 issue：无 / <issue 链接和范围>
发布影响：
- 是否需要新 tag 发布：是 / 否，原因：...
```

业务采用反馈 issue 关闭前还要写明：

- 业务系统编码和仓库。
- 业务采用提交号。
- 业务仓库内 `docs/buck/<version>/` 路径。
- 业务侧验证命令。
- `business-adoption-registry.json` 是否已更新及对应提交号。

不能只因为 MR merged 就关闭 issue。至少要确认 issue 验收标准已满足，并说明本地验证或 CI 验证结果。不能从 Buck GitHub Release 或发布通知 issue 推断业务已采用；业务采用只能来自业务采用反馈 issue 或可验证业务仓库状态。

### 关闭证据规则

关闭 Buck issue 前必须至少说明：

- 修复提交号或 MR。
- 根因、质量效用树、采用方案和未采用方案。
- 验证命令和结果。
- 日志压缩和失败片段读取方式。
- 是否影响 contract、manifest、持久化、发布资料包、业务 agent skill。
- 是否需要业务跟进 issue；若业务侧规则另行同步，必须链接后续 issue。
- 若影响业务可消费产物，是否需要发版、GitHub Release 和兜底通知。
- 若只是延期、不做、拆分或判定业务私有，说明原因和边界。

不能以“聊天里解释过”作为关闭证据。不能把 planned 能力当作 implemented 关闭 issue；planned 只能说明后续计划，不能替代已经合并、验证和可消费的实现。

父 issue 或治理总项被拆成可执行子 issue 后，如果父 issue 不再有独立验收标准，应在 comment 中列出子 issue、说明后续 milestone 和影响面，然后关闭父 issue。不要长期保留仅重复子 issue backlog 的父 issue；如确需保留父 issue，必须说明它独立承载的验收目标。

## Agent 处理规则

Buck 维护 agent 处理 issue 时：

1. 读取 issue 正文和全部 comments/notes。
2. 判断是否属于 `buck` 通用框架问题；业务私有需求留在业务仓库。
3. 设置或建议类型、范围、优先级和必要状态标签。
4. 判断 milestone 是否表达计划窗口；不要把 milestone 当作发布证明。
5. 检查已完成 milestone 是否仍然 active；满足 tag、`release_publish`、GitHub Release 和无 open issue 条件时及时关闭。
6. 修复时同步检查源码、测试、架构文档、发布资料包、业务 agent skill 和本地 maintainer skill。
7. 关闭前评论提交号、验证命令、影响面和发布影响。

业务侧 agent 遇到 Buck 相关问题时：

1. 先确认业务仓库当前采用的 `docs/buck/<version>/`、Maven BOM 和 npm 依赖版本。
2. 如果是业务私有流程、客户定制页面或业务数据规则，留在业务仓库。
3. 如果是 Buck 已发布能力 bug、资料包缺口、通用规则缺口或可复用能力缺失，向 `buck-issues` 创建中文 issue。
4. 完成 Buck 升级并验证通过后，创建 `Buck 采用反馈：<business-code> 已采用 <brick-version>` issue，不把 GitHub Release 或发布通知当成采用证据。

## 边界

- 不把活跃 backlog 写入 `docs/architecture/*`。
- 不用 Milestone 替代 Git tag、release pipeline 或业务采用登记。
- 不让已完成且无 open issue 的 milestone 长期保持 active。
- 不从 Buck GitHub Release 或发布通知 issue 推断业务已采用。
- 不用大量状态标签复制 GitHub 自身的 open/closed、MR、pipeline 状态。
- 不让业务私有需求进入 `buck`。
- 不把标签体系当成强制字段表；标签服务判断和协作，最终证据仍是 issue 正文、评论、MR、commit、pipeline 和业务仓库状态。
