# 业务应用 CI/CD 规范

本文面向上层业务开发组、业务开发智能体和业务仓库维护者，说明业务应用如何使用 Buck 发布资料包建立流水线。它不替代 `buck` 自身 tag 发版流水线。runner / 目录 / 制品样例见 [business-ci-cd-examples.md](business-ci-cd-examples.md)。

## 目标和边界

业务 CI/CD 负责把独立业务仓库从源码交付到开发环境、测试人员专用测试环境和 tag 制品库：

- `dev` 分支自动验证、构建镜像并部署到 K8s 开发环境。
- `test` 分支自动验证、构建镜像并部署到 K8s 测试环境，供测试人员提测和回归。
- `main` 分支只作为发布基线验证，不自动部署 dev/test 环境。
- tag 自动验证、构建后端和前端交付物，并上传到 GitHub Release 资产（`FS_URL` 指向 Release 根地址）。
- 所有发布和部署必须依赖 Buck 规则检查、后端测试和前端检查。

Buck 负责提供发布资料包中的 `.github/workflows/ci.yml` 模板、Docker/K8s 模板、业务规则检查和文档。业务仓库负责按项目实际情况维护少量业务变量、K8s 域名、端口、运行 profile 和业务验收命令。

## 组级变量

业务仓库与旧验证壳项目位于同一 GitHub 分组时，默认复用分组 CI/CD Variables。业务仓库不应提交真实凭据。变量命名、来源、mask/protected 要求、本地开发私有 env 和证据记录统一按发布资料包中的 `secret-environment-governance.md` 执行；本地开发从 `templates/local-secrets.env.example` 复制到仓库外 `~/.brick/<repo-name>/local-secrets.env`。

| 变量 | 来源 | 用途 |
| --- | --- | --- |
| `FS_URL` | 仓库变量 | GitHub Release / 制品上传根地址，通常为 `https://github.com/wu9007/buck`。 |
| `REGISTRY_URL` | 仓库变量 | 容器镜像仓库地址（GHCR 或业务自建 registry）。 |
| `DOCKER_USER` / `DOCKER_PASS` | 仓库 secrets | 镜像仓库登录凭据。 |
| `NAMESPACE` | 仓库变量或模板默认值 | K8s 命名空间前缀，开发环境使用 `${NAMESPACE}-dev`。 |
| `GITHUB_TOKEN` | Actions 自动提供 | 通知与 Release 上传。未配置额外通知时 job 只写日志，发布和部署结果不能被伪造为成功。 |
| `NEXUS_MAVEN_URL` / `NEXUS_USERNAME` / `NEXUS_PASSWORD` | 可选仓库 secrets | 仅当业务仓不走 GitHub Packages 时，后端拉取 Buck Maven 依赖。 |
| `NPM_REGISTRY_URL` / `NPM_TOKEN` 或 npm 账号变量 | 可选仓库 secrets | 前端拉取 Buck npm 依赖；默认从 GitHub Release tarball 安装。 |
| `BUSINESS_TEST_DB_URL` / `BUSINESS_TEST_DB_USERNAME` / `BUSINESS_TEST_DB_PASSWORD` | 项目或分组变量 | 测试环境运行库连接信息。`test` 部署 job 写入 K8s Secret 时映射成应用读取的 `BUSINESS_DB_URL` / `BUSINESS_DB_USERNAME` / `BUSINESS_DB_PASSWORD`。 |

所有凭据类变量只能在 GitHub Actions secrets、K8s Secret、配置中心或团队密码管理器中保存明文。issue、MR、日志和截图只记录变量名、来源类别、`SET/MISSING` 状态、pipeline/job 链接和验证结果。

业务仓库可在 `.github/workflows/ci.yml` 覆盖下列项目参数：

