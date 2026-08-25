# 业务应用 AI 短上下文

Buck 版本：2.0.0-12

## 当前目标

`buck-demo` 验证已发布 Buck 的采用闭环：IAM 登录、当前主体菜单工作台、把框架缺口回流到 `wu9007/buck` issues。

第一阶段范围：登录 + 工作台 + IAM 已发布管理页。不装配 AI 助手和身份联邦。

验证命令：

```bash
npm run check
./gradlew :backend:test
./gradlew :backend:bootRun
cd frontend && npm run dev
```

禁止：复制 buck 源码、手写 JDBC/SQL、mock 菜单/权限、把 RC 模块当生产默认。

## Buck 资料包

```text
docs/buck/2.0.0-12/
```

业务侧 agent skill：`docs/buck/2.0.0-12/agent-skills/buck-business-agent/`
