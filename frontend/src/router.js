import { createRouter, createWebHistory } from 'vue-router';
import { iamRoutes } from '@wildbuck/module-iam-frontend';

const HomeView = {
  template: '<section class="console-page"><header class="console-page__header"><h1>业务工作台</h1><p>登录后从 IAM 当前主体菜单进入管理页。</p></header></section>',
};

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    ...iamRoutes.map((item) => ({
      path: item.path,
      name: item.id,
      component: item.component,
      meta: {
        permission: item.permission,
        title: item.title,
      },
    })),
  ],
});
