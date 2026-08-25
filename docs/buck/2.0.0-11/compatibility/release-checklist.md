# 发布兼容性检查清单

本清单用于每次发布前确认 `buck` 的后端 BOM、前端 npm 包、契约、迁移和独立上层应用消费路径没有漂移。它不替代 `docs/architecture/delivery/dependency-publishing.md`。

产品化升级证据口径见 `docs/architecture/governance/productization-evidence-ledger.md`。真实 Maven Central / npmjs 发布记录、独立业务仓库消费 CI 和发布后安装验证必须写入 issue/MR 或 GitHub Release 证据，不能用本地 dry-run 或计划说明替代。可选 Nexus / Verdaccio 仅在实际使用时记入证据。

发布 tag 必须使用 `v<大重构版本号>.<迭代版本号>.<修订版本号>-<测试版本号>`，例如 `v1.4.2-3`。发布版本为去掉 `v` 后的 `1.4.2-3`；同一版本线内只允许测试版本号最大的 tag 发布。

正式发版在GitHub 仓库执行：

```text
git@github.com:wu9007/buck.git
```

GitHub Actions runner 必须能访问 Maven Central、npmjs、GitHub Packages（仅 Flyway）和发布验证数据库。不把内网 Nexus / sidecar Verdaccio 当作默认前提。发布凭据只放在 GitHub Actions secrets，且应设为 masked/protected。

## MCP 工具执行语义（1.0.0-144+）

启用 `core:mcp` 后，classpath 上的 `BrickAiTool*` 按当前主体过滤。写工具 / `ASK` 策略返回 `REQUIRES_CONFIRMATION`，**不会**直接执行。`FULL_ACCESS` 不能覆盖该门。这是兼容收紧：旧验证壳匿名目录/直执行不再是产品行为。生产保持 `allow-anonymous=false`。

## 适用范围

- patch 版本：只允许兼容修复、测试守卫和文档补强。
- minor 版本：允许新增 core/module/starter 能力，但不能破坏旧 BOM、npm exports、API path、DTO 字段语义、权限 code 或菜单 code。
- major 版本：允许破坏性变更，但必须写迁移说明、升级路径和上层应用改造步骤。

## 契约兼容报告（机器生成）

仓库提交默认基线：`tools/contract-compat/contract-surface.baseline.json`。

**发布门禁（自动）**：`npm run release:verify` 首先执行 `npm run contract-compat:check`。该命令对比当前工作树与 baseline，写出 `.brick/contract-compat-report.json`，并在存在 **breaking** 时失败。

