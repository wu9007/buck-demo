# Skill 与发布资料包覆盖矩阵

本文档用于判断 Buck maintainer skill、business skill、长期文档和 release bundle 是否覆盖同一组业务采用规则。它不是过程计划；后续新增规则时，应先判断规则属于哪一类，再同步到对应资料面。

## 覆盖原则

- `buck-next-maintainer` 只服务 Buck 维护闭环，不进入业务资料包。
- `buck-business-agent` 面向独立业务仓库，必须能在不读取 `buck` 源码的情况下完成采用判断、业务开发和反馈回流。
- release bundle 是业务仓库内 `docs/buck/<version>/` 的权威资料源，必须包含业务侧可执行的文档、模板、规则、示例、兼容说明和 business skill。
- GitHub Release 是中心化发布日志，回答“版本是否可用、发布证据在哪里、业务是否建议评估升级”；不能替代业务采用反馈。
- `compatibility/migration-notes.md` 是业务升级评估入口，不能保留待补充占位文本。

## 覆盖矩阵

| 规则或机制 | 长期文档 | maintainer skill | business skill | release bundle | GitHub Release / compatibility |
| --- | --- | --- | --- | --- | --- |
| 架构边界、分层和已声明 core/modules 能力范围 | `ai-working-context.md`、`maintainer-operating-guide.md` | 必须读取并声明 | 通过业务资料包读取 | `upper-application-development-guide.md`、`business-module-adoption-reference.md` | 不重复展开 |
| Context Budget Gate 与阶段化加载 | `context-budget-gate.md`、`business-context-budget.md` | 热入口 + reference | 热入口 + reference | `business-context-budget.md` | MR/issue comment 记录压缩策略 |
| Next-work triage、issue 排序和分支规则 | `git-branch-governance.md`、`github-issue-governance.md` | 开始需求前强制执行 | 业务仓库同类执行，不操作 Buck 分支 | `git-branch-governance.md`、`github-issue-governance.md` | issue/MR 证据承载 |
| 业务源码读取边界 | `maintainer-operating-guide.md` | 正常 triage 不读取业务源码；只读业务 issue/comments/release/adoption evidence | 只读业务仓库和资料包；禁止读取、搜索、打开、修改、提交或推送 `buck` 源码仓库或本地 checkout | `business-repository-startup-checklist.md`、`templates/AGENTS.md` | 不适用 |
| Buck 能力命中和复用规则 | `upper-application-development-guide.md`、`business-module-adoption-reference.md` | 判断是否吸收到 Buck | 开工前必须判断 | `capabilities/`、业务指南、规则脚本、示例 | 仅说明资料包变化 |
| 发布资料包内容完整性 | `dependency-publishing.md`、本文档 | 变更时检查 docs/tests/templates/skills | 使用当前资料包作为权威源 | README、templates、examples、rules、compatibility、agent-skills | artifact 链接和资料包路径 |
| 密钥和环境变量治理 | `secret-environment-governance.md`、`dependency-publishing.md`、`business-ci-cd.md` | 维护文档、守卫、issue/MR 证据和本机安装副本；不记录明文值 | 使用 release bundle、GitHub Actions secrets、K8s Secret、配置中心或团队密码管理器；本地开发从模板复制到仓库外私有 env | `secret-environment-governance.md`、`templates/local-secrets.env.example`、`templates/AGENTS.md`、`templates/README.ai.md`、business skill | GitHub Release 说明资料包规则变化，不承载任何真实凭据 |
| 业务 skill 安装/使用门禁 | `business-repository-startup-checklist.md` | 确认是否影响 business skill | 开工前声明 `buck-business-agent skill 状态` | `agent-skills/buck-business-agent/`、templates | Release 可说明 skill 变化 |
| 版本说明和升级影响 | `release-compatibility-checklist.md`、`dependency-publishing.md` | 发布收口时检查 | 升级时读取 release bundle 和业务资料包；升级验证后必须向业务负责人汇报来源→目标、新增、完善/修复、业务侧适配和证据入口 | `compatibility/release-checklist.md`、`compatibility/migration-notes.md`、`compatibility/breaking-changes.json`、`compatibility/business-upgrade-notice.md` | GitHub Release、migration notes 不能留占位；应含新增/完善/修复/业务适配分区；breaking-changes.json 供改编配置 |
| 测试策略 | `maintainer-operating-guide.md`、本文档 | 优先高价值代表性守卫，避免重复低价值测试；结构测试只保留 route/module surface 代表性守卫 | 跑业务聚焦测试和总检查 | 规则脚本和示例验证 | MR/issue comment 写明验证结果 |
| 文档复杂度治理 | `document-complexity-governance.md`、本文档 | 新增长期文档、release bundle、skill 或模板规则时先判定承载边界 | 业务侧只读取 release bundle 中可消费文档，不回读 maintainer-only 规则 | `templates/AGENTS.md`、`templates/README.ai.md` 只承载稳定开工规则，不承载活跃 backlog 或临时计划 | GitHub Release 只记录版本影响，不承载过程计划 |
| 框架产品化架构评审 | `review-boundary.md`、`productization-baseline.md` | 仅 `buck` 仓库内 skill `.grok/skills/buck-productization-review/`；不进业务资料包与 Codex 安装链路 | **禁止**使用框架产品化评审 skill；不做 `buck` 全仓成熟度打分 | 不包含 productization review skill | 不承载框架成熟度分数 |
| 业务采用/合规审查 | `review-boundary.md`、startup checklist、upper guide | 维护侧只收 issue/采用反馈，不代替业务仓审查 | 用 checklist、bundle rules 与 `buck-business-agent`；对象是业务仓 + 资料包 | checklist、rules、business skill | 采用反馈与升级说明，不推断框架产品化分数 |

## 同步规则

- 新增 maintainer-only 规则时，优先更新 maintainer skill、maintainer references 和长期治理文档；只有影响业务可消费资料时才进入 release bundle。
- 新增业务侧规则时，优先更新 delivery 文档、release bundle、business skill 和规则脚本；maintainer skill 只记录同步责任。
- 新增版本、发布或迁移规则时，必须同步 release generator、release tests 和 compatibility 文档。
- 新增长期文档、skill 或模板规则时，必须先按 `docs/architecture/governance/document-complexity-governance.md` 判断源文档、引用面和允许重复范围。
- 能用脚本或测试阻断的规则不要只写进 skill；判断型规则才放入 skill 或 reference。
- 同类型测试只保留一个代表性高价值守卫，覆盖关键边界和生成物，不为每个等价文案堆重复断言；结构测试不对整页 messages 或静态 message 对象做快照式枚举。

## 验收口径

每次 skill 或 release bundle 治理改动，至少确认：

- 业务资料包里没有 `buck-next-maintainer`。
- `buck-business-agent` 能从资料包安装或被明确要求使用。
- GitHub Release 和 `compatibility/migration-notes.md` 没有待补充占位文本。
- MR 描述包含 Context Ledger、Quality Utility Tree、Tool Output Strategy、Business Follow-up 和发版影响。
- 若影响业务可消费资料，合并后只记录发版影响和业务可消费面；只有维护负责人或明确 release issue 给出明确发版指令后，才创建 tag、触发 `release_publish` 并在 GitHub Release 写明影响。
