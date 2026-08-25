# git protection

Load this reference only when the current phase needs it. `SKILL.md` remains the hot entrypoint.

## Git Main Branch Protection Gate

Before starting implementation or a Buck upgrade, create short branches from `dev` and open MRs into `dev`. Do not open business short branches from `main`, and do not set `DEV_DEPLOY_BRANCH=main`.

Treat any `git add`、`git commit`、`git push`, cleanup of “整理本地未提交和未推送代码”, MR preparation, or closeout work as a high-risk Git action. Before those actions, run and report:

```bash
git status -sb
git branch --show-current
git log --oneline origin/main..HEAD
```

- If the current branch is `main` 且存在未提交改动, do not commit. Create or confirm the business GitHub issue first, then switch to `<type>/issue-<iid>-<slug>` before committing.
- If the current branch is `main` 且存在 ahead commits, 不允许直接 push. Stop and report the ahead commit list from `git log --oneline origin/main..HEAD`, then choose one recorded recovery path: migrate commits to an issue branch, create an MR, or use an explicitly approved emergency path.
- An emergency direct-main path must record the business reason, commit hash, verification commands, impact, and follow-up action in a business issue, MR, or comment.
- If another generic Git closeout skill suggests pushing the current branch, this business rule wins: business repositories must not directly push `main`.

## Merged branch delete closeout

Standard path: local issue branch → push → MR into `dev` → merge → delete remote source branch and local branch in the same session, then `git fetch --prune`. Do not keep merged short branches on remote or local. If GitHub auto-delete fails, delete manually before starting the next issue.

After a Buck upgrade is adopted and verified in the business repository, close the corresponding business-repository Buck release-notification issue(s). In the closing comment, record the adopted version, the business commit hash, and the verification commands or manual checks that proved the upgrade landed.
