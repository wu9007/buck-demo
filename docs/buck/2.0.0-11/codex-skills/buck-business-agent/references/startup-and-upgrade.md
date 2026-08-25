# startup and upgrade

Load this reference when the phase is Buck upgrade / 采用新版本 / release signal / adoption feedback. On **upgrade intent**, `SKILL.md` hard-requires this file **before** any version discovery shortcut or dependency edit.

## GitHub Release access runbook (allowed; not source isolation)

Reading Buck **GitHub Releases** is the **only** normal way to discover publish evidence for upgrades. This is **allowed** and is **not** reading a `buck` source working tree.

### Allowed

- `gh release list -R wu9007/buck` (GitHub still redirects `wu9007/brick-next`)
- `gh release view <tag> -R wu9007/buck`
- `GET /repos/wu9007/buck/releases/tags/:tag_name`
- Prefer `gh api repos/wu9007/buck/releases` when the CLI wrapper is unavailable
- Auth: `gh` logged-in session, or `Authorization: Bearer <token>` for API
- After authorization: download the 资料包 from the GitHub Release **asset** `buck-<version>.zip` (`gh release download <tag> -R wu9007/buck -p 'buck-*.zip'`). If that asset is missing, use `brick-next-*.zip` for versions published before the rename. Actions artifacts are a fallback if the zip is missing from the Release.

### Forbidden (do not fall back)

- Local `buck` git checkout, `git tag` / commit messages in that tree
- Nexus / Maven repository version listing, Verdaccio / npm `@wildbuck/*` version listing as **candidate discovery**
- Guessed shared filesystem / FS paths, release-notice body alone without a readable GitHub Release
- “Tag exists → treat as released” without a GitHub Release record

### Failure mode

If Releases cannot be listed or viewed (401/403/404, missing token, wrong project id):

1. **Stop** upgrade discovery and dependency edits
2. Report the exact failure (command/status) and required access (token scope / gh login / repo path)
3. File or link a Chinese `buck` issue if the release log is missing for a claimed tag
4. **Do not** fall back to Nexus, npm, or local tags

中文硬句：读 GitHub Release（API/`gh`）允许；读 `buck` 工作区源码禁止；Release 读不到时停止，禁止用 Nexus/tag 顶替。

## Startup Workflow

The business repository's `docs/buck/<version>/` is the authoritative Buck release bundle for business development. Do not use `buck` CI artifacts, temporary download directories, or external release zips as the first source of truth.

If the user, a brick-next issue comment, a GitHub Release, or any necessary fallback release notice says Buck was fixed or a new Buck version was released, treat that as a release signal and check the business repository before reading the bundle or writing code:

```bash
git fetch origin
git ls-tree --name-only origin/main:docs/buck || git ls-tree --name-only origin/main:docs/brick-next
```

When the release signal arrives through a brick-next issue comment, GitHub Release, or fallback release notice:

1. Read the relevant GitHub Release or issue comments first. Prefer `GET /repos/wu9007/buck/releases/tags/:tag_name` or `gh release view` so you can capture the fixed issue number, published version or tag, pipeline/job evidence, release_publish job, release artifact, and summary of changed docs, packages, rules, or templates.
2. Check whether the business repository has already adopted that version in `AGENTS.md`, `README.ai.md`, `docs/buck/<version>/`, backend BOM, and frontend `@wildbuck/*` versions.
3. If the business repository has not adopted the version, report the current adopted version and the newly published version, summarize the issue-comment changes, and wait for the business owner or lead to decide whether to upgrade.
4. If the business repository has adopted the version, read the new bundle from the business repository, run the release-bundle business rule check, then apply only the required business-side changes.
5. If a tag exists but no GitHub Release record can be read, stop and file or link a Chinese `buck` issue for the release-bundle gap. Do not continue from tag names, dependency versions, guessed shared filesystem paths, or release-notice summaries alone.
6. Do not read the `buck` source repository (formerly `brick-next`), do not download release artifacts before explicit authorization, and do not change dependency or bundle versions merely because an issue says a version was published.

人工要求升级 is a stronger release signal, but still requires release-log review before edits:

1. Identify the current adopted Buck version from the business repository, not from chat history.
2. Discover candidate Buck versions newer than the adopted version from **GitHub Releases only** (or an explicitly provided release index that is itself a Release list). **Do not** discover candidates from Nexus, Verdaccio, npm, or local tags.
3. 逐个读取 GitHub Release 发布日志 for every candidate version before choosing or applying an upgrade. Capture the version, tag, pipeline/job evidence, release artifact, main changes, upgrade recommendation, and non-upgrade impact.
4. If there are 多个可升级版本, summarize every candidate's release log and ask the business owner or lead to choose the target version. Do not silently choose the newest tag.
5. If there is 只有一个可升级版本, summarize that release log, then upgrade to that version because the human has already requested an upgrade.
6. If GitHub Release logs cannot be read, stop and report the missing release-log evidence instead of upgrading from tag names or dependency versions alone. **No Nexus/tag fallback.**
7. If artifact download is explicitly authorized, use `Authorization: Bearer: <token>` or `Authorization: Bearer <token>` (or authenticated `gh`). Do not try Basic Auth or a form-login flow first.
8. After reading the Release description, download `buck-<version>.zip` from that Release’s assets (`gh release download <tag> -R wu9007/buck -p 'buck-*.zip'`). If missing, try `brick-next-*.zip` for pre-rename versions. Extract so the tree is `docs/buck/<version>/` (zip root `buck-<version>/` or `brick-next-<version>/`). Use Actions artifacts only if the zip is not attached. Do not treat a short Maven Central / npmjs 404 as “unpublished” when the GitHub Release exists.

