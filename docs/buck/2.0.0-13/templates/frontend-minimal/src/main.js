import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import 'element-plus/dist/index.css';
import { registerBrickPwaServiceWorker } from '@wildbuck/core-ui-frontend/pwa';
import './styles/brick-console.css';
import App from './App.vue';
import { router } from './router';
import { setupBrickHttp } from './brick/http';

setupBrickHttp();
// PWA: register SW early in main (not after shell mount). public/sw.js is installability-only.
// Chrome address-bar install icon is NOT guaranteed; use user-menu install + beforeinstallprompt.
registerBrickPwaServiceWorker({ serviceWorkerUrl: '/sw.js' }).catch(() => undefined);

createApp(App)
  .use(router)
  .use(ElementPlus, { locale: zhCn })
  .mount('#app');
