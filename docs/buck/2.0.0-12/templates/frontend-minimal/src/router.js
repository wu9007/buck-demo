import { createRouter, createWebHistory } from 'vue-router';

const HomeView = {
  template: '<section class="console-page"><header class="console-page__header"><h1>业务工作台</h1><p>从这里装配业务页面和 Buck 模块页面。</p></header></section>',
};

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
  ],
});