Use this source priority:

1. Current business repository working tree bundle: `AGENTS.md`, `README.ai.md`, and `docs/buck/<version>/`.
2. Business repository remote designated branch bundle, defaulting to `origin/main`.
3. Explicitly authorized downloaded Buck release artifact. Prefer the GitHub Release asset `buck-<version>.zip` (fallback `brick-next-*.zip`); extract so the tree is `docs/buck/<version>/` (the zip root is `buck-<version>/` or `brick-next-<version>/`). Existing `docs/brick-next/<version>/` remains valid until that version is upgraded. Update `AGENTS.md` / `README.ai.md`, and commit it to the business repository before development. Maven BOM and npm `@wildbuck/*` are how the app **consumes** the version after the owner chooses to upgrade — not how the agent **discovers** versions.

If the user-stated Buck version and the business repository bundle version differ, report the exact versions and wait for unified naming or bundle synchronization. Do not guess or switch to a different source silently.

A Buck GitHub Release, fallback release notice, or shared artifact location does not mean the business repository must upgrade immediately. GitHub Release is the default Buck release log and release index; fallback per-business notification issues are only for necessary reminders. Treat shared release artifacts as an available delivery source, not as the business development source of truth. If the business repository has not adopted the notified version yet, report the current adopted version, summarize the new version, and wait for the business owner or business lead to decide whether to pull the new dependency version and bundle. Do not change Maven BOM versions, npm `@wildbuck/*` versions, `docs/buck/<version>/`, `AGENTS.md`, or `README.ai.md` just because a Buck release was announced. Any downloaded bundle must be copied back into the business repository before development starts.

After a Buck upgrade is adopted and verified, keep only the active release bundle under `docs/buck/<version>/` unless the business owner explicitly asks to preserve older bundles for audit or comparison. Before deleting old `docs/buck/<old-version>/` directories, confirm `AGENTS.md`, `README.ai.md`, CI scripts, package versions, Maven BOM versions, and business docs no longer reference them. Include the cleanup in the same release-adoption commit or in an immediate follow-up commit.

## Upgrade business-adaptation apply gate (hard)

Deps/bundle bump is **step one only**. After the target bundle is in the business repository, the agent **must** turn the upgrade delta into **executed business-side changes** in this repository (or an explicit empty result after scan). Reporting “adaptation needed” without applying it is a failed upgrade.

中文硬门禁：升级不只是换版本号；必须根据变更内容在业务仓完成相应调整（含删除框架已删配置项），不能只汇报「需要适配」。

### When

Immediately after:

1. Target BOM / `@wildbuck/*` / `docs/buck/<version>/` / `AGENTS.md` / `README.ai.md` are updated on the upgrade branch
2. Before claiming verification complete, filing adoption feedback, or telling the owner “upgrade done”

### Sources (priority)

1. Target-version **GitHub Release** description and linked issue/MR close notes (feat/fix/docs, config surface, skill, rules)
2. Bundle `compatibility/migration-notes.md` and `compatibility/business-upgrade-notice.md`
3. Diff of adopted skill/rules/docs inside the new bundle vs the previous active bundle under `docs/buck/` when still present
4. Tag/commit summary only when the above lack product-facing detail (**never** a `buck` source working tree)

### Mandatory scan → apply checklist

Produce a written **业务侧适配清单**, then apply each item you can without inventing product policy:

| Signal in delta | Required business action |
| --- | --- |
| Config key removed / default-only / no longer configurable | Search business `application*.yml` / `.properties` / env samples / Helm / K8s / CI variables; **delete or stop setting** obsolete keys; do not leave dead config “harmless” |
| Config key added as deploy decision | Add only if this environment needs non-default value; prefer framework defaults |
| Skill / rules / templates / check scripts changed | Re-install or refresh from `docs/buck/<version>/agent-skills/` and bundle rules; re-run release-bundle business rule check |
| API path / SPI / frontend contract / theme / permission / menu impact | Update business call sites, pages, and docs in the same upgrade MR when possible |
| Persistence / migration guidance | Follow bundle migration notes; no handwritten JDBC/SQL shortcuts |
| Breaking change needing owner product choice | Stop, list options, wait — still must not skip the scan |

