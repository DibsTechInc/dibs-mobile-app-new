/**
 * Changing your own password. Re-authenticates first — Firebase rejects `updatePassword` on an
 * older session with `auth/requires-recent-login`, and surfacing that would be a dead end.
 */
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';
import { useCallback, useState } from 'react';

import { apiClient, confirmPasswordSet } from '@/api';
import { authErrorCode, describeAuthError, passwordProblem } from '@/domain/auth/describe-auth-error';
import { auth } from '@/lib/firebase';

export type ChangePasswordStatus =
  | { kind: 'idle' }
  | { kind: 'working' }
  | { kind: 'done' }
  /** `field` puts the message under the input that caused it rather than at the foot of the form. */
  | { kind: 'error'; message: string; field: 'current' | 'next' | null };

export interface ChangePasswordState {
  status: ChangePasswordStatus;
  change: (args: { currentPassword: string; newPassword: string }) => void;
  reset: () => void;
}

export function useChangePassword(): ChangePasswordState {
  const [status, setStatus] = useState<ChangePasswordStatus>({ kind: 'idle' });

  const change = useCallback(({ currentPassword, newPassword }: {
    currentPassword: string;
    newPassword: string;
  }) => {
    if (status.kind === 'working') return;

    // Checked before Firebase is troubled, so the rule reads the same on this form as on sign-up.
    const problem = passwordProblem(newPassword);
    if (problem) {
      setStatus({ kind: 'error', message: problem, field: 'next' });
      return;
    }
    if (!currentPassword) {
      setStatus({ kind: 'error', message: 'Please enter your current password.', field: 'current' });
      return;
    }
    if (currentPassword === newPassword) {
      setStatus({
        kind: 'error',
        message: 'That is the password you already have. Choose a different one.',
        field: 'next',
      });
      return;
    }

    const user = auth.currentUser;
    if (!user?.email) {
      // A LIVE session, not a persisted userid. On a shared device a stored identity can outlive
      // the session that created it, and changing "your" password against somebody else's account
      // is the worst version of that mistake.
      setStatus({
        kind: 'error',
        message: 'Please sign in again before changing your password.',
        field: null,
      });
      return;
    }

    setStatus({ kind: 'working' });

    void (async () => {
      try {
        await reauthenticateWithCredential(
          user,
          EmailAuthProvider.credential(user.email!, currentPassword),
        );
      } catch (error) {
        const code = authErrorCode(error);
        // The one place the app can be specific without leaking anything: the client typed this
        // address themselves and is already signed in as it, so there is no account to enumerate.
        const wrongPassword =
          code === 'auth/wrong-password' ||
          code === 'auth/invalid-credential' ||
          code === 'auth/invalid-login-credentials';
        setStatus({
          kind: 'error',
          message: wrongPassword
            ? 'That current password is not right. Try again, or sign out and use “Forgot password”.'
            : describeAuthError(error),
          field: wrongPassword ? 'current' : null,
        });
        return;
      }

      try {
        await updatePassword(user, newPassword);
      } catch (error) {
        setStatus({ kind: 'error', message: describeAuthError(error), field: 'next' });
        return;
      }

      // The password is LIVE from here. The mirror write below is bookkeeping and must NEVER turn
      // a success into a reported failure — that sends somebody to change it again and invalidate
      // the one that worked. Logged, though: a flag stuck false is the documented cause of being
      // unable to sign in on the widget afterwards, and this is the only trace of why.
      try {
        await confirmPasswordSet(apiClient);
      } catch (error) {
        console.warn('[password] confirm-password-set failed after a successful change', error);
      }

      setStatus({ kind: 'done' });
    })();
  }, [status.kind]);

  return { status, change, reset: () => setStatus({ kind: 'idle' }) };
}
