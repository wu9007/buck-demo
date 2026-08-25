# Buck Next 2.0.0-12 最小知识包

只读本仓库 `docs/buck/2.0.0-12/`。禁止读取、搜索、打开、修改、提交或推送 `buck` 工作区。

## 1. 先声明

- 当前 Buck 版本：`2.0.0-12`（以本仓资料包为准，不来自聊天）
- `buck-business-agent skill 状态：已使用 / 已安装`；无法安装则停止
- 任务类型：新建切片 / 修 bug / 升级 Buck

## 2. 只先读这些

1. 本文件
2. `agent-index.json`（boot / phase / doNotRead；RC 不当生产默认）
3. `capabilities/packs.json`（先选四包：runtime / identity / governance / agent-surface）
4. 命中包对应的 `capabilityAdoption[]` 卡
5. `capabilities/error-catalog.json`
6. 业务仓 `docs/business/` 当前需求摘要

升级任务再读 `compatibility/migration-notes.md` 与 GitHub Release。不抄验证壳，不要一次读完全包。

## 3. 命中与硬停止

命中 `capabilityAdoption[].triggers` 必须 `reuse`，禁止 `forbidden`；`whenNot[]` 表示场景化不宜调用。人读对照表见 `agent-skills/buck-business-agent/references/capability-hit.md`。不采用须写入 `docs/business/module-adoption-decision.md` 并等待确认。

- 列表筛选分页 → `core:query`；选项 → `core:option`
- 不手写 SQL/JDBC；不把 RC 模块当生产默认
- 写工具 / MCP 写调用：未确认不得当成已成功
- 出错用 error-catalog 的 `code` / `recovery` / `retryable`，不用裸 HTTP 状态当结论

## 4. 阶段再读

- 建仓 / 结构：`business-repository-startup-checklist.md`、`upper-application-development-guide.md`
- 模块坐标：`business-module-adoption-reference.md`
- 前端：`business-frontend-ui-reference.md`，细则 `business-frontend-page-patterns.md`
- CI：`business-ci-cd.md`、`templates/github-actions.yml`
- 预算：`business-context-budget.md`
- AI 工具 / MCP：`capabilities/tools.schema.json`

## 5. Git 与反馈

开始下一个需求前执行 Next-work triage gate，按 `<type>/issue-<iid>-<slug>` 建分支；tag 只能从 `main` 上已合并 commit 创建。`git add` / `commit` / `push` 前先 `git status -sb`、`git branch --show-current`、`git log --oneline origin/main..HEAD`；当前分支是 `main` 且存在未提交改动时不直接提交，当前分支是 `main` 且存在 ahead commits 时不允许直接 push。

缺口提到 buck Issues：https://github.com/wu9007/buck/issues。用中文；按 `github-issue-governance.md` 与 `issue-templates/`。

## 6. 包内还剩什么

`dependencies/`、`templates/`（含 `github-ci-brick-consume-smoke.yml`）、`examples/`、`rules/`、`compatibility/`、`secret-environment-governance.md`、`skill-release-coverage-matrix.md`、`agent-skills/`（无 maintainer skill）。`templates/AGENTS.md` 只放稳定开工规则，不放 backlog。
