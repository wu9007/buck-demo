# 业务前端页面模式

本文档是 [business-frontend-ui-reference.md](business-frontend-ui-reference.md) 的细则。主文件保留原则、包入口、壳职责和禁止事项；本文件只写工作台、导航、主题 token、页面模式和字段组件。

## Identity、Authorization 与 Workspace Profile

上层业务常有「一人多岗」：同一登录身份需要在**不同工作台视图**（如登记 / 体检 / 采血）之间切换菜单焦点。必须把三层概念写清，避免顶栏「工位/角色」下拉被操作员当成切换了 IAM 身份。

| 层 | 含义 | 真源与变更方式 |
| --- | --- | --- |
| **Identity** | 登录是谁 | login / logout / access token / 当前主体会话 |
| **Authorization** | 能做什么 | IAM 角色与权限授予；`principal.permissions` / 功能点；后端鉴权 |
| **Workspace Profile**（工作台场景 / 工位视图） | 当前**看**哪一套工作台 UI | **仅 UI**：默认首页、侧栏子集、布局焦点；**不**换 token、**不**调登录接口 |

硬门禁：

1. Workspace Profile 可过滤的菜单 / 路由，必须是 **Authorization 并集的子集**：`visibleRoutes ⊆ routesAllowedBy(principal.permissions)`。
2. **禁止**用 localStorage「角色」或资料包示例暗示「切换角色 = 获得未授权权限」或「隐藏即无权限」。无权限由后端与 IAM 决定；前端软裁只影响导航焦点，不能当安全边界。
3. 文案优先用 **工位视图 / 工作台场景 / Workspace Profile**，避免单独使用「角色切换」与 IAM「角色管理」混淆。若历史 UI 仍写「角色」，产品侧应改为「工位」类措辞。
4. 仅有一个可用 profile，或当前主体权限不足以构成多岗时：隐藏切换器或只读展示当前岗，不要展示假选项。
5. `frontend-minimal` 与发布资料包**不得**把「角色切换」演示成可绕过权限的能力；需要多岗 UI 时必须遵守本节契约，优先使用正式 helper/组件。

### 正式能力（core-ui）

包入口：

- 纯函数：`@wildbuck/core-ui-frontend/workspace-profile` 或 `@wildbuck/core-ui-frontend/shell`
- 组件：`BrickWorkspaceProfileSelect`（`@wildbuck/core-ui-frontend/shell`）

| API | 用途 |
| --- | --- |
| `listAvailableBrickWorkspaceProfiles(profiles, permissions)` | 按 `requiredPermissions` / `anyPermissions` 得到可用工位 |
| `resolveBrickWorkspaceProfileId(profiles, permissions, preferredId)` | 解析当前 id（偏好可用则用之，否则第一个可用） |
| `filterBrickConsoleRoutesByWorkspaceProfile(routes, profile, permissions)` | 先权限门禁再 profile 成员过滤 |
| `filterBrickConsoleNavigationGroupsByWorkspaceProfile(groups, profile, permissions)` | 过滤侧栏分组并去掉空组 |
| `read/writeBrickWorkspaceProfilePreference` | 仅 UI 偏好（`brick-console:workspace-profile`），**不**换 token |
| `BrickWorkspaceProfileSelect` | 顶栏/工具条下拉；`v-model` 为 profileId；`hideWhenSingle` 默认 true |

业务提供 profiles 配置（枚举留在业务仓），形状示例：

```js
const profiles = [
  {
    id: 'phlebotomy',
    title: '采血',
    defaultPath: '/blood/collect',
    routeIds: ['blood.collect', 'blood.queue'],
    anyPermissions: ['blood:collect:view'],
  },
  {
    id: 'exam',
    title: '体检',
    pathPrefixes: ['/blood/exam'],
    requiredPermissions: ['blood:exam:view'],
  },
];

// 1) IAM / 当前主体投影得到有权 navigationGroups 之后：
const activeId = resolveBrickWorkspaceProfileId(
  profiles,
  principal.permissions,
  readBrickWorkspaceProfilePreference(),
);
const profile = findBrickWorkspaceProfile(profiles, activeId);
const focusedGroups = filterBrickConsoleNavigationGroupsByWorkspaceProfile(
  navigationGroups,
  profile,
  principal.permissions,
);

// 2) 顶栏：
// <BrickWorkspaceProfileSelect
//   :profiles="profiles"
//   :permissions="principal.permissions"
//   v-model="activeId"
//   @update:model-value="(id) => writeBrickWorkspaceProfilePreference(id)"
// />
```

配置源（静态 JSON、业务配置 API）由业务仓决定；**不要**在 IAM 角色管理里配置工位视图。权限/菜单真源仍是 IAM；工位只做展示子集。

业务岗位枚举、权限码表留在业务仓；Buck 提供过滤算法与可选切换器。

## 控制台导航与 IAM 菜单边界