| 变量 | 默认值 | 用途 |
| --- | --- | --- |
| `svcport` | `8080` | 后端容器和 Service HTTP 端口。 |
| `frontend_svcport` | `80` | 前端容器和 Service HTTP 端口。 |
| `replicas` | `1` | 开发环境副本数。 |
| `ingress` | `${{ github.event.repository.name }}` | Ingress 域名前缀。 |
| `prefix` | `/` | Ingress path 前缀。 |
| `dev_profile` | `dev` | 后端开发环境 Spring profile。 |
| `test_profile` | `test` | 后端测试环境 Spring profile。 |
| `DEV_DEPLOY_BRANCH` | `dev` | 触发开发环境镜像构建和 K8s 部署的分支，固定为 `dev`。 |
| `TEST_DEPLOY_BRANCH` | `test` | 触发测试环境镜像构建和 K8s 部署的分支。进入提测阶段后默认保持为 `test`。 |
| `release_group` | `brick/${{ github.event.repository.name }}` | 镜像仓库分组路径。 |
| `CI_BACKEND_VERIFY_IN_DOCKER` | `false` | shell runner 宿主机 Java/Gradle 不满足要求时，后端测试是否进入 Docker/JDK17 容器执行。 |
| `CI_BACKEND_BUILD_IN_DOCKER` | `false` | shell runner 宿主机 Java/Gradle 不满足要求时，`bootJar` 是否进入 Docker/JDK17 容器执行。 |
| `CI_BACKEND_TEST_IMAGE` | `ghcr.io/library/ubuntu/ubuntu25-jdk17-jdk8:1.0` | 后端测试容器镜像。该镜像名包含 `jdk8` 是历史命名，按 JDK17 镜像使用。 |
| `CI_BACKEND_BUILD_IMAGE` | 空 | 后端构建容器镜像；为空时复用 `CI_BACKEND_TEST_IMAGE`。 |
| `CI_BACKEND_RUNTIME_IMAGE` | `ghcr.io/library/ubuntu/ubuntu25-jdk17-jdk8:1.0` | 后端运行镜像 Dockerfile 的 `BRICK_RUNTIME_IMAGE` build arg。 |
| `CI_POSTGRES_IMAGE` | 空 | 后端 Docker 测试需要临时 PostgreSQL 时配置镜像；为空时模板不拉取 Docker Hub。 |
| `CI_FRONTEND_NGINX_IMAGE` | `nginx:1.27-alpine` | 前端 Nginx 镜像；无法访问 Docker Hub 时应改为可达的镜像。 |
| `BACKEND_SERVICE_NAME` / `BACKEND_SERVICE_PORT` | `${{ github.event.repository.name }}-backend-service` / `svcport` | 前端 Nginx 模板代理到后端 Service 的名称和端口。 |
| `CI_CREATE_RUNTIME_SECRET` | `false` | 是否由部署 job 把 GitHub Actions secrets 写入 K8s runtime Secret。 |
| `CI_REGISTER_DEV_DNS` | `false` | 是否在前端部署后调用业务自有 DNS API 注册开发域名。 |

tag 制品库默认地址为 `${FS_URL}/releases/${CI_PROJECT_NAME}/${GITHUB_REF_NAME}`，对外展示等价于 `https://github.com/wu9007/buck/releases/{业务项目名称}/{tag}`。

## 流水线阶段

业务仓库 `.github/workflows/ci.yml` 应从发布资料包 `templates/github-actions.yml` 生成，默认阶段如下：

| 阶段 | Job | 触发 | 责任 |
| --- | --- | --- | --- |
| `policy` | `verify_brick_rules` | 所有分支和 tag | 执行业务结构和 Buck 能力复用规则。 |
| `verify` | `verify_backend`、`verify_frontend` | 所有分支和 tag | 后端测试、前端检查。 |
| `build` | `build_backend`、`build_frontend` | `dev`、`test` 和 tag | 构建后端 jar、非 local 的 yml、`logback-spring.xml`、兼容 `logback.xml` 与前端 dist/tar。 |
| `image` | `push_*_dev_image`、`push_*_test_image` | `dev`、`test` | 推送开发或测试环境镜像。 |
| `deploy` | `deploy_*`、`monitor_*` | `dev`、`test` | 自动部署 K8s 并等待 rollout。 |
| `release` | `publish_tag_artifacts` | tag | 上传 tag 交付物到 GitHub Release。 |
| `notify` | `notify_*_success`、`notify_failure` | `dev`、`test`、tag 或失败 | 环境区分明确的通知；测试成功必须显示 `Test 部署成功通知` 并使用 `*.example.com`。 |

