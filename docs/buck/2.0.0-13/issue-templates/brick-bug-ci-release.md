---
name: Bug / CI / 发布失败
about: 已发布行为缺陷、GitHub Actions、Packages 或发版失败
labels: 缺陷
---

# Bug / CI / 发布失败

用于提交已发布行为缺陷、GitHub Actions、Runner、GitHub Packages、release artifact 或 `release_publish` 问题。

## 现象

说明用户可见现象或流水线失败点。

## 复现步骤

1.
2.
3.

## 日志或错误

粘贴关键日志、错误码、job URL、commit SHA 或 tag。

## 影响范围

- 是否影响安全、发布、业务采用或已登记业务系统：
- 影响的 core/module/tools/release bundle：

## 初步归属

- `type:bug` / `type:ci` / `type:release`
- 建议 owner：
- 是否需要回滚或重新发 tag：

## 质量效用树

- 可靠性：
- 安全性：
- 可维护性：
- 兼容性：
- 业务影响：

## 修复验收

- 聚焦复现测试：
- `npm run check`：
- MR pipeline：
- 如涉及 tag：`release_publish`：

## 建议标签 / Milestone

- 类型：`type:bug` / `type:ci` / `type:release`
- 范围：`scope:`
- 优先级：`priority:`
- Milestone：`buck v<version>`
