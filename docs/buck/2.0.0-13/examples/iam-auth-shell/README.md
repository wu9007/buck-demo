# IAM 登录与当前主体菜单装配

使用 Buck 2.0.0-13 时，默认复用模式必须同时满足：

1. `<IamAuthFlowView :app="{ state, ...useAuthWorkspace() }" />`，不要只传 workspace。
2. 把已采用模块的 `brickRoutes` 注册进 router。
3. `buildCurrentPrincipalNavigationGroups(brickRoutes, workspace)`；空 routes ≠ 显示全部 `navigationMenus`。

可复制片段见 `src/App.js`。列表页示例仍在 `examples/frontend-shell`。
