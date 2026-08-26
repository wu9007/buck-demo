<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, shallowRef } from 'vue';
import { Bell, Guide, Refresh } from '@element-plus/icons-vue';
import { useRoute, useRouter } from 'vue-router';
import { showBrickStatus } from '@wildbuck/core-ui-frontend';
import {
  createBrickConsoleAppearanceRuntime,
  readBrickConsoleAppearancePreference,
} from '@wildbuck/core-ui-frontend/appearance';
import {
  BrickConsoleShell,
} from '@wildbuck/core-ui-frontend/shell';
import { createAuthExperience } from '@wildbuck/module-iam-frontend/auth-experience';
import {
  createInitialAuthState,
} from '@wildbuck/module-iam-frontend/auth-state';
import { useAuthWorkspace } from '@wildbuck/module-iam-frontend/auth-workspace';
import IamAuthFlowView from '@wildbuck/module-iam-frontend/auth-view';
import {
  buildCurrentPrincipalNavigationGroups,
  loadCurrentPrincipalWorkspace,
} from '@wildbuck/module-iam-frontend/current-principal-workspace';
import { moduleRoutes } from './router';

const router = useRouter();
const route = useRoute();
const appearanceRuntime = createBrickConsoleAppearanceRuntime({
  appearance: readBrickConsoleAppearancePreference(),
  onChange: (snapshot) => {
    themePreference.value = snapshot.theme;
    resolvedTheme.value = snapshot.resolvedTheme;
    density.value = snapshot.density;
    fontSize.value = snapshot.fontSize;
  },
});
const initialAppearance = appearanceRuntime.read();
const themePreference = ref(initialAppearance.theme);
const resolvedTheme = ref(initialAppearance.resolvedTheme);
const density = ref(initialAppearance.density);
const fontSize = ref(initialAppearance.fontSize);
const collapsedGroupKeys = ref([]);
const routeRefreshTick = ref(0);
const workspace = shallowRef(null);

const state = reactive({
  ...createInitialAuthState((text) => {
    try {
      return text ? JSON.parse(text) : null;
    } catch {
      return null;
    }
  }),
  authExperience: createAuthExperience('zh-CN'),
  loginType: 'username-password',
  form: {
    username: '',
    password: '',
    captchaCode: '',
  },
});

async function loadAuthenticatedContext() {
  workspace.value = await loadCurrentPrincipalWorkspace();
  const home = workspace.value?.navigationMenus?.[0]?.path || '/';
  if (route.path === '/login' || route.path === '/') {
    await router.replace(home);
  }
}

const authWorkspace = useAuthWorkspace({
  state,
  showStatus: showBrickStatus,
  loadAuthenticatedContext,
});
const authApp = shallowRef({ state, ...authWorkspace });
const isAuthFocus = authWorkspace.isAuthFocus;

const navigationGroups = computed(() => buildCurrentPrincipalNavigationGroups(
  moduleRoutes,
  workspace.value,
  { permissions: workspace.value?.permissions || [] },
));
const activeRouteId = computed(() => String(route.name || 'home'));
const currentPrincipal = computed(() => ({
  displayName: workspace.value?.employeeName
    || workspace.value?.username
    || authWorkspace.sessionUserName.value
    || '未登录',
}));

onMounted(() => {
  authWorkspace.bootstrapAuthState();
});

onBeforeUnmount(() => {
  appearanceRuntime.dispose();
});

function navigate(routeItem) {
  router.push(routeItem.path);
}

function updateTheme(value) {
  appearanceRuntime.setAppearance({ theme: value });
}

function updateDensity(value) {
  appearanceRuntime.setAppearance({ density: value });
}

function updateFontSize(value) {
  appearanceRuntime.setAppearance({ fontSize: value });
}

function refreshCurrentPage() {
  routeRefreshTick.value += 1;
}

function openMenuGuide() {
  console.info('按 Buck 页面向导规范接入业务侧向导步骤。');
}

function openNotifications() {
  console.info('在这里接入业务通知中心。');
}
</script>

<template>
  <IamAuthFlowView
    v-if="isAuthFocus"
    :app="authApp"
    brand-title="Buck Demo"
    brand-mark="B"
    brand-subtitle="业务工作台"
  />
  <div
    v-else
    class="console-root"
    :data-theme="resolvedTheme"
    :data-density="density"
    :data-font-size="fontSize"
  >
    <BrickConsoleShell
      brand-title="Buck Demo"
      brand-subtitle="业务工作台"
      brand-mark="B"
      :theme="resolvedTheme"
      :theme-preference="themePreference"
      :density="density"
      :font-size="fontSize"
      :navigation-groups="navigationGroups"
      :active-route-id="activeRouteId"
      :current-principal="currentPrincipal"
      v-model:sidebar-collapsed-group-keys="collapsedGroupKeys"
      :sidebar-group-collapsible="true"
      :sidebar-searchable="true"
      @navigate="navigate"
      @update:theme="updateTheme"
      @update:density="updateDensity"
      @update:font-size="updateFontSize"
    >
      <template #topbar-actions>
        <el-button text title="刷新当前页" aria-label="刷新当前页" @click="refreshCurrentPage">
          <el-icon aria-hidden="true"><Refresh /></el-icon>
        </el-button>
        <el-button text title="菜单引导" aria-label="菜单引导" @click="openMenuGuide">
          <el-icon aria-hidden="true"><Guide /></el-icon>
        </el-button>
        <el-button text title="通知" aria-label="通知" @click="openNotifications">
          <el-icon aria-hidden="true"><Bell /></el-icon>
        </el-button>
      </template>

      <RouterView v-slot="{ Component }">
        <component :is="Component" :key="`${activeRouteId}:${routeRefreshTick}`" />
      </RouterView>
    </BrickConsoleShell>
  </div>
</template>
