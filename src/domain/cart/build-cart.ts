/**
 * The cart, as a screen reads it: a list of lines and one summary.
 *
 * PURE TypeScript. The bar and the checkout screen both render this, so the figure on the bar and
 * the figure being charged cannot come from two different calculations — which is exactly how the
 * widget's schedule row came to say "Included" while its checkout bar demanded $22.00.
 *
 * ── Every line has a `state`, and only one of them is chargeable ───────────────────────────────
 * A cart id can survive the class it points at. The schedule refreshes, an off-peak window closes,
 * a class fills, a studio cancels a session — and the id sitting in the cart says nothing about
 * any of that. So each line is resolved against the LIVE schedule every render and lands in one of
 * five states, each of which the checkout screen has a sentence and a way out for:
 *
 *   `ready`       — a real price a card can pay. The only state that contributes to the total.
 *   `gone`        — the class is no longer in the schedule window. Cancelled, or already started.
 *   `full`        — it filled while it sat in the cart.
 *   `free`        — `free_class`. Bookable, but never by card; a $0 PaymentIntent is rejected.
 *   `noPrice`     — `price_dibs` null or 0, which means "priced elsewhere", NOT free.
 *
 * The total counts `ready` lines and nothing else. Summing a line we cannot charge would put a
 * number on the button that the checkout is structurally unable to collect.
 */
import type { ScheduleEvent } from '@/api/schemas/schedule';
import { formatBalance } from '@/domain/money/format';
import { resolveClassCharge, type ClassCharge } from '@/domain/pricing/class-charge';
import { longDayLabel } from '@/domain/schedule/days';
import { toScheduleEntry } from '@/domain/schedule/entry';
import type { ScheduleEntry } from '@/domain/schedule/types';

export type CartLineState = 'ready' | 'gone' | 'full' | 'free' | 'noPrice';

export interface CartLine {
  eventId: number;
  state: CartLineState;
  /** Null only when the class is `gone` — there is no row left to describe it with. */
  entry: ScheduleEntry | null;
  /** 'Saturday, August 15'. Empty when the class is gone. */
  dayLabel: string;
  locationLabel: string | null;
  /** Null when the class is `gone`; otherwise always present, even in the un-chargeable states. */
  charge: ClassCharge | null;
  /** What to tell the client about this line. Empty for `ready` — a good line needs no sentence. */
  note: string;
}

export interface CartSummary {
  lines: CartLine[];
  /** How many lines can actually be charged. The count the bar and the button quote. */
  chargeableCount: number;
  /** Lines in the cart that cannot be charged. Surfaced, never silently dropped. */
  blockedCount: number;
  totalCents: number;
  /** "$84.46". Always two decimals — this is money about to leave an account, not a quoted price. */
  totalLabel: string;
  /** True when there is at least one chargeable line. What gates the Checkout affordance. */
  canCheckout: boolean;
}

export interface BuildCartOptions {
  showInstructor: boolean;
  currency?: string;
}

function noteFor(state: CartLineState, entry: ScheduleEntry | null): string {
  switch (state) {
    case 'gone':
      return 'No longer on the schedule — it may have been cancelled, or it has already started.';
    case 'full':
      return entry?.hasWaitlist
        ? 'This class filled up. Ask the studio about the waitlist.'
        : 'This class filled up while it was in your cart.';
    case 'free':
      return 'This class is free — book it with the studio directly for now.';
    case 'noPrice':
      return 'This class is not priced for card payment. Contact the studio to book it.';
    default:
      return '';
  }
}

/**
 * @param events   every event in the loaded schedule window, raw
 * @param eventIds the cart, in the order the client added to it
 */
export function buildCart(
  events: ScheduleEvent[],
  eventIds: number[],
  { showInstructor, currency }: BuildCartOptions,
): CartSummary {
  // Indexed once rather than a `.find()` per id: a 20-class cart against a 150-event window is
  // 3,000 comparisons on every keystroke-equivalent re-render otherwise.
  const byId = new Map(events.map((event) => [event.eventid, event]));

  const lines = eventIds.map<CartLine>((eventId) => {
    const event = byId.get(eventId);

    if (!event) {
      return {
        eventId,
        state: 'gone',
        entry: null,
        dayLabel: '',
        locationLabel: null,
        charge: null,
        note: noteFor('gone', null),
      };
    }

    const entry = toScheduleEntry(event, { showInstructor, currency });
    const charge = resolveClassCharge(event, currency);

    // Order matters. Full is checked BEFORE price, because a full class cannot be booked at any
    // price and telling somebody the fee for a seat that does not exist is the wrong sentence.
    const state: CartLineState = entry.isFull
      ? 'full'
      : charge.status === 'free'
        ? 'free'
        : charge.status === 'unknown'
          ? 'noPrice'
          : 'ready';

    return {
      eventId,
      state,
      entry,
      dayLabel: longDayLabel(event.start_date),
      locationLabel: event.location?.name?.trim() || null,
      charge,
      note: noteFor(state, entry),
    };
  });

  const chargeable = lines.filter((line) => line.state === 'ready');
  const totalCents = chargeable.reduce((sum, line) => sum + (line.charge?.totalCents ?? 0), 0);

  return {
    lines,
    chargeableCount: chargeable.length,
    blockedCount: lines.length - chargeable.length,
    totalCents,
    totalLabel: formatBalance(totalCents / 100, currency),
    canCheckout: chargeable.length > 0,
  };
}
