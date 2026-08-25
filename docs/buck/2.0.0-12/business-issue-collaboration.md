# 业务侧 Issue、Labels 和 Milestone 协作

本文档面向上层业务仓库负责人、业务开发 agent 和 Buck 维护者，说明业务侧如何使用 GitHub Issue、Labels、Milestone 与 `buck` 协作。它不替代业务仓库自己的需求管理，也不代表业务系统必须升级到每个 Buck 测试版。

## 目标

- 业务私有需求留在业务仓库 issue，避免把客户定制流程、页面细节或业务数据规则混入 `buck`。
- 通用框架缺口创建或关联 `buck` issue，让 Buck 的 core、modules、starters、发布资料包和 business-agent skill 可持续演进。
- GitHub Release 是 Buck 默认发布日志和 release index；发布公告只表示新版本可用，不从发布公告、发布通知或 tag 流水线推断业务采用。
- 业务采用反馈必须包含业务提交号、Buck 版本、资料包路径、依赖版本和验证命令。
- 业务 milestone 表达业务交付或 Buck 采用窗口，不替代 Buck tag、tag pipeline 或 `release_publish` 结果。

## Issue 归属

业务仓库 issue 优先承载：

- 业务私有需求、客户定制页面、业务流程、业务数据治理和业务验收。
- 当前业务版本、业务发布窗口、业务 CI/CD 环境和业务升级排期。
- Buck 版本升级评估和升级执行任务。逐业务仓库发布通知 Issue 不再是默认发布公告渠道，只作为必要时的兜底通知方式。

`buck` issue 优先承载：

- 已发布 Buck core、modules、starters、tools 或 release bundle 的 bug。
- 多个业务仓库可复用的框架能力、SPI、规则脚本、模板、示例或公开组件。
- 发布资料包文档缺口、business-agent skill 缺口、Issue 模板缺口和关闭证据规则缺口。
- 业务系统完成 Buck 升级并验证通过后的采用反馈。

业务侧发现 Buck 通用缺口时，在业务 issue 中保留业务上下文，同时创建或关联 `buck` issue；不要直接修改 `buck` 源码，不复制 Buck 模块源码，也不要用本地 workaround 替代 core/module 公共能力。

## Labels 建议

业务仓库可以按自己的管理习惯维护 labels，但与 Buck 协作时建议至少区分：

- 类型：需求、bug、文档、CI/CD、兜底通知、采用反馈。
- 范围：业务功能、Buck 采用、发布资料包、业务 agent、基础设施。
- 优先级：阻断发布或安全底线的问题优先；普通改进按业务版本窗口排期。
- 状态：待确认、可实现、处理中、验证中、阻塞。

向 `buck` 创建或关联 issue 时，按 `docs/buck/<version>/github-issue-governance.md` 建议 `type:*`、`scope:*`、`priority:*` 和必要的 `status:*`。如果当前采用的 Buck 资料包还没有该文件，仍应在 issue 正文写明建议类型、范围、优先级、影响版本和验证证据。

## 初始化门禁

业务仓库必须初始化 labels 和 milestone。开始下一个业务需求前，业务 agent 应先确认业务仓库已经有可用于排序、分流和验收的 labels/milestone；没有初始化时，先创建或执行治理初始化 issue，再进入业务实现。

最低 label 维度包括：

- `type:*`：需求、bug、文档、CI/CD、Buck 采用、采用反馈等类型。
- `scope:*`：业务功能、Buck 采用、发布资料包、业务 agent、基础设施等范围。
- `priority:*`：阻断发布、安全底线、普通改进和低优先级优化。
- `status:*`：ready、blocked、in-progress、review、verify 等少量人工状态。

开始处理业务 issue 前，优先设置 GitHub assignee，并把状态调整为 `status:in-progress`。如果当前用户或 agent 没有权限设置 assignee，应在 issue comment 中写明当前会话、分支和认领原因。看到已有 assignee 或 `status:in-progress` 时，默认不要重复开发；只有业务负责人明确要求接手或原处理人交接时，才继续处理，并在 comment 中说明接手原因。

业务 milestone 至少区分业务交付窗口和 Buck 采用窗口。业务仓库可以使用自己的版本节奏，但 milestone 标题必须让维护者看出它是业务计划窗口，而不是 Buck tag 或发布流水线结果。

## Milestone

业务 milestone 表达业务交付或 Buck 采用窗口，例如：

```text
business-app adopt brick v1.0.0-60
business-app release 2026-06
```

Buck milestone 表达 Buck 计划交付窗口，例如：

```text
brick-next v1.0.0-60
```

二者都只是计划窗口。业务 milestone 不证明业务已经采用 Buck；Buck milestone 不证明对应 tag 已发布。实际 Buck 可用性以 tag pipeline 和 `release_publish` 成功为准，业务实际采用以采用反馈 issue 或可验证业务仓库状态为准。

采用窗口完成后应及时关闭对应业务 milestone：当 Buck 采用 issue、采用 MR、main pipeline、资料包清理和向 `buck` 提交的采用反馈证据都闭环后，业务 agent 应检查并关闭该 adoption milestone，避免已完成窗口继续干扰排序。业务交付 milestone 不能因为 Buck 采用完成就关闭，必须等业务需求验收也完成。

## GitHub Release 和采用反馈

GitHub Release 只说明新版本可用。业务系统是否升级，由业务负责人根据当前采用版本、风险和排期决定。逐业务仓库发布通知 Issue 只作为必要时的兜底方式，不作为 Buck 默认发布日志。

业务系统决定升级后，应在业务仓库完成：

- 提交完整资料包到 `docs/buck/<version>/`。
- 后端 Maven BOM 和 Buck Maven 依赖更新到目标版本。
- 前端 `@wildbuck/*` 依赖更新到目标版本。
- `AGENTS.md`、`README.ai.md` 和业务文档同步目标 Buck 版本。
- 运行业务仓库约定的后端、前端、CI 和 `rules/check-business-structure.mjs` 验证命令。

升级验证通过后，业务 agent 必须先（或同时）向业务负责人输出本次升级变更摘要，再在 `buck` 创建采用反馈 issue。摘要至少覆盖：来源版本 → 目标版本、新增能力、完善/修复、业务侧是否需要适配（无则写「未声明破坏性变更」）、证据入口（GitHub Release、`compatibility/migration-notes.md`、关键 issue/MR）。禁止只报告版本号与验证通过。

采用反馈 issue 标题格式：

```text
Buck 采用反馈：<business-code> 已采用 <brick-version>
```

正文至少包含：

- 业务系统编码和业务仓库地址。
- 业务采用提交号。
- 资料包路径，例如 `docs/buck/<brick-version>/`。
- 后端 Maven BOM / Buck Maven 依赖版本。
- 前端 `@wildbuck/*` 依赖版本。
- 验证命令和结果。
- 是否请求 Buck 维护侧更新 `business-adoption-registry.json`。

## 边界

- 不把业务仓库 issue 全部同步到 `buck`。
- 不要求业务系统强制升级到每个 Buck 测试版。
- 不从 GitHub Release、发布公告、发布通知或发布流水线成功推断业务采用。
- 不让业务侧 Milestone 替代 Buck tag pipeline。
- 不让业务 agent 根据聊天历史判断 Buck 版本、资料包路径、采用状态或 issue 归属。
