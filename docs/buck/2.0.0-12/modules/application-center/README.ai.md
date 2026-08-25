# 应用中心 AI 上下文

## 职责

Buck 应用中心：应用元数据、OAuth 客户端、密钥、重定向 URI、Scope 授权和调用记录。依赖 `core:oauth2` / `core:openapi` SPI，不实现协议执行。

## 不负责

- 身份源 / 同步 / 关联（`modules:identity-federation`）
- IAM 主体、角色、功能点、菜单
- OAuth2/OIDC 回调控制器
- 旧 `client-app` 混合模型

## 采用时机

治理第三方应用、OAuth client / Scope，或需要 OpenAPI HMAC 签名密钥 SPI。

## 禁止平行

- 不直接依赖 `modules:iam`，不反查权限主数据名称
- 不把本模块当成所有业务组织接入的唯一 client 源；业务组织接入应实现 `core:oauth2` / `core:openapi` SPI
- 重复 `clientId` 由 `core:openapi` 失败，不按优先级猜测
- 审计走 `ApplicationCenterAuditRecorder`，事件不得含密钥明文

## 关键规则

- 授权主键是 `scope`；`method + path` 只用于定位接口
- 写操作事件：`APPLICATION_CREATE/UPDATE/DELETE`、`APPLICATION_SECRET_ROTATE`、`APPLICATION_AUTHORIZATION_ASSIGN`
- P0 不做 SCIM、用户门户、厂商特定 SSO 回调

## 安全编辑区

可改契约与人工实现；改契约后 `npm run generate`。不改 generated，不把协议执行埋进本模块。
