# 业务前端 UI 参考

本文档面向业务前端开发者和业务开发智能体，说明上层业务应用如何复用 Buck 前端包、模块页面、通用组件模式、Element Plus 和主题 token。

## 基础原则

- 默认技术栈是 `Vue 3 + Element Plus`。
- 业务前端壳负责会话状态、模块装配和业务页面；导航、布局、主题切换优先复用 `@wildbuck/core-ui-frontend`。
- Buck 模块前端包负责模块页面、模块 route metadata、权限 map 和部分无界面工作台函数。
- 业务页面可以自定义，但必须复用 Buck HTTP、认证、权限、传输和主题 token。
- 禁止深度引入 `@wildbuck/*` 包未通过 `exports` 暴露的内部文件。

## 前端包和入口

| 包 | 使用方式 |
| --- | --- |
| `@wildbuck/core-api-frontend` | 调 `configureHttp({ baseUrl, prepareRequest, responseErrorHandler, requestDigest, transportEnvelope })` 后，所有生成 SDK 和业务请求统一走 `request<T>()`。 |
| `@wildbuck/core-authentication-frontend` | 使用 `createAuthRequestClient` 处理 Bearer token、401、强制改密和登录传输保护；使用 `createLoginTransportSecurityProvider` 读取 `/transport/meta`。 |
| `@wildbuck/core-authorization-frontend` | 使用 `defineBrickModule`、`collectBrickPermissions`、`buildBrickNavigation` 管理模块 routes、权限和导航。 |
| `@wildbuck/core-transport-frontend` | 使用 `withBrickRequestDigest`、`createBrickTransportEnvelope`、`openBrickTransportEnvelope` 处理摘要和 envelope。 |
| `@wildbuck/core-query-frontend` | 构造 `QueryCriteria`、`QueryFilter`、`QuerySorter` 和 `QueryPager`；只表达前端提交的查询 DSL，不声明后端字段白名单。 |
| `@wildbuck/core-option-frontend` | 调 `/brick/options/list` 加载后端 `BrickOptionProvider` 输出的下拉、单选、多选、标签和字典选项；列表筛选「全部」哨兵用 `normalizeOptionItems` + `withAllOption`，不要在各模块复制。 |
| `@wildbuck/core-client-meta-frontend` | 调 `/brick/client-meta` 读取浏览器启动公开运行时元数据，再用 `bootstrapBrickClient()` 分发给各 core 前端包；用 `formatBrickClientAppVersionLabel` 拼登录页版本条。不承载 secret、token、连接串、内部策略明文、请求体、表单内容或业务对象明文，不替代 `/transport/meta`。 |
| `@wildbuck/core-usage-event-frontend` | 提供 `bootstrapUsageEventsFromClientMeta()`、`createModuleUsageTracker()`、`trackUsageEvent(...)` 和语义 helper；默认从 `client-meta` 自动启用或保持 no-op，手动 `configureUsageEvents` 只用于测试或特殊部署覆盖；模块优先维护稳定事件矩阵并用 tracker 的 `trackPage`、`trackOpen`、`trackAction(featureKey, actionCode, asyncFn)`，动作结果已由页面流程确定时用 `trackActionResult(featureKey, actionCode, result)` 写入 `SUCCESS` / `FAILURE` / `CANCELLED` / `ABANDONED`，页面不要重复写 payload 或 success/failure wrapper 分支。事件 code 和模块矩阵先查发布资料包 `capabilities/usage-event.md`，且只提交白名单 usage event 字段。collect endpoint 复用业务认证、鉴权、网关和传输安全链路，不是匿名日志入口。 |
| `@wildbuck/core-ui-frontend` | 引入 `theme.css`，使用 `shell`、`fields`、`patterns`、`theme` 和根入口暴露的控制台壳、字段组件、页面模式组件、主题预设、导航辅助函数，以及 `showBrickStatus`、`validateBrickRequiredFields` 这类统一反馈能力；浏览器文本下载用 `@wildbuck/core-ui-frontend/download` 的 `downloadTextFile`，不要在业务模块复制 blob 下载样板。 |
| `@wildbuck/core-ui-frontend/pwa` | 可选 PWA 安装引导。**壳层推荐** `useBrickPwaInstall({ vue: { ref, onMounted, onScopeDispose }, serviceWorkerUrl: '/sw.js', onUnavailable })`，把返回的 `canInstallApp` / `installApp` 接到 `BrickConsoleShell`（`can-install-app` + `@install-app` → 用户菜单「安装应用」）。底层仍可用 `createBrickPwaInstallController` / `registerBrickPwaServiceWorker`。业务壳提供 `manifest.webmanifest`、图标与极简 Service Worker，并匿名放行这些资源；不可安装提示可用 `BRICK_PWA_INSTALL_UNAVAILABLE_MESSAGE`。不绑定业务品牌，也不强制完整离线能力。详见下文「PWA 安装与 Vite 开发态」。 |
| `@wildbuck/core-ui-frontend/theme`（浏览器 chrome） | `applyBrickConsoleBrowserChromeTheme(resolvedTheme)`：按主题 **topbar** token 写 `meta[name=theme-color]`，避免 PWA 窗口条永远是默认 accent 蓝。manifest 默认 `theme_color` 用中性色；主题切换时业务壳应同步调用。 |
| `@wildbuck/module-iam-frontend` | 使用 `page-registry` 装配 IAM 页面；使用 `auth-view`、`auth-state`、`auth-workspace` 接入登录、MFA/双因子、改密。默认 `auth-view` 会消费 `client-meta.capabilities.loginBrand` 与 `appVersion` 页脚。 |
| `@wildbuck/module-login-brand-frontend` | 使用 `page-registry` 装配「系统外观 → 登录外观」管理页（需后端 `modules:login-brand`）。 |
| `@wildbuck/module-notification-setting-frontend` | 使用 `page-registry` 装配通知配置页面。 |
| `@wildbuck/module-security-setting-frontend` | 使用 `page-registry` 装配安全配置页面；包根入口和 `page-registry` 会装载安全配置页样式，业务壳需要兜底时可显式引入 `@wildbuck/module-security-setting-frontend/settings-page.css`。 |
| `@wildbuck/module-audit-frontend` | 使用 `page-registry` 装配审计日志页面。 |
| `@wildbuck/module-application-center-frontend` | 使用 `page-registry` 装配应用中心页面。 |