`release` 和 `deploy` 都必须在 `policy`、`verify` 之后执行。`verify_brick_rules` 必须保留在 `policy` stage，自动执行 `node docs/buck/<version>/rules/check-business-structure.mjs .`，不得改成 `if: false`、不得设为 `continue-on-error: true`。业务开发智能体不得删除 `verify_brick_rules`、不得把验证改成手工任务、不得让制品发布绕过失败的验证阶段。

## 独立业务仓 Buck 发布消费 smoke（#380 / #501）

产品化 ledger #163 要求：至少一条独立业务仓库或**等价独立仓**在 clean runner 上消费已发布 `buck-bom` / `buck-starter-application` 与至少一个 `@wildbuck/*` 的可链接 CI 证据。仓库内 `validation:published:backend`（`publishToMavenLocal`）不能替代本证据。发布资料包提供可选模板 `docs/buck/<version>/templates/github-actions-brick-consume-smoke.yml`。

`buck` 自身用 `independent_consume_smoke`（默认分支 `full-check`）和 `consume-smoke-after-release`（`release` 成功后的独立 workflow，或对已有 tag `workflow_dispatch`）跑等价独立仓：`npm run consume:smoke` 在 `build/brick-consume-smoke/` 生成隔离消费者，只解析 Maven Central、npmjs、GitHub Packages（flyway）/ 可选 Nexus 已发布坐标，禁止 `mavenLocal()` / `includeBuild` / `publishToMavenLocal`。刚发完的公网 404 会按 `BRICK_CONSUME_SMOKE_WAIT_MS` 重试，不把 tag `release` 工作流标红。该 job 的 URL 写入 `BRICK_BUSINESS_CONSUMPTION_URL`。业务仓仍应接入下面的模板，不能因为框架侧等价仓就不消费发布物。

### 接入步骤

1. 将模板中的 `brick_consume_smoke` job 合并进业务仓库 `.github/workflows/ci.yml`（`verify` 阶段），或在升级资料包后从上述路径复制。
2. 确认仓库 secrets 可解析 Maven Central、npmjs 和 GitHub Packages（flyway；只配置变量名，不提交密码）：`GITHUB_TOKEN`，可选 `NEXUS_MAVEN_URL` / `NEXUS_USERNAME` / `NEXUS_PASSWORD`，以及 `NPM_REGISTRY_URL` 与 `NPM_TOKEN`。
3. 业务锁定版本与目录：`BRICK_VERSION`（默认与资料包版本一致）；可选 `BRICK_CONSUME_NPM_PACKAGE`（默认 `@wildbuck/core-ui-frontend`）；后端在子目录时设 `BRICK_BACKEND_DIR=backend`；多模块时再设 `BRICK_GRADLE_PROJECT=:open-platform-boot`（business-app 形态）。
4. 默认在 `main`、`dev` 与 tag 上运行；其他分支可设 `BRICK_CONSUME_SMOKE_ENABLED=true`。
5. 成功后 artifact 目录为 `build/brick-consume-smoke/`（含 `report.md` 与 insight/install 日志）。

### 回写 brick-next release-evidence

业务 job 成功后，把 job URL 或 pipeline URL 提供给 Buck 维护侧，写入 brick-next 项目 CI 变量 `BRICK_BUSINESS_CONSUMPTION_URL`。brick-next 正式 tag 的 `release_publish` 会读取该变量写入 `release-evidence.md` 的「独立业务仓库消费 CI」字段。未配置时 tag 流水线使用明确 `exempt:` 说明（不得用空值冒充）。不要从 GitHub Release 或通知 issue 推断业务已采用。

## runner、目录与制品

