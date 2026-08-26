---
name: 业务侧反馈到 Buck
about: 业务仓反馈需要回流到框架的能力或缺口
labels: 增强
---

# 业务侧反馈到 Buck

用于业务侧把 Buck 已发布能力 bug、资料包缺口、通用规则缺口或可复用能力缺失反馈到 `buck`。

## 业务系统

- 业务系统编码：
- 业务仓库：
- 当前采用 Buck 版本：
- 资料包路径：`docs/buck/<version>/`

## 当前采用 Buck 版本

填写 Maven BOM、npm `@wildbuck/*` 和资料包版本。

## 触发场景

说明业务动作、页面、接口、CI/CD 或发布流程。

## Buck 通用归属判断

- 是否属于 Buck 通用能力：是 / 否。
- 如果只是业务私有需求，应留在业务仓库。
- 如果是 Buck 通用能力、资料包缺口或业务 agent 规则缺口，说明建议 owner。

## 质量效用树

- 可扩展性：
- 性能：
- 可靠性：
- 易用性：
- 灵活性：
- 可维护性：
- 兼容性：
- 业务影响：

## 业务侧临时处理

说明是否已有 workaround；如有，说明风险和是否希望 Buck 吸收。

## 期望 Buck 行为

说明期望的框架能力、文档、模板、规则或诊断。

## 验证方式

- 业务侧复现命令：
- 业务侧期望验证命令：
- Buck 侧建议验证命令：

## 建议标签 / Milestone

- 类型：`type:bug` / `type:feature` / `type:docs`
- 范围：`scope:`
- 优先级：`priority:`
- Milestone：`buck v<version>`
