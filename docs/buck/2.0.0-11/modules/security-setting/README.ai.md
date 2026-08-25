# 安全设置 AI 上下文

## 职责

可配置安全策略：登录安全、密码策略、弱密码库、MFA 策略、传输安全、会话令牌寿命。运行时策略通过 provider 交给 `core:authentication` / `core:transport`。

## 不负责

- 登录过滤器 / 控制器（`core:authentication`）
- 密码哈希（`core:cipher`）
- 身份源（`modules:identity-federation`）
- 使用事件开关页面（`core:usage-event` + client-meta）
- 外部短信真实通道

## 采用时机

业务需要运营可改的登录冻结、验证码、MFA、密码生命周期或传输摘要策略。

## 禁止平行

- 不在 IAM 员工页重复采集初始口令或生命周期开关
- 不把认证过滤器放到本模块
- 不读历史空表列 `usage_event_enabled`
- 工具必须调本模块 service，不在 `modules:ai-assistant` 或验证壳实现安全规则

## 关键规则

- `SecuritySettingAccountSecurityPolicyProvider` / `SecuritySettingPasswordPolicyProvider` / `SecuritySettingTransportSecuritySettingProvider` 把库配置转成 core 运行时
- `brick.transport.*` 只作无库配置时的 bootstrap
- `brick.security.token.base64-secret` 仍是部署密钥
- MFA 当前为短信/邮箱验证码；`MFA=EMAIL` 启用时阻止停用 EMAIL 通道

## 安全编辑区

可改契约与人工实现；改契约后 `npm run generate`。不写 SQL/JDBC，不加租户/平台端。
