# capability hit

Load this reference only when the current phase needs it. `SKILL.md` remains the hot entrypoint.

## Capability Hit Gate

Before implementation, read `capabilities/README.md` and `capabilities/capability-catalog.json`. Use `capabilityAdoption[]` for machine fields (`preconditions`, `sideEffects`, `tags`, `whenNot`, maturity). Then scan the business requirements against the table below — the table is the human-readable hit list and must stay complete. If a capability is hit, adopt the listed Buck capability. If you decide not to adopt it, write the reason, alternative, risk, and approver in `docs/business/module-adoption-decision.md`, then wait for confirmation before implementation. That document must explicitly cover IAM, notification-setting, security-setting, audit, application-center, `core:query`, `core:option`, and `core:orm-plus`; do not leave a one-line “adopt Buck core/module” placeholder.

| Business requirement hit | Must adopt |
| --- | --- |
| Users, employees, organizations, roles, menus, permissions, permission assignment, current principal, online sessions | `modules:iam`, `core:authentication`, `core:authorization` |
| External identity sources, federated OAuth2/DingTalk login, directory sync, linking external subjects to local employees | `modules:identity-federation` (**maturity: released-candidate** — production default wait for `released`) + IAM directory ports + `core:oauth2`; login-entry allowlist stays in `modules:security-setting` |
| EMAIL/SMTP provider settings, mail channel governance, sender identity configuration | `modules:notification-setting`, `core:notification-mail` |
| Login security, password policy, weak password library, MFA policy, single login, device check, transport security setting | `modules:security-setting`, `core:authentication`, `core:transport` |
| Audit log storage, audit search, audit detail page, login/security/ORM/business action audit query | `core:audit`, `modules:audit` |
| Production troubleshooting traceId, MDC, request completion logging, response `trace-id` header, Logback traceId pattern | `core:observability`; use the release bundle `templates/backend-minimal/src/main/resources/logback-spring.xml` baseline and keep `%X{traceId}` |
| Browser startup public runtime metadata | `core:client-meta`, `@wildbuck/core-client-meta-frontend` |
| Product usage events, feature exposure/enter/action success/failure/abandonment tracking | `core:usage-event`, `@wildbuck/core-usage-event-frontend`, bootstrapped from `client-meta`; module events use `createModuleUsageTracker()` |
| Image resources, business attachment images, resource references, content preview, and retention cleanup | `core:file-resource`, `@wildbuck/core-ui-frontend/fields` |
| Third-party applications, OAuth clients, redirect URIs, scopes, OpenAPI action catalog, machine access allowlist | Default to `modules:application-center`, `core:oauth2`, `core:openapi`; if the business already owns an organization-access feature, implement the `core:openapi` client/action authorization SPI there. |
| Business AI assistants, model conversations, assistant sidebars, and tool-call approvals | `modules:ai-assistant` (**maturity: released-candidate** — API/contracts may still change; production default wait for `released`), `core:ai-agent`, `@wildbuck/module-ai-assistant-frontend`; assistants use `BrickAiAssistantDefinitionProvider`, tools use `BrickAiToolProvider` and `BrickAiToolExecutor`. |
| External agent process needs standard MCP tools/list and tools/call against this business app (not console sidebar assistant) | `core:mcp` (`buck-core-mcp`, explicit dependency) + tool contribution via `core:ai-agent` (`BrickAiToolProvider` / `BrickAiToolExecutor`; auto-bridged to MCP when ai-agent is on classpath); add formal modules when platform capabilities are hit. Keep default `brick.mcp.allow-anonymous=false` (do not copy validation-shell true). |
| Unified HTTP success/error envelope, `BrickApiResponse`, frontend `request<T>()` unwrap | `core:api`, `@wildbuck/core-api-frontend`; do not invent another envelope |
| Business error codes, default exception response, user-visible error text | `core:error`, module `contract/errors.yaml`, `.brick/error-catalog.json`; do not show raw HTTP status as copy |
| Console shell, page/field patterns, theme tokens, list header/filter/stat components | `core:ui`, `@wildbuck/core-ui-frontend`; do not copy the validation shell or parallel `Console*` components |
| Filtering, pagination, sorting, query DSL | `core:query`, `@wildbuck/core-query-frontend` |
| Select, radio, multi-select, tag, enum, dictionary options | `core:option`, `BrickOptionProvider`, `@wildbuck/core-option-frontend` |
| Business persistence, migrations, logical delete, sensitive fields, signatures, change logs, primary-key strategy | contract, MyBatis-Plus, `core:orm-plus`; single `string(20)` primary key; `IdType.ASSIGN_ID` entity IDs |
