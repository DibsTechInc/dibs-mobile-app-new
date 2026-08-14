/**
 * The auth route.
 *
 * Reached from Home rather than gating it: browsing the schedule needs no account, exactly as on
 * the widget. The gate belongs at booking and purchase.
 *
 * ── It hands people back where they came from ─────────────────────────────────────────────────
 * A guest can fill a cart — the schedule is public and browsing is the point — and only meets the
 * gate at `/checkout`, which sends them here with `?returnTo=/checkout`. Signing in then takes
 * them back to their cart rather than to Home.
 *
 * Without that they land on Home holding a cart they cannot see, which is precisely the widget's
 * post-login bounce: guest taps Confirm → signs in → arrives at "my classes" with the cart
 * nowhere in sight. It took three attempts to fix there. `resolveReturnPath` is a route
 * whitelist, so an unknown or mangled value lands on Home rather than on a route that does not
 * exist.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { AuthScreen, type SessionPanelProps } from '@/features/auth/AuthScreen';
import { resolveReturnPath } from '@/features/auth/returnPath';
import { useAuthActions } from '@/features/auth/useAuthActions';
import { useStudioConfig } from '@/features/studio/StudioConfigProvider';
import { studio } from '@/config/studio';

export default function SignInRoute() {
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { config } = useStudioConfig();
  const { status, session, account, accountMissing, isResolvingAccount, refetchAccount, signOut } =
    useAuth();
  const { signIn, signUp, resetPassword, completeAccountSetup, isBusy } = useAuthActions();
  const [error, setError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const studioName = config?.studioName ?? studio.appName;

  const goOnward = useCallback(() => {
    // `replace`, not `back`: a client who arrived here from a deep link has nothing to go back
    // to, and `back` on an empty stack does nothing at all — a button that looks broken.
    //
    // `replace` also takes sign-in OUT of the stack, so the back gesture from the destination
    // does not land somebody who just signed in on the login screen.
    router.replace(resolveReturnPath(returnTo));
  }, [returnTo]);

  const handleSignIn = useCallback(
    async (email: string, password: string) => {
      setError(null);
      const result = await signIn(email, password);
      if (result.ok) goOnward();
      else setError(result.message ?? null);
    },
    [signIn, goOnward],
  );

  const handleSignUp = useCallback(
    async (values: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone: string;
    }) => {
      setError(null);
      const result = await signUp(values);
      if (result.ok) goOnward();
      else setError(result.message ?? null);
    },
    [signUp, goOnward],
  );

  const handleReset = useCallback(
    async (email: string) => {
      setError(null);
      const result = await resetPassword(email);
      if (!result.ok) setError(result.message ?? null);
    },
    [resetPassword],
  );

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
  }, [signOut]);

  const handleCompleteSetup = useCallback(
    async (firstName: string, lastName: string) => {
      if (!session) return;
      setError(null);
      const result = await completeAccountSetup(session.email, firstName, lastName);
      if (result.ok) refetchAccount();
      else setError(result.message ?? null);
    },
    [session, completeAccountSetup, refetchAccount],
  );

  /**
   * The session panel replaces the form only once we KNOW what the session is.
   *
   * While the Dibs identity is still resolving there is a live Firebase session but no answer
   * yet — and rendering the form in that window invites a client who is already signed in to
   * sign in again. Waiting is the honest state; treating it as signed-out is the widget bug that
   * showed a logged-out checkout to somebody who had just logged in.
   */
  const sessionPanel: SessionPanelProps | null =
    session && !isResolvingAccount
      ? {
          displayName:
            [account?.firstName, account?.lastName].filter(Boolean).join(' ').trim() || null,
          email: session.email,
          accountMissing,
          onSignOut: () => void handleSignOut(),
          onCompleteSetup: (firstName, lastName) => void handleCompleteSetup(firstName, lastName),
          completeError: error,
        }
      : null;

  return (
    <AuthScreen
      studioName={studioName}
      heroUri={config?.heroUrl ?? null}
      supportEmail={config?.customerServiceEmail ?? null}
      busy={isBusy || signingOut}
      resolvingSession={Boolean(session) && isResolvingAccount}
      initializing={status === 'initializing'}
      error={error}
      onDismissError={() => setError(null)}
      onSignIn={(email, password) => void handleSignIn(email, password)}
      onSignUp={(values) => void handleSignUp(values)}
      onResetPassword={(email) => void handleReset(email)}
      session={sessionPanel}
    />
  );
}
