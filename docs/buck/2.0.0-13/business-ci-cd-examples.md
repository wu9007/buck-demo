# 业务 CI/CD 样例

主规则见 [business-ci-cd.md](business-ci-cd.md)。本文只放 runner 适配、目录复制和制品清单，不改变量表和晋级约束。

## runner 类型识别与适配

接入模板前先看 GitHub Actions runner。默认模板使用 GitHub-hosted `ubuntu-latest`。

| runner 形态 | 模板策略 | 必须确认 |
| --- | --- | --- |
| GitHub-hosted | `actions/setup-java` + `actions/setup-node`，`ubuntu-latest`。 | 能访问 Maven Central、npmjs、GitHub Packages（flyway）；可选 Nexus；可选 sidecar Verdaccio；业务数据库。 |
| 自托管，宿主机 Java 17/Gradle/npm/Docker 可用 | 默认在宿主机执行 `./gradlew test`、`bootJar`、`npm run check` 和 Docker build。 | 宿主机 Java 满足后端要求；Gradle wrapper 分发可访问。 |
| 自托管，宿主机 Java 不满足但 Docker 可用 | 打开 `CI_BACKEND_VERIFY_IN_DOCKER=true` 和 `CI_BACKEND_BUILD_IN_DOCKER=true`。 | Docker 可拉业务 registry 镜像；工作目录不共享时用 tar 管道送源码，不能改回 bind mount。 |
| 自托管，不能访问 Docker Hub 或 `services.gradle.org` | 基础镜像用可达 registry；wrapper 切到可访问分发或 runner 缓存。 | 不把公共 Docker Hub 或公网 Gradle 下载作为唯一前提。 |

`CI_POSTGRES_IMAGE` 为空时模板不拉 `postgres:16`；配置后会启临时库并设置 `BUSINESS_DB_*`。后端运行库与 CI 临时验证库必须分离。开发库走 GitHub Actions secrets / 预创建 Secret；测试库必须用 `BUSINESS_TEST_DB_*`，禁止复用开发库。K8s Deployment 引用 `<repo>-backend-runtime-secret`；需要 CI 创建时设 `CI_CREATE_RUNTIME_SECRET=true`。此时只能把 Variables 写入临时 env 再 `kubectl create secret --from-env-file`，不得 `echo` 真实值。`BRICK_TOKEN_SECRET` 可按产品口径在 dev/test 共用；CI 不应把 `BRICK_IAM_ADMIN_INITIAL_PASSWORD` 写入 runtime Secret，除非产品统一覆盖内置默认值。

## 目录约定

```text
templates/docker/backend/Dockerfile      -> backend/docker/Dockerfile
templates/docker/backend/k8s.yaml        -> backend/docker/<repo>.yaml
templates/docker/frontend/Dockerfile     -> frontend/docker/Dockerfile
templates/docker/frontend/nginx.conf     -> frontend/docker/nginx.conf
templates/docker/frontend/k8s.yaml       -> frontend/docker/<repo>-frontend.yaml
```

后端镜像在 `backend/docker/app.jar` 放 jar；前端镜像在 `frontend/docker/dist/` 放 dist。

前端 Nginx 默认代理：`/transport/**`、`/brick/**`、`/api/**`（转发前去掉 `/api`）。默认 upstream 为 `<repo>-backend-service:${svcport}`，不同则覆盖 `BACKEND_SERVICE_NAME` / `BACKEND_SERVICE_PORT`。

K8s 占位符：`ns-placeholder`、`registry-dir-placeholder`、`project-name-placeholder`、`version-placeholder`、`http-port-placeholder`、`host-placeholder`、`prefix-placeholder`、`replicas-placeholder`、`active-placeholder`（仅后端）、`ingress-name-placeholder`（仅前端）。

## tag 制品清单

上传路径：`${FS_URL}/${release_group}/${GITHUB_REF_NAME}/`，对应 GitHub Release 资产。

- `backend/<project>-<version>.jar`（自动写入 `BOOT-INF/classes/META-INF/brick-app-identity.properties`）
- `backend/version.txt`
- `backend/<非 local 的 yml 配置文件>`
- `backend/logback-spring.xml`
- `backend/logback.xml`（历史文件名兼容）
- `frontend/<project>-frontend-<version>.tar.gz`
- `frontend/version.txt`

`*-local.yml` 禁止进入 tag 制品。GitHub Actions `needs` 不会传递上游的上游 artifact；image / deploy / tag job 必须显式依赖 `build_backend` 或 `build_frontend`。前端 image 从 `frontend/build/brick/frontend/*.tar.gz` 解出 dist，不得假设工作区残留 `frontend/dist`。

## 开发域名 DNS

`CI_REGISTER_DEV_DNS=true` 时调用业务自有 DNS API（由 `CI_DEV_DNS_API_BASE` 配置），不要把内网地址写进仓库。`{host-record}` 是主机记录段，例如 `business-app-dev`，不是完整域名。