## 业务壳必须负责的事

- 设置 `configureHttp` 的 `baseUrl`、Bearer token 注入和统一错误处理。
- 维护会话状态和当前主体。
- 读取模块 `brickRoutes`、`brickPermissionMap`、`page-registry`，再通过 `buildBrickConsoleNavigationGroups()` 或业务确认过的同等分组逻辑装配菜单。
- 使用 `BrickConsoleShell` 承载侧栏、顶部栏、内容区和主题属性：`data-theme`、`data-density`、`data-font-size`。
- 顶部栏默认不配置左侧标题、说明或面包屑，不拆开 Shell 自建顶部栏。顶部栏是贴住浏览器顶部和侧栏顶部的扁平全局操作条，不做内容区浮动卡片；只保留刷新、菜单引导、通知、当前主体头像下拉等全局操作入口。系统名称和环境说明放侧栏品牌区，菜单搜索放侧栏菜单上方，当前页面上下文由侧栏 active 状态和页面标题区表达。
- 顶部栏动作按钮由业务壳通过 `topbar-actions` slot 提供；`BrickConsoleShell` 提供布局、主题、动作区和头像下拉，不默认硬编码刷新、菜单引导和通知的业务逻辑。
- 顶部栏正式动作按钮必须使用 `ElButton` 或同等公开组件语义，不允许在 `topbar-actions` 中直接放原生 `<button>`、ASCII 符号按钮或局部自造样式作为正式全局动作。
- 需要折叠侧栏时，使用 `BrickConsoleShell` 的 `v-model:sidebar-collapsed` 和 `sidebar-collapsible`，不要在业务仓库复制或改写 `BrickConsoleSidebar`。
- 默认使用 `BrickConsoleShell` 内置的 `BrickUserMenu` 头像下拉入口打开 `BrickAppearanceSettingsDialog`；特殊布局才直接组合 `BrickAppearanceSwitcher` 或 `createBrickConsoleThemePresets()` 暴露的主题列表，不自定义另一套主题枚举。
- 引入 Element Plus，并**按需注册**壳内实际用到的组件。模块模板里出现的每个 `<el-*>` 都必须在业务壳 `main` 入口 `app.component` 注册（含 CSS），否则会渲染成空白未知标签。常见清单：`ElButton`、`ElForm`、`ElInput`、`ElSelect`、`ElSwitch`、`ElTable`、`ElDialog`、`ElDrawer`、`ElAlert`、`ElTag`、`ElTabs`、`ElPagination`、`ElDropdown` / `ElDropdownMenu` / `ElDropdownItem`（`BrickTableMoreMenu` 必需）、`ElSlider`、`ElProgress`（密码策略弱密码扫描进度）、`ElTree`、`ElDescriptions` / `ElDescriptionsItem`。新增模块组件标签时同步扩壳注册，并加结构测试守卫。
- 中文业务后台必须在前端入口配置 Element Plus locale 为 `zh-cn`。多语言业务接入 `@wildbuck/core-i18n-frontend`：`appearance.locale` 为本机偏好真源，`createBrickI18nRuntime` 为生效 locale，`configureHttp({ localeProvider })` 注入 `Accept-Language` 与 `X-Brick-Locale` 保证与后端 `core:i18n` 一致。
- **模块词条约定**：key 使用 `module.<moduleId>.…`；模块导出 `resolve*Messages(locale)` 与/或 `create*(locale)`；业务壳在 locale 变更时 `registerMessages('module-…', …)`，并把依赖文案的配置对象（如 IAM `createAuthExperience(locale)`）一并重建。禁止模块内自造第二套 i18n 库。壳层样板见 `@wildbuck/core-ui-frontend/i18n`；IAM 登录流样板见 `createAuthExperience` / `resolveIamAuthMessages`。未覆盖页面仍可能中文。不要依赖 Element Plus 默认英文文案，否则未写 placeholder 的下拉会显示 `Select`。
- **侧栏菜单显示名（产品口径 A，唯一来源）**：侧栏**可见项与 title 的唯一业务真源**是 IAM **菜单管理**写入库表后、经 `/iam/current-principal/workspace` 返回的 `navigationMenus`（`menuName` → shell `title`）。模块 `brickRoutes` / page-registry **只**提供可执行页（path、权限、组件），用于与菜单 path 对齐装配，**不得**单独发明侧栏项，也**不得**在 validation / 业务壳用 path→`t(key)` 对照表覆盖 `menuName`。内容原文**不做**框架级自动翻译；`appearance.locale` 只驱动壳层与模块**静态词条**（顶栏、个性化、登录流、模块页内文案等）。切换 English 后侧栏仍显示菜单管理中的名称是预期行为。若需要菜单多语言，应另立「菜单多语言字段 / 管理端分语言录入 / 后端按 locale 返回 title」，而不是壳层 `t(titleKey)`。

