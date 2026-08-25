# Buck 前端发布依赖

版本：2.0.0-11

业务前端应从对应 GitHub Release 下载 `@wildbuck/*` tarball 消费以下包：

- `@wildbuck/core-api-frontend`: `2.0.0-11`
  - exports: `.`
- `@wildbuck/core-authentication-frontend`: `2.0.0-11`
  - exports: `.`
- `@wildbuck/core-authorization-frontend`: `2.0.0-11`
  - exports: `.`
- `@wildbuck/core-client-meta-frontend`: `2.0.0-11`
  - exports: `.`
- `@wildbuck/core-i18n-frontend`: `2.0.0-11`
  - exports: `.`
- `@wildbuck/core-option-frontend`: `2.0.0-11`
  - exports: `.`
- `@wildbuck/core-query-frontend`: `2.0.0-11`
  - exports: `.`
- `@wildbuck/core-transport-frontend`: `2.0.0-11`
  - exports: `.`
- `@wildbuck/core-ui-frontend`: `2.0.0-11`
  - exports: `.`, `./shell`, `./shell-navigation`, `./theme`, `./appearance`, `./fields`, `./download`, `./patterns`, `./status`, `./session-recovery-ui`, `./i18n`, `./pwa`, `./workspace-profile`, `./theme.css`, `./settings-page.css`, `./list-panel.css`
- `@wildbuck/core-usage-event-frontend`: `2.0.0-11`
  - exports: `.`
- `@wildbuck/module-ai-assistant-frontend`: `2.0.0-11`
  - exports: `.`, `./assistant-panel`, `./shell-entry`, `./page-registry`, `./i18n`
- `@wildbuck/module-application-center-frontend`: `2.0.0-11`
  - exports: `.`, `./page-registry`, `./i18n`
- `@wildbuck/module-audit-frontend`: `2.0.0-11`
  - exports: `.`, `./page-registry`, `./i18n`
- `@wildbuck/module-iam-frontend`: `2.0.0-11`
  - exports: `.`, `./auth-experience`, `./management-i18n`, `./auth-state`, `./auth-view`, `./auth-workspace`, `./current-principal-workspace`, `./role-authorization-workspace`, `./page-registry`
- `@wildbuck/module-identity-federation-frontend`: `2.0.0-11`
  - exports: `.`, `./page-registry`, `./i18n`
- `@wildbuck/module-login-brand-frontend`: `2.0.0-11`
  - exports: `.`, `./page-registry`, `./i18n`
- `@wildbuck/module-notification-setting-frontend`: `2.0.0-11`
  - exports: `.`, `./page-registry`, `./i18n`
- `@wildbuck/module-security-setting-frontend`: `2.0.0-11`
  - exports: `.`, `./page-registry`, `./settings-page.css`, `./i18n`

不要深度引入未通过 `exports` 暴露的内部文件。
