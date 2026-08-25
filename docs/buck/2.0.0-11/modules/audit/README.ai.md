# modules:audit AI 上下文

## 模块职责

`modules:audit` 是审计业务模块，负责把 `core:audit` 发布出来的标准审计事件落库，并对外提供查询、详情和后续展示能力。

它不负责：

- 认证/鉴权/ORM 审计事实的采集规则
- MyBatis 拦截器细节
- 平台端、租户端或具体业务工作流逻辑

这些职责都不应该回流到本模块。

## 当前实现范围

- 契约优先的审计接口：
  - `POST /audit/logs/search`：分页列表（`core:query`）
  - `POST /audit/logs/summarize`：按当前筛选条件聚合成功/失败/分类/动作（供页眉全量指标与 AI 工具）
  - `POST /audit/logs/{auditLogId}/detail`：详情
  - `POST /audit/logs/export`：CSV 导出（权限 `audit:log:export`，上限 1000 条，不含详情 JSON/密钥）
- 审计日志持久化表：`brick_audit_log`
- `BrickAuditSink` 数据库实现：`DatabaseBrickAuditSink`
- 审计日志服务与控制器：查询分页、聚合摘要、详情读取
- 前端生产体验：快捷时间范围、活跃筛选 chips、失败行高亮、字段变更人读表格、CSV 导出（上限 1000 条，不含详情 JSON/密钥）
- **多表 / 主子表操作视图**（数据变更页签，#438/#439/#440）：
  - 落库仍为一实体一行（ORM 默认）；同请求共享 `traceId`
  - 打开详情时拉取同 `traceId` 的兄弟 `DATA_CHANGE`（上限见 `AUDIT_RELATED_TRACE_MAX`，可加载更多；截断必须提示）
  - 手写聚合可选 `fieldChangesJson.schemaVersion=2` + `entities[]`（primary/child/related）
  - 人读：`keyBusinessData` → 实体标题/身份条；字段主文案用注解 `displayName`；字典走 `dictionaryProvider` / `staticDictionaryType`
  - 结构：操作叙事头 + 主/从/关联分区；关键字段置顶；一般字段超过阈值折叠；页内字段筛选
  - ORM 适配（`core:audit`）：`targetName` 优先实例业务名，`summary` 形如 `角色「系统管理员」:UPDATE`
- 时间筛选兼容浏览器 `YYYY-MM-DD HH:mm:ss` 与 ISO `T` 分隔
- 面向 AI 安全助手的只读审计摘要工具：通过 `core:ai-agent` 贡献 `security.audit.summarize`，内部复用 `AuditLogService` 和 `core:query`，只返回摘要字段，不暴露审计主键、操作者 ID、目标 ID 或详情 JSON。
- 多数据库 Flyway 迁移：由 `contract/persistence.yaml` 生成

## 关键文件

- `manifest.yaml`：权限、菜单、契约和包路径声明
- `contract/api.yaml`：接口契约
- `contract/dto.yaml`：DTO 契约
- `contract/errors.yaml`：错误码契约
- `contract/persistence.yaml`：持久化契约
- `backend/src/generated/java`：生成的 API、DTO、授权规则，不能手改
- `backend/src/main/java/io/github/wu9007/buck/modules/audit/log`
- `backend/src/main/resources/db_audit`

## 安全编辑区

- 可以改契约和手写实现文件
- 改契约后必须运行 `npm run generate`
- 不允许手写 `.sql`
- 不允许直接使用 `JdbcTemplate` 或原始 SQL 做模块持久化
- 不允许把认证内部实现类、ORM 拦截器内部类直接拉进本模块
