/**
 * Cancelling a booking.
 *
 * The app predicts early-vs-late for the confirm copy; the SERVER decides what actually came back,
 * and `result.returned` is the only thing the outcome sentence may be built from.
 */
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { apiClient, dropClass, queryKeys, BookingRefusedError } from '@/api';
import { describeApiError } from '@/api/errors';
import type { DropClassResponse } from '@/api/schemas/class-booking';
import { studio } from '@/config/studio';
import { useAuth } from '@/features/auth/AuthProvider';

export type DropStatus =
  | { kind: 'idle' }
  | { kind: 'working' }
  | { kind: 'done'; result: DropClassResponse }
  | { kind: 'error'; message: string };

export interface DropClassState {
  status: DropStatus;
  drop: (booking: { dibsTransactionId: number; eventId: number }) => void;
  reset: () => void;
}

export function useDropClass(): DropClassState {
  const queryClient = useQueryClient();
  const { account } = useAuth();
  const [status, setStatus] = useState<DropStatus>({ kind: 'idle' });

  const drop = useCallback(
    (booking: { dibsTransactionId: number; eventId: number }) => {
      if (status.kind === 'working') return;
      setStatus({ kind: 'working' });

      void (async () => {
        try {
          const result = await dropClass(apiClient, booking);
          setStatus({ kind: 'done', result });

          // Everything a drop can move. The pass balance in particular: a returned use that leaves
          // the wallet showing the old count is the widget's "Included label disagrees with the
          // checkout bar" bug in a different costume.
          void queryClient.invalidateQueries({ queryKey: ['schedule'] });
          if (account) {
            void queryClient.invalidateQueries({
              queryKey: queryKeys.upcoming(account.userid, studio.dibsStudioId),
            });
            void queryClient.invalidateQueries({
              queryKey: queryKeys.passes(account.userid, studio.dibsStudioId),
            });
            void queryClient.invalidateQueries({
              queryKey: queryKeys.credit(account.userid, studio.dibsStudioId),
            });
          }
        } catch (error) {
          // A refusal carries the server's own sentence and is not a fault; `describeApiError`
          // would replace it with "the studio's system is having trouble".
          setStatus({
            kind: 'error',
            message:
              error instanceof BookingRefusedError ? error.message : describeApiError(error),
          });
        }
      })();
    },
    [account, queryClient, status.kind],
  );

  return { status, drop, reset: () => setStatus({ kind: 'idle' }) };
}
