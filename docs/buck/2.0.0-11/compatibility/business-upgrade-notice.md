# Buck 2.0.0-11 GitHub Release 与业务升级评估

本文件用于说明 Buck 2.0.0-11 发布后的中心化发布日志和业务升级评估方式。GitHub Releases 是 Buck 默认发布日志和 release index；逐业务仓库发布通知 Issue 只作为必要时的兜底方式。它不是强制升级命令，业务系统应根据自身版本、排期和风险自主判断是否升级。

## GitHub Release

Buck 2.0.0-11 发布成功后，`release_publish` job 会创建或更新对应 GitHub Release。Release 至少包含 tag、pipeline、`release_publish` job、release artifact、主要变化、升级建议、不升级影响、业务侧升级步骤和采用反馈入口。

GitHub Release 只表示新版本可用，不表示业务已经采用。业务采用仍以业务侧主动提交的“Buck 采用反馈”Issue 或可验证业务仓库状态为准。

业务负责人要求升级时，先读 GitHub Release，不要先猜共享目录路径。推荐先调用：

```bash
curl --header "Authorization: Bearer: <token>"   "https://github.com/wu9007/buck/repos/wu9007/buck/releases/tags/:tag_name"

curl --header "Authorization: Bearer <token>"   "https://github.com/wu9007/buck/repos/wu9007/buck/releases/tags/:tag_name"
```

如果 tag 存在但没有对应 GitHub Release 记录，不要把 tag 名字直接当发布证据；停止升级，回流 `buck` issue，等待维护侧补齐 Release 或 release-bundle 证据。

## 共享发布区

Buck 2.0.0-11 的共享发布区由GitHub tag 流水线 `release_publish` job 生成，artifact 名称为：

```text
buck-v2.0.0-11
```

artifact 内包含：

```text
build/release/buck-2.0.0-11/
```

业务系统需要采用本版本时，先从共享发布区获取完整资料包，再提交到业务仓库：

```text
docs/buck/2.0.0-11/
```

业务开发 agent 后续只以业务仓库内的资料包为权威来源；不要直接把共享发布区 artifact 当成开发时的第一阅读来源。若业务负责人明确授权下载 artifact，先从 Release description 记录 `release_publish` job 和 artifact 下载入口，再调用：

```bash
curl --header "Authorization: Bearer: <token>"   --location   "https://github.com/wu9007/buck/repos/wu9007/buck/actions/runs/:run_id/artifacts"   --output buck-2.0.0-11.zip
unzip buck-2.0.0-11.zip
```

下载后必须先把解压得到的 `build/release/buck-2.0.0-11/` 回填到业务仓库 `docs/buck/2.0.0-11/` 后再开始业务开发。

## 业务系统自主判断是否升级

- Buck 维护方发布修复版本后，负责把资料包放入共享发布区，并通过 GitHub Release 沉淀中心化发布日志。
- Buck 维护方默认通过 GitHub Release 发布版本日志；逐业务仓库发布通知 Issue 只作为必要时的兜底方式。
- 业务系统是否拉取最新依赖包和资料包，由业务负责人或业务开发负责人决定。
- 业务系统不希望升级时，可以继续使用已采用的 Buck 版本；业务 agent 不应私自替换依赖版本或资料包目录。
- 业务系统决定升级后，才更新 Maven BOM、npm 依赖、`docs/buck/2.0.0-11/`、`AGENTS.md` 和 `README.ai.md`。
- 业务侧 agent skill 必须从 `docs/buck/2.0.0-11/agent-skills/buck-business-agent/` 安装或确认已使用；无法安装时停止实现。本资料包不包含 `buck-next-maintainer`，业务 agent 不读取或修改 `buck` 工作区。
- 业务系统升级并验证通过后，由业务侧主动在 `buck` 创建“Buck 采用反馈”Issue，写明业务系统、实际采用版本、业务提交号、资料包路径和验证命令。Buck 维护侧不从 GitHub Release 或发布通知推断采用版本。
- 升级完成对业务负责人的标准输出不只是版本号和验证通过：业务 agent 必须在创建采用反馈的同时或之前，汇报来源版本 → 目标版本、新增能力、完善/修复、业务侧是否需要适配（无则写「未声明破坏性变更」）以及 GitHub Release / `compatibility/migration-notes.md` 等证据入口。
- 业务侧 Issue、Labels、Milestone、GitHub Release、兜底通知和采用反馈协作规则见 `docs/buck/2.0.0-11/business-issue-collaboration.md`。

## GitHub Release 和兜底通知登记

Buck 维护方通过 `docs/architecture/delivery/business-adoption-registry.json` 记录已知业务系统、仓库地址、当前采用 Buck 版本、资料包路径、Issue 地址和升级策略。新增业务系统接入 Buck 后，应补充该登记表。

