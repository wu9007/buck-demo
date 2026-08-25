# 存储加密与敏感字段规范

本文档是 Buck **存储加密 / 敏感字段 / 等值查询盲索引** 的权威约定，面向框架维护者（`core:cipher`、`core:orm-plus`）和上层业务应用。长样例见 [storage-encryption-examples.md](storage-encryption-examples.md)。实现与 #347 对齐。当前版本线允许破坏性重构与业务库重建。

## 1. 目标与非目标

| 目标 | 说明 |
| --- | --- |
| 机密性 | 可逆敏感值不以明文落库（配置开启存储加密时） |
| 可演进 | 密文自带格式版本，可从 `v1` 演进到 `v2`（如 GCM） |
| 可查询 | 需要等值查的字段用盲索引列，不在随机 IV 密文上 `=` |
| 业务无感 | 实体属性读写仍是明文语义；加解密由框架 typeHandler 完成 |
| 统一采用 | 业务仓库禁止自造平行加密/哈希索引协议 |

非目标：登录口令、OAuth client secret 走单向哈希；传输加密见 `core:transport`；文件内容见 `core:file-resource`；仅声明为敏感的字段进入本规范。

## 2. 能力归属（强制）

| 能力 | 归属 | 业务侧 |
| --- | --- | --- |
| 算法、信封编解码、盲索引 HMAC 原语 | `core:cipher` / `core:api` cipher 契约 | 只依赖发布依赖，不复制算法代码 |
| typeHandler、敏感查询改写、元数据 | `core:orm-plus` | 实体注解 + contract 列，不手写 JDBC 加解密 |
| 密钥 / pepper 配置 | 运行环境 / 密钥托管 | 不进仓库；不用默认演示密钥上生产 |
| 业务表敏感列与盲索引列 | 业务/模块 `contract/persistence.yaml` + 实体 | 按本规范命名与注解 |

**禁止**：业务模块、validation 壳、上层应用自建 AES 工具类、固定 IV、自创密文前后缀、平行「加密状态表」替代信封语义。

## 3. 字段分类（业务建模时先判定）

| 类型 | 示例 | 存储 | 等值查询 | 注解/列 |
| --- | --- | --- | --- | --- |
| **仅机密** | SMTP 密码、API Key | 密文信封 | 不支持按密文等值查 | `@BrickSensitiveField`；不建盲索引列 |
| **可查敏感** | 手机号、邮箱、证件号 | 密文信封 + 盲索引列 | `WHERE blind_col = HMAC(...)` | `@BrickSensitiveField(searchable = true, blindIndexColumn = "...")` |
| **口令/密钥哈希** | 登录密码、client_secret | 单向哈希列 | `PasswordHasher.matches` | 不要可逆加密 |
| **非敏感** | 姓名展示、组织名 | 明文 | 普通列 | 无 |

新增敏感数据必须先归类；不要把 API Key 做成可查敏感，也不要把手机号只加密不建盲索引却仍按原列等值查。

## 4. 密文信封格式（v1，强制）

```text
v1:<algorithm-token>:<iv-hex>:<ciphertext-hex>
```

| 段 | 含义 |
| --- | --- |
| `v1` | 信封格式版本；换布局/算法语义时升 `v2` |
| `algorithm-token` | `sm4-cbc`（默认）或 `aes-cbc` |
| `iv-hex` | 随机 IV，小写 hex；每次 `encrypt` 重新生成 |
| `ciphertext-hex` | CBC + PKCS5/PKCS7 填充后的密文 hex |

| 操作 | 行为 |
| --- | --- |
| `encrypt(明文)` | 新随机 IV，输出 v1 信封；已是本算法 v1 信封则幂等返回 |
| `decrypt(库内值)` | 见 §5 双态读 |
| 业务实体 getter | 始终拿到明文 |
| 直接读库 | 启用加密时应看到 v1 信封，不应看到明文机密 |

```properties
brick.orm.sensitive.enable-crypt=true
brick.orm.sensitive.crypto-mode=SM4
brick.orm.sensitive.crypto-key=<deployment-secret>
```

默认 `crypto-key` 仅用于本地/验证，禁止生产沿用框架默认值。信封为何分版本见 [storage-encryption-examples.md](storage-encryption-examples.md)。

## 5. 明文 / 密文共存（读路径双态）

允许同列同时存在明文与 v1 信封；业务代码不得自行 `if 加密 then`。

| 库内值形态 | `decrypt` 结果 |
| --- | --- |
| `null` / 空串 | 原样 |
| 合法 v1 信封 | 解密后明文 |
| 可识别的旧版裸 hex ECB | 尝试 ECB 解密；失败则当明文返回 |
| 其它 | 当历史明文原样返回 |