`BrickConsoleShell` 的左侧导航来源仍是业务壳传入的 `navigationGroups`，但在 IAM 接入场景里，左侧导航显示层来源于当前主体可见菜单树。正式推荐做法是：先把模块 `brickRoutes` / `page-registry` 作为可执行页面注册边界，再复用 `@wildbuck/core-ui-frontend/shell-navigation` 的 `mergeBrickConsoleRoutesWithMenus()`、`buildBrickConsoleNavigationGroupsFromMenus()`，或 `@wildbuck/module-iam-frontend` 的 `mergeCurrentPrincipalMenusIntoRoutes()`、`buildCurrentPrincipalNavigationGroups()`，把当前主体 `navigationMenus` 投影成侧栏显示分组。

IAM 菜单管理不是运行时页面生成器，但它是正式的运行时导航显示源。它负责治理菜单目录、菜单与功能点绑定、权限授权展示、菜单名称/顺序/图标治理，以及当前主体可见菜单树推导；真正能打开的前端页面仍必须有业务壳或模块 `page-registry` 注册的 route/component。

边界规则：

- 业务页面菜单必须绑定 function point；目录/分组菜单可以不绑定 function point。
- 左侧导航显示层来源于当前主体可见菜单树；同一个菜单在 IAM 中修改名称、顺序、图标后，刷新后应反映到侧栏。
- 静态 route / `page-registry` 仍是执行边界；菜单树只能重排、命名和筛选已注册页面，不能生成不存在的前端页面。
- 当前主体菜单可以用于展示“我被授权了哪些功能”，但没有对应 route/component 的菜单节点只保留治理含义，不参与页面装载。
- 导航分组命名和顺序应与任务路径保持一致。治理后台里，同一组 IAM 管理能力在业务壳、模块 metadata、IAM 菜单 bootstrap 和当前主体导航投影中，应该统一为同一个中文分组名称，例如 `系统管理`。
- 分组内菜单顺序优先按操作路径组织，监控或审计入口放在配置和维护入口之后；如果实际使用频次明显更高，只能在保持同类顺序稳定的前提下整体前移。
- 业务仓应复用 Buck 正式 helper 装配 `navigationGroups`，不要在业务仓库自建菜单同步机制、额外缓存或另一套路由分组协议。

侧栏折叠是 `@wildbuck/core-ui-frontend` 的正式能力：使用 `BrickConsoleShell` 的 `v-model:sidebar-collapsed`、`v-model:sidebar-collapsed-group-keys`、`sidebar-collapsible`、`sidebar-group-collapsible`、`sidebar-searchable` 与 `brand-mark`；完整壳示例见发布资料包 `examples/frontend-shell`。

### 侧栏菜单图标契约

侧栏菜单图标的**正式主源**是 IAM 菜单管理表单上传的图片（`iconResourceId` → 运行时 `iconUrl`），不是 route 里的中文缩写，也不是业务仓自建图标映射表。

渲染优先级（产品契约，不可颠倒）：

1. **菜单上传图** `iconUrl`（来自当前主体菜单投影解析的 `iconResourceId`）
2. **业务组件 icon**（route 上的 Vue 组件 icon，少见）
3. **线图标兜底**（`BrickConsoleNavIcon`：显式 `iconName` / 字符串 `icon`，否则按 route id/path 推断；再不行用通用 `menu` 线图标）

边界规则：

- IAM 菜单管理负责图标上传、名称、顺序和可见性；业务壳只通过 Buck/IAM 正式 helper 把 `navigationMenus` 合并进 `navigationGroups`。
- 字符串字段 `MenuBindingDescriptor.icon` / 菜单 `icon` **不是**自动图标资源；它最多映射为 `iconName` 或线图标名。真正显示上传图依赖 `iconResourceId` 与文件资源解析出的 `iconUrl`。
- `abbr`、`iconText`、`shortTitle`、`collapsedTitle` 可用于搜索、辅助文案或历史兼容，**不再**作为默认折叠态主视觉。
- 业务仓禁止自建侧栏图标同步缓存、平行 URL 协议或绕过菜单管理的硬编码图标清单。
- 正式环境交付验收应基于真实菜单数据（含已上传图标）；仅靠 route `abbr` 的占位视觉不算完成态。

### 折叠交互与壳层 chrome

