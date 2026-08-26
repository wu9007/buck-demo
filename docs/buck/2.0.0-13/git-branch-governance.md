# Git 分支、MR 和 tag 治理规范

本文档定义 Buck 维护侧和业务侧 agent 使用 Git 分支、Merge Request、`main` 和 tag 的长期协作规则。它不记录活跃 backlog，也不替代 GitHub Issue、MR、pipeline、release artifact 或业务采用反馈。

## 目标

- 所有改动从 GitHub issue 出发，避免聊天历史或本地 TODO 成为真实排期。
- 分支命名能反查 issue、工作类型和目标，降低 3 人维护时的协作成本。
- MR 记录处理内容、影响面、验证命令、发版影响和 GitHub Release / 兜底通知影响。
- tag 只从 `main` 已合并 commit 创建，避免 release bundle、GitHub Release、兜底通知和采用反馈失真。
- 业务侧 agent 采用同类协作规则，但禁止读取、搜索、打开、修改、提交或推送 `buck` 源码仓库或本地 checkout，也不越界操作 `buck` 分支、MR、tag 或 release。

## Next-work triage gate

Buck 维护 agent 和维护人员在开始下一个需求、创建工作分支或准备 MR 前，必须先执行一次 Next-work triage gate：

1. 拉取公开仓 `wu9007/buck-issues` 的 open issues，以及 `business-adoption-registry.json` 中已登记业务系统的 open issues。业务回流不进私有源码仓 `wu9007/buck`。
2. 读取 issue 正文和全部 comments/notes，不能只看标题或初始正文。
3. 按 `docs/architecture/governance/github-issue-governance.md` 更新或确认 `type:*`、`scope:*`、`priority:*`、必要的 `status:*` 和 milestone；开始实现前检查 assignee 和 `status:in-progress`，未认领时用 assignee 加 `status:in-progress` 认领，已认领时不重复处理，除非用户明确要求接手并在 comment 说明原因；milestone 标题必须包含版本窗口和短目标，不能只有版本号。
4. 检查已发布完成且无 open issue 的旧 milestone；满足 tag、`release_publish`、GitHub Release 收口条件时及时关闭。
5. 明确当前最高优先级 issue 以及选择原因，然后再创建分支开始实现。

例外：如果出现 `priority:p0`，例如阻断发布、破坏安全底线、造成已登记业务系统不可用或严重数据风险，可以立即中断当前普通排期并插队处理。

业务侧 agent 在业务仓库也采用同类切换前排序：开始下一个业务需求前先刷新业务仓库 open issues；发现 Buck 通用缺口时链接或创建 `buck` issue，但不得读取、搜索、打开、修改、提交或推送 `buck` 工作区，也不得直接操作 `buck` 分支、MR、tag 或 release。

## 分支命名

统一格式：

```text
<type>/issue-<iid>-<slug>
```

允许的 `type`：

```text
feat
fix
refactor
docs
test
chore
```

含义：

- `feat`：新增需求、新能力、对用户或业务 agent 可见的能力完善。
- `fix`：bug、回归、CI 失败、发布失败、安全缺陷修复。
- `refactor`：不改变外部行为的结构调整、模块收敛、重复实现清理。
- `docs`：长期文档、治理规则、发布资料包说明、模板文案。
- `test`：测试补强、守卫脚本、验证覆盖。
- `chore`：构建、工具、配置、依赖、发布流程维护。

示例：

```text
feat/issue-66-branch-governance
fix/issue-67-release-pipeline-failure
refactor/issue-68-module-query-cleanup
docs/issue-69-issue-template-rules
test/issue-70-governance-guards
chore/issue-71-release-tooling
```

不使用 `codex/`、`human/`、`dev/<name>/` 或 `improve/`。不使用 `improve/` 的原因是边界不清；完善已有能力时按实际影响归类为 `feat`、`fix`、`refactor`、`docs`、`test` 或 `chore`。

## CI 自动门禁

非 tag 流水线按 GitHub Actions `concurrency` 去重：已有 PR 时，同一次普通 branch push 不再重复触发等价 branch pipeline，优先保留 PR pipeline。分层 job 中，`governance` 会先运行：

```bash
npm run git-governance:check
```

该门禁在 MR 或分支流水线中检查当前分支名；只有 `main` 分支流水线和 tag pipeline 豁免，MR source branch 不能用 `main` 绕过工作分支规则。工作分支必须匹配 `<type>/issue-<iid>-<slug>`，`type` 只能是 `feat`、`fix`、`refactor`、`docs`、`test`、`chore`。`codex/`、`human/`、`dev/`、`improve/`、`governance/`、无 issue 号或无 slug 的分支会直接让 pipeline 失败。其余 `generate`、`frontend`、`backend`、`validation` job 按 `rules:changes` 选择，`full_check` 只在 `main` 上执行完整门禁（实现为并行化的 `ci:full-check`，覆盖面与 `npm run check` 相同）。tag 的 `release_publish` 不再重复跑验证，只发 Maven Central（含 flyway）/ Flyway Packages 双写 / npmjs `@wildbuck/*` / GitHub Release。

