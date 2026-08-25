# 业务侧 Context Budget Gate

本文档是 `buck-business-agent` 的按需参考。业务仓库中的版本化规则以 `docs/buck/<version>/business-context-budget.md` 为准；本参考只定义业务 agent 的默认工作方法。

## 常驻

只把下列内容保留在会话常驻上下文：

- 用户最新目标、当前业务 issue、当前 plan 和未完成验证。
- 当前业务仓库采用的 Buck 版本、资料包路径和业务仓库分支。
- 已确认的业务边界、质量效用树取舍、阻塞问题和下一步。
- 关键底线：禁止读取、搜索、打开、修改、提交或推送 `buck` 源码仓库或本地 checkout；不从 GitHub Release 或通知推断业务已采用；不绕过 Buck 发布资料包和业务规则检查。

## 阶段触发

只有进入对应阶段才读取专题：

| 阶段 | 读取内容 |
| --- | --- |
| 初始化 | `business-repository-startup-checklist.md`、业务 labels 和 milestone 状态、`docs/business/` 基础文档。 |
| 需求设计 | `capabilities/capability-catalog.json`、模块采用文档、直接相关业务需求和验收文档。 |
| CI/CD | `business-ci-cd.md`、`.github/workflows/ci.yml`、runner 和变量证据。 |
| Issue/MR | `business-issue-collaboration.md`、`github-issue-governance.md`、`git-branch-governance.md`、业务 issue comments。 |
| 实现 | 直接相关源码、模板、示例和聚焦测试。 |

## 按需读取

- 用 `rg` 定位业务源码、模板、测试和配置，再用小范围 `sed -n` 读取。
- API 只取必要字段，例如 issue 的 `iid/title/labels/milestone/state` 和 MR 的 `iid/title/source_branch/target_branch/pipeline`。
- 能力目录优先读取字段摘要，不把完整 JSON 常驻；需要判断模块、权限、页面、queryCode 或 optionCode 时再读对应片段。
- 命令输出写入 `/tmp/*.log`。成功只读尾部；失败先用关键字定位，再读取相关片段。

## 开工声明

开始业务需求、创建分支或准备 MR 前，先声明：

- 已读取入口和阶段触发文档。
- 当前 Buck 版本、资料包路径和版本来源。
- labels 和 milestone 已初始化；至少有 `type:*`、`scope:*`、`priority:*`、`status:*`，并有业务交付或 Buck 采用 milestone，例如 `business-app adopt brick v<version>`。
- 已检查 assignee 和 `status:in-progress`；未被认领时用 assignee 加 `status:in-progress` 认领，被认领时不重复开发，除非业务负责人明确要求接手并在 comment 说明交接。
- 本次质量效用树和工具输出策略。
- 明确不读取的内容，例如 `buck` 源码、无关历史文档、完整日志或整包 JSON。

## 失败处理

如果业务仓库缺少资料包、labels、milestone、业务上下文或验证命令，不要继续猜测实现。先补齐业务治理问题或向业务负责人确认；如果缺口来自 Buck 发布资料包、规则脚本或 business-agent skill，则创建或关联中文 `buck` issue。

如果用户在业务任务中要求读取或修改 `buck` 源码，停止业务流程，说明业务侧命令禁止操作 `buck` 工作区；只有明确切换为框架维护工作后，才能在 `buck` 仓库使用维护者入口和 skill。

## Context Budget Gate (from SKILL)


Use the business-side Context Budget Gate before any non-trivial business requirement. The versioned source of truth is `docs/buck/<version>/business-context-budget.md`; this skill keeps durable method details in `references/context-budget.md`.

- Keep only the latest user goal, current issue, current Buck version, plan state, constraints, and verification gaps as resident context.
- Read entry summaries first, then load topic rules only when entering the corresponding phase: startup, CI/CD, issue/MR, branch/tag, implementation, or verification.
- Use `rg` before small-range file reads. Do not load whole source trees, complete logs, or full API JSON when a filtered field or snippet is enough.
- Write long command output to `/tmp/*.log`; on success read only the tail, and on failure read keyword snippets.
- Before starting the next business issue, creating a branch, or preparing an MR, confirm `labels 和 milestone 已初始化`. At minimum the business repository needs `type:*`, `scope:*`, `priority:*`, `status:*`, and a business delivery or Buck adoption milestone. Claim work with GitHub assignee plus `status:in-progress`; if an issue already has assignee or `status:in-progress`, do not duplicate unless the business owner explicitly asks you to take over and you comment the handoff.
- Process plans, temporary implementation designs, Context Ledger, Quality Utility Tree, Tool Output Strategy, and verification plans belong in business issue comments or MR descriptions. Do not create `docs/superpowers/plans/**`, `docs/superpowers/specs/**`, or equivalent process documents in the business repository. Long-lived `docs/business/*` files may only record stable business facts, module boundaries, menus, permissions, audit, CI/CD, acceptance, and adoption decisions.
- 中文短句：过程计划写入业务 issue/MR，不写入业务仓库 `docs/superpowers/**`。

If the adopted release bundle does not contain `business-context-budget.md`, still apply the reference rules from this skill and record the missing bundle document as a Buck improvement issue.
