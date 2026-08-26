# Buck 后端发布依赖

版本：2.0.0-13

```gradle
dependencies {
    implementation platform("io.github.wu9007:buck-bom:2.0.0-13")
    implementation "io.github.wu9007:buck-starter-application"
    compileOnly platform("io.github.wu9007:buck-bom:2.0.0-13")
    annotationProcessor platform("io.github.wu9007:buck-bom:2.0.0-13")
    implementation "org.springframework.boot:spring-boot-starter-validation"
    compileOnly "org.projectlombok:lombok"
    annotationProcessor "org.projectlombok:lombok"
    implementation "org.mapstruct:mapstruct"
    annotationProcessor "org.mapstruct:mapstruct-processor"
}
```

按需启用正式 `released` 模块：

```gradle
dependencies {
    implementation "io.github.wu9007:buck-module-iam-backend"
    implementation "io.github.wu9007:buck-module-notification-setting-backend"
    implementation "io.github.wu9007:buck-module-security-setting-backend"
    implementation "io.github.wu9007:buck-module-audit-backend"
    implementation "io.github.wu9007:buck-module-application-center-backend"
}
```

最小壳默认不装配控制台 AI 助手。仅当业务命中助手能力、并接受 `released-candidate` 契约可能演进时，再追加：

```gradle
dependencies {
    implementation "io.github.wu9007:buck-module-ai-assistant-backend"
}
```

不要把验证壳 `validation/security-console` 的助手装配、debug 入口或 `allow-anonymous=true` 抄进业务仓。

达梦 DM 运行时按需加入 JDBC driver；版本由 `buck-bom` 约束：

```gradle
dependencies {
    runtimeOnly "com.dameng:DmJdbcDriver18"
}
```

数据库地址、用户名和密码通过运行环境注入，例如 `SPRING_DATASOURCE_URL`、`SPRING_DATASOURCE_USERNAME`、`SPRING_DATASOURCE_PASSWORD`；不要提交真实 DM 凭据。

真实 Nexus、私有 npm 和数据库变量按资料包根目录 `secret-environment-governance.md` 执行。本地开发从 `templates/local-secrets.env.example` 复制到仓库外 `~/.brick/<repo-name>/local-secrets.env`，CI/CD 使用 GitHub Actions secrets 和 K8s Secret；issue、MR 和日志只记录变量名与验证结果。
