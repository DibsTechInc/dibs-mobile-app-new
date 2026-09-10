/**
 * The cart, as a screen reads it: a list of lines and one summary.
 *
 * PURE TypeScript. The bar and the checkout screen both render this, so the figure on the bar and
 * the figure being charged cannot come from two different calculations — which is exactly how the
 * widget's schedule row came to say "Included" while its checkout bar demanded $22.00.
 *
 * ── Every line has a `state`, and only two of them are bookable ────────────────────────────────
 * A cart id can survive the class it points at. The schedule refreshes, an off-peak window closes,
 * a class fills, a studio cancels a session — and the id sitting in the cart says nothing about
 * any of that. So each line is resolved against the LIVE schedule every render and lands in one of
 * six states, each of which the checkout screen has a sentence and a way out for:
 *
 *   `ready`       — a real price a card can pay. Contributes to the card total.
 *   `covered`     — a pass the client already holds covers it. Bookable, and it costs $0.
 *   `gone`        — the class is no longer in the schedule window. Cancelled, or already started.
 *   `full`        — it filled while it sat in the cart.
 *   `free`        — `free_class`. Bookable, but never by card; a $0 PaymentIntent is rejected.
 *   `noPrice`     — `price_dibs` null or 0, which means "priced elsewhere", NOT free.
 *
 * The card total counts `ready` lines and nothing else. Summing a line we cannot charge would put
 * a number on the button that checkout is structurally unable to collect — and summing a COVERED
 * line would charge somebody for a class their membership already pays for, which is the widget's
 * single most expensive pass bug.
 *
 * ── Coverage is checked BEFORE price, and it is decided by one helper ──────────────────────────
 * `choosePassForClass` — the same function the schedule row and class detail use, mirroring the
 * server's own chooser. A cart that priced a covered class would disagree with the row above it.
 */
import type { Pass } from '@/api/schemas/passes';
import type { FirstClassOffer, ScheduleEvent } from '@/api/schemas/schedule';
import {
  chooseFirstClassLine,
  type FirstClassCandidate,
  type FirstClassEligibility,
} from '@/domain/cart/first-class';
import { formatBalance } from '@/domain/money/format';
import { choosePassForClass, passName } from '@/domain/passes/select';
import { resolveClassCharge, type ClassCharge } from '@/domain/pricing/class-charge';
import { longDayLabel } from '@/domain/schedule/days';
import { toScheduleEntry } from '@/domain/schedule/entry';
import type { ScheduleEntry } from '@/domain/schedule/types';

export type CartLineState = 'ready' | 'covered' | 'gone' | 'full' | 'free' | 'noPrice';

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
  /** The pass that will pay for it, on a `covered` line. Null everywhere else. */
  passId: number | null;
  /** "Month Unlimited" — named on screen, so the client sees WHICH pass is being spent. */
  passName: string | null;
  /** What to tell the client about this line. Empty for `ready` — a good line needs no sentence. */
  note: string;
  /** The row's own first-class offer (client-agnostic). Null when the studio's price does not beat this class. */
  firstClassOffer: FirstClassOffer | null;
  /**
   * How the FIRST-CLASS PRICE relates to this line (2026-09-10):
   *   `applied`     — this is THE line; `charge` already carries the first-class subtotal.
   *   `available`   — this is the line it would go on, but the client switched it off for this cart.
   *   `passInstead` — a pass covers this line; the client may choose the first-class price instead.
   *   null          — nothing to say.
   * At most ONE line is `applied` or `available`; `passInstead` lines are the covered alternatives.
   */
  firstClass: 'applied' | 'available' | 'passInstead' | null;
}

export interface CartSummary {
  lines: CartLine[];
  /** How many lines will be charged to a card. The count the bar and the button quote. */
  chargeableCount: number;
  /** How many will be booked with a pass. Bookable, but no money moves. */
  coveredCount: number;
  /** Lines that cannot be booked at all. Surfaced, never silently dropped. */
  blockedCount: number;
  totalCents: number;
  /** "$84.46". Always two decimals — this is money about to leave an account, not a quoted price. */
  totalLabel: string;
  /** True when there is at least one bookable line, by card OR by pass. */
  canCheckout: boolean;
  /** The line carrying (or, when opted out, able to carry) the first-class price. Null when none. */
  firstClassEventId: number | null;
  /** Cents saved on that line when applied; 0 when opted out or none. */
  firstClassSavingsCents: number;
}

export interface BuildCartOptions {
  showInstructor: boolean;
  currency?: string;
  /**
   * The client's usable passes. Omitted for a guest and while the wallet is resolving.
   *
   * Undefined is NOT the same as `[]`: with no pass data every line prices as a card booking,
   * which is the correct thing to show before we know — but the server checks coverage again and
   * refuses a card for a covered class, so the worst case is a refusal the client can act on
   * rather than a wrong charge.
   */
  passes?: Pass[];
  /**
   * The client's first-class eligibility, from the offer endpoint. Undefined for a guest, while
   * it resolves, and when the read FAILED — all three price the cart normally. Only a resolved
   * `eligible: true` puts the offer on a line.
   */
  firstClassEligibility?: FirstClassEligibility | null;
  /** The client switched the offer off for this cart. The chosen line still reports `available`. */
  firstClassOptOut?: boolean;
  /** The pass-covered line the client chose to price with the first-class price instead. */
  firstClassOverPassEventId?: number | null;
  /** Lines the server refused the offer on this session. */
  firstClassExcludedEventIds?: ReadonlySet<number>;
}