PR pipeline 还会读取 GitHub PR 元数据 API；单个 PR API 不可用时，使用 commit 关联 PR API 兜底，确认仓库已开启合并后删除 source branch。GitHub 仓库设置 `delete_branch_on_merge` 必须为 `true`（Settings → General → Pull Requests → Automatically delete head branches）；否则 pipeline 失败。若当前 GitHub 实例对 `GITHUB_TOKEN` 读取仓库设置返回省略该字段，则 PR 描述顶部的 `PR 硬门禁` 区必须勾选 `- [x] 已开启删除 source branch` 作为 CI 可读兜底；治理脚本只信任顶部可见区域内的该勾选项，避免长描述被截断时误判。该兜底不替代仓库真实开启删除 source branch，维护者仍需用仓库设置或 `gh pr view` 确认。创建 PR 时必须使用删除 source branch 选项，不能把 source branch 清理只留给合并后的人工巡检。

## MR 规则

- 每个 MR 必须关联一个 GitHub issue，并在描述中使用 `Closes #<iid>` 或说明关联但不关闭的原因。
- MR 标题应能看出工作类型和目标。
- MR 描述必须包含处理内容、影响面、验证命令和结果。
- MR 描述必须包含 Context Ledger、Quality Utility Tree、Tool Output Strategy 和 Business Follow-up：
  - Context Ledger 记录入口、专题、目标文件和明确未展开内容。
  - Quality Utility Tree 记录关键质量属性收益、代价和取舍。
  - Tool Output Strategy 记录长日志、API 和命令输出如何压缩读取。
  - Business Follow-up 记录是否影响 business agent、release bundle、已登记业务应用或后续 issue。
- MR 描述必须说明是否影响 contract、manifest、持久化、生成物、release bundle、业务 agent skill 和维护者 skill。
- MR 描述必须说明是否需要发版、GitHub Release 和兜底通知。
- 如果使用低风险验证档位，MR 描述必须补充低风险验证档位记录：判断人、影响面、选择的验证档位、未执行检查和理由。
- 代码类 issue 的自动检查通过后，MR 描述必须补充人工验收兜底：执行 `npm run validation:restart` 后得到的访问地址、进程或端口状态、日志路径、建议人工验证路径，以及 issue 已进入 `status:verifying` 的证据；纯文档或纯治理变更豁免时，必须写明原因。
- PR pipeline 必须通过后才能合并。
- PR 合并后必须删除 source branch；PR 创建时必须开启删除 source branch，以通过 `git-governance:check`。
- 不允许长期保留已合并工作分支。
- 标准交付路径是 **本地 issue 分支 → 推送远端 → 创建/更新 PR → pipeline 通过后合并 → 立即删除远端与本地工作分支**；禁止把“已合入仍留着分支”当作正常状态。

## 合并后分支删除闭环

**硬规则：工作分支一旦成功合入目标分支（`buck` 为 `main`；业务仓库短分支为 `dev`），必须删除远端 source branch 与对应本地分支。** 只删远端、只删本地、或只靠 GitHub 默认设置而事后不核验，均不算完成。

### 合并前

1. 从最新目标分支（维护侧 `main`）拉出 `<type>/issue-<iid>-<slug>`，不在 `main` 上直接开发。
2. 完成本地提交后 **推送远端** 并创建/更新 PR；创建时必须开启删除 source branch。
3. 确认仓库级 `delete_branch_on_merge` 为开启（`buck` 已开启 Automatically delete head branches）。

### 合并后（同一工作会话内必须做完）

1. 快进本地目标分支：`git checkout main && git pull --ff-only origin main`（业务侧对应 `dev` 或负责人指示的目标分支）。
2. **核验远端 source branch 已删除**。若 GitHub 自动删除失败或分支仍存在：
   - `git push origin --delete <type>/issue-<iid>-<slug>`
   - 或 `gh api --method DELETE repos/wu9007/buck/git/refs/heads/<url-encoded-branch>`
3. **删除本地工作分支**：
   - 若分支被 worktree 占用，先 `git worktree remove <path>`（或 `git worktree remove --force` 仅在确认无未提交有效改动时）。
   - 再 `git branch -d <type>/issue-<iid>-<slug>`；仅当确认无独有有效提交且需丢弃时才用 `-D`。
4. **清理远程跟踪引用**：`git fetch --prune`（或 `git remote prune origin`），消除 `: gone` / stale 引用。
5. 开始下一需求前，本地不应再保留该已合并工作分支；Next-work triage 不得依赖“旧分支还在”作为状态。

### 禁止与例外

- 禁止长期保留已合并的 `feat/`、`fix/`、`refactor/`、`docs/`、`test/`、`chore/` 工作分支（远端或本地）。
- 禁止用“以后再清”“先堆着”跳过本闭环。
- 允许保留的只有：`main`（及业务侧受保护晋级分支 `dev`/`test`/`main`）、未合并且仍在进行的工作分支、用户明确要求保留并写明原因的分支。
- 若合并后自动删除失败，必须在当次会话手动删掉并在 issue/MR comment 记一句原因（权限、竞态、API 失败等），不能静默留下。

