# 后端结构

- 模式：单模块
- 包前缀：`io.github.wu9007.buckdemo`
- 入口：`backend/src/main/java/io/github/wu9007/buckdemo/BuckDemoApplication.java`
- 功能点目录：后续业务切片放 `backend/src/main/java/io/github/wu9007/buckdemo/applet/<feature>/`
- 迁移目录：使用已发布 IAM / 安全设置 / 审计模块自带 Flyway，业务仓第一阶段不新增平行迁移
- 确认人：业务负责人
