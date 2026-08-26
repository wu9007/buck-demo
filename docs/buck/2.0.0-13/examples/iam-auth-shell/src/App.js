import { reactive, shallowRef } from 'vue';
import { createInitialAuthState } from '@wildbuck/module-iam-frontend/auth-state';
import { useAuthWorkspace } from '@wildbuck/module-iam-frontend/auth-workspace';
import IamAuthFlowView from '@wildbuck/module-iam-frontend/auth-view';
import { brickRoutes as iamRoutes } from '@wildbuck/module-iam-frontend';
import { brickRoutes as auditRoutes } from '@wildbuck/module-audit-frontend';
import { brickRoutes as securitySettingRoutes } from '@wildbuck/module-security-setting-frontend';
import { buildCurrentPrincipalNavigationGroups } from '@wildbuck/module-iam-frontend/current-principal-workspace';

const readJson = (raw) => {
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
};
const state = reactive(createInitialAuthState(readJson));
const authWorkspace = useAuthWorkspace({ state, showStatus, loadAuthenticatedContext });
const authApp = shallowRef({ state, ...authWorkspace });
const brickRoutes = [...iamRoutes, ...auditRoutes, ...securitySettingRoutes];
const navigationGroups = buildCurrentPrincipalNavigationGroups(brickRoutes, currentPrincipalWorkspace);

// template:
// <IamAuthFlowView v-if="!authWorkspace.isAuthenticated.value" :app="authApp" />
// <BrickConsoleShell v-else :navigation-groups="navigationGroups" />
