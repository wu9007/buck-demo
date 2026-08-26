---
name: Buck 采用反馈
about: 业务仓已采用某 Buck 版本的可验证反馈
labels: 发布
---

# Buck 采用反馈

标题建议：`Buck 采用反馈：<business-code> 已采用 <brick-version>`

用于业务系统完成 Buck 升级、提交资料包和依赖版本，并验证通过后，申请 Buck 维护侧更新 `business-adoption-registry.json`。

## 业务系统

- 业务系统编码：
- 业务仓库：
- 默认分支：

## 已采用 Buck 版本

- Buck 版本：
- 后端 BOM 版本：
- 前端 `@wildbuck/*` 版本：

## 业务提交号

- 采用提交：
- MR / pipeline：

## 发布资料包路径

- `docs/buck/<version>/`：
- 是否清理旧资料包：

## Maven / npm 依赖版本

- Maven BOM：
- Buck 后端依赖：
- npm `@wildbuck/*`：

## 验证命令和结果

- 后端检查：
- 前端检查：
- 业务规则检查：
- CI pipeline：

## 遗留问题

说明暂不处理的问题、风险和后续 issue。

## 登记诉求

请 Buck 维护侧根据本 issue 更新 `business-adoption-registry.json`。不从 GitHub Release 或发布通知推断采用，只根据本采用反馈或可验证业务仓库状态更新登记。

## 建议标签 / Milestone

- 类型：`type:adoption`
- 范围：`scope:business-agent` / `scope:release-bundle`
- 优先级：`priority:`
- Milestone：`buck v<version>`