- 默认折叠控件在侧栏底部：双箭头 + 文案「折叠侧边栏」/「展开侧边栏」，无底板；由 `BrickConsoleSidebarCollapseToggle` 统一实现，不要在 Shell/Sidebar 各写一份。
- 折叠态菜单保留 `title` 作为 tooltip；图标仍遵守上一节优先级，折叠只改变布局密度，不改变导航来源。
- 菜单分组标题默认可点击折叠；需要默认折叠某组时，优先在 `navigationGroups` 分组上设置 `defaultCollapsed: true`，需要受控状态时使用 `v-model:sidebar-collapsed-group-keys`。
- 不允许折叠的固定分组可设置 `collapsible: false`。当前激活路由所在分组会自动展开，避免折叠后隐藏当前页面入口。
- `brand-mark` 控制品牌区折叠态标识；复杂 logo 可用 `sidebar-brand-mark` slot。
- 菜单快速检索使用 `BrickConsoleShell` 的 `sidebar-searchable`。搜索会匹配分组名、菜单标题、路径、`abbr/iconText/shortTitle/collapsedTitle` 以及 route 的 `keywords/searchKeywords`。
- 需要在菜单上方放额外筛选、自定义整体侧栏折叠按钮或图标渲染时，使用 `sidebar-nav-before`、`sidebar-collapse-toggle`、`sidebar-route-icon` slot，不复制或改写 `BrickConsoleSidebar`。
- 右侧上下文面板顶栏（如 AI 助手）必须与主顶栏等高、同底边：使用 `BrickConsoleContextHeader` / `.shell-context-header`（高度 token `--shell-topbar-height`），顶栏图标按钮复用 `.shell-icon-button`。
- 当前主体 `navigationMenus`、菜单 `iconResourceId`/`iconUrl` 与模块 route metadata 共同构成正式导航投影输入；运行时侧栏应复用 Buck helper 完成合并，不要在业务壳手写另一套菜单图标同步逻辑。

### 顶部栏全局动作

业务壳需要展示刷新、菜单引导、通知等全局入口时，使用 `BrickConsoleShell` 的 `topbar-actions` slot。推荐顺序是刷新当前页、菜单引导、通知、当前主体头像下拉。刷新和通知属于业务运行时动作，Buck 不默认绑定业务路由刷新策略或通知中心。

```vue
<template #topbar-actions>
  <el-button text title="刷新当前页" aria-label="刷新当前页" @click="refreshCurrentPage">
    <el-icon aria-hidden="true"><Refresh /></el-icon>
  </el-button>
  <el-button text title="菜单引导" aria-label="菜单引导" @click="openActiveMenuGuide">
    <el-icon aria-hidden="true"><Guide /></el-icon>
  </el-button>
  <el-button text title="通知" aria-label="通知" @click="openNotifications">
    <el-icon aria-hidden="true"><Bell /></el-icon>
  </el-button>
</template>
```

不要在 `topbar-actions` 中直接使用原生 `<button>`、字符图标按钮或仅靠局部 CSS 拼出来的一次性动作区；正式全局动作统一使用 Element Plus 按钮语义和 Buck 顶部栏布局。

顶部栏不展示系统信息、环境说明、菜单搜索、当前菜单标题、菜单分组或页面说明。系统身份放侧栏品牌区，页面标题和说明放页面内容区。

## 登录/传输端点路由

`configureHttp({ baseUrl })` 只影响 `@wildbuck/core-api-frontend` 的 `request()`、生成 SDK 和业务 API 请求，不会改写 `@wildbuck/core-authentication-frontend` 登录链路里的固定公开端点。

采用 IAM 登录页时，业务前端开发和网关至少要转发：

| 路径 | 用途 | 代理规则 |
| --- | --- | --- |
| `GET /transport/meta` | 登录传输保护元数据。 | 原样代理到后端 `/transport/meta`。 |
| `GET /brick/captcha` | 图形验证码 challenge。 | 原样代理到后端 `/brick/captcha`。 |
| `POST /brick/login` | 用户名密码登录。 | 原样代理到后端 `/brick/login`。 |
| `POST /brick/logout` | 登出。 | 原样代理到后端 `/brick/logout`。 |
| `/brick/mfa/**`、`/brick/password/change` | MFA 和强制改密。 | 原样代理到后端同名路径。 |
| `/brick/session/verify-password` | 已登录会话 step-up 密码再确认。 | 原样代理；业务用 `@wildbuck/core-ui-frontend` 的 `BrickStepUpConfirm` + `@wildbuck/core-authentication-frontend` 的 `verifySessionPassword`，禁止自造验密接口。 |
| `/api/**` | 业务 API 或 Buck 模块 API 的业务壳前缀。 | 通常 rewrite 掉 `/api` 后转发到后端。 |

采用默认 `/api` rewrite 时，`/api` 不属于后端 Controller 路径。前端调用 `request('/face-archives')`，浏览器发出 `/api/face-archives`，代理转发给后端 `/face-archives`；后端不要再声明 `@RequestMapping("/api/face-archives")`。

Vite dev proxy 推荐：

```js
server: {
  proxy: {
    '/transport': {
      target: 'http://127.0.0.1:8080',
      changeOrigin: true,
    },
    '/brick': {
      target: 'http://127.0.0.1:8080',
      changeOrigin: true,
    },
    '/api': {
      target: 'http://127.0.0.1:8080',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
    },
  },
}
```

首次启动前至少确认 `GET /transport/meta`、`GET /brick/captcha`、`POST /brick/login` 能从前端 dev server 代理到后端。不要把 `/transport/meta` 错配成 `/api/transport/meta`。

## 模块页面装配

模块页面通过 `page-registry` 暴露组件 loader。业务壳可以按 route id 装载：

