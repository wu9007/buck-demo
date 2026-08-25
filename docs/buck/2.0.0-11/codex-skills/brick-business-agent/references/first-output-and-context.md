# first output and context

Load this reference only when the current phase needs it. `SKILL.md` remains the hot entrypoint.

## Staged Business Context

Read enough to produce a safe first output, but do not front-load every long bundle document for ordinary tasks.

### 热入口必读

Read these before non-trivial business work:

1. `AGENTS.md`
2. `README.ai.md`
3. `docs/buck/<version>/README.md`（最小知识包：声明、先读 catalog、命中/硬停止、阶段再读）
4. `docs/buck/<version>/agent-index.json`（boot / phase / doNotRead；不要通读 delivery 长文）
5. `docs/buck/<version>/capabilities/capability-catalog.json` 的 `capabilityAdoption[]`
6. `docs/buck/<version>/business-context-budget.md` if present in the adopted bundle
7. `docs/business/` summary files that define the current requirement, menu, acceptance, CI, or module adoption context

### 阶段触发读取

Load these only when entering the matching phase:

- **Buck upgrade / 采用新版本:** skill `references/startup-and-upgrade.md` (**hard-load before any version discovery or dependency edit**) plus bundle `compatibility/migration-notes.md` when the target version is known
- Business startup or repository structure: `business-repository-startup-checklist.md`
- CI/CD, runner, deployment, release artifact, or environment work: `business-ci-cd.md`
- Issue routing, adoption feedback, labels, milestone, or Buck feedback: `business-issue-collaboration.md`, `github-issue-governance.md`, and `issue-templates/`
- Branch, MR, tag, or next-work triage: `git-branch-governance.md`
- Business module adoption or UI/API design: `upper-application-development-guide.md`, `business-module-adoption-reference.md`, `business-frontend-ui-reference.md`, and `business-frontend-page-patterns.md`
- AI 工具 / MCP / 助手写调用：`capabilities/tools.schema.json`（toolCode、inputSchema、executionPolicy、writeOperation、failureModes）

### 按需读取

Load these only for the current design, implementation, or diagnosis decision:

- `docs/buck/<version>/capabilities/README.md`
- `docs/buck/<version>/capabilities/capability-catalog.json`
- direct business source, templates, rules, tests, API snippets, MR diff, and CI failure snippets

If any hot-entry file is missing, report the missing context before implementation. If a phase-triggered or on-demand file is missing when that phase needs it, stop that phase and create or link a Buck improvement issue; do not read `buck` source to compensate.

## Required First Output

Choose the checklist that matches the task. **Do not use only the feature checklist for a Buck upgrade.**

### A. Feature / implementation first output

Do not start implementation until you have produced:

- Whether the repository has enough information to begin development.
- Context Budget Gate evidence, including loaded entries, triggered topic rules, tool output strategy, and whether `labels 和 milestone 已初始化`.
- Buck capability hit analysis.
- Buck module adoption decision.
- Backend Maven dependency list.
- Frontend npm dependency list.
- Backend structure decision: single-module or multi-module, Java package prefix, feature directories, migration directories.
- CI/CD adoption decision: `.github/workflows/ci.yml` source, group variables, dev K8s deployment target, tag artifact path, and any missing environment variables.
- First-phase business slices.
- Missing business context or questions that block implementation.

If business goals, entities, pages, permissions, audit events, database, or acceptance commands are missing, stop and ask for that context.

### B. Upgrade-task first output（升级 / 采用新版本专用）

When the user asks to **upgrade Buck**, **adopt a new Buck version**, or equivalent, produce **this checklist before** Nexus/npm probes, BOM/`@wildbuck/*`/bundle edits, or artifact downloads:

1. `buck-business-agent skill 状态：已使用 / 已安装`（或 `无法安装` 并停止）
2. Confirmed full read of `references/startup-and-upgrade.md` (state it explicitly)
3. **Current adopted version** from this business repository only (`AGENTS.md` / `README.ai.md` / `docs/buck/<version>/` / backend BOM / frontend `@wildbuck/*`)
4. **Candidate GitHub Releases** newer than the adopted version (list tag/version + one-line summary each). Discovery source must be GitHub Releases (`gh` or API) — **not** Nexus, Verdaccio, npm, or local tags
5. If **multiple** candidates: wait for business owner/lead to choose; do not silently pick the newest
6. If **one** candidate and the human already requested upgrade: summarize that Release before applying
7. Whether **artifact download is authorized** in this session (yes/no). If no, do not download
8. Planned branch: open from **`dev`**, name like `chore/brick-upgrade-<version>`, MR into `dev`
9. Planned **business-adaptation pass** after deps/bundle land: read Release + `compatibility/migration-notes.md` / `business-upgrade-notice.md`, scan business config/call sites, apply removals/updates in the same upgrade MR when possible
10. Blockers: missing token/gh login, Release unreadable, missing business code for adoption feedback, etc.

Only after the checklist above (and required owner decisions) may you download the authorized artifact, update deps/bundle, or open the upgrade branch.

After deps/bundle update, do **not** stop at version alignment: execute the adaptation pass (or write `业务侧适配：无（已核对…）`) before claiming complete. Details: `references/startup-and-upgrade.md`.

中文验收：升级意图下，首轮输出必须能检查「当前版本 / Release 候选 / 是否需负责人选型 / 是否授权下载 / 是否从 dev 开分支 / **升级后业务适配计划**」；落地后必须有已执行适配或明确「无」；禁止只输出能力命中或直接 curl 制品库版本。