接入模板前必须识别 GitHub Actions runner executor，不要假设 `image` / `services` 一定生效。Docker / shell / 镜像适配、临时 PostgreSQL、runtime Secret 写入方式和目录复制、Nginx 代理、K8s 占位符、tag 制品清单、`needs` artifact 传递见 [business-ci-cd-examples.md](business-ci-cd-examples.md)。

## dev / test 自动部署

`DEV_DEPLOY_BRANCH` 固定为 `dev`。dev 流水线：构建 jar/dist → 推送 `snapshot-<timestamp>` 镜像到 `${REGISTRY_URL}/${release_group}` → 部署 `${NAMESPACE}-dev` → 等待 `kubectl rollout status`。需要自动注册开发域名时设 `CI_REGISTER_DEV_DNS=true`。

进入提测后 `TEST_DEPLOY_BRANCH` 默认是 `test`：同样构建并推送镜像，部署 `${NAMESPACE}-test`，runtime Secret 把 `BUSINESS_TEST_DB_*` 映射为应用读取的 `BUSINESS_DB_*`，Ingress 使用 `*.example.com`，成功通知必须是 `Test 部署成功通知`。测试环境必须独立于开发环境的 namespace、Secret、数据库变量和域名。测试 bug 修复必须先合回 `test` 回归并同步回 `dev`。

业务仓库应优先复用模板中的 `kubectl --kubeconfig ~/.kube/config` 约定。

## 晋级分支

业务仓库一律采用受保护晋级分支，与项目阶段无关：

| 分支 | 角色 |
| --- | --- |
| `dev` | 开发集成基线；短分支与 Buck 升级分支从 `dev` 拉出并经 MR 合入；`DEV_DEPLOY_BRANCH=dev` 触发 dev 部署 |
| `test` | 提测基线；`TEST_DEPLOY_BRANCH=test` 触发 test 部署 |
| `main` | 发布基线；业务 tag 只从 `main` 上已合并 commit 创建 |

禁止把 `main` 当作开发基线或升级基线；禁止把 `DEV_DEPLOY_BRANCH` 改成 `main`。

推荐晋级链路：`<type>/issue-<iid>-<slug> -> dev -> test -> main -> tag`。普通开发仍从 GitHub issue 出发，通过 MR 合入 `dev`。进入提测后，`dev`、`test`、`main` 是受保护环境/晋级分支。

强约束：

- 禁止直接向 `dev`、`test`、`main` push。
- 禁止 feature/fix/chore 短分支直接合入 `test` 或 `main`。
- 禁止未通过 `dev` 验证的迭代内容提测到 `test`。
- 禁止业务 agent 在没有业务负责人明确指示时合并 `dev -> test`、`test -> main` 或创建业务发布 tag。
- 禁止 `test` 复用 `dev` 的数据库、namespace、Secret 或域名。
- 禁止 `main` 自动部署 dev/test 环境。
- 禁止从 `dev`、`test` 或业务短分支打 tag。
- 禁止 tag 制品发布绕过 `policy` 和 `verify` 阶段。

`dev -> test`、`test -> main` 和 tag 都必须有业务负责人在当前会话或可追溯 issue/MR comment 中明确指示；没有明确指示时业务 agent 只能准备 MR 和验证证据。

## 失败处理

验证失败时，流水线应停止在 `policy` 或 `verify` 阶段。正确处理方式是修复业务目录、依赖、测试或 Buck 能力采用问题。如果失败原因是 Buck 资料包缺少必要能力、文档模糊或模板不能支撑业务仓库，应在 `buck` Issues 创建中文问题。业务 CI/CD issue 留在业务仓库；能归纳为 Buck 通用缺口时再创建或关联 `buck` issue。协作规则见 [business-issue-collaboration.md](business-issue-collaboration.md)。

不允许通过以下方式绕过：删除 `verify_brick_rules`；把验证 job 改成 `if: false`；让 tag 发布 job 不依赖验证阶段；在业务仓库复制 Buck 内部脚本或自建平行规则；把凭据写入仓库。