```js
import { brickRouteComponentLoaders as iamPages } from '@wildbuck/module-iam-frontend/page-registry';
import { brickRouteComponentLoaders as auditPages } from '@wildbuck/module-audit-frontend/page-registry';
import { brickRouteComponentLoaders as securitySettingPages } from '@wildbuck/module-security-setting-frontend/page-registry';

const pageLoaders = {
  ...iamPages,
  ...auditPages,
  ...securitySettingPages,
};

const component = pageLoaders['iam.roles.list'];
```

正式 route id：

| 模块 | route id |
| --- | --- |
| IAM | `iam.employees.list`、`iam.menus.list`、`iam.organizations.list`、`iam.roles.list`、`iam.sessions.list`（侧栏/权限投影走 `/iam/current-principal/workspace`，无单独「当前主体」管理页） |
| 通知配置 | `notification-setting.email-smtp` |
| 安全设置 | `security-setting.login-security`、`security-setting.password-policy`、`security-setting.transport-security` |
| 审计 | `audit.logs.list` |
| 应用中心 | `application-center.apps` |

业务需求命中员工、组织、角色、菜单、会话、安全策略、审计日志或应用中心治理页面时，前端必须优先装配这些模块页面。命中但不装配时，必须在 `docs/business/module-adoption-decision.md` 说明原因并等待确认。禁止新建同名治理页面来替代已发布模块页面。

安全配置页依赖标准配置页样式来约束 `el-slider` 轨道、端点标记、只读块和暗色主题禁用态。正常通过 `@wildbuck/module-security-setting-frontend` 根入口读取 `brickRoutes`，并通过 `@wildbuck/module-security-setting-frontend/page-registry` 装载页面时，模块包会自动引入这份样式；如果业务壳采用特殊拆包、微前端隔离或按需 CSS 提取导致样式未进入页面，应在前端入口兜底引入：

```js
import '@wildbuck/module-security-setting-frontend/settings-page.css';
```

不要复制模块内部历史 CSS，也不要在业务仓库覆盖 `.setting-form .el-slider`、`.el-slider__marks-text` 等基础选择器来修局部漂移。若业务消费发布包后出现滑动条极短，应升级 `@wildbuck/core-ui-frontend` / 安全模块前端包，而不是在业务侧把 `width` 改回 `100%`。

### IAM/Security/Audit page-registry 接入自检

IAM 包提供 `validateIamPageRegistry()`，业务壳接入 IAM 治理页面后应先跑 route/loader/permission 自检：

```js
import { brickRoutes as iamRoutes } from '@wildbuck/module-iam-frontend';
import {
  brickRouteComponentLoaders as iamPages,
  validateIamPageRegistry,
} from '@wildbuck/module-iam-frontend/page-registry';

const currentPermissions = currentPrincipal.permissions;
const diagnostics = validateIamPageRegistry({
  routes: iamRoutes,
  loaders: iamPages,
  grantedPermissions: currentPermissions,
});

if (!diagnostics.ok) {
  console.warn(diagnostics.messages);
}
```

自检结果用于区分：

- `missingLoaderRouteIds`：业务壳拿到了 route，但没有对应动态组件 loader。
- `orphanLoaderRouteIds`：loader 有入口，但 route metadata 未注册。
- `missingPermissionRouteIds`：当前主体缺少打开治理页面所需权限。

如果自检通过但页面仍打不开，再检查 Vue Router 是否注册了对应 path、`/api` proxy 是否 rewrite、浏览器控制台是否有动态 import 或组件运行时错误。登录后 API smoke check 可覆盖 `/iam/current-principal/workspace`、`/iam/menus/tree`、`/iam/roles/search`、`/iam/employees/search`、`/iam/organizations/tree`。

## 主题 token

主题通过 CSS token 级联，禁止页面写死主题色。引入 `@wildbuck/core-ui-frontend/theme.css`；壳组件从 `@wildbuck/core-ui-frontend/shell` 取 `BrickConsoleShell`、`BrickConsoleDrawer`、`BrickUserMenu`、`BrickAppearanceSettingsDialog`、`BrickAppearanceSwitcher`、`buildBrickConsoleNavigationGroups`；字段从 `fields` 取 `BrickImageUploadField`、`BrickManagedSecretInput`、`BrickReadonlyCopyInput`、`resolveBrickManagedSecretField`；模式从 `patterns` 取 `BrickFilterToolbar` 等。

根容器挂 `data-theme` / `data-density` / `data-font-size`。`data-theme` 取值只能是渲染 token：`blue`、`orange`、`guard`、`green`、`night`。`xlarge` 为适老档。

主题语义按 `createBrickConsoleThemePresets()`：`blue` 浅色默认；`orange`/`guard`/`green` 为深色侧栏 + 浅色内容区；**仅 `night` 为全暗主题**。默认建议 `blue`。

核心 token 至少覆盖：`--console-primary`、`--console-card-bg`、`--console-page-bg`、`--console-text`、`--console-field-bg`、`--console-space-*`；并联动 Element Plus 的 `--el-color-primary`、`--el-table-bg-color` 等表格变量。