写路径：插入/更新的敏感字段明文只写 v1 信封。未扫到的历史明文行保持不变，直到批任务或业务更新触达。新库/可重建库应按信封写入，不要长期依赖全表明文。

## 6. 盲索引（可查敏感，强制约定）

v1 使用随机 IV，同一明文每次密文不同，不能再 `WHERE phone = encrypt(?)`。等值查询必须落在确定性盲索引列。

```text
blind = hex( HMAC-SHA256(pepper, normalize(plaintext)) )
```

| 项 | 约定 |
| --- | --- |
| pepper | `brick.orm.sensitive.blind-index-pepper`，与 crypto-key 分离；生产必配 |
| normalize | 默认 `trim`；邮箱/手机规范化可走 SPI，模块不得各写一套 |
| 空值 | null/空串不派生，索引列为空 |
| 密文列 | 原业务列名，建议长度 ≥ 512 |
| 盲索引列 | `<原列名>_blind`，HMAC-SHA256 → 64 hex |

`searchable = false`（默认）不要盲索引列；`searchable = true` 必须声明 `blindIndexColumn`，contract 必须有对应列与索引。

| 阶段 | 行为 |
| --- | --- |
| 目标态 | 等值条件落在盲索引属性；明文只经 `BrickSensitiveQuerySupport.eqBlindIndex` 派生一次 HMAC |
| 禁止 | 对密文列做 `=` / `IN` 期望命中；对盲索引列存明文；用 `LIKE` 扫密文或盲索引 |
| 禁止 | 敏感参数拦截器对盲索引列参数再次 HMAC |

模糊搜索不在本规范内。实体/查询片段与相等性泄露说明见 [storage-encryption-examples.md](storage-encryption-examples.md)。

## 7. 业务应用采用步骤（可复制）

1. 判定字段类型（§3）。
2. contract：密文列足够长；可查则加 `*_blind` + 索引。
3. 实体：`@BrickSensitiveField` + `BrickSensitiveStringTypeHandler` + `autoResultMap = true`；可查则补盲索引字段与 `searchable`。
4. 配置（环境注入）：
   ```properties
   brick.orm.sensitive.enable-crypt=true
   brick.orm.sensitive.crypto-mode=SM4
   brick.orm.sensitive.crypto-key=${BRICK_STORAGE_CRYPTO_KEY}
   brick.orm.sensitive.blind-index-pepper=${BRICK_STORAGE_BLIND_INDEX_PEPPER}
   ```
5. API/审计：机密类字段响应用「已配置」布尔或脱敏，禁止回传解密后的密钥材料；审计 payload 不得含明文机密。
6. 禁止业务 Service 调用 `Cipher.getInstance` 自加密后写入。
7. 能力不足时回流 `buck` Issue，不在业务仓分叉协议。

Maven：通常经 `buck-starter-application` / `core:orm-plus` 进入依赖图。契约类型在 `io.github.wu9007:buck-core-api`；默认实现 `buck-core-cipher`。

## 8. 与口令哈希的边界

| | 存储加密（本规范） | 口令哈希 |
| --- | --- | --- |
| API | `BrickStorageCipherService` | `PasswordHasher` |
| 可逆 | 是（有密钥） | 否 |
| 典型列 | `api_key_ciphertext`、PII | `password_hash`、`client_secret_hash` |
| 查询 | 机密不可查；PII 走盲索引 | `matches(raw, hash)` |

## 9. 升级路径：重建库（当前推荐）

当前版本线以可重建库为主，不提供框架内置在线分批重加密作业：重建/迁移 schema → 种子可先写明文默认值 → 启动 bootstrap 写时加密 → 读路径双态兼容未触达历史明文。验证壳与可接受清空数据的环境：删库 → Flyway → 默认值 → 启动 bootstrap。不能清库的长时混存另立 issue。

## 10. 扩展点与验收

扩展：`BrickStorageCipherProvider` / `Delegate`（密码机、KMS）、`BrickStorageBlindIndexService`、信封 `v2+` 仅 core 升级解析。业务优先换配置/换 Provider Bean，不要改信封字符串拼接规则。

- [ ] 启用后库内仅机密/可查敏感列看不到明文密钥或 PII 明文（未迁移历史明文除外）。
- [ ] 新写入为 `v1:` 前缀信封；同一明文两次写入密文不同。
- [ ] 可查字段等值查走盲索引；pepper 与 crypto-key 分离且非默认。
- [ ] 业务代码无手写加解密；实体读写明文语义。
- [ ] API/审计无泄露密钥明文；生产覆盖默认 `crypto-key` / pepper。

IAM 员工试点列映射见 [storage-encryption-examples.md](storage-encryption-examples.md)。ORM 总规范见 [orm-plus.md](orm-plus.md)；业务采用见 [business-module-adoption-reference.md](../delivery/business-module-adoption-reference.md)。
