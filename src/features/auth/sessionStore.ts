/**
 * The auth SESSION — and nothing else.
 *
 * ⚠️ Deliberately not persisted, and deliberately does not hold the Dibs userid or profile.
 *
 * "Logged in" means a LIVE Firebase session, never a stored id. The widget learned this the
 * expensive way: `thisuser` persisted to localStorage, so a userid outlived the session that
 * created it, and on a shared device that userid was the PREVIOUS client's identity — a
 * logged-out browser rendered someone else's saved Mastercard with an enabled Confirm button
 * (shared CLAUDE.md, 2026-08-04). A phone is a shared device more often than a browser is.
 *
 * Firebase does persist its own session to AsyncStorage, which is what keeps a client signed in
 * across launches. That is fine and it is different: the SDK re-validates, and `auth.currentUser`
 * is the live answer. What must never happen is US caching an identity derived from it.
 *
 * The userid and profile are server data and live in TanStack Query (invariant 8), keyed on the
 * signed-in email, so they are re-fetched for whoever is actually signed in now.
 */
import { create } from 'zustand';

export type AuthStatus =
  /** Firebase has not yet told us whether anyone is signed in. NOT the same as signed out. */
  | 'initializing'
  /** Firebase has resolved and nobody is signed in. Browsing is fine; booking is not. */
  | 'guest'
  /** A live Firebase session exists. The Dibs userid may still be resolving. */
  | 'signedIn';

export interface AuthSession {
  uid: string;
  /**
   * Exactly as Firebase holds it.
   *
   * It used to be load-bearing that this was NOT lowercased: `get-user-account` matched the Dibs
   * row case-sensitively, so normalizing here could turn a real account into "no account". That
   * reader was made case-insensitive on 2026-08-14 (`get-user-has-account.js` now compares
   * `LOWER(email)`), so the case no longer decides anything — but it is still passed through
   * untouched, because this is the address Firebase authenticated and the app has no business
   * rewriting it.
   */
  email: string;
}

interface SessionState {
  status: AuthStatus;
  session: AuthSession | null;
  /** Called only by the Firebase listener. Nothing else may write the session. */
  setSession: (session: AuthSession | null) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  status: 'initializing',
  session: null,
  setSession: (session) => set({ session, status: session ? 'signedIn' : 'guest' }),
}));

/**
 * Non-hook access, for the API client's 401 handler.
 *
 * The client is not a React component and cannot call a hook, but it must be able to ask
 * whether anyone is signed in before it reacts to a rejected token.
 */
export const readSession = (): AuthSession | null => useSessionStore.getState().session;
