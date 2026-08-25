# Buck 前端壳示例

使用 Buck 2.0.0-11 时，前端从 `@wildbuck/core-api-frontend`、`@wildbuck/core-authentication-frontend`、`@wildbuck/core-authorization-frontend`、`@wildbuck/core-transport-frontend`、`@wildbuck/core-client-meta-frontend`、`@wildbuck/core-query-frontend`、`@wildbuck/core-option-frontend`、`@wildbuck/core-usage-event-frontend`、`@wildbuck/core-i18n-frontend` 和 `@wildbuck/core-ui-frontend` 起步。

## 关键规则

- HTTP 请求统一走 `configureHttp` 和 `request<T>()`。
- HTTP 初始化后读取 `/brick/client-meta`，用 `@wildbuck/core-client-meta-frontend` 和各 core 前端包 bootstrap 公开运行时配置；产品使用事件不要在业务壳重复维护 `enabled/appCode/endpoint`。
- Vite 代理必须包含 `/transport/**` 和 `/brick/**` 固定端点；业务 API 通过 `/api/**` rewrite 到后端根路径时，业务代码调用 `request('/face-archives')`，后端 Controller 映射 `/face-archives`，不要在 Controller 上再写 `/api`。
- 启动前端调试前必须先启动真实后端，并确认 `BUSINESS_API_BASE_URL` 或 `127.0.0.1:8080` 可访问；不要在前端示例中构造 mock 菜单、mock 权限或 mock 业务数据。
- 治理页面按需装配 `@wildbuck/module-*-frontend/page-registry`。
- IAM 页面装配后可调用 `validateIamPageRegistry()` 检查路由、loader 和权限。
- 页面组件使用 Element Plus、`BrickConsoleShell`、`BrickUserMenu`、`BrickAppearanceSettingsDialog`、`BrickAppearanceSwitcher` 和 `--console-*` token；标准个性化入口是头像下拉里的“个性化设置”（主题/字号/密度/登录后自动全屏/语言）。
- 顶部栏只保留全局操作和当前主体头像下拉，不显示系统信息、环境说明、当前菜单标题、菜单分组或页面说明；系统身份放侧栏品牌区，菜单搜索放侧栏菜单上方，编辑详情侧边抽屉优先用 `BrickConsoleDrawer`。
- 默认主题建议使用 `blue` 浅色主题；`night` 才是全暗主题，`green` / `orange` / `guard` 是深色侧栏加浅色内容区的品牌主题。
- 跟随系统时：`system` 只是偏好值；用 `createBrickConsoleAppearanceRuntime()` 得到 `resolvedTheme`，根节点 `data-theme` 与 Shell `:theme` 只绑 `resolvedTheme`，`:theme-preference` 绑偏好（可为 `system`）。禁止 `data-theme="system"`。
- 侧栏整体折叠和菜单分组折叠都通过 `BrickConsoleShell`；分组折叠使用 `v-model:sidebar-collapsed-group-keys`、`sidebar-group-collapsible`、分组 `defaultCollapsed` 和 `collapsible: false`。菜单快速检索用 `sidebar-searchable`；额外筛选才用 `sidebar-nav-before`。侧栏菜单图标优先菜单上传 `iconUrl`，线图标仅兜底；品牌区用 `brand-mark` / slot，不复制 `BrickConsoleSidebar`。
- 顶部栏全局动作通过 `topbar-actions` 提供，建议顺序为刷新、菜单引导、通知；页面向导具体步骤由业务侧实现，但必须使用稳定 `data-guide-id` 和 Buck 统一向导规范。
- 页面列表筛选、分页和排序请求使用 `@wildbuck/core-query-frontend` 构造 `QueryCriteria`；后端仍必须用 `BrickQueryDefinition` 校验字段、操作符和分页上限。
- 标准筛选工具条从 `@wildbuck/core-ui-frontend/patterns` 引入 `BrickFilterToolbar`；`shell` 只承载应用壳、侧栏、顶部栏、抽屉和导航辅助。筛选动作区可以直接嵌入 `BrickActionBar`，toolbar 会移除底部动作区语义下的顶部留白，业务页面不要再写局部 padding 覆盖。
- `BrickFilterToolbar` 内每个筛选字段必须有中文 placeholder、可见 label 或明确 `aria-label`；中文业务后台必须在前端入口把 Element Plus locale 配为 `zh-cn`，不要依赖 Element Plus 默认英文文案。
- 下拉、多选和标签的选项来源走后端 `core:option`，前端使用 `@wildbuck/core-option-frontend` 加载；不要写静态 `<el-option>` 或本地选项数组。

## 文件

- `src/pages/FaceArchiveList.vue`：列表页、筛选条、表格、分页和状态标签示例。
