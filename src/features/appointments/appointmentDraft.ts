/**
 * The appointment being assembled: one service, (maybe) a provider, a date, a slot, and — at a
 * monthly-commitment studio — whether it locks in monthly.
 *
 * Same philosophy as `cartStore`: in memory only, never persisted (a draft restored from disk on
 * Tuesday holds Monday's slot — a double-booking wearing a price tag), and route params carry
 * NOTHING. Back navigation never clears it; only booking or an explicit clear does.
 *
 * ── The invalidation rules (design handoff, verbatim) ─────────────────────────────────────────
 * Changing the SERVICE keeps the provider (the roster is studio-wide — the server has no
 * per-type provider mapping to invalidate against) but always clears the date and slot.
 * Changing the PROVIDER clears the date and slot. Changing the DATE clears the slot. A slot from
 * a previous selection surviving any upstream edit is a booking for the wrong thing.
 *
 * The chosen slot is held as a SNAPSHOT (times, price, location), not an id — slots have no ids,
 * and the booking payload is built from exactly what the client was shown. The snapshot never
 * outlives a fresh availability response for the same day: the screen re-validates it against
 * the live grid and drops it if the time has vanished.
 */
import { create } from 'zustand';

import type { AvailabilitySlot } from '@/api/schemas/appointments';

export type CommitmentKind = 'single' | 'monthly';

interface AppointmentDraftState {
  serviceId: number | null;
  providerId: number | null;
  /** `YYYY-MM-DD` in the studio's calendar. */
  date: string | null;
  slot: AvailabilitySlot | null;
  commitment: CommitmentKind;

  selectService: (serviceId: number) => void;
  selectProvider: (providerId: number) => void;
  selectDate: (date: string) => void;
  selectSlot: (slot: AvailabilitySlot | null) => void;
  setCommitment: (commitment: CommitmentKind) => void;
  clear: () => void;
}

const EMPTY = {
  serviceId: null,
  providerId: null,
  date: null,
  slot: null,
  commitment: 'single' as CommitmentKind,
};

export const useAppointmentDraft = create<AppointmentDraftState>((set) => ({
  ...EMPTY,

  selectService: (serviceId) =>
    set((state) =>
      state.serviceId === serviceId
        ? state
        : { serviceId, date: null, slot: null, commitment: 'single' },
    ),

  selectProvider: (providerId) =>
    set((state) =>
      state.providerId === providerId ? state : { providerId, date: null, slot: null },
    ),

  selectDate: (date) =>
    set((state) => (state.date === date ? state : { date, slot: null, commitment: 'single' })),

  selectSlot: (slot) => set({ slot }),

  setCommitment: (commitment) => set({ commitment }),

  clear: () => set({ ...EMPTY }),
}));
