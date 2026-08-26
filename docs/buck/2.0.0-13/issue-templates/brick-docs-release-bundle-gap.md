---
name: 文档或 release bundle 缺口
about: 文档、治理规则或发布资料包缺口
labels: 文档
---

# 文档或 release bundle 缺口

用于提交长期文档、发布资料包、业务指南、模板、规则脚本或示例缺口。

## 背景

说明谁在什么场景下读到了不清楚或缺失的内容。

## 缺口位置

- `docs/architecture/*`：
- release bundle：
- templates/rules/examples：
- business-agent skill：

## 期望补充

说明应补充的规则、示例、边界或验证方式。

## 质量效用树

- 可理解性：
- 易用性：
- 可维护性：
- 灵活性：
- 业务影响：

## 影响范围

- 影响的业务系统：
- 是否导致业务 agent 猜测、读源码或自造机制：

## 边界与禁止事项

- 模板不能替代长期架构文档。
- 临时计划和 backlog 不写入 `docs/architecture/*`。
- 业务私有流程不进入 Buck 通用规范。

## 验收标准

- 文档或 release bundle 内容补齐。
- 相关测试或规则脚本能防止再次失联。
- 若影响业务可消费资料包，说明是否需要发版、GitHub Release 和兜底通知。

## 建议标签 / Milestone

- 类型：`type:docs`
- 范围：`scope:docs` / `scope:release-bundle` / `scope:business-agent`
- 优先级：`priority:`
- Milestone：`buck v<version>`
