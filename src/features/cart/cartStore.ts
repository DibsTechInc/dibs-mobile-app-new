/**
 * The cart: which classes the client has tapped Book on, and nothing else.
 *
 * ── It stores IDS. That is the whole design ────────────────────────────────────────────────────
 * Not names, not prices, not times — just `eventId`s, in the order they were added. Everything a
 * cart row displays is re-derived from the live schedule query at render time (`domain/cart`).
 *
 * The alternative — snapshotting the price when the row was tapped — is how a client ends up
 * looking at a stale number. An off-peak window closes, or the studio re-prices the class, and a
 * snapshot cart happily shows the old figure right up until the server refuses the charge. Storing
 * ids means the cart cannot hold a price at all, so it cannot hold a WRONG one; and a class that
 * disappears from the schedule entirely becomes a row that says so, rather than a ghost with a
 * price on it.
 *
 * ── Never persisted ────────────────────────────────────────────────────────────────────────────
 * Deliberately in memory only. A cart restored from disk on Tuesday for a Monday class is a dead
 * end wearing a price tag — the same lesson as the widget's `paymentOptionsAll`, which was
 * rehydrating a deleted card into an enabled Confirm button. Session state stays in the session.
 */
import { create } from 'zustand';

interface CartState {
  /** Event ids, in the order they were added. Order is the order the checkout list renders in. */
  eventIds: number[];
  add: (eventId: number) => void;
  remove: (eventId: number) => void;
  /** Tapping the row's button again takes it back out. Every add has a visible undo. */
  toggle: (eventId: number) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  eventIds: [],

  // Guarded against duplicates: two taps on the same row must not book the class twice, and a
  // `Set` here would lose the insertion order the checkout list depends on.
  add: (eventId) =>
    set((state) =>
      state.eventIds.includes(eventId) ? state : { eventIds: [...state.eventIds, eventId] },
    ),

  remove: (eventId) =>
    set((state) => ({ eventIds: state.eventIds.filter((id) => id !== eventId) })),

  toggle: (eventId) =>
    set((state) =>
      state.eventIds.includes(eventId)
        ? { eventIds: state.eventIds.filter((id) => id !== eventId) }
        : { eventIds: [...state.eventIds, eventId] },
    ),

  clear: () => set({ eventIds: [] }),
}));

/**
 * Is this class in the cart?
 *
 * A selector rather than `useCartStore().eventIds.includes(id)` at the call site, because the
 * latter re-renders every schedule row whenever ANY row is added or removed. With a 20-class day
 * that is 20 re-renders for one tap.
 */
export function useIsInCart(eventId: number): boolean {
  return useCartStore((state) => state.eventIds.includes(eventId));
}

export function useCartCount(): number {
  return useCartStore((state) => state.eventIds.length);
}
