/**
 * The app's single ApiClient, wired to this build's studio and to the auth session.
 *
 * ⚠️ The ONE file under `src/api/` that touches the React Native runtime (via
 * `@/config/studio` → expo-constants). Everything else here is pure TypeScript so the jest node
 * project can exercise it; keep it that way, and never import this module from a test.
 *
 * Auth is injected rather than imported. If this file imported the auth store, and the auth
 * store imported the client to resolve a user, the cycle would resolve differently under Metro
 * than under jest — and the failure would look like "requests are unauthenticated sometimes."
 * Instead `src/features/auth` installs its providers at startup; until it does, every request
 * goes out unauthenticated, which is correct for the public endpoints Home already uses.
 */
import { studio } from '@/config/studio';

import { ApiClient } from './client';

/** Signed out, or auth has not installed itself yet. Both mean "no Authorization header". */
let getIdToken: () => Promise<string | null> = async () => null;
let onUnauthorized: () => void = () => {};

/**
 * Hand the client a way to mint a Firebase ID token.
 *
 * Called once, at startup, by the auth layer. The callback must ask Firebase every time rather
 * than returning something cached by us — Firebase already caches and refreshes, and a token we
 * held onto is a token that can be stale, or belong to whoever was signed in before.
 */
export function setAuthTokenProvider(provider: () => Promise<string | null>): void {
  getIdToken = provider;
}

/** What to do when the server rejects our token. Wired to the sign-out flow. */
export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

export const apiClient = new ApiClient({
  baseUrl: studio.apiUrl,
  // Indirect on purpose: the providers are installed after this module is first evaluated.
  getIdToken: () => getIdToken(),
  onUnauthorized: () => onUnauthorized(),
  // Loud in development, forgiving in production: an additive backend field must never brick a
  // shipped build that cannot be updated for days.
  strictSchemas: __DEV__,
  onSchemaMismatch: (endpoint, issues) => {
    console.warn(`[api] ${endpoint} response did not match its schema:\n  ${issues.join('\n  ')}`);
  },
});

export { ApiClient } from './client';
export * from './endpoints';
export { ApiError, ApiSchemaError, describeApiError } from './errors';
export { queryKeys } from './keys';