### 跟随系统主题接入（硬契约）

`system` 是**主题偏好（preference）**，不是 CSS token。业务壳把 `system` 直接写到 `data-theme` 或 Shell 的渲染 `theme` 上时，跟随系统会失效。

| 概念 | 允许值 | 用途 |
| --- | --- | --- |
| theme preference | `system` / `blue` / `orange` / `guard` / `green` / `night` | 用户选择、localStorage 持久化、设置弹窗回显 |
| resolvedTheme | 仅 `blue` / `orange` / `guard` / `green` / `night` | 根节点 `data-theme`、Shell 渲染 `theme` |

推荐接线（可复制）：

```js
import {
  createBrickConsoleAppearanceRuntime,
  readBrickConsoleAppearancePreference,
} from '@wildbuck/core-ui-frontend/appearance';

const preference = readBrickConsoleAppearancePreference();
const appearanceRuntime = createBrickConsoleAppearanceRuntime({
  appearance: preference,
  onChange: (snapshot) => {
    resolvedTheme.value = snapshot.resolvedTheme;
    themePreference.value = snapshot.theme;
  },
});
const snapshot = appearanceRuntime.read();
// snapshot.theme 可为 system；snapshot.resolvedTheme 永远是渲染 token
```

```vue
<div
  class="console-root"
  :data-theme="resolvedTheme"
  :data-density="density"
  :data-font-size="fontSize"
>
  <BrickConsoleShell
    :theme="resolvedTheme"
    :theme-preference="themePreference"
    :density="density"
    :font-size="fontSize"
    :fullscreen-auto-enter="fullscreenAutoEnter"
    :locale="locale"
    @update:theme="(value) => appearanceRuntime.setAppearance({ theme: value })"
    @update:density="(value) => appearanceRuntime.setAppearance({ density: value })"
    @update:font-size="(value) => appearanceRuntime.setAppearance({ fontSize: value })"
    @update:fullscreen-auto-enter="(value) => appearanceRuntime.setAppearance({ fullscreenAutoEnter: value })"
    @update:locale="(value) => appearanceRuntime.setAppearance({ locale: value })"
  />
</div>
```

规则：

1. **渲染侧**只绑 `resolvedTheme`：根容器 `data-theme`、登录页/未登录边界与已登录 Shell 必须一致使用 resolved token。
2. **设置侧**绑 preference：`theme-preference` / 保存逻辑可以是 `system`。
3. **禁止** `data-theme="system"`、`:theme="'system'"`、依赖不存在的 `theme-system` CSS token。
4. **禁止**业务自造 `matchMedia` / `localStorage` 主题协议；持久化与系统外观监听统一走 `@wildbuck/core-ui-frontend/appearance`。
5. 偏好为 `system` 时，runtime 会监听 `prefers-color-scheme` 并刷新 `resolvedTheme`；组件卸载时调用 `appearanceRuntime.dispose()`。
6. 改完后硬刷新前端；验收：个性化设置选「跟随系统」→ 切换 OS 浅色/深色 → 控制台 `data-theme` 在 `blue`/`night` 间变化，设置回显仍为「跟随系统」。

### 主题切换验收清单

标准入口：顶部栏头像下拉“个性化设置” → `BrickUserMenu` → `BrickAppearanceSettingsDialog`。特殊布局才用 `BrickAppearanceSwitcher`。弹窗可配置主题、字号、密度、登录后是否自动全屏（默认否）和语言；不提供 mock 表格预览。切换主题时检查壳/侧栏/按钮/`ElTable`/卡片/筛选条在 `night` 下仍用 `--console-*`，无硬编码颜色/白底；弹窗文案区分日间 / 深色侧栏 / 全暗主题。选「跟随系统」时按上一节契约验收，不得出现 `data-theme="system"`。

## 页面模式

业务页面优先复用这些模式，具体实现以 `@wildbuck/core-ui-frontend/patterns` 的 block/action 约定为边界。Buck 吸收的是代码化页面模式，不是低代码运行时平台；业务仓库仍写 Vue 页面、组合已发布组件和模块 SDK，不通过后台配置拖拽页面，不保存运行时 UI schema。

| 模式 | 适用场景 | 组成 |
| --- | --- | --- |
| 筛选 + 表格 | 列表、日志、角色、员工、应用 | 页面头、筛选条、表格、分页、行操作。 |
| 树表 + 抽屉 | 组织、菜单、层级结构 | 左右不分裂，主区树表，详情进入抽屉。 |
| 列表 + 详情抽屉 | 应用、角色、员工、安全配置 | 主任务区保持列表，详情和编辑进入 `BrickConsoleDrawer`。 |
| 配置表单 | 密码策略、登录安全、传输安全 | `ElForm`、分组区块、状态提示、保存按钮。 |
| 指标卡片 | 工作台和概览 | 小型 metric card，避免大面积装饰卡片。 |

### block/action 边界

