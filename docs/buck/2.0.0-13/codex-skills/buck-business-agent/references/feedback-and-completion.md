# feedback and completion

Load this reference only when the current phase needs it. `SKILL.md` remains the hot entrypoint.

## Buck Evolution Feedback

If you find any of the following during business development, create or ask to create an issue at brick-next. Do not only leave it in chat, a commit message, or a local TODO:

- Buck lacks a foundational capability, SPI, configuration item, published entrypoint, project template, or example that the business application should reuse.
- A published Buck function has a bug, or behaves differently from the release docs, contracts, configuration reference, or examples.
- The release docs are ambiguous, incomplete, or have unclear boundaries, causing you to guess, deep-read internals, or build a parallel mechanism.
- A function works technically but does not match normal business development expectations, such as missing extension points, weak diagnostics, or an incomplete acceptance path.
- The business-agent skill, business `AGENTS.md` template, startup checklist, or release bundle organization can be improved to help future business agents adopt Buck correctly.

```text
https://github.com/wu9007/buck-issues/issues
```

Use Chinese for the issue title and body. Exact error logs, class names, API names, configuration keys, and package names may remain in their original language.

The issue should include:

- Issue type: bug, foundational capability request, documentation issue, behavior expectation gap, or skill improvement.
- Business repository and Buck version.
- Triggering scenario.
- Reproduction steps or concrete evidence of the gap.
- Expected behavior.
- Actual behavior or missing capability.
- Impact and whether development is blocked.
- Suggested Buck module or core owner.
- Business-side workaround, if any.
- Verification approach.

## Completion Checks

Before claiming completion:

- Run the focused tests for the changed slice.
- Run the business repository's total check command if it exists.
- If contracts, persistence, or generated artifacts changed, run the repository's generation and generated-output checks.
- Report any verification command that could not be run and why.
- After each verified phase or release-adoption step, commit and push the business repository changes promptly. Exclude local IDE files, caches, logs, and unrelated user changes. If push fails, report the exact branch, commit hash, command, and blocker.
- After a Buck upgrade is verified, report the upgrade delta to the business owner before or when filing adoption feedback. Required sections: source→target version, new capabilities, improvements/fixes, **business adaptations executed** (or `业务侧适配：无（已核对 Release 与 migration-notes）`), breaking note (`未声明破坏性变更` when none), remaining owner decisions, and evidence links. Do not only describe “可能需要适配” without apply evidence. Details: `references/startup-and-upgrade.md`.
- After runnable frontend/backend changes pass checks, **start local services for owner acceptance** (next section). Do not only paste start commands and stop.

## Local runtime handoff (hard gate)

业务负责人要在本机直接点验。自动化检查通过后，agent 必须在本地把可运行面**真正拉起来**并回报 URL，不能只输出 `npm run dev` / `bootRun` 让人自己敲。

### When it applies

Applies when the change touches a runnable surface, for example:

- Backend Java/API, Flyway, config that needs a running process
- Frontend pages, shell, UI, Vite entry, module page wiring
- Buck upgrade that changes runtime behavior the owner should click-test
- Any task the owner asked to “run it so I can verify”

### When it may be skipped

Skip only when there is **no runtime surface**, for example pure docs, labels, skill text, rules-only, or issue-only work. If you skip, the final reply **must** state the skip reason in Chinese, e.g. `跳过本地启动：本次仅文档/规则，无前后端运行面`。

### Required actions (in order)

1. Finish focused tests / total check (and generate checks when needed).
2. Start **backend then frontend** using the business repository’s documented commands (prefer repo `README.ai.md` / `AGENTS.md` scripts). Typical patterns:
   - Backend: Gradle `bootRun` or the repo wrapper; wait until the health/port is up.
   - Frontend: `npm run dev` (or the repo script) against the real backend; do not invent a mock backend.
3. Confirm both sides are listening (process still running, URL returns, or log shows ready).
4. In the final reply to the business owner, report:
   - Frontend URL (e.g. `http://127.0.0.1:5173`)
   - Backend URL / port (e.g. `http://127.0.0.1:8080`)
   - Default login hint only if the repo already documents bootstrap accounts (**never** print secrets, tokens, or production credentials)
   - Log path and/or PID if useful
   - Suggested click path for acceptance (route or menu path)
5. Leave services running for the owner unless they asked you to stop them.

### Failure handling

- If start fails: report root cause (port in use, DB down, missing env, compile error), the command used, and the condition to unblock. **Do not silently skip.**
- If only one side can start: report partial status and the blocker for the other side.
- If the environment cannot run services at all (no JDK/Node/DB): say so explicitly and stop claiming “ready for click acceptance”.

### Anti-patterns

- Ending with only “请本地执行 `npm run dev` / `./gradlew bootRun`”.
- Claiming completion without URLs when the task had a runnable surface.
- Starting mock backends or skipping real API wiring to make the UI look green.
