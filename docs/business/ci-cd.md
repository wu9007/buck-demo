# CI/CD

- 工作流：`.github/workflows/ci.yml`，来自资料包 `templates/github-actions.yml`
- `verify_brick_rules` 执行 `node docs/buck/2.0.0-13/rules/check-business-structure.mjs .`
- 后端 `test`/`bootRun` 使用 PostgreSQL。资料包默认 H2 会被 `BrickDatabaseDialectResolver` 拒绝，见 `wu9007/buck#70`
- CI `verify` 使用 `postgres:16` service（用户 `buck` / 库 `buck_demo`）
- 分支基线：`dev` → `test` → `main`
- 第一阶段未接 K8s 自动部署；缺组级变量时在 issue 记录，不自造第二套流水线
