/**
 * Booking the appointment — the one mutation, plus the monthly flow's conflict pre-check and the
 * success snapshot the Booked screen renders from.
 *
 * ── Why a snapshot store and not route params ─────────────────────────────────────────────────
 * The Booked screen is its own route (the flow's screens unwind behind it), and route params
 * carry nothing in this flow by rule. The snapshot is written at success; the DRAFT clears when
 * the Booked screen arrives (see BookedScreen), because the checkout route redirects the moment
 * its slot disappears and clearing here would race the navigation.
 *
 * ── Error posture ─────────────────────────────────────────────────────────────────────────────
 * `room_conflict` is the one refusal with its own path: the slot was taken while the client sat
 * on checkout, NOTHING was charged (the server checks before any money moves), and the honest
 * answer is a fresh slot grid — the screen routes back with availability invalidated. Everything
 * else renders the server's own sentence (card declines arrive humanized). Unknown failures do
 * NOT claim nothing was charged; only the server can say that.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import { create } from 'zustand';

import {
  apiClient,
  AppointmentRefusedError,
  checkSlotConflict,
  completeAppointmentBooking,
  createRecurringAppointment,
  queryKeys,
} from '@/api';
import type { AvailabilitySlot } from '@/api/schemas/appointments';
import { studio } from '@/config/studio';
import {
  appointmentIdempotencyKey,
  buildRecurringBookingBody,
  buildSingleBookingBody,
  type AppointmentPaymentInput,
} from '@/domain/appointments/payload';
import { useAuth } from '@/features/auth/AuthProvider';


/** What the Booked screen shows. Written on success, in the same breath as the draft clearing. */
export interface BookedSnapshot {
  kind: 'single' | 'monthly';
  serviceName: string;
  /** Null at a roomBooking studio — no name is ever rendered there. */
  providerName: string | null;
  /** Stored wall-clock of the (first) session. */
  startIso: string;
  durationMinutes: number | null;
  /** Monthly: every session paid for today. Single: just the one. */
  sessionIsos: string[];
  /** What actually left their account today, in dollars. 0 for a fully covered booking. */
  paidTotal: number;
  paidWith: 'card' | 'pass' | 'credit';
  /** Monthly only — the commitment continues past the paid dates. */
  isRecurring: boolean;
}

interface LastBookingState {
  snapshot: BookedSnapshot | null;
  set: (snapshot: BookedSnapshot) => void;
  clear: () => void;
}

export const useLastBooking = create<LastBookingState>((set) => ({
  snapshot: null,
  set: (snapshot) => set({ snapshot }),
  clear: () => set({ snapshot: null }),
}));

/** One monthly session's bookability, per the server's pre-check. */
export interface SessionConflict {
  startIso: string;
  conflicted: boolean;
  reason: string | null;
}

/**
 * The widget's per-session conflict sweep, as a query: every candidate date is checked in
 * parallel and conflicted ones are listed-but-excluded. A failed check counts as conflicted —
 * over-flagging costs one date from the list; under-flagging books a session the server refuses.
 */
export function useMonthlyConflicts({
  sessionIsos,
  slot,
  instructorId,
  locationId,
  enabled,
}: {
  sessionIsos: string[];
  slot: AvailabilitySlot | null;
  instructorId: number | null;
  locationId: number | null;
  enabled: boolean;
}) {
  // Duration to project each session's end from its start; the slot's own end anchors it.
  const durationMs =
    slot?.end_time && slot.start_time
      ? new Date(slot.end_time).getTime() - new Date(slot.start_time).getTime()
      : 60 * 60 * 1000;

  return useQuery({
    queryKey: [
      'appointmentConflicts',
      studio.dibsStudioId,
      instructorId,
      locationId,
      ...sessionIsos,
    ],
    queryFn: async ({ signal }): Promise<SessionConflict[]> =>
      Promise.all(
        sessionIsos.map(async (startIso) => {
          const endIso = new Date(new Date(startIso).getTime() + durationMs).toISOString();
          const result = await checkSlotConflict(
            apiClient,
            {
              dibsStudioId: studio.dibsStudioId,
              startTimeIso: startIso,
              endTimeIso: endIso,
              instructorId,
              locationId,
            },
            signal,
          );
          return { startIso, conflicted: result.conflicted, reason: result.reason };
        }),
      ),
    enabled: enabled && sessionIsos.length > 0,
    // Bookability moves under us like availability does; never serve a stale verdict.
    staleTime: 0,
    gcTime: 0,
  });
}

export type BookingPhase =
  | { kind: 'idle' }
  | { kind: 'working' }
  | { kind: 'booked' }
  | {
      kind: 'failed';
      message: string;
      /** 'room_conflict' → the screen routes back to slots with the grid refreshed. */
      refusalCode: string | null;
      /** True only when the SERVER said no money moved. */
      nothingCharged: boolean;
    };

