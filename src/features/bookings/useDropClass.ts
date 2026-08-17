/**
 * Cancelling a booking.
 *
 * The app predicts early-vs-late for the confirm copy; the SERVER decides what actually came back,
 * and `result.returned` is the only thing the outcome sentence may be built from.
 */
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import {
  apiClient,
  cancelAppointment,
  dropClass,
  queryKeys,
  BookingRefusedError,
  type ClientBookings,
} from '@/api';
import { describeApiError } from '@/api/errors';
import type { DropClassResponse } from '@/api/schemas/class-booking';
import type { UpcomingBookingRow } from '@/api/schemas/upcoming';
import { studio } from '@/config/studio';
import { useAuth } from '@/features/auth/AuthProvider';

export type DropStatus =
  | { kind: 'idle' }
  | { kind: 'working' }
  | { kind: 'done'; result: DropClassResponse }
  | { kind: 'error'; message: string };

export interface DropClassState {
  status: DropStatus;
  /**
   * `isAppointment` routes to the appointment sibling endpoint — same request keys, same
   * response shape, one extra server rule (notice-or-nothing). The two endpoints are mutually
   * exclusive server-side, so sending the wrong one is a refusal, never a wrong cancel.
   */
  drop: (booking: { dibsTransactionId: number; eventId: number; isAppointment?: boolean }) => void;
  reset: () => void;
}

export function useDropClass(): DropClassState {
  const queryClient = useQueryClient();
  const { account } = useAuth();
  const [status, setStatus] = useState<DropStatus>({ kind: 'idle' });

  const drop = useCallback(
    (booking: { dibsTransactionId: number; eventId: number; isAppointment?: boolean }) => {
      if (status.kind === 'working') return;
      setStatus({ kind: 'working' });

      void (async () => {
        try {
          const keys = { dibsTransactionId: booking.dibsTransactionId, eventId: booking.eventId };
          const result = booking.isAppointment
            ? await cancelAppointment(apiClient, keys)
            : await dropClass(apiClient, keys);
          setStatus({ kind: 'done', result });

          /*
           * The row leaves the list NOW, from the cache — not when the refetch lands.
           *
           * This is not a guess: the server has just confirmed the drop, so marking the cached row
           * `dropped` is writing a fact we hold. Without it the cancelled class sat on My Calendar
           * for the whole `get-upcoming-appts` round trip — a slow legacy handler, tens of seconds
           * on staging — looking exactly like a cancel that had not worked (Alicia, 2026-08-16:
           * "is it happening? is it broken?"). The invalidation below still reconciles with the
           * server's own answer when it arrives.
           */
          if (account) {
            const markDropped = (rows: UpcomingBookingRow[]) =>
              rows.map((row) =>
                row.dibsTransactionId === booking.dibsTransactionId
                  ? { ...row, dropped: true }
                  : row,
              );
            queryClient.setQueryData<ClientBookings>(
              queryKeys.upcoming(account.userid, studio.dibsStudioId),
              (cached) =>
                cached
                  ? { upcoming: markDropped(cached.upcoming), previous: markDropped(cached.previous) }
                  : cached,
            );
          }

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
