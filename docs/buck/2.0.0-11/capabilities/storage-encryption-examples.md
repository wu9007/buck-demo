# 存储加密样例

主规则见 [storage-encryption.md](storage-encryption.md)。本文只放信封说明、实体/查询片段和 IAM 试点细节，不改协议。

## 为什么需要 `v1`

- 标识「这是框架信封」而不是历史明文或其它系统编码。
- 允许以后引入 `v2:sm4-gcm:...` 时同列混存新旧信封，读路径按版本分支解密。
- 与「算法名」分工：`algorithm-token` 描述密码学模式；`v1` 描述字符串如何解析。

完整示例：

```text
v1:sm4-cbc:a1b2c3d4e5f60718293a4b5c6d7e8f90:9f3c...
```

## 实体与查询片段

```java
@BrickSensitiveField(searchable = true, blindIndexColumn = "phone_number_blind")
@TableField(value = "phone_number", typeHandler = BrickSensitiveStringTypeHandler.class)
private String phoneNumber;

/** 框架/写入钩子维护；业务不要手填，查询条件由框架改写或走统一 API */
@TableField("phone_number_blind")
private String phoneNumberBlind;
```

```java
String phoneBlind = BrickSensitiveQuerySupport.blindIndexOf("13800000000");
if (phoneBlind != null) {
  criteria.appendFilterGroup(QueryFilter.group(QueryFilter.eq("phoneNumberBlind", phoneBlind)));
}
```

列表条件：AND（组织、启用状态）走 `QueryCriteria.topFilter`；OR 关键字（姓名 LIKE 或手机盲索引 eq）走 `appendFilterGroup`。

## 相等性泄露

盲索引故意在同 pepper 下同文同值，以便查询。这比明文或 ECB 密文直接相等可控：无 pepper 不能还原明文，但低熵值（手机号）存在离线猜测风险。pepper 必须高熵且保密，生产禁止默认值。

## IAM 员工试点细节

| 业务属性 | 密文列 | 盲索引列 | 列表 keyword 行为 |
| --- | --- | --- | --- |
| 手机号 | `phone_number` | `phone_number_blind` | 11 位数字 → `phoneNumberBlind` 等值 |
| 邮箱 | `email` | `email_blind` | 含 `@` → `emailBlind` 等值 |
| 身份证 | `id_card_number` | `id_card_number_blind` | 15/18 位证件形态 → `idCardNumberBlind` 等值 |
| 姓名/工号 | 明文 | — | `LIKE` |

写库前调用 `BrickSensitiveBlindIndexSupport.fillBlindIndexes(entity)`。验证壳不重建库时的默认联系方式：手机 `13800000000`、邮箱 `operator@example.com`、身份证 `110101199001010011`。

- Flyway 手写 DML：`V1_0_0_50_005__iam_employee_sensitive_default_values.sql`（对空/无 blind 的活跃员工写入明文默认值）。
- 为何不写密文/HMAC 进 SQL：依赖运行时 `crypto-key` / `blind-index-pepper`，迁移时不可知。
- 启动 bootstrap 会再次 `ensureEmployee` + 填盲索引，经 typeHandler 落成 v1 信封。

## 相关代码

| 资源 | 路径 |
| --- | --- |
| 信封工具 | `core/api/.../BrickStorageCipherEnvelope.java` |
| 默认实现 | `core/cipher/.../JceBrickStorageCipherService.java` |
| 盲索引 | `core/cipher/.../HmacBrickStorageBlindIndexService.java` |
| 写入填充 | `core/orm-plus/.../BrickSensitiveBlindIndexSupport.java` |
| typeHandler | `core/orm-plus/.../BrickSensitiveStringTypeHandler.java` |
| 员工实体 | `modules/iam/.../EmployeeEntity.java` |
