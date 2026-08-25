# buck-demo

独立上层业务应用，用来验证基于已发布 Buck `2.0.0-12` 的采用、开发、回流闭环。

- 不复制、不修改 `wu9007/buck` 源码
- 资料包在 `docs/buck/2.0.0-12/`
- 默认运维账号见资料包 IAM bootstrap：用户名以模块种子为准，初始密码 `ChangeMe123!`（仅本地开发）

## 启动

本地需要 PostgreSQL（默认 `127.0.0.1:5432/buck_demo`，用户 `buck`）。资料包模板里的 H2 不能用于启动。

```bash
# 结构检查
npm run check

# 后端
./gradlew :backend:bootRun

# 前端（另开终端，先等后端起来）
cd frontend && npm install && npm run dev
```

前端默认 http://127.0.0.1:5173 ，后端 http://127.0.0.1:8080 。