发布前或重大契约变更后，也可用 CLI 手工生成结构化兼容信号（API 含 method/path/permission/**request/response 类型引用**、DTO 字段、errors、permissions、menus、persistence、frontend exports）：

```bash
# 发版/CI 等价检查（相对仓库 baseline，breaking 阻断）
npm run contract-compat:check

# 在任意 before 快照上对比当前工作树
npm run contract-compat:snapshot -- --output .brick/contract-surface-before.json
npm run contract-compat:compare -- --before .brick/contract-surface-before.json --output .brick/contract-compat-report.json
node tools/brick-cli/bin/brick.mjs contract-compat compare --before .brick/contract-surface-before.json --fail-on-breaking

# 有意变更契约表面后更新仓库 baseline（与功能变更同一 MR）
npm run contract-compat:baseline
```

报告字段：

- `summary.breaking` / `summary.additive` / `summary.compatible`
- `changes[]`：`severity`、`area`（api/dto/persistence/frontend-exports 等）、`target`、`message`
- API 面：endpoint 删除、permission 变更、**request/response 类型引用变更**默认 `breaking`；仅新增 endpoint 为 `additive`

将报告摘要写入 MR / GitHub Release / release evidence；patch/minor 不得出现未说明的 `breaking` 项。
发版资料包必须产出 `compatibility/breaking-changes.json`（由同一份 contract-compat 报告生成，`action` 为 `adapt` 或 `adopt-optional`），供升级智能体改编配置，不替代 `migration-notes.md`。

## 发布流水线门禁

正式发布只通过 GitHub tag 流水线触发。`release:verify` 在 PR / main 完成，tag job 只发制品：

```bash
npm run release:version -- --tag v1.4.2-3
npm run release:prepare -- --tag v1.4.2-3
npm run publish:backend:central
npm run release:npmrc
npm run publish:frontend
npm run release:bundle -- --tag v1.4.2-3
npm run release:github-release -- --tag v1.4.2-3
```

本地完整门禁仍用 `npm run release:verify`，展开后必须覆盖：

```bash
npm run contract-compat:check
npm run check
npm run validation:published:backend
npm run publish:frontend:dry-run
```

如果只需要在开发机定位后端制品问题，可以单独执行 `npm run publish:backend:local`。开发机不执行正式 Maven Central / npmjs 发布。

如果改动契约、manifest、持久化或迁移，还必须执行：

```bash
npm run generate
npm run generate:check
```

## 发布证据收口

tag 流水线的 `release_publish` 在创建 GitHub Release 后强制运行 `release:evidence --check`，并把报告写入 release artifact。本地补跑或手工收口时：

```bash
npm run release:evidence -- --tag v1.4.2-3 --github-release-url <release-url> --pipeline-url <pipeline-url> --release-publish-job-url <job-url> --artifact-url <artifact-url> --nexus-publication-url <nexus-url> --verdaccio-publication-url <verdaccio-url> --publish-frontend-verify-url <verify-job-url> --business-consumption-url <business-ci-url> --check
```

该命令生成 `build/release/release-evidence.md`。CI 环境可省略大部分 URL 参数；缺失的独立业务消费 CI 必须写 `exempt:` / `豁免:` 原因，不能用空值或尖括号占位。它只证明发布可用性和登记表当前采用证据，不把 GitHub Release、发布通知或 tag pipeline 当作业务采用证明。

## 后端兼容性

- `buck-bom` 是后端兼容入口；上层应用必须通过 BOM 锁定 Buck 版本。
- `starters:application` 的默认装配变化必须写入发布说明。
- 新增、删除或改名 Maven 坐标都属于版本表面变化。
- `validation/business-api` 必须继续通过 Maven 坐标消费 `io.github.wu9007:buck-bom` 和 `io.github.wu9007:buck-starter-application`，不能使用 `project(...)` 或 `includeBuild`。

## 前端兼容性

- `@wildbuck/*` 包名和 npm exports 是前端兼容入口。
- 前端包发布到 npmjs `https://registry.npmjs.org/`；GitHub Release tarball 作拖底。sidecar Verdaccio `http://127.0.0.1:4873/` 仅可选。
- 删除 npm exports、改名包、改变根导出语义都属于破坏性变更。
- `npm run publish:frontend:dry-run` 必须能对所有发布型 workspace 执行 `npm pack --dry-run`，用于提前发现缺文件、错误入口和 package manifest 漂移。
- tag job 以 `npm publish` 退出码判定前端是否发出。不要在同一 job 里立刻 `npm pack @pkg@version` 回核对（npmjs 复制延迟，#53）。可选 `publish:frontend:verify` 仅在 registry 已可见后本地使用。

## 迁移和契约

- API path、DTO 字段语义、错误 code、权限 code、菜单 code 都是契约表面。
- 数据库迁移默认由 persistence contract 生成；历史手写迁移必须登记在 `docs/architecture/governance/module-migration-governance.md`。
- 破坏性变更必须说明旧版本上层应用如何升级，不能只说明当前版本如何首次接入。

## 发布记录最小内容

每次发布记录至少包含：

- 版本号和变更类型：patch、minor 或 major。
- 新增、删除或改名的 Maven 坐标、npm 包和 npm exports。
- BOM constraints 变化。
- starter 默认装配变化。
- contract、manifest、权限、菜单和迁移变化。
- `build/release/buck-<version>/` 每版本资料包路径。
- GitHub Release URL，以及 Release description 中的 pipeline、`release_publish` job 和 artifact 链接。
- `npm run check`、`npm run validation:published:backend` 和 `npm run publish:frontend:dry-run` 的结果。
- 独立业务仓库消费 CI、真实 Maven Central / npmjs 发布记录和发布后安装验证；这些证据按 `productization-evidence-ledger.md` 记录。可选 Nexus / Verdaccio 仅在实际使用时记入。
- `npm run release:evidence -- --tag <tag> ... --check` 的输出，确认发布可用性证据齐全，并确认 `business-adoption-registry.json` 里的每个业务系统都有 `adoptionEvidence.sourceUrl`。
