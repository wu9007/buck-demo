# AiAssistant AI Context

`modules:ai-assistant` 是 Buck AI 助手模块，负责 AI 服务配置、助手定义发现、会话持久化和工具调用状态机。

## 当前职责

- 管理 AI 服务配置、启用状态、provider code、默认模型、旧 `credentialRef` 兼容和密文托管 API Key。
- 管理数据库型助手配置、系统提示词和工具绑定；助手定义本身不再绑定模型服务或默认模型。
- 提供 `BrickAiAssistantDefinitionProvider` 助手定义贡献 SPI，允许正式模块或上层业务应用声明助手 code、名称、提示词和绑定工具。
- 当检测到 `modules:security-setting` 时，内置贡献正式 `security` 助手定义，统一复用安全设置工具与审计摘要工具；验证壳不再单独 seed 安全助手。
- 当检测到 `modules:iam` 时，内置贡献正式 `system-admin`（系统管理助手）定义，绑定员工/组织/角色/会话/功能点等 IAM 运维工具；助手可见性依赖任一相关 IAM 业务权限（员工、组织、角色、会话、菜单），不在验证壳硬编码。
- 通过 `AiAssistantDefinitionService` 将数据库型助手和贡献型助手统一解析为运行时定义。
- 创建会话、保存用户/助手消息，并通过 `core:ai-agent` 调用模型 provider。
- 构造模型请求时使用 `brick.ai-assistant.model-context.max-messages` 限制最近有效历史消息窗口，默认 20；系统提示和当前消息由后端显式注入，会话接口仍返回完整持久化历史。
- 助手列表独立于 AI 服务存在与否；真正创建会话或发送消息时，才根据当前会话指定模型服务或首个可用 AI 服务解析本轮模型。
- 会话生命周期由后端负责：关闭助手标签只影响前端显示；清空当前对话会关闭旧会话并创建新会话；删除对话使用逻辑删除隐藏会话、消息和工具调用。
- 将模型请求的工具调用落为 `PENDING_APPROVAL`、`APPROVED`、`EDITED`、`REJECTED`、`EXECUTING`、`SUCCEEDED`、`FAILED`、`EXPIRED` 等状态。
- 通过 `BrickAiToolRegistry` 和 `BrickAiToolExecutorRegistry` 获取工具描述与执行器，并按当前主体权限过滤可用工具。
- 内置 `fake` 模型 provider 仅用于本地和自动化测试，不绑定外部模型 SDK。

## 明确不负责

- 不实现登录安全、密码策略、传输安全或审计日志的业务规则；这些工具应由对应正式模块贡献。
- 不在配置 JSON、前端详情、日志或工具结果中返回 API key、token、password、secret 等明文；模型服务 API Key 只能通过 `core:orm-plus` 敏感字段密文托管或旧 `credentialRef` 兼容路径使用。
- 不承载平台端、租户、多租户或上层应用启动壳逻辑。
- 不在模块内手写 SQL、直接使用 JDBC，或绕过 `core:authorization`、`core:orm-plus`、`core:ai-agent`。
- 不把验证壳作为助手业务逻辑来源。

## 边界

- 对外 API、DTO、错误码和持久化结构以 `contract/` 为单一来源。
- 生成代码和迁移产物不得手改。
- 会话、agent loop、工具执行和工具目录运行时只能通过 `AiAssistantDefinitionService` 解析助手，不直接依赖 `AiAssistantDao` 或 `AiAssistantEntity`。
- 业务应用扩展助手时只贡献 `BrickAiAssistantDefinitionProvider` 和对应 `core:ai-agent` 工具，不在验证壳或前端硬编码助手清单。
- 贡献型助手通过 `BrickAiAssistantDefinition.permissionCodes` 声明当前主体需要具备的业务功能点权限；普通侧栏只展示当前用户具备对应业务权限的助手，不使用独立 AI 专用使用权限。
- 贡献型助手只声明 `toolCodes`；工具是否可见、是否可执行仍由当前主体权限和工具描述的 `permissionCode` 决定。
- 内置 `security` 助手不再依赖模型服务预绑定；默认会跟随当前可用模型服务清单选择会话初始模型服务，用户仍可在会话中切换。
- `modules/ai-assistant/frontend` 已提供 `assistant-panel`、`shell-entry` 和 `page-registry` 正式入口；验证壳只装配。
