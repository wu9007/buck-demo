# IAM AI 上下文

## 职责

本地身份主数据：主体、员工、组织、角色、功能点、权限、菜单、会话运维。登录 HTTP 归 `core:authentication`；本模块只提供 `UserDetailsService` 和密码生命周期适配。

## 不负责

- OAuth client / Scope / 应用密钥（`modules:application-center`）
- 身份源 / 同步 / 关联（`modules:identity-federation`，只提供目录端口）
- 密码策略与登录安全配置（`modules:security-setting`）
- 任意新建/删除功能点（功能点由 `FunctionCatalogContributor` 注册）

## 采用时机

业务需要内置员工/组织/角色/菜单/会话治理，或由本应用承载用户名密码账号。

## 禁止平行

- 不手写 SQL / JDBC，不改 generated，不引入兄弟模块或 `core.*.spring.*`
- 不恢复 `permission_codes`、`role_menu` 或账号直接权限
- 不把应用接入、OpenAPI 策略塞进 IAM
- 业务仓不写 IAM 初始化 SQL/runner；只配 `brick.iam.bootstrap.*`

## 关键规则

- 授权链：`principal_account -> principal_role -> role -> role_permission -> permission`
- 菜单可见性由权限反推功能点；业务页菜单必须绑功能点
- 可登录主体必须绑员工档案
- 角色互斥（SoD）拦截新分配，不自动摘除已有双持
- 管理员重置密码走主体切片 + 全局初始密码 / `ADMIN_RESET`；强制下线走 session 切片
- `IamSetupService` 的改密辅助只给样例/测试，不是正式业务接口
- AI 写工具改员工/角色/会话，执行门在 `core:ai-agent`

## 联邦

只实现 `IamDirectoryEmployeePort` / `IamDirectoryOrganizationPort`。禁止与 `modules:identity-federation` 互相 compile。

## 安全编辑区

- 可改契约与人工实现；改契约后运行 `npm run generate`
- 不改 generated，不写 SQL/JDBC，不加租户/平台端，不引入兄弟模块

## 验证

```bash
./gradlew --no-daemon --max-workers=1 :modules:iam:backend:test
```