业务壳不应重新实现登录请求、MFA 验证、强制改密切换、传输加密、请求摘要或模块 SDK。

## PWA 安装与 Vite 开发态

可选能力：业务壳自备 `manifest.webmanifest`、图标与 Service Worker；Buck 只提供安装提示 UX（`beforeinstallprompt` → 用户菜单「安装应用」）。

### 验收预期（硬口径）

| 入口 | 是否 Buck 承诺 |
| --- | --- |
| 用户菜单「安装应用」（`canInstallApp` + `@install-app`） | **是**（当浏览器触发 `beforeinstallprompt` 且非 standalone） |
| 浏览器 ⋮ 菜单 “安装应用 / Install app” | 浏览器行为，可用作兜底 |
| Chrome **地址栏右上角安装/下载图标** | **否**；受浏览器启发式控制，**不得**作为验收成功标准 |
| DevTools → Application → Manifest / Service Workers | 自检路径，不是产品入口 |

`beforeinstallprompt` 未触发时：`canInstallApp` 为 false，菜单可不显示安装项；若业务在 `installApp` / `onUnavailable` 中提示，使用 `BRICK_PWA_INSTALL_UNAVAILABLE_MESSAGE` 或等价中文说明（需 Chrome/Edge + HTTPS/localhost）。

### installability 清单

- 通过 **HTTPS** 或 **localhost** 访问
- `manifest.webmanifest` 可 200；`display` 含 `standalone`（或等价可安装 display）
- 至少 **192** 与 **512** 图标（`purpose` 按业务需要，通常 `any` / `maskable`）
- `prefer_related_applications` 不为 true（不要挡安装）
- Service Worker **已注册且 controlling** 当前页
- 不要依赖地址栏图标出现

### 尽早注册 Service Worker

