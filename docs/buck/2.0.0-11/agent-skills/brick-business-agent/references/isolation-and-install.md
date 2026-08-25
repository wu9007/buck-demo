# isolation and install

Load this reference only when the current phase needs it. `SKILL.md` remains the hot entrypoint.

## Isolation Rules

- Business-side commands must not read, search, open, modify, commit, or push the `buck` source repository (formerly `brick-next`) or any local `buck` / `brick-next` checkout.
- 中文硬约束：业务侧禁止读取、搜索、打开、修改、提交或推送 `buck` 源码仓库（曾用名 `brick-next`）或本地 checkout。
- 中文短句：不要读取 `buck` 源码，更不要修改 `buck` 工作区。
- Do not run `rg`, `sed`, `cat`, `apply_patch`, `git add`, `git commit`, or `git push` against a `buck` working tree from a business task.
- 中文命令约束：业务侧不得执行 `rg`、`sed`、`cat`、`apply_patch`、`git add`、`git commit` 或 `git push` 等命令去操作 `buck` 工作区。
- If the user explicitly asks for framework maintenance, stop the business workflow and switch to a `buck` maintainer session and skill before reading or changing framework source.
- Do not rely on previous chat history for architecture or business decisions.
- Do not copy Buck source into the business repository.
- Do not use Gradle `project(...)`, Gradle `includeBuild`, or npm workspaces to connect the business repository to Buck source.
- Do not deep import `@wildbuck/*` files that are not exposed through package `exports`.
- Do not bypass the Buck business rule check shipped in the release bundle.

## Skill Distribution Boundary

When a business repository carries a Buck release bundle that includes `docs/buck/<version>/agent-skills/buck-business-agent/`, treat that directory as the business-side installable skill source for that Buck version. The bundle must not include `buck-next-maintainer`, and business agents must not install or use maintainer-only skills to operate `buck` branches, MRs, tags, releases, or issue closure.

If a business-side skill rule seems wrong or incomplete, file or link a Chinese `buck` issue from the business context. Do not edit the release bundle directly in the business repository except as part of an approved Buck version adoption.

## Skill Installation Gate

Business agents must install and use `buck-business-agent` before implementation. At the beginning of every non-trivial business task, confirm that the current Codex session is using the business-side skill for the Buck version adopted by the repository.

If the skill is not available in the current session, install it from the adopted release bundle source:

```text
docs/buck/<version>/agent-skills/buck-business-agent/
```

For one compatibility window the same bundle also writes `agent-skills/brick-business-agent/`. Prefer the `buck-business-agent` directory.

Do not install `buck-next-maintainer` in a business repository. If the current environment cannot install or load `buck-business-agent`, stop implementation and report the blocker with the attempted install source. Do not continue with a manual fallback that only reads the bundle.

Every first output, MR description, issue comment, or final handoff must include `buck-business-agent skill 状态：已使用 / 已安装`. If installation failed, report `buck-business-agent skill 状态：无法安装` and stop before code changes.