`block` 是页面任务区域，例如筛选区、列表区、详情抽屉内容区、配置分组、审计上下文、空状态和错误状态。`action` 是用户可执行命令，例如保存、重置、删除、复制密钥、强制登出、批量操作、导入导出和危险确认。

`core-ui` 负责一致体验：

- 布局、密度、主题 token、Element Plus 尺寸联动。
- 加载态、空状态、错误反馈、危险确认和动作区层级。
- slot 命名、actions 摆放、主动作/次动作/危险动作的视觉秩序。
- 可见性、禁用态和 loading 的呈现方式。

`core-ui` 不接管业务边界：

- core-ui 不是查询引擎；查询字段白名单、允许操作符、排序字段、分页上限和执行映射仍归 `core:query`。
- core-ui 不是选项源；下拉、单选、多选、标签和字典选项仍归 `core:option` / `BrickOptionProvider`。
- core-ui 不是权限引擎；按钮是否可见、是否禁用、是否允许执行，语义判断仍归模块权限或业务页面。
- 页面字段、按钮文案、业务动作处理、数据请求、审计补充信息和复制内容仍由模块页面或业务页面负责。

后端不返回筛选控件布局、组件类型、页面文案、动作按钮结构或运行时 UI schema。IAM 菜单和权限目录也不是动态页面生成器；它们只能影响导航、可见性和授权结果，不能替代前端 route/component。业务需要新 pattern 时，应向 `buck` 提交中文 Issue，而不是在业务仓库复制验证壳 CSS 或自建低代码配置表。

第一批 block/action pattern 命名和场景：

| 名称 | 类型 | 状态 | 场景 |
| --- | --- | --- | --- |
| `BrickFilterToolbar` | block | 已发布 | 列表页筛选字段网格和筛选动作区；字段、文案和查询 DSL 由页面持有。动作区**仅**重置/筛选。 |
| `BrickPageHeader` | block | 已发布 | 紧凑后台页眉（title / description / actions；可选 eyebrow）；主操作放 `#actions`，指标放 `#stats`，默认不是营销向超大标题。 |
| `BrickListPageActions` | action | 已发布 | 页眉动作槽：`#extra` → `#import` → `#export` → `#primary`（新增最右）。见 #442/#443。 |
| `BrickSelectionActionBar` | action | 已发布 | 表格多选条：已选 N + `#batch` + `#clear`；`selectedCount<=0` 隐藏。 |
| `BrickImportExportMenu` | action | 已发布 | 可选 plain 下拉合并导入/导出。 |
| `BrickStatStrip` | block | 已发布 | 可选指标条；只展示 label/value/tone，不占用主操作位，不计算业务指标。 |
| `BrickPageBlock` | block | 已发布 | 页面内容区通用任务块，统一标题、说明、加载、错误、空状态和动作 slot。 |
| `BrickEmptyState` | block | 已发布 | 无数据、筛选无结果、无权限或加载失败后的可恢复提示。 |
| `BrickActionBar` | action | 已发布 | 页面、配置表单或抽屉底部的主动作、次动作和危险动作布局。 |
| `BrickRiskConfirm` | action | 已发布 | 删除、强制登出、重置密钥、影响全局配置保存等危险操作确认。 |

首批约定：

- `block` 默认通过 `loading`、`error`、`empty` 或同等 slot 表达状态，不自己请求数据。
- `action` 默认通过 `loading`、`disabled`、`danger` 或同等 props 表达交互状态，不自己判断权限。
- pattern 只接收展示必要的信息和回调，不接收后端查询定义、选项 provider code 到控件布局的映射规则，也不读取权限目录。
- 如果 pattern 需要 `#actions`、`#footer`、`#empty`、`#error` 等 slot，应让页面放入业务按钮、业务表单和业务提示。

已发布入口速查（细节见包 `README` / `.d.ts`）：

| 入口 | 用途 |
| --- | --- |
| `BrickConsoleShell` / Sidebar / Topbar | 主壳；侧栏 `navigationGroups`、`brand-mark`、`abbr`、折叠与 `sidebar-nav-before`；顶部栏**不展示系统信息**，页面上下文在侧栏 active 与页面标题；全局动作用 `topbar-actions` |
| `BrickConsoleDrawer` | 列表详情/创建/编辑侧栏 |
| `BrickPageHeader` / `BrickListPageActions` / `BrickSelectionActionBar` / `BrickImportExportMenu` / `BrickStatStrip` / `BrickPageBlock` / `BrickEmptyState` / `BrickFilterToolbar` / `BrickActionBar` / `BrickRiskConfirm` | patterns：页眉、列表动作槽、选中条、导入导出菜单、指标条、任务块、空态、筛选、底部动作、危险确认 |
| `BrickUserMenu` + `BrickAppearanceSettingsDialog` + `BrickChangePasswordDialog` | 头像下拉「个性化设置」与「修改密码」**壳内弹窗**（`:change-password-submit` → IAM `changeOwnPassword` / `POST /brick/password/change`；勿整页跳转认证流） |
| `BrickAppearanceSwitcher` | 紧凑切换，不替代标准弹窗 |
| `BrickReadonlyCopyInput` / `BrickManagedSecretInput` + `resolveBrickManagedSecretField` / `BrickImageUploadField` | 敏感只读复制、凭据编辑、图片上传 |
| `buildBrickConsoleNavigationGroups` / `createBrickConsoleThemePresets` / `createBrickConsoleAppearanceRuntime` / `theme.css` | 导航、主题预设、外观运行时、token |
- `BrickConsoleShell` 的 `sidebarCollapsed` / `sidebarCollapsible`：标准侧栏折叠能力，业务壳可用 `v-model:sidebar-collapsed` 控制。