在 **入口 `main.js`**（或等价 bootstrap）尽早调用 `registerBrickPwaServiceWorker({ serviceWorkerUrl: '/sw.js' })`，或在 `useBrickPwaInstall({ serviceWorkerUrl: '/sw.js', ... })` 中传入 URL 以便 mount 时注册。
**不要**等到壳层完全 mount 后才“顺手”注册，也不要把 SW 注册绑在某个业务路由里。

### Vite 开发态最小 Service Worker（禁止 cache-first 劫持）

开发态若在 `install` 里 `cache.addAll(['/','/index.html',...])` 或对同源 GET 做 **cache-first**，会劫持 `/src/*`、Vite 模块图和 HMR，导致 SW 不稳定、`beforeinstallprompt` 不触发。安装引导阶段请用**透明 fetch**（有 fetch 处理器即可，不预缓存业务资源）：

```js
/* public/sw.js — installability only; not a full offline cache */
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  event.respondWith(fetch(event.request));
});
```

生产若需要离线缓存，必须**单独设计**且避开开发态劫持；不要把生产 cache-first 策略原样拷进 Vite `public/sw.js` 做安装验收。

发布资料包 `templates/frontend-minimal/public/sw.js` 提供同口径最小样例；业务仓可复制后改品牌/manifest，不要改 Buck 运行时 API。

### 推荐接线摘要

```js
// main.js — 尽早注册（与壳 mount 解耦亦可）
import { registerBrickPwaServiceWorker } from '@wildbuck/core-ui-frontend/pwa';
registerBrickPwaServiceWorker({ serviceWorkerUrl: '/sw.js' });

// 壳内：useBrickPwaInstall + BrickConsoleShell can-install-app / @install-app
```

主题切换时仍调用 `applyBrickConsoleBrowserChromeTheme(resolvedTheme)`，避免 PWA 窗口条色与控制台不一致。

## 会话过期与并发请求

后台页面刷新时通常会并发加载当前主体、选项、列表和详情。access token 过期后，这些请求可能同时返回 401；这类并发 401 只允许触发一次全局会话过期处理。业务壳必须把会话级错误收口到一次全局处理，不要让每个页面再弹出“加载列表失败”“加载选项失败”等局部错误。

推荐做法是在业务壳用 `configureHttp` 注册一次完整会话生命周期：

1. `tokenRefresh`：access 过期时单飞 `/brick/token/refresh`，成功则无感重放原请求（需持久化 refreshToken）。
2. `createBrickSessionErrorHandler`：仅在续期失败后触发终态，按 `expirationStrategy`（client-meta 非敏感摘要）分流 `LOGIN_OUT`（清会话）/ `SCREEN_LOCK`（soft-suspend + `BrickSessionRecoveryOverlay`）。历史 `VERIFY_PASS` 归一为 `SCREEN_LOCK`；解锁走登录再签发，不自动重放失败请求。
3. 页面 `catch` 里若 `isBrickSessionError(error)` 则直接返回，不再弹局部错误。

默认会话级错误包含 HTTP `401`，以及 `BRICK_UNAUTHORIZED`、`BRICK_ACCESS_TOKEN_EXPIRED`、`BRICK_SESSION_EXPIRED`、`BRICK_PASSWORD_CHANGE_REQUIRED`、`BRICK_MFA_REQUIRED` 等认证状态码。需要扩展时，通过 `createBrickSessionErrorHandler({ shouldHandle })` 保持业务壳集中判断，不要在每个页面复制 401 处理。过期解锁走登录再签发，不要调用 step-up `/brick/session/verify-password`。

## 壳启动时序：client-meta 与 options 鉴权

浏览器壳启动时，公开元数据、会话和字典请求的**鉴权级别不同**，不要当成同一类“启动 API”。

| 步骤 | 能力 | 鉴权默认 | 壳侧要求 |
| --- | --- | --- | --- |
| 1 | `GET /brick/client-meta` + `bootstrapBrickClient` | 公开启动元数据（非 secret） | **不要** `await` 卡住首屏 mount；失败/超时时按安全默认继续（如 usage-event 保持 disabled） |
| 2 | 登录 / 恢复会话 / 注入 Bearer | 认证链路 | 未就绪前不要批量打需登录的业务 API |
| 3 | `POST /brick/options/list`（`loadBrickOptions`） | **默认需登录后鉴权** | token 就绪后再加载；未登录 401 是预期，不是 option 坏了 |
| 4 | 列表/详情等业务 API | 按业务与 IAM 规则 | 与 options 相同，勿在匿名半初始化态狂刷 |

硬约定：

