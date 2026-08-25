---
name: Buck 发布兜底通知
about: 必要时向业务仓发送发布兜底通知
labels: 发布
---

# Buck 发布兜底通知

用于 Buck 维护侧在必要时向已登记业务系统补发版本通知。GitHub Releases 是 Buck 默认发布日志和 release index；逐业务仓库发布通知 Issue 只作为兜底方式。通知不代表业务必须升级。

适用场景：

- 高风险安全修复需要主动提醒业务负责人。
- 业务负责人明确要求在业务仓库留发布通知 Issue。
- 业务仓库暂时无法访问或读取 `buck` GitHub Release。

## 发布信息

- Buck 版本：
- Git tag：
- 发布流水线：
- `release_publish` job：
- release artifact：

## 本版本主要变化

1.
2.
3.

## 是否建议升级

说明是否建议升级，以及业务负责人决定是否升级。

## 不升级影响

说明停留在当前版本会缺少哪些修复、资料包、规则或能力。

## 业务端升级步骤

- 提交 `docs/buck/<version>/`。
- 更新 Maven BOM 和后端 Buck 依赖。
- 更新 npm `@wildbuck/*` 依赖。
- 同步 `AGENTS.md`、`README.ai.md` 和业务文档。
- 运行后端、前端、规则脚本和 CI 检查。

## 采用反馈要求

业务升级验证通过后，在 `buck` 创建 `Buck 采用反馈：<business-code> 已采用 <brick-version>` issue，写明业务提交号、资料包路径、依赖版本和验证命令。

## 建议标签 / Milestone

- 类型：`type:release`
- 范围：`scope:release-bundle` / `scope:business-agent`
- 优先级：`priority:`
- Milestone：业务采用窗口或 Buck 发布窗口
