/**
 * Owns the auth session: watches Firebase, resolves the Dibs identity behind it, and gives the
 * API client its 401 handler.
 *
 * The token PROVIDER is installed separately and earlier (`installAuthBridge`, called at module
 * scope in the root layout) because requests can be in flight before this component's effects
 * run. Nothing here needs to have mounted for a request to carry the right token.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { createContext, use, useCallback, useEffect, useMemo, type ReactNode } from 'react';

import { apiClient, fetchUserAccount, queryKeys, setUnauthorizedHandler } from '@/api';
import type { AccountIdentity } from '@/api/schemas/user-account';
import { studio } from '@/config/studio';
import { auth } from '@/lib/firebase';

import { useSessionStore, type AuthSession, type AuthStatus } from './sessionStore';

export interface AuthState {
  status: AuthStatus;
  session: AuthSession | null;
  /** The Dibs identity behind the session. Null while it is still resolving. */
  account: AccountIdentity | null;
  /**
   * True when there IS a session but its Dibs identity has not landed yet.
   *
   * Screens that need a userid must wait on this rather than reading "no account" as "guest".
   * That conflation is what let the widget flash a logged-out checkout at somebody who had just
   * signed in, inviting a tap that signed them straight back out.
   */
  isResolvingAccount: boolean;
  /**
   * Set when a live Firebase session has no matching Dibs row. A real state, not a loading one:
   * every authenticated endpoint rejects that client, so the app must offer a way out instead of
   * leaving them signed in to nothing.
   */
  accountMissing: boolean;
  accountError: unknown;
  refetchAccount: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const status = useSessionStore((state) => state.status);
  const session = useSessionStore((state) => state.session);
  const setSession = useSessionStore((state) => state.setSession);

  // The single writer of the session. Fires once on launch with Firebase's restored answer,
  // which is what moves the app off `initializing`.
  useEffect(
    () =>
      onAuthStateChanged(auth, (user) => {
        setSession(user?.email ? { uid: user.uid, email: user.email } : null);
      }),
    [setSession],
  );

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    // Everything keyed to a person goes with them. Nothing about the previous client may
    // survive into the next one's session on the same phone.
    queryClient.removeQueries({ queryKey: ['account'] });
    queryClient.removeQueries({ queryKey: ['passes'] });
    queryClient.removeQueries({ queryKey: ['credit'] });
    queryClient.removeQueries({ queryKey: ['paymentMethods'] });
    queryClient.removeQueries({ queryKey: ['upcoming'] });
    queryClient.removeQueries({ queryKey: ['history'] });
  }, [queryClient]);

  // A rejected token means this session is over. Firebase refreshes tokens on its own, so a 401
  // is not a blip — it is a credential the server will not accept again.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (useSessionStore.getState().session) void signOut();
    });
    return () => setUnauthorizedHandler(() => {});
  }, [signOut]);

  // Destructured for the same reason as in StudioConfigProvider: the query object is a fresh
  // identity every render, so memoizing on it would hand the whole tree a new auth value each time.
  const {
    data: account,
    isPending: accountPending,
    isSuccess: accountLoaded,
    error: accountError,
    refetch: refetchAccountQuery,
  } = useQuery({
    queryKey: queryKeys.accountByEmail(session?.email ?? ''),
    queryFn: ({ signal }) =>
      fetchUserAccount(
        apiClient,
        { email: session!.email, dibsStudioId: studio.dibsStudioId },
        signal,
      ),
    enabled: Boolean(session),
    staleTime: 5 * 60 * 1000,
    // A 401/403 here is answered by signing out, not by hammering the endpoint.
    retry: 1,
  });

  const value = useMemo<AuthState>(
    () => ({
      status,
      session,
      account: account ?? null,
      isResolvingAccount: Boolean(session) && accountPending,
      // `null` from a SUCCESSFUL fetch is the "Firebase account with no Dibs row" case. A null
      // from a failed one is just a failure, and must not be reported as a missing account.
      accountMissing: Boolean(session) && accountLoaded && account === null,
      accountError,
      refetchAccount: () => void refetchAccountQuery(),
      signOut,
    }),
    [
      status,
      session,
      account,
      accountPending,
      accountLoaded,
      accountError,
      refetchAccountQuery,
      signOut,
    ],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthState {
  const state = use(AuthContext);
  if (!state) throw new Error('useAuth must be used inside an <AuthProvider>.');
  return state;
}