export interface BookSingleArgs {
  kind: 'single';
  serviceId: number;
  serviceName: string;
  slot: AvailabilitySlot;
  instructorId: number;
  providerName: string | null;
  locationId: number | null;
  payment: AppointmentPaymentInput;
  pricing: { subtotal: number; tax: number; total: number };
  /** What actually leaves the account today (total less credit; 0 under a pass). */
  paidTotal: number;
}

export interface BookMonthlyArgs {
  kind: 'monthly';
  serviceId: number;
  serviceName: string;
  slot: AvailabilitySlot;
  instructorId: number;
  providerName: string | null;
  payment: AppointmentPaymentInput;
  pricing: { subtotal: number; tax: number; total: number };
  paidTotal: number;
  payNowIsos: string[];
  holdIsos: string[];
  passCoveredSessions: number;
}

export type BookArgs = BookSingleArgs | BookMonthlyArgs;

export function useBookAppointment() {
  const { account } = useAuth();
  const queryClient = useQueryClient();
  const setLastBooking = useLastBooking((state) => state.set);

  const [phase, setPhase] = useState<BookingPhase>({ kind: 'idle' });
  /** A double tap must not book twice. The server's own idempotency guard is the backstop. */
  const running = useRef(false);

  const book = useCallback(
    async (args: BookArgs) => {
      if (running.current) return;
      if (!account) {
        setPhase({
          kind: 'failed',
          message: 'Please sign in to book.',
          refusalCode: null,
          nothingCharged: true,
        });
        return;
      }

      running.current = true;
      setPhase({ kind: 'working' });

      try {
        if (args.kind === 'single') {
          const body = buildSingleBookingBody({
            userid: account.userid,
            dibsStudioId: studio.dibsStudioId,
            appointmentTypeId: args.slot.apptIdForType ?? args.serviceId,
            slotStartIso: args.slot.start_time,
            locationId: args.locationId,
            instructorId: args.instructorId,
            payment: args.payment,
            pricing: args.pricing,
            idempotencyKey: appointmentIdempotencyKey(account.userid, args.serviceId),
          });
          await completeAppointmentBooking(apiClient, body);
        } else {
          const body = buildRecurringBookingBody({
            userid: account.userid,
            dibsStudioId: studio.dibsStudioId,
            appointmentTypeId: args.slot.apptIdForType ?? args.serviceId,
            appointmentTypeName: args.serviceName,
            instructorId: args.instructorId,
            instructorName: args.providerName ?? '',
            payNowIsos: args.payNowIsos,
            holdIsos: args.holdIsos,
            payment: args.payment,
            pricing: args.pricing,
            passCoveredSessions: args.passCoveredSessions,
          });
          await createRecurringAppointment(apiClient, body);
        }

        setLastBooking({
          kind: args.kind,
          serviceName: args.serviceName,
          providerName: args.providerName,
          startIso: args.slot.start_time,
          durationMinutes: args.slot.lengthInMinutes ?? null,
          sessionIsos: args.kind === 'monthly' ? args.payNowIsos : [args.slot.start_time],
          paidTotal: args.paidTotal,
          paidWith: args.payment.type,
          isRecurring: args.kind === 'monthly',
        });
        // The draft is NOT cleared here: the checkout ROUTE redirects to /book the moment its
        // slot disappears, which would race the success navigation. The Booked screen clears it
        // on arrival instead — by then nothing is standing on the draft.
        setPhase({ kind: 'booked' });

        // Invalidate rather than patch — the server's rows are the record.
        void queryClient.invalidateQueries({
          queryKey: queryKeys.upcoming(account.userid, studio.dibsStudioId),
        });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.passes(account.userid, studio.dibsStudioId),
        });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.credit(account.userid, studio.dibsStudioId),
        });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.accountActivity(account.userid, studio.dibsStudioId),
        });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.upcomingPayments(account.userid, studio.dibsStudioId),
        });
        // The slot is gone now — anyone stepping back must see a fresh grid.
        void queryClient.invalidateQueries({ queryKey: ['availability'] });
      } catch (error) {
        if (error instanceof AppointmentRefusedError) {
          setPhase({
            kind: 'failed',
            message: error.message,
            refusalCode: error.refusalCode,
            // The one refusal the server DOCUMENTS as pre-charge. Everything else stays honest
            // about not knowing.
            nothingCharged: error.refusalCode === 'room_conflict',
          });
        } else {
          setPhase({
            kind: 'failed',
            message:
              error instanceof Error && error.message
                ? error.message
                : 'Something went wrong. Please try again.',
            refusalCode: null,
            nothingCharged: false,
          });
        }
      } finally {
        running.current = false;
      }
    },
    [account, queryClient, setLastBooking],
  );

  const reset = useCallback(() => setPhase({ kind: 'idle' }), []);

  return { phase, book, reset };
}