function noteFor(state: CartLineState, entry: ScheduleEntry | null): string {
  switch (state) {
    // Deliberately empty. A covered line renders its pass NAME beside a $0, which says more than
    // a sentence would — and it is good news, not something that needs explaining away.
    case 'covered':
      return '';
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
  {
    showInstructor,
    currency,
    passes,
    firstClassEligibility,
    firstClassOptOut = false,
    firstClassOverPassEventId = null,
    firstClassExcludedEventIds,
  }: BuildCartOptions,
): CartSummary {
  // Indexed once rather than a `.find()` per id: a 20-class cart against a 150-event window is
  // 3,000 comparisons on every keystroke-equivalent re-render otherwise.
  const byId = new Map(events.map((event) => [event.eventid, event]));

  // ── Pass 1: which line carries the first-class price ────────────────────────────────────────
  // Decided BEFORE any line is priced, by the one chooser, from the same coverage answer the lines
  // themselves use. An override on a covered line un-assigns that line's pass below.
  const candidates: FirstClassCandidate[] = [];
  for (const eventId of eventIds) {
    const event = byId.get(eventId);
    if (!event) continue;
    const entry = toScheduleEntry(event, { showInstructor, currency, passes });
    const charge = resolveClassCharge(event, currency);
    const covering = passes && passes.length > 0 ? choosePassForClass(passes, event) : null;
    candidates.push({
      eventId,
      startsAt: event.start_date,
      offer: event.first_class_offer ?? null,
      coveredByPass: Boolean(covering) && !entry.isFull,
      chargeable: !entry.isFull && charge.status === 'chargeable',
    });
  }
  const firstClassEventId = chooseFirstClassLine(candidates, firstClassEligibility, {
    overPassEventId: firstClassOverPassEventId,
    excludedEventIds: firstClassExcludedEventIds,
  });
  const eligible = firstClassEligibility?.eligible === true;

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
        passId: null,
        passName: null,
        note: noteFor('gone', null),
        firstClassOffer: null,
        firstClass: null,
      };
    }

    const entry = toScheduleEntry(event, { showInstructor, currency, passes });
    const rowOffer = event.first_class_offer ?? null;
    const isFirstClassLine = firstClassEventId === eventId;
    const applyFirstClass = isFirstClassLine && !firstClassOptOut && rowOffer !== null;
    const charge = resolveClassCharge(
      event,
      currency,
      applyFirstClass && rowOffer ? { firstClass: { priceCents: rowOffer.priceCents } } : {},
    );

    // The same chooser the row above used, so the cart cannot disagree with it. `undefined` passes
    // means we have not asked — not that the client holds none. When the client chose the
    // first-class price INSTEAD of their pass on this line, the pass steps aside here and only
    // here — the server books it as a card/credit class and never spends the pass.
    const coveringPass = passes && passes.length > 0 ? choosePassForClass(passes, event) : null;
    const covering = isFirstClassLine && coveringPass && applyFirstClass ? null : coveringPass;

    // Order matters, and it is the same order the server gates in.
    //   FULL first — a full class cannot be booked at any price, and telling somebody the fee for
    //     a seat that does not exist is the wrong sentence.
    //   COVERED next — a pass covers the class whatever the studio lists it at, and pricing it
    //     would charge a member for something they already pay for monthly.
    const state: CartLineState = entry.isFull
      ? 'full'
      : covering
        ? 'covered'
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
      passId: state === 'covered' && covering ? covering.id : null,
      passName: state === 'covered' && covering ? passName(covering) : null,
      // A pass the allowlist turned away is NAMED on the priced line, never silently dropped —
      // `entry.excludedPassName` comes from the same helper the chooser uses, so the note and the
      // refusal the server would give cannot disagree.
      note:
        state === 'ready' && entry.excludedPassName
          ? `${entry.excludedPassName} isn’t accepted for this class, so it’s priced as a drop-in.`
          : noteFor(state, entry),
      firstClassOffer: rowOffer,
      firstClass:
        isFirstClassLine && state === 'ready' && charge.firstClassApplied
          ? 'applied'
          : isFirstClassLine && state === 'ready' && rowOffer
            ? 'available'
            : state === 'covered' && rowOffer && eligible && !entry.isFull
              ? 'passInstead'
              : null,
    };
  });

  const chargeable = lines.filter((line) => line.state === 'ready');
  const covered = lines.filter((line) => line.state === 'covered');
  // COVERED lines contribute nothing. This is the one arithmetic decision in the file that is
  // really a money decision.
  const totalCents = chargeable.reduce((sum, line) => sum + (line.charge?.totalCents ?? 0), 0);

  return {
    lines,
    chargeableCount: chargeable.length,
    coveredCount: covered.length,
    blockedCount: lines.length - chargeable.length - covered.length,
    totalCents,
    totalLabel: formatBalance(totalCents / 100, currency),
    // A cart of nothing but pass-covered classes is perfectly checkoutable — it just costs $0.
    canCheckout: chargeable.length + covered.length > 0,
    firstClassEventId: lines.some((l) => l.firstClass === 'applied' || l.firstClass === 'available')
      ? firstClassEventId
      : null,
    firstClassSavingsCents: lines.reduce(
      (sum, l) => sum + (l.firstClass === 'applied' ? (l.charge?.savingsCents ?? 0) : 0),
      0,
    ),
  };
}
