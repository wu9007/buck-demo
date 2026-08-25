---
name: brick-business-agent
description: Use when acting as an upper business application development agent for a Buck-based business repository — developing, validating, upgrading Buck version / 采用 Buck 新版本, or filing adoption feedback — from a published Buck release bundle without reading brick-next source or relying on chat history.
---

# Buck Business Agent

Use this skill when developing or validating an independent upper business application that consumes Buck through published artifacts, **or when upgrading / adopting a new Buck version**.

This skill is the **hot entrypoint** (method, routing, stop conditions). Version-specific rules live in the business repository release bundle: `docs/buck/<version>/`. Detailed gates live in `references/*` and load only when the phase needs them — **except upgrade intent**, which hard-loads `references/startup-and-upgrade.md` before any version discovery or dependency edit (see below).

## Isolation (non-negotiable)

- Do not read, search, open, modify, commit, or push `buck` source or any local `buck` checkout.
- 中文硬约束：业务侧禁止读取、搜索、打开、修改、提交或推送 `buck` 源码仓库或本地 checkout。
- 中文短句：不要读取 `buck` 源码，更不要修改 `buck` 工作区。
- Do not run `rg`, `sed`, `cat`, `apply_patch`, `git add`, `git commit`, or `git push` against a `buck` working tree from a business task.
- 中文命令约束：业务侧不得执行 `rg`、`sed`、`cat`、`apply_patch`、`git add`、`git commit` 或 `git push` 等命令去操作 `buck` 工作区。
- Do not rely on chat history for architecture decisions. Do not copy Buck source into the business repository.
- Do not deep import `@wildbuck/*` files outside package `exports`. Do not bypass the release-bundle business rule check.
- **Allowed:** read Buck **GitHub Releases** (and jobs/artifacts metadata) via GitHub API or `gh release list|view`. That is **not** reading a `buck` source working tree.

Details: `references/isolation-and-install.md`.

## Skill install gate

- Business agents must install and use `buck-business-agent` before implementation **or upgrade**.
- Install from `docs/buck/<version>/agent-skills/buck-business-agent/` when needed.
- Bundle must not include `buck-next-maintainer`; business agents must not use maintainer skill to operate `buck`.
- Every first output / MR / issue comment / handoff must include `buck-business-agent skill 状态：已使用 / 已安装` (or `无法安装` and stop).

Details: `references/isolation-and-install.md`.

## Upgrade intent hard gate (non-negotiable)

**English hard gate:** When the user intent includes **upgrade Buck / adopt a new Buck version / 升级到最新 / 采用新版本**, you must **fully read** `references/startup-and-upgrade.md` and produce the **upgrade-task first-output checklist** (in `references/first-output-and-context.md`) **before** any Nexus/npm version probe, any BOM/`@wildbuck/*`/bundle edit, or any artifact download.

**中文硬门禁：** 当用户意图含「**升级 Buck / 采用新版本 / 升到最新**」时，在任何依赖或资料包变更、任何 Nexus/npm 版本探测、任何 artifact 下载之前，必须**完整读取** `references/startup-and-upgrade.md` 并输出**升级任务专用首轮清单**。

Mandatory upgrade path:

1. Current adopted version from **this business repository** (`AGENTS.md` / `README.ai.md` / `docs/buck/<version>/` / BOM / `@wildbuck/*`)
2. Discover candidates from **GitHub Releases only** (API or `gh`)
3. Read each candidate Release log → summarize
4. Multiple candidates → **business owner chooses**; single candidate after human upgrade request → summarize then proceed
5. Artifact download only after **explicit authorization**
6. Edit deps/bundle on a branch from `dev`
7. **Apply business-side adaptations from the upgrade delta** (not report-only) — hard gate; see below
8. Verify, report delta **with executed adaptations**, then adoption feedback

### Upgrade business-adaptation gate (non-negotiable)

Updating BOM / `@wildbuck/*` / release bundle alone is **not** a completed upgrade.

**English hard gate:** After the target version’s deps and `docs/buck/<version>/` are in the business repo, you must read the target **GitHub Release** plus bundle `compatibility/migration-notes.md` and `compatibility/business-upgrade-notice.md` (when present), build an **actionable adaptation checklist**, and **apply** every item that can be done in this business repository **before** claiming the upgrade finished or filing adoption feedback.

