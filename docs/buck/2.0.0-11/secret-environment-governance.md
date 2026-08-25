# 团队密钥与环境变量治理

本文定义 Buck 维护仓库、发布资料包和上层业务仓库共享的密钥与环境变量规则。它覆盖真实数据库、Nexus、私有 npm、镜像仓库、K8s、短信/邮件、第三方 OAuth/OpenAPI 凭据等运行和发布依赖。

## 基本原则

- 团队共享变量名、用途、加载方式、权限要求和验证证据，不共享明文密钥文件。
- 团队权威来源只能是密码管理器、GitHub/Project CI/CD Variables、GitHub Actions secrets、K8s Secret、配置中心或经安全负责人批准的等价密钥系统。
- 本地开发的真实值只能落在仓库外私有文件，例如 `~/.brick/<repo-name>/local-secrets.env`。
- 仓库、issue、MR、skill、release bundle、日志和截图不得出现真实密码、token、client secret、数据库真实地址或生产连接串。
- CI/CD 变量中的凭据必须设置为 masked；发布、生产或受保护环境变量应设置为 protected。
- 自动化脚本只能输出变量名、是否存在、文件权限、日志路径和验证结果，不能输出变量值。

## 本地开发约定

每个仓库使用独立的本地私有 env 文件：

```text
~/.brick/<repo-name>/local-secrets.env
```

以 `buck` 为例：

```bash
install -d -m 700 ~/.brick/brick-next
cp local-secrets.env.example ~/.brick/brick-next/local-secrets.env
chmod 600 ~/.brick/brick-next/local-secrets.env
```

开发或验证前加载：

```bash
set -a
source ~/.brick/brick-next/local-secrets.env
set +a
```

检查权限和变量存在性时使用 `secret-env local-check`，只输出变量名和状态：

```bash
npm run brick -- secret-env local-check \
  --file ~/.brick/brick-next/local-secrets.env \
  --vars BRICK_DM_JDBC_URL,BRICK_DM_USERNAME,BRICK_DM_PASSWORD
```

## 变量分组

数据库专项 smoke 使用专项变量，避免把不同数据库的真实连接串混进通用 Spring 配置：

| 数据库 | URL | 用户名 | 密码 |
| --- | --- | --- | --- |
| DM | `BRICK_DM_JDBC_URL` | `BRICK_DM_USERNAME` | `BRICK_DM_PASSWORD` |
| Oracle | `BRICK_ORACLE_JDBC_URL` | `BRICK_ORACLE_USERNAME` | `BRICK_ORACLE_PASSWORD` |
| PostgreSQL | `BRICK_PG_JDBC_URL` | `BRICK_PG_USERNAME` | `BRICK_PG_PASSWORD` |
| MySQL | `BRICK_MYSQL_JDBC_URL` | `BRICK_MYSQL_USERNAME` | `BRICK_MYSQL_PASSWORD` |
| openGauss / GaussDB | `BRICK_GAUSS_JDBC_URL` | `BRICK_GAUSS_USERNAME` | `BRICK_GAUSS_PASSWORD` |

业务应用运行时 datasource 优先使用 Spring 标准环境变量：

```text
SPRING_DATASOURCE_URL
SPRING_DATASOURCE_USERNAME
SPRING_DATASOURCE_PASSWORD
```

验证 smoke 运行策略值：

| 目标 | 变量 |
| --- | --- |
| 管理端员工/会话 smoke 初始密码策略补齐 | `BRICK_SECURITY_CONSOLE_INITIAL_PASSWORD` |

发布与私服变量：

| 目标 | 变量 |
| --- | --- |
| Nexus | `NEXUS_URL`、`NEXUS_MAVEN_URL`、`NEXUS_USERNAME`、`NEXUS_PASSWORD` |
| 公共 npmjs `@wildbuck` | `NPM_TOKEN`（Automation / granular）；可选 `NPM_REGISTRY_URL`（默认 `https://registry.npmjs.org/`） |
| 私有 npm | `NPM_REGISTRY_URL`、`NPM_TOKEN` 或 `NPM_USERNAME`、`NPM_PASSWORD`、`NPM_EMAIL` |
| GitHub Packages Maven | `GITHUB_PACKAGES_MAVEN_URL`、`GITHUB_ACTOR`、`GITHUB_TOKEN`（Actions 自动注入 token） |
| Maven Central | `MAVEN_CENTRAL_USERNAME`、`MAVEN_CENTRAL_PASSWORD`（Central Portal user token，不是登录密码） |
| GPG 签名 | `SIGNING_KEY`、`SIGNING_KEY_ID`、`SIGNING_PASSWORD`（ASCII-armored 私钥；CI 内存签名） |
| Docker Registry | `REGISTRY_URL`、`DOCKER_USER`、`DOCKER_PASS` |
| K8s / 制品 | `NAMESPACE`、`FS_URL` |

## CI/CD 约定

- Buck 发布流水线和业务流水线从 GitHub Actions secrets 读取 Nexus、npm、Maven Central、GPG、镜像仓库和 K8s 变量。GitHub Packages 发版路径使用 `GITHUB_TOKEN`；Maven Central 使用 `MAVEN_CENTRAL_USERNAME` / `MAVEN_CENTRAL_PASSWORD` 与 `SIGNING_KEY*`。不把明文写入仓库。
- 真实数据库 smoke 可以配置为手工 job；job 读取 GitHub Actions secrets，不在仓库保存连接串。
- 后端运行库与 CI 临时验证库必须分离。开发环境运行库通过 K8s Secret 或环境侧预建 Secret 注入，不能写入镜像、Dockerfile 或仓库配置。
- 业务仓库可使用发布资料包模板里的 runtime Secret 机制，但只能传递变量到 K8s Secret，不得把值打印到 job 日志。

## 证据记录

issue/MR 只能记录：

- 使用的变量名。
- secret 来源类别，例如“GitHub CI/CD Variables”、“GitHub Actions secrets”或“团队密码管理器”。
- 执行命令、日志路径、metadata 路径、pipeline/job 链接。
- 变量存在性检查结果，例如 `BRICK_DM_PASSWORD=SET`。
- 验证结果和失败原因。

issue/MR 不记录：

- 明文密码、token、client secret、签名密钥。
- 真实生产连接串或真实生产 IP。
- `.env`、`.npmrc`、`gradle.properties` 的真实内容。

## 自动化守卫

仓库级检查：

```bash
npm run secret-env:check
```

该命令扫描文本文件中的明显高风险真实值，例如真实 JDBC host、`PASSWORD` / `TOKEN` / `SECRET` 赋值。它允许 `.example` 模板、占位符、`${ENV_VAR}`、GitHub Actions `${{ secrets.* }}` 以及约定的本地开发默认值。

本地文件检查：

```bash
npm run brick -- secret-env local-check --file ~/.brick/brick-next/local-secrets.env --vars NEXUS_USERNAME,NEXUS_PASSWORD
```

该命令只检查权限和变量名，不解析、不打印变量值。

## Skill 和发布资料包同步

- `buck-next-maintainer` 负责维护本规范、仓库守卫、release bundle、GitHub issue/MR 证据和本机安装副本。
- `buck-business-agent` 只面向业务仓库，要求业务侧从当前发布资料包、GitHub Actions secrets、K8s Secret 或团队密码管理器获取凭据，不读取 `buck` 维护者本机文件。
- release bundle 必须包含本规范、`local-secrets.env.example`、业务 CI/CD 变量说明和 business skill 规则。
- 能用 `secret-env:check` 或业务结构脚本阻断的规则，不只写在 skill 里。