1. **`client-meta` 可公开 ≠ `options/list` 可匿名。** 字典经 `BrickOptionProvider` 聚合，可能含组织、人员、业务状态等，框架**不**默认匿名放行 `POST /brick/options/list`。
2. **禁止**为消 401 在前端写死业务枚举；正确路径是登录后 `loadBrickOptions`，或业务用 `BrickAuthorizationRuleContributor` **显式**声明更宽规则（须自担泄露面，生产谨慎；open-mode 联调也优先“先登录再拉字典”）。
3. **推荐非阻塞 client-meta**（#377）：先 mount 壳与路由，再异步 `loadBrickClientMeta` → `bootstrapBrickClient`；不要把整页白屏绑在 meta 请求上。包内示例见 `@wildbuck/core-client-meta-frontend` README。
4. open-mode / 业务 API 匿名联调时：业务私有 path 的匿名规则与 Buck 字典鉴权**独立**；主链可匿名不代表 options 自动匿名。

```js
import { bootstrapBrickClient, loadBrickClientMeta } from '@wildbuck/core-client-meta-frontend';
import { loadBrickOptions, createOptionRequest } from '@wildbuck/core-option-frontend';

// 1) 先挂载应用（示意）
mountApp();

// 2) client-meta：不阻塞首屏
loadBrickClientMeta()
  .then((meta) => bootstrapBrickClient(meta, { /* usageEvent 等 */ }))
  .catch(() => {
    // 安全默认：无 capabilities / usage-event 保持关闭，不阻断页面
  });

// 3) options：仅在会话/token 就绪后
async function loadShellOptionsWhenAuthenticated() {
  if (!hasAccessToken()) {
    return;
  }
  const options = await loadBrickOptions([createOptionRequest('your_option_code')]);
  // ...
}
```

## 业务 4xx 错误展示契约

完整写作规范与检查清单见 [error-user-feedback.md](../capabilities/error-user-feedback.md)。

业务接口在校验或领域规则拒绝时，推荐返回 HTTP 4xx，body 使用与 `BrickApiResponse` 一致的失败信封：

| 字段 | 含义 | 前端用途 |
| --- | --- | --- |
| `code` | 稳定机器码 | 分支、埋点、联调日志 |
| `message` | **发生了什么 / 为什么不行** | toast 主句 |
| `recovery` | **下一步怎么做**（必填于 `errors.yaml`） | toast 第二句 |

硬门禁：

- **禁止**默认展示 `error.message === "HTTP nnn"`（`BrickHttpError` 传输层文案）。
- **禁止** `catch` 丢弃 `error` 后永远弹固定「保存失败」；应优先展示服务端 `message`/`recovery`，再用目录 `fallbackCode`。
- 必须读 `error.payload.code` / `message` / `recovery`，或使用框架 helper：
  - `@wildbuck/core-api-frontend`：`readBrickBusinessError`、`formatBrickBusinessError`、`resolveBrickErrorFromCatalog`
  - `@wildbuck/core-ui-frontend`：`showBrickBusinessError`（与 core-api 统一组合规则：`原因。建议。`）
- 会话类错误仍走 `createBrickSessionErrorHandler` + `isBrickSessionError`；业务拒绝走 business helper，不要混用。
- 具体业务码表留在 `contract/errors.yaml`；Buck 约定信封形状、组合规则与展示纪律。
- 可观测：业务侧或后端 WARN 日志应带出 `businessCode`；前端联调至少记录 `code`，不要只记 status=400。

```js
import {
  isBrickSessionError,
  resolveBrickErrorFromCatalog,
} from '@wildbuck/core-api-frontend';
import { showBrickBusinessError, showBrickStatus } from '@wildbuck/core-ui-frontend/status';
import { moduleErrors } from '../generated/errors';

try {
  await submitOrder();
} catch (error) {
  if (isBrickSessionError(error)) {
    return;
  }
  showBrickStatus(
    resolveBrickErrorFromCatalog(error, moduleErrors, {
      fallbackCode: 'MODULE_SAVE_FAILED',
    }).text,
    'error',
  );
  // 无目录时：showBrickBusinessError(error);
}
```

## 保存型表单统一规则