Search pattern expectation (adapt paths to the business repo layout):

```bash
rg -n 'brick\.(mcp|security|transport|openapi|orm|observability|usage-event)\.' --glob 'application*.{yml,yaml,properties}' --glob '*.env*' --glob '**/values*.yaml' .
```

When the Release or migration-notes names removed keys (for example dropped MCP path/server-name/bridge switches), **actively purge those keys from business config** even if Spring ignores unknown properties.

If the scan finds nothing actionable: write `业务侧适配：无（已核对 Release 与 migration-notes）` in the upgrade MR/issue comment and owner handoff.

### Same-MR preference

Prefer applying adaptations in the **same** upgrade branch/MR as the version bump. If size forces a follow-up, open it immediately from `dev` and do not claim the upgrade complete until that follow-up is merged or the owner explicitly defers with a recorded reason.

## Upgrade delta report gate (hard)

After adaptations are applied (or explicit empty result) and verification passes — and before or when filing the adoption feedback issue — the business agent **must** report a readable upgrade delta summary to the business owner. Do not claim the upgrade is finished with only “deps/bundle updated, CI passed, adoption feedback filed”.

中文硬门禁：升级验证通过后，必须在创建采用反馈的同时或之前，向业务负责人输出「本次版本新增/完善/修复摘要」与「**已执行的业务侧适配**」；禁止只报告版本号和验证通过。

Required sections:

1. **Source → target version** (for example `1.0.0-122 → 1.0.0-123`)
2. **New capabilities** (feat)
3. **Improvements / fixes** (fix / docs / rule enhancements)
4. **Business adaptations executed** (files/keys changed: removed obsolete config, skill refresh, call-site updates, etc.). If none after scan, write `业务侧适配：无（已核对 Release 与 migration-notes）`. Do **not** only write abstract “可能需要适配” without apply evidence
5. **Breaking / non-breaking note**: if the Release and migration-notes declare no breaking impact, write `未声明破坏性变更`; otherwise list them with how they were handled
6. **Remaining owner decisions** (if any). If none, write `无待负责人决策项`
7. **Evidence entry points**: GitHub Release URL, bundle `compatibility/migration-notes.md`, upgrade MR/commit hashes

Place the summary in the conversation with the business owner. Prefer also pasting it into the business adoption issue or MR comment so the delta survives the session.

After a Buck upgrade is adopted and verified, proactively create or ask to create a Chinese issue in the brick-next repository titled `Buck 采用反馈：<business-code> 已采用 <brick-version>`. Include the business repository URL, business commit hash, release bundle path, backend/frontend dependency versions, and verification commands. This is the only normal way Buck maintainers should update `business-adoption-registry.json`; a Buck GitHub Release or release notification does not prove adoption.

After a Buck adoption milestone is complete, check for `已完成但仍 active 的 milestone`. Close the adoption milestone when its adoption issue, MR, main pipeline, release-bundle cleanup, and Buck adoption feedback evidence are all closed or recorded. Do not close a broader business delivery milestone until the business requirements in that milestone are also accepted.

When creating Buck evolution or adoption feedback issues, use `docs/buck/<version>/business-issue-collaboration.md`, `docs/buck/<version>/github-issue-governance.md`, and `docs/buck/<version>/issue-templates/` from the adopted release bundle when present to decide whether the issue belongs in the business repository or `buck`, propose labels, milestone, and closing evidence. If the adopted bundle does not yet contain these files, include suggested type/scope/priority, affected Buck version, and verification evidence in the issue body instead of reading `buck` source.

When the adopted release bundle contains `docs/buck/<version>/git-branch-governance.md`, use it before starting the next business issue, creating a branch, preparing an MR, or creating a business tag. Run its Next-work triage gate against business-repository issues, use `<type>/issue-<iid>-<slug>` branches, keep tag creation on merged `main` commits, and do not directly modify `buck` or operate `buck` branches, MRs, tags, or releases.

Business agents must treat `dev`, `test`, and `main` as protected promotion branches. Short feature/fix/chore branches may enter `dev` through MR only; 业务 agent 禁止直接把短分支合入 `test` 或 `main`. Business agents must not merge `dev -> test`, merge `test -> main`, push directly to `dev` / `test` / `main`, or create a business release tag unless the business owner gives an explicit business-owner instruction in the current session or in a traceable issue/MR comment.

## Branch baseline gate (before develop or upgrade)

Business repositories always use `dev` / `test` / `main`:

```bash
git fetch origin
git rev-parse --verify --quiet origin/dev
```

- Open feature and Buck-upgrade short branches **from `dev`**, and open MRs into `dev`.
- `DEV_DEPLOY_BRANCH` is always `dev`; `TEST_DEPLOY_BRANCH` is always `test`; business tags are created only from merged `main` commits.
- Do not open business short branches from `main`, and do not set `DEV_DEPLOY_BRANCH=main`.
