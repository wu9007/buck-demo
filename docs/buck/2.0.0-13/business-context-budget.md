# 业务侧 Context Budget Gate

本文档面向业务开发负责人和业务开发 agent，定义业务仓库消费 Buck 发布资料包时的上下文预算门禁。目标不是少读必要证据，而是把常驻、阶段触发、按需读取和长输出处理变成可检查规则，避免业务 agent 因重复粘贴全文、拉整包 JSON 或读取 `buck` 源码而浪费上下文。

## 适用范围

- 初始化或升级独立业务仓库的 Buck 发布资料包。
- 业务需求、业务 bug、Buck 采用反馈和 Buck 通用缺口 issue 的分流。
- 业务仓库分支、MR、CI、tag、release artifact 和采用验证。
- `buck-business-agent` 在业务仓库内的开工门禁和交付证据。

业务 agent 不读取 `buck` 源码仓库。业务侧命令禁止读取、搜索、打开、修改、提交或推送 `buck` 源码仓库或本地 checkout；不得用 `rg`、`sed`、`cat`、`apply_patch`、`git add`、`git commit`、`git push` 等命令操作 `buck` 工作区。版本规则、模板、示例、检查脚本和 skill 都以业务仓库内 `docs/buck/<version>/` 为权威来源。

## 预算层级

| 层级 | 读取内容 | 时机 | 规则 |
| --- | --- | --- | --- |
| 常驻 | 用户最新目标、当前业务 issue、当前 Buck 版本、plan 状态、未完成验证 | 会话内常驻 | 只保留摘要、决策和阻塞点，不重复粘贴全文。 |
| 热入口必读 | `AGENTS.md`、`README.ai.md`、`docs/buck/<version>/README.md`、`docs/business/` 摘要 | 非平凡业务需求开始前 | 只作为版本、业务目标和资料包路由依据。 |
| 阶段触发读取 | `business-repository-startup-checklist.md`、`business-ci-cd.md`、`business-issue-collaboration.md`、`git-branch-governance.md`、`github-issue-governance.md` | 初始化、CI、issue、分支、MR、tag 或采用反馈阶段 | 进入对应阶段才读，不提前展开无关专题。 |
| 按需读取 | 能力目录、模板、示例、业务源码、聚焦测试、MR diff、CI 失败片段 | 设计、实现或诊断阶段 | 先 `rg` 定位，再小范围 `sed -n`；只读够当前决策使用的片段。 |
| 长输出 | 完整测试日志、CI job 日志、整包 API JSON、长构建输出 | 失败诊断或审计留痕时 | 写入 `/tmp/*.log`；成功只读尾部，失败按关键字读片段。 |

## 开工门禁

开始下一个业务需求、创建分支或准备 MR 前，业务 agent 必须声明：

- 已读取的入口摘要：业务仓库 `AGENTS.md`、`README.ai.md`、当前 `docs/buck/<version>/` 和 `docs/business/`。
- 当前采用 Buck 版本和资料包路径，且版本来自业务仓库，不来自聊天历史、发布通知或临时 artifact。
- `buck-business-agent skill 状态：已使用 / 已安装`。如果当前会话未安装，必须先从 `docs/buck/<version>/agent-skills/buck-business-agent/` 安装；无法安装时停止实现，并报告安装来源、失败原因和业务影响。
- 业务仓库 labels 和 milestone 已初始化；至少包含 `type:*`、`scope:*`、`priority:*`、`status:*` 四类标签。
- 已检查 assignee 和 `status:in-progress`；未被认领时用 assignee 加 `status:in-progress` 认领，被认领时不重复开发，除非业务负责人明确要求接手并在 comment 说明交接。
- 任何 `git add`、`git commit`、`git push`、整理本地未提交和未推送代码、准备 MR 或收尾工作前，已执行 `git status -sb`、`git branch --show-current` 和 `git log --oneline origin/main..HEAD`。
- 当前分支是 `main` 且存在未提交改动时，不直接提交；当前分支是 `main` 且存在 ahead commits 时，不允许直接 push，必须先报告 ahead 提交并选择 issue 分支迁移、MR 或有记录的紧急流程。
- 当前业务 milestone 表达业务交付或 Buck 采用窗口，例如 `business-app adopt brick v<version>`，不替代 Buck tag 或 `release_publish` 结果。
- 本次质量效用树：可扩展、性能、可靠性、易用性、灵活性、可维护性、兼容性和业务影响的收益、代价和取舍。
- Tool Output Strategy：哪些日志写入 `/tmp/*.log`，哪些 API 字段过滤读取，哪些长文档不展开。

如果 labels 或 milestone 没有初始化，先创建或补齐业务仓库治理 issue，再进入业务实现。不要让业务代码 MR 同时夹带未说明的治理初始化。

## 阶段化加载

1. Triage 阶段：读取业务 issue 正文和 comments，确认是否业务私有、Buck 采用、Buck 通用缺口或 CI/环境问题；只保留排序依据和阻塞摘要。
2. Design 阶段：读取业务上下文、能力目录和直接相关专题文档；先讨论质量效用树，再决定是否采用 Buck 模块、扩展业务逻辑或向 `buck-issues` 提 issue。
3. RED 阶段：只读取要加断言的业务测试、规则脚本或模板，先观察失败，再改实现。
4. GREEN 阶段：用 `rg` 定位目标源码、模板或文档，小范围读取和编辑。
5. Verify 阶段：长命令输出写 `/tmp/*.log`；通过时读尾部摘要，失败时按 `ERROR|FAIL|Exception|expected` 等关键字读取片段。
6. Handoff 阶段：MR、issue comment 和最终报告只写证据摘要、根因、取舍、验证结果和业务跟进，不复制长日志全文。

## 交付证据

业务 agent 的方案、MR 描述或 issue comment 至少包含：

- Context Ledger：常驻、热入口必读、阶段触发读取、按需读取的文件和明确未展开的内容。
- Quality Utility Tree：采用方案对关键质量属性的收益和代价。
- Tool Output Strategy：日志、API 和命令输出如何压缩读取。
- Business Follow-up：是否需要业务仓库 issue、`buck` issue、Buck 采用反馈或资料包升级。
- 验证结果：聚焦测试、业务总检查、CI job、人工验收入口和无法运行项。

## 边界

- 不把 Context Budget Gate 当作少读必要 issue comments、业务验收标准或 CI 失败证据的理由。
- 不从 GitHub Release、发布公告、兜底通知或 tag 流水线成功推断业务已经采用 Buck。
- 不读取、搜索、打开、修改、提交或推送 `buck` 源码仓库或本地 checkout 来补业务上下文缺口；业务仓库缺资料包或资料包不完整时，先同步资料包或向业务负责人确认。
- 如果用户在业务任务中要求读取或修改 `buck` 源码，停止业务流程并说明业务侧命令禁止操作 `buck` 工作区；只有明确切换为框架维护工作后，才能在 `buck` 仓库使用维护者入口和 skill。
- 不把固定规则重复粘贴到每个回复；引用业务仓库内稳定文档、issue、MR、commit 和验证日志摘要。
