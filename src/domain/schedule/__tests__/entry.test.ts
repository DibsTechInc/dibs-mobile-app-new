/**
 * The rules that decide what a client is told about a class.
 *
 * Fixtures are trimmed copies of REAL `get-schedule` rows captured from production for studios
 * 210 and 88 on 2026-08-06 — including the quirks that make this worth testing: `isFull` and
 * `has_waitlist` arriving as null, and a `lastname` with a leading space.
 */
import type { ScheduleEvent } from '@/api/schemas/schedule';

import { formatInstructorName, formatPrice, toScheduleEntry } from '../entry';

const OPTIONS = { showInstructor: true, currency: 'USD' };

/** Studio 210, event 180392617 — the shape almost every row has. */
function realEvent(overrides: Partial<ScheduleEvent> = {}): ScheduleEvent {
  return {
    eventid: 180392617,
    start_date: '2026-08-05T18:00:00.000Z',
    end_date: '2026-08-05T19:00:00.000Z',
    name: 'Flow ',
    seats: 16,
    spots_booked: 1,
    price_dibs: 22,
    has_waitlist: null,
    isFull: null,
    can_apply_pass: true,
    private: false,
    on_demand: false,
    free_class: false,
    eventtype: 'class',
    instructor: { firstname: 'Marta', lastname: ' Estellés', image_url: null },
    location: { name: 'Carlsbad Village Yoga Co-op', address: '390 Oak Ave A & B' },
    ...overrides,
  } as ScheduleEvent;
}

describe('formatPrice', () => {
  it('drops a meaningless .00 but keeps real cents', () => {
    expect(formatPrice(22)).toBe('$22');
    expect(formatPrice(16.5)).toBe('$16.50');
  });

  it('reads price_dibs as dollars, not cents', () => {
    // The rest of the money layer is cents; this column is not. Getting it wrong turns a $22
    // class into a 22-cent one.
    expect(formatPrice(22)).toBe('$22');
  });
});

describe('formatInstructorName', () => {
  it('collapses the stray whitespace live data actually carries', () => {
    // Studio 210 stores lastname as " Estellés". A template literal gives "Marta  Estellés".
    expect(formatInstructorName('Marta', ' Estellés')).toBe('Marta Estellés');
  });

  it('returns null rather than an empty or half-blank name', () => {
    expect(formatInstructorName(null, null)).toBeNull();
    expect(formatInstructorName('  ', '')).toBeNull();
    expect(formatInstructorName('Marisa', null)).toBe('Marisa');
  });
});

describe('toScheduleEntry — capacity', () => {
  it('derives spots left from the counts', () => {
    const entry = toScheduleEntry(realEvent({ seats: 16, spots_booked: 13 }), OPTIONS);
    expect(entry.spotsLeft).toBe(3);
    expect(entry.isFull).toBe(false);
  });

  it('treats a full class as full even though isFull is null on the wire', () => {
    // This is the case that matters: `isFull` is null on most live rows, so trusting the flag
    // would show "Open" on a class with no room and send a client into a booking that fails.
    const entry = toScheduleEntry(realEvent({ seats: 16, spots_booked: 16, isFull: null }), OPTIONS);
    expect(entry.isFull).toBe(true);
    expect(entry.spotsLeft).toBe(0);
  });

  it('never reports negative spots when a class is overbooked', () => {
    const entry = toScheduleEntry(realEvent({ seats: 16, spots_booked: 18 }), OPTIONS);
    expect(entry.spotsLeft).toBe(0);
    expect(entry.isFull).toBe(true);
  });

  it('falls back to the isFull flag when the counts are missing', () => {
    const entry = toScheduleEntry(
      realEvent({ seats: null, spots_booked: null, isFull: true }),
      OPTIONS,
    );
    expect(entry.spotsLeft).toBeNull();
    expect(entry.isFull).toBe(true);
  });

  it('reads a null has_waitlist as no waitlist', () => {
    expect(toScheduleEntry(realEvent({ has_waitlist: null }), OPTIONS).hasWaitlist).toBe(false);
    expect(toScheduleEntry(realEvent({ has_waitlist: true }), OPTIONS).hasWaitlist).toBe(true);
  });
});

describe('toScheduleEntry — price', () => {
  it('shows the list price', () => {
    expect(toScheduleEntry(realEvent(), OPTIONS).price).toEqual({
      kind: 'amount',
      amountLabel: '$22',
    });
  });

  it("shows the backend's discounted price when a pricing rule matched", () => {
    const entry = toScheduleEntry(
      realEvent({
        pricing_rule: {
          original_price: 22,
          discounted_price: 16.5,
          rule_name: 'Weekday Mid-Morning 25% Off',
        },
      }),
      OPTIONS,
    );
    // Never recompute the discount — the backend already did the arithmetic and its number is
    // what checkout will charge.
    expect(entry.price).toEqual({ kind: 'amount', amountLabel: '$16.50' });
  });

  it('says Free only when the studio marked it free', () => {
    expect(toScheduleEntry(realEvent({ free_class: true }), OPTIONS).price).toEqual({
      kind: 'amount',
      amountLabel: 'Free',
    });
  });

  it('says nothing at all when the price is 0 or absent', () => {
    // A pass-only class stores 0. Rendering "$0" would be a promise the studio never made.
    expect(toScheduleEntry(realEvent({ price_dibs: 0 }), OPTIONS).price).toEqual({ kind: 'unknown' });
    expect(toScheduleEntry(realEvent({ price_dibs: null }), OPTIONS).price).toEqual({
      kind: 'unknown',
    });
  });

  it('never claims a pass covers the class', () => {
    // Guests have no passes and this transform has no access to them. Promising coverage the
    // checkout then refuses is the widget bug that charged a member for an unlimited class.
    const kinds = [realEvent(), realEvent({ can_apply_pass: true }), realEvent({ free_class: true })]
      .map((event) => toScheduleEntry(event, OPTIONS).price.kind);
    expect(kinds).not.toContain('covered');
  });
});

describe('toScheduleEntry — the rest', () => {
  it('trims the trailing space studios leave on class names', () => {
    expect(toScheduleEntry(realEvent(), OPTIONS).name).toBe('Flow');
  });

  it('computes duration from the stored times', () => {
    expect(toScheduleEntry(realEvent(), OPTIONS).durationMinutes).toBe(60);
  });

  it('returns a null duration rather than a wrong one', () => {
    expect(toScheduleEntry(realEvent({ end_date: null }), OPTIONS).durationMinutes).toBeNull();
    expect(
      toScheduleEntry(realEvent({ end_date: '2026-08-05T18:00:00.000Z' }), OPTIONS).durationMinutes,
    ).toBeNull();
  });

  it('hides the instructor entirely for a studio that does not show them', () => {
    // Studio 263 rents space to independent trainers; its trainerid is a phantom assignment.
    const entry = toScheduleEntry(realEvent(), { showInstructor: false });
    expect(entry.instructor).toBeNull();
  });

  it('keeps the start time exactly as stored, with no timezone conversion', () => {
    expect(toScheduleEntry(realEvent(), OPTIONS).startsAt).toBe('2026-08-05T18:00:00.000Z');
  });
});
