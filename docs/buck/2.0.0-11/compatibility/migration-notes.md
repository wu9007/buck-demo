# Buck 2.0.0-11 迁移说明

本文件随发布资料包生成，用于业务负责人和业务开发 agent 评估从当前采用版本升级到 Buck 2.0.0-11 的影响。它不代表业务系统已经采用；实际采用仍以业务侧采用反馈 issue 或可验证业务仓库状态为准。

## 版本影响摘要

- 发布物版本统一为 `2.0.0-11`，业务仓库升级时 Maven BOM、Buck Maven 依赖、npm `@wildbuck/*` 依赖和 `docs/buck/2.0.0-11/` 资料包必须同步到同一版本。
- 本资料包包含业务开发指南、能力目录、模板、规则脚本、业务侧 `buck-business-agent` skill、兼容性检查清单、`compatibility/breaking-changes.json` 和本迁移说明。升级智能体改编配置时优先读 JSON（`surface` / `old` / `new` / `action`），再读本散文。
- GitHub Release 是默认发布日志和 release index；逐业务仓库通知 issue 只作为必要时兜底，不代表业务已经采用。

## 升级变更分区

业务 agent 升级完成后向业务负责人汇报时，优先按下列分区整理摘要（与 GitHub Release「本版本主要变化」同源，由发版流水线从上一 tag 到本 tag 的 commit subject 自动汇总；无条目写「无」，无破坏性声明写「未声明破坏性变更」）：

### 新增能力

- 无

### 完善与修复

- chore: 源码仓与资料包从 brick-next 更名为 buck (#61)
- fix: 把 consume-smoke 从 tag 发包成功口径拆开并对公网延迟重试 (#59)
- docs: skill 对齐发版成功口径与资料包 zip (#57)

### 业务侧适配

- 未声明破坏性变更

## GitHub Release 与 artifact 下载剧本

人工要求升级时，先读取 `GET /repos/wu9007/buck/releases/tags/:tag_name`，不要先猜共享目录路径。推荐认证方式：

```bash
curl --header "Authorization: Bearer: <token>"   "https://github.com/wu9007/buck/repos/wu9007/buck/releases/tags/:tag_name"

curl --header "Authorization: Bearer <token>"   "https://github.com/wu9007/buck/repos/wu9007/buck/releases/tags/:tag_name"
```

从 Release description 记录 pipeline、`release_publish` job、artifact 名称和下载入口后，只有在业务负责人明确授权时，才继续调用 `GET /repos/wu9007/buck/actions/runs/:run_id/artifacts` 或 Release 中的 artifact 直链下载资料包。

```bash
curl --header "Authorization: Bearer: <token>"   --location   "https://github.com/wu9007/buck/repos/wu9007/buck/actions/runs/:run_id/artifacts"   --output buck-2.0.0-11.zip
unzip buck-2.0.0-11.zip
```

下载后必须先把 `build/release/buck-2.0.0-11/` 回填到业务仓库 `docs/buck/2.0.0-11/`，同步 `AGENTS.md` / `README.ai.md`，提交后再开始业务开发。如果 tag 存在但没有对应 GitHub Release 记录，停止升级并回流 `buck` issue。

## 兼容性影响

- 未在本版本关联 MR 或 issue 关闭证据中声明破坏性变更时，按兼容修复、文档增强、规则增强或资料包增强处理。
- 如本版本涉及 Maven 坐标、npm package/export、BOM constraints、starter 默认装配、contract、manifest、权限、菜单或数据库迁移变化，以对应 MR、issue 关闭证据和 GitHub Release 中的明确记录为准。
- 业务仓库不得混用不同 Buck 版本的 BOM、Maven 依赖、npm 依赖和资料包。

## OpenAPI 认证模型核对

- 从 Buck 1.0.0-77 起，HMAC-SM3 不再作为 OAuth2 之外的 OpenAPI 直连认证路径。
- `/openapi/**` 机器访问认证主线是 OAuth2 `client_credentials` 获取 Bearer token；scope/action 授权来自 OAuth2 token 上下文。
- 需要防重放、防篡改时，HMAC-SM3 只能作为 Bearer 后置完整性扩展，通过 `OpenApiHmacIntegrityCredentialProvider`、`OpenApiHmacIntegrityValidator` 和 `OpenApiHmacNonceStore` 接入。
- 业务仓库如果曾按旧资料包实现 HMAC 直连认证，应删除该调用路径，改为 OAuth2 client credentials；确有完整性需求时再补 HMAC integrity。

## 业务升级动作

1. 先读取 `GET /repos/wu9007/buck/releases/tags/:tag_name`，确认 GitHub Release 中的 pipeline、`release_publish` job、artifact 名称和下载入口。
2. 如业务负责人明确授权下载 artifact，再通过 `GET /repos/wu9007/buck/actions/runs/:run_id/artifacts` 或 Release 中的 artifact 直链下载资料包。
3. 将解压得到的 `build/release/buck-2.0.0-11/` 回填到业务仓库 `docs/buck/2.0.0-11/`。
4. 将后端 `io.github.wu9007:buck-bom` 和 Buck 后端依赖更新到 `2.0.0-11`。
5. 将前端 npm `@wildbuck/*` 依赖更新到 `2.0.0-11`。
6. 同步业务仓库 `AGENTS.md`、`README.ai.md` 和 `docs/business/module-adoption-decision.md` 中的 Buck 版本。
7. 任意 AI 工具开工前，确认当前会话已使用或已安装资料包中的 `agent-skills/buck-business-agent/`。
8. 运行业务仓库约定的后端、前端、规则脚本和 CI 检查。
9. 升级验证通过后，向业务负责人输出升级变更摘要（来源版本 → 2.0.0-11、新增能力、完善/修复、业务侧适配、证据入口），再在 `buck` 创建 `Buck 采用反馈：<business-code> 已采用 2.0.0-11`。

## 需要核对的版本表面

- Maven 坐标和 `buck-bom` constraints。
- npm package 和 `exports`。
- `buck-starter-application` 默认装配。
- contract、manifest、权限、菜单、queryCode、optionCode 和数据库迁移。
- release bundle 的 `skill-release-coverage-matrix.md`、`business-context-budget.md`、`rules/`、`templates/` 和 `agent-skills/`（兼容期内仍双写 `codex-skills/`）。
