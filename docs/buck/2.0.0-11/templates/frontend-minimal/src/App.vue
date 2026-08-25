<script setup>
import { computed, onBeforeUnmount, ref } from 'vue';
import { Bell, Guide, Refresh } from '@element-plus/icons-vue';
import { useRoute, useRouter } from 'vue-router';
import {
  createBrickConsoleAppearanceRuntime,
  readBrickConsoleAppearancePreference,
} from '@wildbuck/core-ui-frontend/appearance';
import {
  BrickConsoleShell,
  buildBrickConsoleNavigationGroups,
} from '@wildbuck/core-ui-frontend/shell';

const router = useRouter();
const route = useRoute();
// system is a preference, not a CSS token. Render only resolvedTheme on data-theme / Shell theme.
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

const consoleRoutes = [
  { id: 'home', title: '工作台', abbr: '工', path: '/', group: 'workspace', order: 0 },
];
const navigationGroups = buildBrickConsoleNavigationGroups(consoleRoutes);
const activeRouteId = computed(() => String(route.name || 'home'));

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
  <div
    class="console-root"
    :data-theme="resolvedTheme"
    :data-density="density"
    :data-font-size="fontSize"
  >
    <BrickConsoleShell
      brand-title="Buck 业务应用"
      brand-subtitle="业务控制台"
      brand-mark="B"
      :theme="resolvedTheme"
      :theme-preference="themePreference"
      :density="density"
      :font-size="fontSize"
      :navigation-groups="navigationGroups"
      :active-route-id="activeRouteId"
      :current-principal="{ displayName: '业务管理员' }"
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