- 管理表单、配置表单和抽屉编辑表单中的可编辑字段，继续显式标明 `（必填）` 或 `（选填）`；筛选表单默认按 `（选填）` 处理。
- 保存型编辑/配置表单中的必填项，还应展示明显红色星号；标准 `el-form-item` 统一挂到 `brick-required-form`，自定义标签行复用 `console-required-label`。
- 同一个字段只能渲染一套必填星号；挂了 `brick-required-form` 的字段不再额外叠加本地星号，标签已经通过 `console-required-label` 输出红色星号时，也不再叠加 `el-form-item required` 的默认星号。
- 点击保存前，优先使用 `validateBrickRequiredFields` 做本地空值校验，并尽量聚焦首个非法字段。
- 保存成功/失败优先使用 `showBrickStatus` toast，不要把瞬时错误或成功提示渲染在表格、按钮或抽屉底部下方。
- 页面级错误块保留给首次加载失败等状态，不要复用为保存阶段的短暂反馈。
- 上述保存型表单规则属于业务页产品化硬约束，不是“可选建议”；正式业务页的编辑、创建和配置表单不应再用本地 `ElMessage` 空值阻断、底部提示块或隐式必填来替代。

## 认证流程页接入方式

登录第一因子、验证码、MFA/双因子、强制改密和密码到期提醒属于同一条认证流程。业务侧可以决定页面品牌、布局、交互顺序和提示文案，但认证请求、传输保护、MFA 状态、强制改密状态、token 持久化和会话恢复仍归 Buck 运行时。

业务前端有两种接入方式：

| 模式 | 使用场景 | 做法 |
| --- | --- | --- |
| 默认复用模式 | 业务系统接受 Buck 默认治理后台登录体验。 | 业务壳引入 `@wildbuck/module-iam-frontend/auth-view`，传入由 `auth-state` 和 `auth-workspace` 组成的 `app`；可用轻量 props 配置品牌文案。 |
| 整页自定义模式 | 需要客户品牌、特殊版式、独立宣传区或定制的 MFA/双因子、改密体验。 | 业务侧自己实现登录第一因子页、验证码区域、MFA/双因子认证页、强制改密/密码提醒页；状态和动作仍复用 `@wildbuck/module-iam-frontend/auth-state`、`@wildbuck/module-iam-frontend/auth-workspace` 或更底层 `@wildbuck/core-authentication-frontend`。 |

默认 `IamAuthFlowView` 支持轻量品牌配置 props：`brandTitle`、`brandMark`、`brandSubtitle`、`primaryButtonType`（默认 `primary`），以及推荐的 **`initialLoginBrand`**（壳启动时已加载的 `capabilities.loginBrand` 对象）。正式路径以 `client-meta.capabilities.loginBrand` 为准（管理端「登录外观」）。

**防闪屏（业务必看）**：若壳在显示 auth-view **之前**未预取 meta，auth-view 会先显示中性占位再拉取 brand（`1.0.0-140+`）。验证壳不闪是因为先 `loadBrickClientMeta` 再传 `initial-login-brand`。业务推荐：

```js
const meta = await loadBrickClientMeta().catch(() => null);
const loginBrandCapability = meta?.capabilities?.loginBrand ?? null;
const shellBrand = resolveBrickShellBrand(meta);
applyBrickShellBrowserChrome(shellBrand);
// <IamAuthFlowView :app="authApp" :initial-login-brand="loginBrandCapability" />
// <BrickConsoleShell v-bind="brickShellBrandToConsoleProps(shellBrand)" />
```

壳层用 `resolveBrickShellBrand` / `applyBrickShellBrowserChrome` / `brickShellBrandToConsoleProps` 与登录页同源。**不要**在业务壳 i18n 里写死产品名/Logo。

**Logo/背景重启丢失**：检查 `brick.file-resource.storage-root` 是否为**绝对路径**且磁盘未随容器重建清空（见 file-resource 能力文档）。深度品牌化（独立宣传区、完全自定义版式）仍用整页自定义模式，不要深度引入模块内部源码，也不要修改 `node_modules`。

### 默认复用模式装配门禁

`useAuthWorkspace()` 返回的 `currentLoginMode`、`canDismissPasswordReminder`、`isAuthenticated` 等字段是 **Vue `ComputedRef`**。组件侧已用 `unref` 兼容 Ref 与普通对象，但业务壳仍应按下列方式持有 `app`，避免嵌套 Ref 被意外解包后动作丢失：

