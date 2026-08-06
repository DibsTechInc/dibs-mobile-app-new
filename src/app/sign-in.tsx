/**
 * The auth route.
 *
 * Reached from Home rather than gating it: browsing the schedule needs no account, exactly as on
 * the widget. The gate belongs at booking and purchase, which are later phases.
 */
import { router } from 'expo-router';
import { useCallback, useState } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { AuthScreen, type SessionPanelProps } from '@/features/auth/AuthScreen';
import { useAuthActions } from '@/features/auth/useAuthActions';
import { useStudioConfig } from '@/features/studio/StudioConfigProvider';
import { studio } from '@/config/studio';

export default function SignInRoute() {
  const { config } = useStudioConfig();
  const { status, session, account, accountMissing, isResolvingAccount, refetchAccount, signOut } =
    useAuth();
  const { signIn, signUp, resetPassword, completeAccountSetup, isBusy } = useAuthActions();
  const [error, setError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const studioName = config?.studioName ?? studio.appName;

  const goHome = useCallback(() => {
    // `replace`, not `back`: a client who arrived here from a deep link has nothing to go back
    // to, and `back` on an empty stack does nothing at all — a button that looks broken.
    router.replace('/');
  }, []);

  const handleSignIn = useCallback(
    async (email: string, password: string) => {
      setError(null);
      const result = await signIn(email, password);
      if (result.ok) goHome();
      else setError(result.message ?? null);
    },
    [signIn, goHome],
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
      if (result.ok) goHome();
      else setError(result.message ?? null);
    },
    [signUp, goHome],
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