### 周期巡检（发现残留时）

```bash
git fetch --prune
git branch -r --merged main   # 远端已合并但仍存在的工作分支（应为空或仅 main）
git branch --merged main      # 本地已合并但仍存在的工作分支
git worktree list             # 占用已合并分支的 worktree
```

对已合入目标分支的工作分支：先卸 worktree，再删本地，再删仍存在的远端分支。不要把已合并分支重新推送或再次开 MR。

## main 分支规则

- `main` 是唯一集成分支。
- 不直接向 `main` 提交。
- `main` 上的 commit 必须来自 MR merge commit，或经过明确维护流程的紧急修复。
- 本地 `main` 应定期快进到 `origin/main`，不在本地 `main` 上直接开发。

## tag 和发布规则

- tag 只能从 `main` 上已合并 commit 创建。
- 不从 feature/fix/refactor/docs/test/chore 分支直接打 tag。
- release tag 使用现有格式：

```text
v<major>.<minor>.<patch>-<test>
```

- 同一版本线内，测试版本号最大的 tag 才是最新测试版。
- tag 推送后由 GitHub tag pipeline 执行 `release_publish`。
- 影响业务可消费产物时，`release_publish` 成功后必须创建或更新对应 GitHub Release；逐业务仓库发布通知 Issue 只作为必要时的兜底方式。
- release 收口时检查对应 milestone；如果 tag、`release_publish`、必要 GitHub Release 已完成且无 open issue 挂载，应关闭 milestone。
- 业务是否采用不能从 GitHub Release 或发布通知推断，仍以业务采用反馈 issue 或可验证业务仓库状态为准。

## Agent 适用范围

Buck 维护 agent：

- 在 `buck` 仓库完整执行本规范。
- 负责 Buck issue、MR、main、tag、release pipeline、GitHub Release 和必要兜底通知闭环。
- 不把业务私有需求带入 `buck`。

业务侧 agent：

- 在业务仓库采用同类分支命名和 MR 规则：`<type>/issue-<iid>-<slug>`。
- 不直接提交业务仓库 `dev`、`test` 或 `main`。
- 业务仓库普通开发短分支只能通过 MR 合入 `dev`；短分支禁止直接合入 `test` 或 `main`。
- 业务进入提测阶段后，`dev`、`test`、`main` 可以作为受保护环境/晋级分支存在：`dev` 自动部署开发环境，`test` 自动部署测试人员专用环境，`main` 只作为发布基线验证。
- `dev -> test`、`test -> main` 和业务 tag 必须等待业务负责人在当前会话或可追溯 issue/MR comment 中明确指示；没有明确指示时，业务 agent 只能准备 MR 和验证证据，禁止自行执行合并或打 tag。
- 任何 `git add`、`git commit`、`git push`、整理本地未提交和未推送代码、准备 MR 或收尾工作前，必须先执行 `git status -sb`、`git branch --show-current` 和 `git log --oneline origin/main..HEAD`。
- 当前分支是 `main` 且存在未提交改动时，不允许直接提交；先创建或确认业务 GitHub issue，再切到 `<type>/issue-<iid>-<slug>` 分支后提交。
- 当前分支是 `main` 且存在 ahead commits 时，不允许直接 push；先报告 `git log --oneline origin/main..HEAD` 的提交列表，并选择迁移到 issue 分支、创建 MR，或由业务负责人明确记录紧急流程。
- 用户要求“整理本地未提交和未推送代码”时，视为高风险 Git 收尾动作，先执行上述 main 保护检查，不按当前分支直接提交或推送。
- MR 合并后删除远端 source branch，并删除对应本地工作分支；执行 `git fetch --prune`，不把已合并分支或 stale 引用长期留在业务工作区。
- 业务发布 tag 只能从业务仓库 `main` 已合并 commit 创建，不能从 `dev`、`test` 或业务短分支直接创建。
- 禁止读取、搜索、打开、修改、提交或推送 `buck` 源码仓库或本地 checkout，不在 `buck` 开分支、MR、tag 或 release。
- 发现 Buck 通用缺口时，创建或关联 `buck` issue。
- 业务采用新 Buck 版本并验证通过后，创建 `Buck 采用反馈：<business-code> 已采用 <brick-version>` issue。

## 边界

- 不新增长期普通开发分支；`dev`、`test`、`main` 仅作为受保护环境/晋级分支使用。
- 不区分 Codex 分支和人工分支。
- 不让 tag 或 release notification 替代业务采用反馈。
- 不让已经完成且无 open issue 的 release milestone 长期保持 active。
- 不把已合并工作分支长期留在远端或本地；不把分支清理只留给“下次有空”。
- 不把分支治理只写入本地 skill 或聊天历史。
- 不让业务侧 agent 直接操作 `buck` 分支、MR、tag 或 release。
