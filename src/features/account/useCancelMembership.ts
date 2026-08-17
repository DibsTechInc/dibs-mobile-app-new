/**
 * Cancelling a membership.
 *
 * The commitment refusal is a STATE, not an error string — it carries a date the screen renders.
 */
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { apiClient, cancelMembership, queryKeys } from '@/api';
import { CommitmentNotMetError } from '@/api/endpoints/membership';
import { describeApiError } from '@/api/errors';
import { studio } from '@/config/studio';
import { useAuth } from '@/features/auth/AuthProvider';

export type CancelMembershipStatus =
  | { kind: 'idle' }
  | { kind: 'working' }
  | { kind: 'done' }
  /** The server said no. Unreachable in practice — the button is hidden — so if it fires, the
   *  app and the server disagreed and the client is owed the server's answer, legibly. */
  | { kind: 'refused'; eligibleOn: string | null; packageName: string | null }
  | { kind: 'error'; message: string };

export interface CancelMembershipState {
  status: CancelMembershipStatus;
  cancel: (args: { passId: number; packageId: number }) => void;
  reset: () => void;
}

export function useCancelMembership(): CancelMembershipState {
  const queryClient = useQueryClient();
  const { account } = useAuth();
  const [status, setStatus] = useState<CancelMembershipStatus>({ kind: 'idle' });

  const cancel = useCallback(
    ({ passId, packageId }: { passId: number; packageId: number }) => {
      if (status.kind === 'working') return;
      setStatus({ kind: 'working' });

      void (async () => {
        try {
          await cancelMembership(apiClient, {
            dibsStudioId: studio.dibsStudioId,
            passId,
            packageId,
          });
          setStatus({ kind: 'done' });

          if (account) {
            void queryClient.invalidateQueries({
              queryKey: queryKeys.passes(account.userid, studio.dibsStudioId),
            });
          }
        } catch (error) {
          if (error instanceof CommitmentNotMetError) {
            setStatus({
              kind: 'refused',
              eligibleOn: error.eligibleOn,
              packageName: error.packageName,
            });
            return;
          }
          setStatus({ kind: 'error', message: describeApiError(error) });
        }
      })();
    },
    [account, queryClient, status.kind],
  );

  return { status, cancel, reset: () => setStatus({ kind: 'idle' }) };
}