**中文硬门禁：** 依赖与资料包回填后，必须根据目标版 **GitHub Release** 与资料包 `compatibility/migration-notes.md`、`compatibility/business-upgrade-notice.md`（若有）列出**可执行适配清单**，并在业务仓**主动落地**全部可自动完成项；禁止只改版本号就宣称升级完成。

Must scan and adapt when the delta implies it (examples, not exhaustive):

- **Removed / renamed config keys** → delete or rename in business `application*.yml` / `.properties` / env samples / deploy templates (do not leave obsolete keys “for later”)
- **New required config / defaults change** → add only non-default deploy decisions; prefer framework defaults
- **API path / SPI / skill / rule / template changes** → update business call sites, install refreshed `buck-business-agent`, refresh CI rule scripts from the new bundle
- **Permission / menu / migration / frontend contract impact** → apply or open a follow-up issue with owner decision when human choice is required

If nothing to adapt after an honest scan, write explicitly `业务侧适配：无（已核对 Release 与 migration-notes）`. If blocked on owner choice, stop with the exact blocker — do not skip the scan.

Full runbook: `references/startup-and-upgrade.md`.

**Forbidden on upgrade intent (hot entry):**

- Using **Nexus / Maven / Verdaccio / npm registry version lists** as the upgrade-candidate discovery source
- Using **local `buck` checkout, local tags, or tag commit messages** as release evidence
- Choosing the newest tag silently when multiple Releases exist
- Downloading artifacts before explicit authorization
- Falling back to Nexus/tag after GitHub Release API fails — **stop** and report / file a Chinese brick-next issue instead
- Claiming upgrade complete after **deps/bundle only**, without adaptation scan + apply (or explicit `业务侧适配：无`)

## Context Budget Gate

Use staged loading. Source of truth: `docs/buck/<version>/business-context-budget.md` when present; durable method in `references/context-budget.md`.

- Resident: latest goal, issue, Buck version, plan, constraints, verification gaps.
- Entry first, then phase-triggered topic rules, then on-demand source/API/log snippets.
- **Upgrade intent always phase-triggers** `startup-and-upgrade.md` before other implementation loading.
- `rg` before small-range reads; long output → `/tmp/*.log` (tail on success, keyword snippets on failure).
- Before next issue / branch / MR: confirm `labels 和 milestone 已初始化`; claim with assignee + `status:in-progress`.
- Process plans belong in issue/MR comments, not `docs/superpowers/**`.

## Hot entry reads

Before non-trivial work:

1. `AGENTS.md`
2. `README.ai.md`
3. `docs/buck/<version>/README.md`
4. `docs/buck/<version>/agent-index.json`（boot / phase / doNotRead；长文按 phase 再读，RC 不当生产默认）
5. `docs/buck/<version>/capabilities/packs.json`（先选四包，再读命中包 adoption 卡）
6. `docs/buck/<version>/business-context-budget.md` if present
7. Relevant `docs/business/` summaries

**If upgrade intent:** also read `references/startup-and-upgrade.md` and the upgrade first-output section in `references/first-output-and-context.md` **before** capability-hit style implementation planning.

Phase-triggered and on-demand files: `references/first-output-and-context.md`.

## Reference routing

Read references only when the phase needs them — **except upgrade intent must load startup-and-upgrade immediately**:

| Trigger | Reference |
| --- | --- |
| Isolation, install, distribution boundary | `references/isolation-and-install.md` |
| Context budget details | `references/context-budget.md` |
| **Buck upgrade, 采用新版本, release signal, adoption feedback** | **`references/startup-and-upgrade.md` (hard-load on upgrade intent)** |
| Git main protection, high-risk git actions | `references/git-protection.md` |
| Staged reads, required first output (feature **or** upgrade) | `references/first-output-and-context.md` |
| Capability hit table, module adoption | `references/capability-hit.md` |
| Backend structure, query list protocol | `references/backend-structure.md` |
| CI/CD, secrets env, deploy pipelines | `references/cicd.md` |
| Lombok / MapStruct / DTO placement | `references/backend-coding.md` |
| core/module capability boundaries | `references/capability-boundaries.md` |
| Forbidden parallel mechanisms | `references/forbidden-parallel.md` |
| Frontend/UI implementation rules | `references/implementation-rules.md` |
| Buck evolution feedback, completion checks | `references/feedback-and-completion.md` |

