// Buck 业务前端最小 Vite 配置。
// /transport 和 /brick 是登录/传输公开端点；/api 只是前端代理前缀。
// 采用本模板时，业务后端 Controller 映射不要包含 /api。
// 启动前端调试前必须先启动真实后端，并确认 BUSINESS_API_BASE_URL 或 127.0.0.1:8080 可访问。
// 不要新增 mock:backend、mock-backend 或任何本地 mock 数据入口。
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const backendTarget = process.env.BUSINESS_API_BASE_URL || 'http://127.0.0.1:8080';

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/transport': {
        target: backendTarget,
        changeOrigin: true,
      },
      '/brick': {
        target: backendTarget,
        changeOrigin: true,
      },
      '/api': {
        target: backendTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