| 推荐 | 禁止 |
| --- | --- |
| `const workspace = useAuthWorkspace({...})`，用 **对象字面量** 或 `shallowRef` 组装 `app`：`{ state, ...workspace }` 或 `{ state, login: workspace.login, currentLoginMode: workspace.currentLoginMode, ... }` | `ref({ state, ...useAuthWorkspace() })` 后再深度展开，导致嵌套 `ComputedRef` 被 Vue 解包成普通值/丢失 |
| 传给 `<IamAuthFlowView :app="authApp" />` 时保持 workspace 字段的 Ref 语义 | 在未说明的情况下把 `currentLoginMode` 强制再 `.value` 包一层或改成不可追踪的 getter 残骸 |

最小装配示意：

```js
import { reactive, shallowRef } from 'vue';
import { createInitialAuthState } from '@wildbuck/module-iam-frontend/auth-state';
import { useAuthWorkspace } from '@wildbuck/module-iam-frontend/auth-workspace';
import IamAuthFlowView from '@wildbuck/module-iam-frontend/auth-view';

const authApp = shallowRef(null);
const state = reactive({
  ...createInitialAuthState(readJson),
  loginType: 'username-password',
  // form / authExperience 等按 auth-state 约定补齐
});
const workspace = useAuthWorkspace({
  state,
  showStatus,
  loadAuthenticatedContext,
});
authApp.value = { state, ...workspace };
// template: <IamAuthFlowView :app="authApp" brand-title="业务系统" />
```

整页自定义时，状态与动作仍来自 `@wildbuck/module-iam-frontend/auth-state` 与 `@wildbuck/module-iam-frontend/auth-workspace`（`createInitialAuthState`、`useAuthWorkspace`、`AuthScreen`）。业务页根据 `state.authScreen` 切换登录第一因子 / MFA / 改密视图，只替换 DOM，不改变固定动作语义：`app.login()`、`app.sendMfaVerificationCode()`、`app.completeMfaVerification()`、`app.completePasswordChange()`。最小示例见发布资料包 `examples/frontend-shell` 与模块前端 README。

自定义认证流程页必须遵守：

- 只能使用发布包公开 `exports`，例如 `@wildbuck/module-iam-frontend/auth-state`、`@wildbuck/module-iam-frontend/auth-workspace`、`@wildbuck/core-authentication-frontend`。
- 不得自建本地认证客户端，不得在业务仓库重新拼 `/brick/login`、`/brick/mfa/**`、`/brick/password/change` 的 fetch 封装来替代 Buck 运行时。
- MFA/双因子页面发送验证码时调用 `app.sendMfaVerificationCode()`；业务页只负责展示发送状态、验证码输入框和提交按钮，不读取或回填调试验证码。
- 不得把短信、邮箱、TOTP 等具体 MFA/双因子目标解析逻辑放进前端；目标解析和发码仍由后端 `core:authentication` SPI 与业务/IAM 数据适配。
- 必须原样代理 `/transport/meta`、`/brick/captcha`、`/brick/login`、`/brick/logout`、`/brick/mfa/**`、`/brick/password/change`、`/brick/session/verify-password`；不得代理 `/debug/**`，验证壳的 debug 端点只服务本仓库烟测，不属于业务发布面。
- 如果现有 `auth-workspace` 暴露的动作不足以支撑业务认证流程，向 `buck` 提中文 Issue 请求扩展公开入口，不要深度引用 `@wildbuck/module-iam-frontend/src/features/...`。

## 查询与选项

前端负责查询体验，后端负责查询能力边界。业务页面可以用 `@wildbuck/core-query-frontend` 构造统一 `QueryCriteria`，但字段白名单、允许操作符、排序字段、分页上限和执行映射只能由后端 `BrickQueryDefinition` 声明并校验。不要在前端定义“哪些字段可查”来替代后端边界。

使用 `@wildbuck/core-query-frontend` 的 `createQueryCriteria` / `queryFilter` / `querySorter` 构造 DSL；字段白名单与分页上限仍由后端 `BrickQueryDefinition` 校验。

下拉、单选、多选、标签和字典选项统一来自后端 `BrickOptionProvider`。前端使用 `@wildbuck/core-option-frontend` 的 `loadBrickOptions` / `createOptionRequest` 加载后再用 `v-for` 渲染，禁止静态 `<el-option label="启用" value="ENABLED" />` 或本地 `statusOptions = [{ label, value }]`。

`POST /brick/options/list` **默认需要认证**。壳启动阶段的加载顺序与未登录 401 的处理见上文「壳启动时序：client-meta 与 options 鉴权」。

## 工作台、导航、主题与页面模式

