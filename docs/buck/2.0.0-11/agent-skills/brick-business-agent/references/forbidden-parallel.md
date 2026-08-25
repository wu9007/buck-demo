# forbidden parallel

Load this reference only when the current phase needs it. `SKILL.md` remains the hot entrypoint.

## Forbidden Parallel Governance

- Do not create `UserController`, `RoleController`, `MenuController`, `PermissionController`, `SessionController`, or equivalent tables/pages to replace IAM.
- Do not create SQL files, command-line scripts, application runners, seed controllers, or migration shortcuts that initialize IAM users, roles, menus, permissions, or admin passwords. Use IAM bootstrap and its documented configuration surface.
- Do not create `AuditLogEntity`, audit tables, audit query controllers, or audit pages to replace the audit module.
- Do not create password policy tables, MFA policy tables, login security controllers, or transport-security setting pages to replace the security-setting module.
- Do not create a local TraceIdFilter, RequestLoggingFilter, request/response body logger, or observability subsystem to replace `core:observability`. Do not merge usage event JSON lines, audit facts, and production troubleshooting logs into one format.
- Do not create a local client meta endpoint, config center, or frontend startup protocol to replace `core:client-meta`, and do not use client-meta to return secrets, tokens, connection strings, request bodies, form content, or business objects.
- Do not create a local analytics SDK, usage event endpoint, JSON-line log format, or tracking subsystem to replace `core:usage-event`, and do not expose `/brick/usage-events/collect` as an anonymous logging endpoint. Do not create a local usage-event log format, duplicate usage-event frontend/backend switches, or scatter usage-event payload assembly and success/failure wrapper branches across pages; configure the host logger or marker route instead.
- Do not store image Base64 blobs in business tables, logs, query responses, or audit payloads. Use `core:file-resource`; business tables store resource IDs, categories, sizes, and expireAt, then delete or disable the Buck file resource before deleting the business record during retention cleanup.
- Do not create a long-term local OpenAPI HMAC Filter, signature canonicalization rule, replay protection mechanism, scope/action primary check, or access log model. Reuse `core:oauth2` for client credentials and `core:openapi` for Bearer-post integrity; business organization-access code may only supply OAuth2 client/action authorization data through `core:oauth2` SPI, signing material through `OpenApiHmacIntegrityCredentialProvider`, business secondary integrity checks through `OpenApiHmacIntegrityValidator`, and clustered nonce storage through `OpenApiHmacNonceStore`. HMAC must not be used as a direct authentication path.
- Do not create a generic CRUD agent, generic database agent, or generic OpenAPI agent. Do not create a local AI conversation table, assistant catalog, tool-call state machine, or hardcoded frontend assistant list to replace `modules:ai-assistant`. Do not read or copy validation/security-console as an AI assistant implementation source. AI tools must not use direct JDBC, handwritten SQL, unrestricted OpenAPI calls, or repository/controller shortcuts; they call business services under the current principal and Buck tool policy.
- Do not create a long-lived parallel MCP server or tool registry when `core:mcp` is the hit. Do not use admin CRUD as the external-agent main path. Do not set production `brick.mcp.allow-anonymous=true` by copying the validation shell. Do not wire external-agent MCP into `modules:ai-assistant` session APIs as a substitute for `core:mcp`.
- Do not create a local universal-query framework under `query/`; use `core:query`.
- Do not handwrite page list filtering, pagination, or sorting in Controller/Service with MyBatis-Plus wrappers; use `core:query`.
- Do not create a local audit subsystem under `audit/`; use DO metadata, `core:audit`, and `modules:audit`.
- Do not create a generic `integration/` package that mixes external clients, internal calls, and adapters.
- Do not create any backend directory outside the release-bundle allowlist to hold a parallel mechanism.
- Do not keep a local wheel because Buck is missing a capability. File a brick-next issue and wait for a framework capability, extension point, or approved temporary path.
- Do not copy `validation/security-console` providers, resolvers, debug endpoints, hardcoded targets, or other “先跑通再说” implementations into the business repository. Current-user contact data, MFA targets, notification routes, and similar formal semantics must come from formal business master data and released Buck capabilities.
