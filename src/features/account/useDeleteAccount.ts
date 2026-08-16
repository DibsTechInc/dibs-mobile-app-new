/**
 * Deleting the account.
 *
 * On success the LOCAL session follows the server: sign out, drop every cached query, land on
 * Home. The order matters — the caches hold the deleted person's bookings and passes, and a
 * sign-out that left them warm would flash somebody's history at the next client on a shared
 * device.
 *
 * A refusal (`active_membership` / `active_subscription`) is a state, not an error: the sheet
 * renders the server's sentence and offers the route to the thing that must be cancelled first.
 */
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';

import { apiClient, deleteAccount, AccountDeletionRefusedError } from '@/api';
import { describeApiError } from '@/api/errors';
import { useAuth } from '@/features/auth/AuthProvider';

export type DeleteAccountStatus =
  | { kind: 'idle' }
  | { kind: 'working' }
  /** The server refused because something is still billing. Carries its own sentence. */
  | { kind: 'blocked'; code: string; message: string }
  | { kind: 'error'; message: string };

export interface DeleteAccountState {
  status: DeleteAccountStatus;
  deleteAccount: () => void;
  reset: () => void;
}

export function useDeleteAccount(): DeleteAccountState {
  const queryClient = useQueryClient();
  const { signOut } = useAuth();
  const [status, setStatus] = useState<DeleteAccountStatus>({ kind: 'idle' });

  const run = useCallback(() => {
    if (status.kind === 'working') return;
    setStatus({ kind: 'working' });

    void (async () => {
      try {
        await deleteAccount(apiClient);
        /*
         * The account is gone server-side; everything local about it goes too, in this order:
         * off the account surfaces first (Home is public, so there is no sign-in flash), then
         * the session, then the caches — cleared LAST so nothing refetches with a token that
         * just died. No 'done' state: the navigation IS the confirmation.
         */
        router.replace('/');
        await signOut();
        queryClient.clear();
      } catch (error) {
        if (error instanceof AccountDeletionRefusedError) {
          setStatus({ kind: 'blocked', code: error.refusalCode, message: error.message });
          return;
        }
        setStatus({ kind: 'error', message: describeApiError(error) });
      }
    })();
  }, [queryClient, signOut, status.kind]);

  return { status, deleteAccount: run, reset: () => setStatus({ kind: 'idle' }) };
}