细则见 [business-frontend-page-patterns.md](business-frontend-page-patterns.md)，包括：

- Identity / Authorization / Workspace Profile
- 控制台导航与 IAM 菜单边界
- 登录/传输端点路由
- 模块页面装配
- 主题 token（含跟随系统主题接入）
- 页面模式、动作位地图、筛选条、图片上传与敏感字段

主文件不重复展开，避免智能体一次读入超预算长文。能力缺口向 `buck` 提中文 Issue：<https://github.com/wu9007/buck/issues>。


## Element Plus 使用规则

- 按钮使用 `ElButton`，危险动作用 `type="danger"`，主要动作用 `type="primary"`。
- 表单使用 `ElForm`，紧凑编辑区优先 `label-position="top"`。
- 管理表单、配置表单和抽屉编辑表单中的每个可编辑字段都要显式标明 `（必填）` 或 `（选填）`；筛选表单默认按（选填）处理。
- 如果字段的必填性会随开关、模式或上下文变化，标签、可编辑态和校验反馈必须同步变化，不能让操作人靠提交失败猜测。
- 长列表使用 `ElTable` + `ElPagination`。
- 编辑和详情优先 `BrickConsoleDrawer`，短确认用 `ElDialog`；确需完全自定义抽屉时才直接使用 `ElDrawer`。
- 删除、重置、强制下线、密钥轮换、影响全局配置保存等危险确认优先使用 `BrickRiskConfirm`；页面负责业务文案、权限和实际提交，组件只负责确认交互和影响范围表达。
- 状态提示使用 `ElAlert`、`ElTag` 或统一消息提示。
- 开关和二选一配置优先用 `ElSwitch` 或稳定分段控制，不用漂浮 checkbox 行。
- 下拉、单选、多选的选项来源优先走 `core:option`。
- 中文业务后台入口必须设置 Element Plus locale 为 `zh-cn`；列表筛选字段不得依赖默认英文 placeholder。

## 禁止事项

- 不绕过 Element Plus 手写基础按钮、表单、表格、弹窗和分页。
- 不写死颜色、间距、字号来覆盖主题切换。
- 不用模块内部未导出的 Vue 文件作为业务页面依赖。
- 不在业务壳中重新实现认证请求客户端、传输保护或 SDK 请求工具。
- 不新建员工、组织、角色、菜单、会话、安全策略、审计日志、应用中心等同类治理页面来替代模块 `page-registry`。
- 不把验证壳 `validation/security-console` 当成最终产品模板照搬；它是验证发布依赖的场景壳。
- 不复制验证壳中的局部 CSS 来追视觉效果；业务视觉基线以 `@wildbuck/core-ui-frontend/theme.css` 和公开组件为准。
- 不在业务仓库自造 `CopyInput`、`SecretInput`、`SensitiveCredentialInput`、密钥只读输入框或密钥复制按钮；敏感值展示复制统一使用 `BrickReadonlyCopyInput`，敏感凭据编辑统一使用 `BrickManagedSecretInput` 和 `resolveBrickManagedSecretField()`。
- 不在业务仓库复制 `.filter-bar`、`.query-toolbar` 或本地万能查询工具条样式；筛选条统一使用 `BrickFilterToolbar`，日期类筛选统一使用 Element Plus 日期下拉。
- 不在删除、重置、强制下线、密钥轮换或全局配置保存中直接使用 `ElMessageBox.confirm` 自造危险确认；危险确认统一用 `BrickRiskConfirm`，普通短提示才使用 Element Plus 弹窗。
- 不在 `topbar-actions` 中直接使用原生 `<button>`、ASCII 符号按钮或局部自造样式充当正式全局动作；顶部栏动作统一复用 Element Plus 按钮语义和 Buck 顶部栏布局。
- 不把已定义为正式业务能力的页面做成本地示例数据页、占位列表页或 mock 记录演示页；验证壳中的演示性页面模式不能直接视为业务完成态。
- 不把本地 mock 后端、本地 mock 菜单、本地 mock 权限或本地 mock 业务数据作为调试和验收依据；业务仓库不得保留 `mock:backend`、`mock-backend` 或 `frontend/scripts/mock-backend.*` 入口。
- 不把 `@wildbuck/core-ui-frontend/patterns` 的 block/action 当成低代码运行时平台；不存储运行时 UI schema，不让后端返回筛选控件布局、组件类型、按钮结构或页面文案。