发布后协作顺序：

1. 查看 `business-adoption-registry.json` 的业务系统列表。
2. 确认 tag 流水线的 `release_publish` job 已创建或更新 GitHub Release，Release 中写明 Buck 版本、共享发布区位置、主要修复、是否建议业务端主动升级，以及不升级时的影响。
3. 只有高风险安全修复、业务负责人明确要求、或业务仓库无法读取 GitHub Release 时，才通过登记的 `issueTracker` 或约定渠道创建中文兜底通知。
4. 业务端决定升级并完成仓库内资料包更新、依赖更新和验证后，由业务侧提交采用反馈；Buck 维护侧根据采用反馈或业务仓库真实证据更新登记表。

## 业务侧采用反馈模板

业务仓库完成升级并验证通过后，在 `buck` 创建 Issue：

```text
Buck 采用反馈：<business-code> 已采用 2.0.0-11
```

正文至少包含：

```md
Issue 类型：业务采用反馈

业务系统：<business-code>
Buck 版本：2.0.0-11
业务仓库：<business-repository-url>
采用提交：<business-commit-sha>
资料包路径：docs/buck/2.0.0-11/

## 已更新内容

- 后端 Maven BOM 和 Buck 后端依赖已更新到 2.0.0-11。
- 前端 @wildbuck/* 依赖已更新到 2.0.0-11。
- AGENTS.md、README.ai.md 和 docs/business/module-adoption-decision.md 已同步 Buck 版本。

## 验证结果

- <business backend check command>：通过。
- <business frontend check command>：通过。
- node docs/buck/2.0.0-11/rules/check-business-structure.mjs .：通过。

## 登记诉求

请 Buck 维护侧将 business-adoption-registry.json 中 <business-code> 的 brickVersion 更新为 2.0.0-11。
```

## 可直接发送的 Issue 正文

```md
Buck 2.0.0-11 已发布。

默认发布日志：brick-next GitHub Release。

共享发布区：GitHub tag 流水线 release_publish job artifact，artifact 名称 buck-v2.0.0-11，目录 build/release/buck-2.0.0-11/。

本通知不强制业务系统升级。请业务负责人根据当前 Buck 采用版本、修复内容和业务排期自主判断是否拉取最新依赖包和资料包。

如果决定升级，请在业务仓库完成：
- 先读取 `GET /repos/wu9007/buck/releases/tags/:tag_name`，确认 GitHub Release 中记录的 pipeline、`release_publish` job 和 artifact 下载入口。
- 只有在业务负责人明确授权后，才通过 `GET /repos/wu9007/buck/actions/runs/:run_id/artifacts` 或 Release 中的 artifact 直链下载资料包。
- 将解压得到的 `build/release/buck-2.0.0-11/` 回填到业务仓库 `docs/buck/2.0.0-11/` 后再开始业务开发。
- 把完整资料包提交到 docs/buck/2.0.0-11/。
- 后端 BOM 和 Buck Maven 依赖使用 2.0.0-11。
- 前端 @wildbuck/* 依赖使用 2.0.0-11。
- 同步 AGENTS.md、README.ai.md 和 docs/business/module-adoption-decision.md 中的 Buck 版本。
- 任意 AI 开发工具开工前，必须从 docs/buck/2.0.0-11/agent-skills/buck-business-agent/ 更新或确认业务侧安装副本（可用 `npm run skills:install` 装到 `~/.buck/skills` 并镜像到工具目录）；不要安装 buck-next-maintainer，也不要读取或修改 brick-next 工作区。无法安装时停止实现并反馈阻断原因。
- 运行本业务仓库约定的后端、前端和总检查命令。
- 升级验证通过后，在 brick-next 创建“Buck 采用反馈：<business-code> 已采用 2.0.0-11”Issue，主动告知 Buck 维护侧更新业务采用登记。
- 同时向业务负责人输出升级变更摘要：来源版本 → 2.0.0-11、新增能力、完善/修复、业务侧适配（无则「未声明破坏性变更」）、证据入口（本 Release、migration-notes）。
- Issue、Labels、Milestone、GitHub Release、兜底通知和采用反馈协作按 docs/buck/2.0.0-11/business-issue-collaboration.md 执行。
- 如果 tag 存在但没有对应 GitHub Release 记录，停止升级并回流 `buck` issue，不要继续猜共享目录或只凭 tag 名采用。

业务开发 agent 仍以业务仓库内 docs/buck/<version>/ 为唯一权威资料源；不要直接读取 brick-next CI artifact 开发。

不要从 GitHub Release、发布公告、发布通知或发布流水线成功推断业务已经采用。
```