### 动作布局与操作列顺序

底部动作统一 `BrickActionBar`：`secondary`（取消/重置）在左，`primary`（保存）在右，`danger` 最后并可内嵌 `BrickRiskConfirm`。列表操作列固定：查看/编辑 → 派生结构动作 → 次级处置 → 危险动作。

正式能力页不接受本地示例数据页、占位列表页或 mock 记录完成态。启动前端调试前必须先启动真实后端；不得使用 mock 菜单、mock 权限或 mock 业务数据作为验收依据。禁止 `mock:backend` / `mock-backend` 入口。模块内部 `ConsolePageHeader` 等非 exports 不可依赖。缺口提中文 issue：<https://github.com/wu9007/buck/issues>。

### 列表页动作位地图（#442，强制）

列表页的「新增 / 批量 / 导入 / 导出」**位置必须统一**。规范 issue：[buck#442](https://github.com/wu9007/buck/issues/442)；组件 issue：[#443](https://github.com/wu9007/buck/issues/443)。

| 动作类型 | 槽位 | 视觉 | 禁止 |
| --- | --- | --- | --- |
| **新增 / 创建** | 页眉 `BrickListPageActions` **`#primary` 最右** | `type="primary"` 实心；`data-guide-anchor="primary-action"` | 不进筛选条；不与导出并列两个 solid primary |
| **导出** | `BrickListPageActions` `#export`（新增左侧） | **`type="primary" plain`**（描边主色，字色可读） | **禁止**裸 `plain`（部分主题下字色与底对比不足）；禁止实心 `type="primary"` 与「新增」抢创建语义；无新增页导出可最右仍用 primary plain |
| **导入** | `#import` 或 `BrickImportExportMenu` | `type="primary" plain` | 不散落为唯一入口（空状态可重复次要 CTA） |
| **批量操作** | `BrickSelectionActionBar` 下拉 | `type="primary" plain` 下拉触发器；危险项 + `BrickRiskConfirm` | 不把批量菜单永久放在页眉当主操作 |
| **页内次级工具**（如角色互斥） | `#extra` | `plain` 或 `type="primary" plain` | 不得抢最右 solid primary |
| **筛选 / 重置** | 仅 `BrickFilterToolbar` | 重置左、筛选 primary | 筛选条不放新增/导入/导出 |
| **保存 / 取消** | 抽屉/表单 `BrickActionBar` | 取消左、保存右 | 不把保存塞进页眉 |

页眉：`BrickPageHeader` → `#actions` → `BrickListPageActions`（`#extra` / `#export` / `#primary`）。完整 slot 以 `@wildbuck/core-ui-frontend/patterns` 的 `.d.ts` 为准。旧文档「页面级主动作可放筛选条最右」已废止。

#### 批量 / 导入导出交互要点（#446）

- **批量**：仅多选表格展示勾选列；有选中才出现 `BrickSelectionActionBar`；`#batch` 放 `el-dropdown`（触发器 `type="primary" plain`）；菜单分组为常规 → 导出选中（可选）→ 危险（divided + `BrickRiskConfirm`）；进行中 bar 上 loading，禁止重复提交。
- **导出（页眉）**：`#export` 使用 **`type="primary" plain`**（描边主色，保证字色对比）；导出**当前筛选结果**（或声明上限，如审计 1000 条）；`loading` + `showBrickStatus` 反馈条数/文件名。
- **导出选中**：放 `BrickSelectionActionBar`，不替换页眉导出。
- **导入**：页眉 `#import` 或 `BrickImportExportMenu` → 抽屉/对话框（下载模板 → 上传 → 校验结果表 → 确认导入）；失败展示可读错误行；core-ui 不实现解析引擎。
- **视觉对照**：solid primary 仅「新增/创建」；导出/导入/批量触发器统一 primary plain，避免裸 `plain` 在 console 主题下字色不可读。

### 标准筛选工具条

列表筛选优先 `BrickFilterToolbar`（patterns，不从 shell 引入）；不承担 `core:query` 白名单。筛选字段必须提供中文 placeholder、可见 label 或 `aria-label`，不能依赖 Element Plus 默认英文文案。日期/时间用 `ElDatePicker`（含 `datetimerange`），禁用原生 date input；区间字段可加 `brick-filter-toolbar__field--range` 跨两列。筛选动作区顺序：**仅**重置类 → 筛选类（`primary`）。**禁止**在筛选条放置新增、导入、导出或其它页面级业务命令（见上节动作位地图）。`actions` 可直接放筛选相关的 `BrickActionBar` 片段，不要写页面局部 `.brick-action-bar { padding-top: 0; }` 覆盖。配置页可引 `@wildbuck/core-ui-frontend/settings-page.css`；安全模块用 `@wildbuck/module-security-setting-frontend/settings-page.css`。不复制 `.filter-bar` 等本地工具条 CSS。

### 颜色字段

统一 `BrickColorField`（色板 + hex 输入，高度对齐）。不要在业务页复制 `el-color-picker` 局部 CSS。按需注册壳需全局挂载 `ElColorPicker`。

### 图片上传字段

统一 `BrickImageUploadField`（`@wildbuck/core-ui-frontend/fields`）；上传走 `core:file-resource`，业务表存 `resourceId`，不塞 Base64。禁止本地 `input[type=file]`+预览组合替代。

**预览契约（易踩坑）**

| 允许作为 `<img src>` | 禁止作为 `<img src>` |
| --- | --- |
| 本地 `blob:`（`createBrickLocalImagePreview(file)` 或组件内部在选文件后自动生成） | 鉴权内容地址 `GET /file-resources/{id}/content` 对应的 `contentUrl`（裸 `<img>` 无 Authorization → 401） |
| 业务公开匿名资源（如 `login-brand` 的 `/login-brand/public/logo`） | 把 Base64 data URL 长期写进业务表 / client-meta |
| 通过 `loadBrickImageResourcePreviewUrl(resourceId)` 用 `requestBlob` 换出的临时 `blob:` | 自建平行上传协议 |

推荐 helper（同 `@wildbuck/core-ui-frontend/fields` 导出）：

- `uploadBrickImageResource(file, category)` — 上传，返回 `resourceId` / `contentUrl`（**不要**把 `contentUrl` 绑到预览）
- `createBrickLocalImagePreview(file)` / `revokeBrickImagePreview(url)` — 未保存预览生命周期
- `loadBrickImageResourcePreviewUrl(resourceId)` — 已保存资源的鉴权读 + blob 预览
- `isBrickFileResourceContentUrl(url)` / `resolveBrickImagePreviewUrl(url, fallback)` — 过滤危险 content URL

`BrickImageUploadField` 在选文件后会先用本地 `blob:` 预览；父组件传入鉴权 `contentUrl` 时组件会忽略它并继续用本地 blob，直到父组件换成公开路径或清空。

配置页双列表单布局复用 `@wildbuck/core-ui-frontend/settings-page.css` 的 `.setting-form` / `.brick-detail-form` 与 `__full` 全宽修饰，不要在业务页复制一套 grid gap。

### 手写签名字段（可选组件边界）

Buck **当前未**提供正式 `BrickSignaturePadField`。业务仓可以自建画板（Canvas / 第三方库），但必须遵守：

| 允许 | 禁止 |
| --- | --- |
| 画板输出 `Blob` / `File` 后上传 `core:file-resource`（如 `POST /file-resources/images?category=BUSINESS_ATTACHMENT`） | 自建第二套附件表、平行上传协议、或把 Base64 写进业务 JSON / 列表表 |
| 业务表只存 `signatureResourceId`（或等价 resource id） | 业务请求体长期携带签名像素明文 |
| 引用登记 / `disableIfUnreferenced` 等 file-resource 清理语义按模块约定使用 | 与 CA/UKey 国密签混成一套业务私有协议（国密签属 security/cipher 长期项，与手写签产品语义分离） |

可选后续：若多业务重复要手写签，再向 `buck` 提 `type:feature` 请求正式 `BrickSignaturePadField`（仍只产出 Blob，上传仍走 file-resource）。

### 敏感值只读展示与复制字段

统一 `BrickReadonlyCopyInput`；列表/详情默认脱敏；可复制值须后端明确返回并经 `copy-text`，不从掩码反推。

### 敏感凭据编辑字段

统一 `BrickManagedSecretInput` + `resolveBrickManagedSecretField()`；字段级 `appSecretConfigured` / `apiKeyConfigured` / `secretKeyConfigured` / `credentialMasked`；已托管后「留空表示不修改」；禁止本地 `SensitiveCredentialInput` 克隆。校验用 `validateBrickRequiredFields` 与 helper 的 `validationValue`。

### 标准侧边抽屉

优先 `BrickConsoleDrawer`；短确认 `ElDialog`；禁止固定像素 `size`（如 `520px`），特殊宽度写入 `docs/business/module-adoption-decision.md`。

### 页面向导规范

入口在 `topbar-actions` 菜单引导；目标 `data-guide-id`；步骤含 `target/title/body/placement`；完成态 key 按系统+主体+route 隔离；遮罩与按钮文案走 Buck token（上一步/下一步/完成/跳过）；抽屉内目标先开抽屉再定位。
