# backend structure

Load this reference only when the current phase needs it. `SKILL.md` remains the hot entrypoint.

## Backend Structure Gate

Use the business release bundle and `docs/business/backend-structure.md` if present. If that file is missing, propose it before implementation.

Default to a single backend module unless the business context clearly defines multiple business components that need in-process collaboration or independent migration boundaries.

Single-module backend shape:

```text
backend/src/main/java/com/example/<app>/
  <App>Application.java
  config/
  constant/
  exception/
  utils/
  applet/
    <feature>/
      controller/
      dto/
      repository/
      service/
      provider/
```

Multi-module backend shape:

```text
backend/
  <app>-module-common/
  <app>-module-<component>/
  <app>-boot/
```

Rules:

- Single-module applications do not create `innerapi`; same-module feature collaboration goes through service boundaries.
- Multi-module applications may keep `innerapi`, but only as contracts in `<app>-module-common` and implementations in component modules. Callers must not depend on another component's implementation module.
- Multi-module applications must declare each component's appMode ownership, migration directory, menu/function namespace, permission namespace, frontend route group, and backend API path. Shared features must not use a single business domain namespace; use a shared namespace such as `open-platform.*` / `open-platform:*` or a business-approved equivalent.
- Frontend and backend appMode must match. Do not run a single-module frontend against a suite backend or use suite verification to claim a single-module appMode is ready. Each declared appMode needs paired startup commands, empty-database backend startup or equivalent verification, frontend check/build, and core IAM menu/function/permission checks.
- 中文短句：前后端 appMode 必须一致，`suite` 通过不能替代单模块 appMode 验证。
- Module migration directories may create and maintain only their own tables, indexes, constraints, and default data. Do not reference other business module tables through Flyway foreign keys, `alter table`, `insert/select`, `update`, `delete`, data sync scripts, repair scripts, or default-data linkage. Cross-module collaboration goes through service boundaries, `innerapi`, events, or SPI.
- Business Controller paths use real business domain semantics. Do not default to `/admin`, and do not put the frontend proxy prefix `/api` into Spring mappings. Access control belongs to Buck authentication/authorization and permission points, not to path prefixes.
- When IAM is adopted, runtime left navigation must come from the current principal IAM menu projection, such as `/iam/current-principal/workspace` `navigationMenus`. Route metadata and module routes only register executable pages and bind components; they are not the source of menu titles, grouping, sorting, enablement, or visibility.
- Use only the standard backend directory allowlist. Directories such as `query/`, `audit/`, and `integration/` are examples of non-allowlisted directories, not special one-off rules.
- Query capability comes from DO/persistence metadata, explicit `BrickQueryDefinition`, field/operator allowlists, and `core:query`.
- Page/API list filtering, pagination, and sorting must use `BrickQueryDefinition`, `QueryCriteria`, and `BrickQueryExecutor`. Do not implement page list protocols in Controller/Service with `LambdaQueryWrapper`, `QueryWrapper`, or `Wrappers.lambdaQuery` plus `selectList` / `selectPage`, `like`, `orderBy`, page/size, or frontend-controlled sort fields. Internal exact reads by primary key, unique key, or fixed foreign key can use MyBatis-Plus, but must not become a page list protocol.
- Data-change audit metadata comes from DO annotations such as `@BrickPersistentEntity` and `@BrickChangeLogField`; business action audit is published from service code through `BrickAuditPublisher`.
- ORM Plus physical mapping comes from MyBatis-Plus annotations and conventions: table name from `@TableName`, column names from `@TableId` / `@TableField` or camelCase-to-snake_case inference, and primary key from `@TableId`. Use `@BrickPersistentEntity("显示名")` for display name and change-log switches. Do not use `@BrickColumn`; field length, nullable, index and constraint metadata belong to contract/Flyway, and sensitive/signature/change-log behavior uses dedicated Buck annotations.
- External system clients should use clearly named `client/` or `remote/`; externally published APIs should use `openapi/`; do not use a generic `integration/` bucket.
- Migration directories should follow `src/main/resources/db_<app-or-component>/<database>/V<business-version>_<seq>__<description>.sql`. If the release bundle does not publish a business migration generator, reviewed Flyway DDL is allowed only as a migration artifact in that directory; business runtime code must still avoid direct JDBC or handwritten SQL.
- For Dameng DM runtime, add `runtimeOnly 'com.dameng:DmJdbcDriver18'` and let `buck-bom` provide the version. Inject datasource URL, username, and password from the runtime environment. DM support does not relax persistence boundaries: migrations still belong under `db_<app-or-component>/dm`, and business runtime code must not use direct JDBC or handwritten SQL.
- The business repository CI must run `node docs/buck/<version>/rules/check-business-structure.mjs .`. If it fails, fix the directory or adopt Buck core/modules; do not remove the job, weaken the script, or skip the check.