## Hard stop conditions (short)

- Never invent parallel IAM, audit, query, option, observability, client-meta, usage-event, OpenAPI HMAC, or AI assistant stacks; use released Buck capabilities or file a Chinese `buck` issue.
- Page list filter/sort/page → `core:query`; options → `core:option` / `BrickOptionProvider`.
- No handwritten runtime SQL / JDBC in business code.
- Do not copy `validation/security-console` as formal implementation source.
- `modules:ai-assistant` and `modules:identity-federation` are **maturity: released-candidate** unless the adopted bundle/manifest says `released`; production default wait for `released`. Capability hit row must treat AI assistants with RC risk: Business AI assistants → `modules:ai-assistant` + `core:ai-agent`. Identity federation → `modules:identity-federation`, not a parallel stack inside IAM.
- Prefer release-bundle templates/examples; keep business logic in the business repository.
- Theme: `system` is preference only. Bind `resolvedTheme` to `data-theme` / Shell `:theme`; bind preference to `theme-preference`. Forbid `data-theme="system"`. Details: `references/implementation-rules.md`.
- **Upgrade:** never discover versions from Nexus/npm/local tags; never use local `buck` checkout as evidence; GitHub Release first.

Capability table and full boundary lists: `references/capability-hit.md`, `references/capability-boundaries.md`, `references/forbidden-parallel.md`.

## Required first output (summary)

**Feature / implementation tasks:** context readiness, Context Budget evidence, capability hit, module adoption, backend/frontend deps, structure decision, CI/CD adoption decision, first slices, blockers. Full checklist: `references/first-output-and-context.md`.

**Upgrade / 采用新版本 tasks:** use the **upgrade-task first-output checklist** in `references/first-output-and-context.md` (skill status, current version, Release candidates, owner choice, download auth, branch from `dev`) — **not** the feature capability-hit checklist alone.

## Git protection (summary)

Before `git add` / `git commit` / `git push` / local cleanup / MR prep, report:

```bash
git status -sb
git branch --show-current
git log --oneline origin/main..HEAD
```

Do not commit or push directly on `main` with uncommitted work or ahead commits. Details: `references/git-protection.md`.

Branch baseline (before develop or upgrade):

- Always use `dev` → `test` → `main`. Open short branches and Buck-upgrade branches from `dev`, MR into `dev`.
- `DEV_DEPLOY_BRANCH` is always `dev`; never set it to `main` or use `main` as the development baseline.
- Details: `references/startup-and-upgrade.md`, `references/cicd.md`, `references/git-protection.md`.

## Completion (summary)

Focused tests → repository total check if present → generate checks when contracts/persistence change → commit/push per repo rules → **for runnable frontend/backend changes, start local services and report frontend/backend URLs** (not only paste start commands). Pure docs/rules may skip with an explicit reason. Full list: `references/feedback-and-completion.md`.

Buck upgrade close-out checklist (when the phase is a Buck version upgrade):

1. Bundle / BOM / `@wildbuck/*` / `AGENTS.md` / `README.ai.md` aligned to the target version
2. **Business adaptations applied** from Release + migration-notes (config cleanup, skill refresh, call-site/docs/CI updates) — or explicit `业务侧适配：无（已核对…）`
3. Focused and total checks pass; old inactive bundle cleaned unless the owner asked to keep it
4. **Upgrade delta reported to the business owner** (source→target, feat, fix/docs, **executed** adaptations, evidence links) — hard gate; see `references/startup-and-upgrade.md`
5. Chinese adoption feedback issue filed in `buck`
6. Business adoption milestone closed when its evidence is complete

## Authority note

When a long rule exists both here and in `docs/buck/<version>/`, the **adopted release bundle** wins for version-specific detail. Skill methods and stop conditions still apply. Prefer fixing gaps via Chinese `buck` issues rather than local parallel mechanisms.
