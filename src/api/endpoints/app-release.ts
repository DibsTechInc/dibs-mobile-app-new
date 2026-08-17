/**
 * `GET /api/v2/app-release/:studioSlug` — what this app is told about its own version.
 *
 * Unauthenticated, no body. The ONE endpoint in this app that must never surface a failure to its
 * caller: a version gate that throws is a version gate that can take the app down with it, which
 * is the exact outcome it exists to prevent.
 *
 * So this function **never rejects**. Every failure — network, timeout, 500, a 200 carrying HTML,
 * a body that is a string — resolves to `null`, and `decideReleaseGate` reads null as "no gate".
 */
import type { ApiClient } from '../client';
import { appReleaseSchema, type AppReleaseResponse } from '../schemas/app-release';

/**
 * Shorter than the client's 20s default on purpose.
 *
 * Nothing waits on this — the tree renders regardless — but a request that hangs for twenty
 * seconds holds a socket and a query slot for a fact that stops being actionable the moment the
 * client is already using the app.
 */
const APP_RELEASE_TIMEOUT_MS = 8_000;

export async function fetchAppRelease(
  client: ApiClient,
  studioSlug: string,
  signal?: AbortSignal,
): Promise<AppReleaseResponse | null> {
  try {
    return await client.get(
      `app-release/${encodeURIComponent(studioSlug)}`,
      {},
      appReleaseSchema,
      { signal, timeoutMs: APP_RELEASE_TIMEOUT_MS },
    );
  } catch {
    // Deliberately swallowed, and deliberately not logged as an error: an unreachable release
    // endpoint is a non-event for the client. The gate resolves to none and the app carries on.
    return null;
  }
}
