# 身份联邦 AI 上下文（modules:identity-federation）

## 职责

可选业务模块：**外部身份联邦与目录供给**（实现已在本模块，非 IAM 过渡壳）。

切片：

| 切片 | 职责 |
| --- | --- |
| authsource | 身份源主数据、试连、联邦 SPI（**不含**登录入口开关） |
| identitysync | 通讯录同步：拉取 → 暂存 → 策略写主数据；同步开关 `sync_policy.enabled` |
| identitylink | 暂存与员工关联（匹配键仅 API 参数，不进身份源表） |

**不依赖** `modules:iam`（兄弟模块禁止）。主数据经 `core:api` 目录端口；IAM 实现端口。

## 装配

- 仅本地密码：不装本模块
- 联邦/目录：装本模块 + IAM + core oauth2
- validation/security-console：双装

## 边界

- API：`/identity-federation/**`
- 权限：`identity-federation:*`
- 表：`brick_idf_*`（Flyway 归属本模块）
- 登录匹配：仅 `binding.external_subject`；**不**持久化 `account_linking_*`
- **登录入口**：`modules:security-setting` 白名单 `federated_login_source_keys`（`BrickFederatedLoginAllowlist` SPI）
- **同步开关**：仅 `sync_policy.enabled`；与登录入口无关
- **同步时机**：`scheduleMode=MANUAL|INTERVAL` + `scheduleIntervalMinutes`（15/30/60/360/1440）；`IdentitySyncScheduleRunner` 每 60s tick 到期则自动预览并确认应用
- 身份源 API 字段 `loginEntryEnabled` 为只读投影（读白名单），非本表列
- **回调公网基址** `callbackPublicBaseUrl` 在身份源表单维护；OAuth2 回调 = `{基址}/brick/auth/callback/oauth2/{sourceKey}`，CAS 回调 = `{基址}/brick/auth/callback/cas/{sourceKey}`
- **类型模型**：协议族（OAUTH2 / CAS）→ 预设（DINGTALK / GITHUB / HAINAN）→ 实例。禁止厂商一等类型。CAS 配置在 `brick_idf_source_cas`
- 无兼容双注册
- `maturity: released-candidate`：契约/API 可能演进，生产默认等 `released`

## 晋级 released（#534）

本单不改成熟度。翻 `released` 前须同时满足：契约无未说明 breaking；validation 覆盖身份源/同步/关联 FlowTest；资料包/采用卡可生产装配；`module-maturity` 纳入强制采用面；CAS（#530/#531/#532）合入或明确不阻塞。未满足前生产默认等 `released`。晋级不得把安全维升为 implemented。

详细边界见 `docs/architecture/decisions/0003-identity-federation-module.md`。
