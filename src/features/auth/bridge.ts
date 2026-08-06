/**
 * Connects Firebase to the API client, before anything renders.
 *
 * Called at MODULE scope from the root layout rather than from an effect. Effects run
 * child-first, so by the time a provider's effect fires, its children's queries have already
 * asked for a token — and a request that goes out unauthenticated because of mount ordering
 * fails as a 401 that looks exactly like an expired session.
 *
 * The direction of the dependency matters: auth reaches into the API client, never the reverse.
 * If `src/api` imported the auth store and the auth store imported the client, the cycle would
 * resolve differently under Metro than under jest, and the symptom would be "requests are
 * unauthenticated sometimes."
 */
import { setAuthTokenProvider } from '@/api';
import { getCurrentIdToken } from '@/lib/firebase';

let installed = false;

export function installAuthBridge(): void {
  if (installed) return;
  installed = true;
  // Asks Firebase every time. The SDK caches and refreshes; anything we held onto could be
  // expired, or could belong to whoever was signed in before on a shared phone.
  setAuthTokenProvider(getCurrentIdToken);
}
