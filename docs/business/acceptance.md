# 验收

1. `npm run check` 通过
2. `./gradlew :backend:test` 通过
3. 后端 `bootRun` 后，用 bootstrap 运维账号登录前端
4. 登录后侧栏菜单来自真实当前主体，能打开至少一页 IAM 管理页面
5. 前端不以 mock 菜单 / mock 权限验收
