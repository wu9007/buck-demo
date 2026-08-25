import {
  configureHttp,
  createBrickSessionErrorHandler,
  formatBrickBusinessError,
  isBrickSessionError,
} from '@wildbuck/core-api-frontend';
import { showBrickBusinessError, showBrickStatus } from '@wildbuck/core-ui-frontend';

import { TOKEN_KEY, REFRESH_TOKEN_KEY, EXPIRATION_STRATEGY_KEY } from '@wildbuck/module-iam-frontend/auth-state';

const ACCESS_TOKEN_KEY = TOKEN_KEY;

function readExpirationStrategy() {
  const raw = String(window.localStorage.getItem(EXPIRATION_STRATEGY_KEY) || 'LOGIN_OUT')
    .trim()
    .toUpperCase();
  // Historical VERIFY_PASS is the same soft-suspend product surface as SCREEN_LOCK.
  if (raw === 'SCREEN_LOCK' || raw === 'VERIFY_PASS') {
    return 'SCREEN_LOCK';
  }
  return 'LOGIN_OUT';
}

/**
 * Terminal path after silent refresh failed (or no RT).
 * Shell should listen for brick:session-terminal and soft-suspend for SCREEN_LOCK.
 * LOGIN_OUT clears local tokens here; SCREEN_LOCK only drops dead AT/RT and keeps app routing.
 */
function handleSessionTerminal(error) {
  const strategy = readExpirationStrategy();
  const message = formatBrickBusinessError(error) || '会话已失效，请按提示继续。';
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.dispatchEvent(new CustomEvent('brick:session-terminal', {
    detail: { strategy, message, error },
  }));
  if (strategy === 'SCREEN_LOCK') {
    showBrickStatus(message, 'warning');
    return;
  }
  showBrickStatus(message || '会话已失效，请重新登录后继续。', 'warning');
  window.dispatchEvent(new CustomEvent('brick:session-expired'));
}

const handleSessionError = createBrickSessionErrorHandler({
  onSessionError(error) {
    handleSessionTerminal(error);
  },
});

export { formatBrickBusinessError, isBrickSessionError, showBrickBusinessError };

export function setupBrickHttp() {
  configureHttp({
    baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
    tokenRefresh: {
      async refresh() {
        const refreshToken = window.localStorage.getItem(REFRESH_TOKEN_KEY);
        if (!refreshToken) {
          return false;
        }
        // Raw fetch — must not re-enter configureHttp session recovery.
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/brick/token/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!response.ok) {
          return false;
        }
        const body = await response.json();
        const payload = body?.data && body?.category ? body.data : body;
        if (!payload?.accessToken) {
          return false;
        }
        window.localStorage.setItem(ACCESS_TOKEN_KEY, payload.accessToken);
        if (payload.refreshToken) {
          window.localStorage.setItem(REFRESH_TOKEN_KEY, payload.refreshToken);
        }
        return true;
      },
    },
    prepareRequest(_path, init) {
      const token = window.localStorage.getItem(ACCESS_TOKEN_KEY);
      if (!token) {
        return init;
      }
      return {
        ...init,
        headers: {
          ...(init.headers || {}),
          Authorization: `Bearer ${token}`,
        },
      };
    },
    responseErrorHandler: handleSessionError,
    requestDigest: {
      enabled: false,
    },
    transportEnvelope: {
      enabled: false,
    },
  });
}


/**
 * Page-level catch for domain 4xx (not session). Never toast bare "HTTP 400".
 * Example: try { await save() } catch (e) { if (isBrickSessionError(e)) return; showBusinessError(e) }
 */
export function showBusinessError(error) {
  showBrickBusinessError(error);
}
