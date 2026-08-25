# Notification Setting AI Context

`modules:notification-setting` 是正式通知提供方配置模块。

## 当前职责

- 管理 `EMAIL` 通道当前生效的 `smtp-mail` provider 配置
- 提供配置查询、更新和前端治理页面
- 通过正式模块向 `core:notification-mail` 提供 SMTP 配置快照
- 对敏感字段做存储加密，不回传密码明文
- 停用正式 EMAIL 通道前，会通过 `core` SPI 拦截仍被正式能力占用的场景，避免留下静默失效配置
- `POST /notification-setting/email-smtp/test-send`：用**已保存且启用**的正式配置走 `BrickNotificationService` 测试发送
- 配置审计记录 `passwordChange`：`UNCHANGED | SET | ROTATED | CLEARED`；测试发送审计 `EMAIL_SMTP_TEST_SEND`（收件域掩码，无密码/正文）

## 明确不负责

- 用户正式邮箱、手机号等主数据
- MFA 是否开启、默认模式、冻结和密码策略
- 验证壳临时配置或调试 provider
- 短信或其他通知通道
- 多版本密钥库、密码机/HSM、跨通道密钥编排

## 边界

- `modules:iam` 继续负责当前主体正式邮箱主数据和 `BrickMfaVerificationTargetResolver`
- `modules:security-setting` 继续只负责安全策略
- `core:notification-mail` 继续是正式 `smtp-mail` provider；本模块只提供配置来源
- `validation/*` 只装配和验证，不承载正式 provider/config 语义
- 测试发送不得在请求中携带 password 覆盖；必须证明正式存储凭据可用
- 日志与审计禁止密码、完整邮件正文；测试发送审计只保留收件域掩码（`***@domain`）
