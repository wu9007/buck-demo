# login-brand AI 上下文

`modules:login-brand` 是**正式功能点模块**（`released-candidate`）：管理登录页系统名称、描述、Logo、背景与布局位置。

## 职责

- 管理端：登录外观配置页（查看/保存、图片上传、实时预览、模板/重置）
- 持久化：`brick_login_brand_setting` 单例配置
- 登录按钮主色：`primaryColor` 有值=自定义；空/null=跟随控制台个性化主题主色（不新增列）
- 公开呈现：`BrickClientMetaContributor` → `capabilities.loginBrand` → IAM 登录页消费
- 公开资产：`GET /login-brand/public/logo|background`（仅当前启用配置引用的资源）
- 审计：`LoginBrandAuditRecorder` 发布 `LOGIN_BRAND_UPDATE` / `LOGIN_BRAND_RESET`
- 使用事件：前端 `usage-events.js` 矩阵（页面/保存/模板/重置）
- **业务采用文档**：`docs/architecture/delivery/business-module-adoption-reference.md`（登录外观与登录页版本）；版本身份见 `business-ci-cd.md` / `core/client-meta/README.ai.md`

## 不负责

- 不在 `modules:iam` 管理域塞登录页合成（IAM manifest 禁止）
- 不做框架多租户品牌表
- 不开放任意 CSS/像素拖拽；位置为受控预设
- 不把正式配置主数据沉到 `validation/*`
- 不把应用版本号写进品牌表（版本来自 CI 注入的 jar 身份 / client-meta）

## 权限与菜单

- `login-brand:appearance:view` / `login-brand:appearance:manage`
- 菜单：系统外观 / 登录外观 → `/login-brand/appearance`
- Function catalog + menu bootstrap 由 `LoginBrandFunctionCatalogContributor` 注册；IAM bootstrap 管理员角色自动吸收目录权限

## 管理端生产 UX（调研驱动）

- 一键布局：页面顶部卡片区（非文案空提示）
- 实时预览：宽屏/窄屏仅改画布宽度示意，不保存两套配置
- 脏表单：未保存提示、`beforeunload`、放弃更改
- 图片预览：走 `@wildbuck/core-ui-frontend/fields` 的 local blob / public URL 协议，禁止 contentUrl 绑 img
- 表单布局：`brick-detail-form`（settings-page.css）
- 浏览器标签页标题/图标与系统名称、Logo 一致；页脚版权、恢复默认

## 迁移注意

- 迁移仅由 `contract/persistence.yaml` 生成（`npm run generate`），不要手写 SQL。
- 基线 `1.0.0-50.001` + 增量 `1.0.0-50.002`（footer/title/template 列）均为生成产物。

## 验证

```bash
./gradlew :modules:login-brand:backend:test --console=plain
npm --workspace @wildbuck/module-login-brand-frontend test
```
