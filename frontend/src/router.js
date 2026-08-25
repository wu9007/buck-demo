import { createRouter, createWebHistory } from 'vue-router';
import { brickRoutes as iamRoutes } from '@wildbuck/module-iam-frontend';
import { brickRoutes as auditRoutes } from '@wildbuck/module-audit-frontend';
import { brickRoutes as securitySettingRoutes } from '@wildbuck/module-security-setting-frontend';
import HomePage from './pages/HomePage.vue';

export const moduleRoutes = [
  ...iamRoutes,
  ...auditRoutes,
  ...securitySettingRoutes,
];

function toVueRoute(item) {
  return {
    path: item.path,
    name: item.id,
    component: item.component,
    meta: {
      permission: item.permission,
      title: item.title,
    },
  };
}

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
    },
    ...moduleRoutes.map(toVueRoute),
  ],
});
