/**
 * The request bodies, pinned field-for-field against the WIDGET's builders (traced 2026-08-16,
 * `confirmationPanel.jsx` + `completeAppointmentBooking.js`). These are contract tests: the
 * fixture is the wire shape two backends already parse, so a failing test here means the
 * request changed, not that the fixture needs updating.
 */
import {
  appointmentIdempotencyKey,
  buildRecurringBookingBody,
  buildSingleBookingBody,
  splitStoredDateTime,
} from '../payload';

describe('splitStoredDateTime', () => {
  it('slices the stored wall-clock with UTC accessors — never the device zone', () => {
    expect(splitStoredDateTime('2026-08-22T14:00:00.000Z')).toEqual({
      date: '2026-08-22',
      time: '14:00',
    });
  });
});

describe('appointmentIdempotencyKey', () => {
  it('carries the REAL appointment type id (the widget mints appt-{userid}-0-{ts} — a traced bug, not parity to keep)', () => {
    expect(appointmentIdempotencyKey(42, 150, new Date(1755000000000))).toBe(
      'appt-42-150-1755000000000',
    );
  });
});

describe('buildSingleBookingBody', () => {
  const base = {
    userid: 413885,
    dibsStudioId: 263,
    appointmentTypeId: 150,
    slotStartIso: '2026-08-22T11:00:00.000Z',
    locationId: 7,
    instructorId: 3865565,
    pricing: { subtotal: 125, tax: 6.09, total: 131.09 },
    idempotencyKey: 'appt-413885-150-1755000000000',
  };

  it('card: the widget’s exact shape — pm id, useCredit, display pricing, promo null, source widget', () => {
    const body = buildSingleBookingBody({
      ...base,
      payment: { type: 'card', paymentMethodId: 'pm_123', useCredit: 10 },
    });

    expect(body).toEqual({
      userid: 413885,
      dibsStudioId: 263,
      appointmentTypeId: 150,
      appointmentDetails: {
        date: '2026-08-22',
        time: '11:00',
        locationId: 7,
        instructorId: 3865565,
        notes: '',
      },
      paymentMethod: {
        type: 'card',
        paymentMethodId: 'pm_123',
        stripeIdempotencyKey: 'appt-413885-150-1755000000000',
        useCredit: 10,
      },
      pricingBreakdown: {
        subtotal: 125,
        discount: 0,
        tax: 6.09,
        total: 131.09,
        amount_to_charge: 121.09,
      },
      appliedPromo: null,
      source: 'widget',
    });
  });

  it('pass: zeroed pricing, passId + passName, no pm — a covered booking has no money to describe', () => {
    const body = buildSingleBookingBody({
      ...base,
      payment: { type: 'pass', passId: 9001, passName: '5-Session Pack', useCredit: 25 },
    }) as Record<string, Record<string, unknown>>;

    expect(body.paymentMethod).toEqual({
      type: 'pass',
      paymentMethodId: null,
      passId: 9001,
      passName: '5-Session Pack',
      stripeIdempotencyKey: 'appt-413885-150-1755000000000',
      // Forced 0 under a pass, whatever the caller held — the widget's own rule.
      useCredit: 0,
    });
    expect(body.pricingBreakdown).toEqual({
      subtotal: 0,
      discount: 0,
      tax: 0,
      total: 0,
      amount_to_charge: 0,
    });
  });

  it('credit: no pm, useCredit carries the amount, amount_to_charge nets to zero', () => {
    const body = buildSingleBookingBody({
      ...base,
      payment: { type: 'credit', useCredit: 131.09 },
    }) as Record<string, Record<string, unknown>>;

    expect(body.paymentMethod).toMatchObject({ type: 'credit', paymentMethodId: null, useCredit: 131.09 });
    expect((body.pricingBreakdown as { amount_to_charge: number }).amount_to_charge).toBe(0);
  });
});

describe('buildRecurringBookingBody', () => {
  const payNow = ['2026-08-22T11:00:00.000Z', '2026-08-29T11:00:00.000Z'];
  const holds = ['2026-09-05T11:00:00.000Z'];
  const base = {
    userid: 413885,
    dibsStudioId: 263,
    appointmentTypeId: 150,
    appointmentTypeName: 'STRENGTH STUDIO',
    instructorId: 3865565,
    instructorName: '',
    payNowIsos: payNow,
    holdIsos: holds,
    pricing: { subtotal: 250, tax: 12.19, total: 262.19 },
  };

  it('card: charge now — the widget’s exact flags', () => {
    const body = buildRecurringBookingBody({
      ...base,
      payment: { type: 'card', paymentMethodId: 'pm_123', useCredit: 0 },
    });

    expect(body).toEqual({
      userid: 413885,
      dibsStudioId: 263,
      appointmentTypeId: 150,
      appointmentType: 'STRENGTH STUDIO',
      instructorId: 3865565,
      instructorName: '',
      payNowOccurrences: payNow,
      holdOccurrences: holds,
      compedOccurrences: [],
      perOccurrenceAssignments: [],
      payment: {
        paymentMethodId: 'pm_123',
        passId: null,
        passName: null,
        useCredits: false,
        creditAmount: 0,
        chargeCardIfNeeded: true,
        bookUnpaid: false,
      },
      pricingBreakdown: {
        subtotal: 250,
        discount: 0,
        tax: 12.19,
        total: 262.19,
        amount_to_charge: 262.19,
      },
      appliedPromo: null,
      paymentOption: 'charge',
      employeeId: null,
      sendConfirmationEmail: true,
      source: 'widget',
    });
  });

  it('full pass coverage: one assignment per date, no charge, paymentOption unpaid', () => {
    const body = buildRecurringBookingBody({
      ...base,
      pricing: { subtotal: 0, tax: 0, total: 0 },
      payment: { type: 'pass', passId: 9001, passName: '5-Session Pack', useCredit: 0 },
      passCoveredSessions: 2,
    }) as Record<string, unknown>;

    expect(body.perOccurrenceAssignments).toEqual([
      { start_date: payNow[0], paidPassId: 9001 },
      { start_date: payNow[1], paidPassId: 9001 },
    ]);
    expect(body.payment).toEqual({
      paymentMethodId: null,
      passId: 9001,
      passName: '5-Session Pack',
      useCredits: false,
      creditAmount: 0,
      chargeCardIfNeeded: false,
      bookUnpaid: false,
    });
    expect(body.paymentOption).toBe('unpaid');
  });

  it('partial pass + card: earliest dates assigned to the pass, card flagged for the remainder', () => {
    const body = buildRecurringBookingBody({
      ...base,
      pricing: { subtotal: 125, tax: 6.09, total: 131.09 },
      payment: { type: 'card', paymentMethodId: 'pm_123', passId: 9001, passName: 'Pack', useCredit: 0 },
      passCoveredSessions: 1,
    }) as Record<string, unknown>;

    expect(body.perOccurrenceAssignments).toEqual([{ start_date: payNow[0], paidPassId: 9001 }]);
    expect((body.payment as { chargeCardIfNeeded: boolean }).chargeCardIfNeeded).toBe(true);
    expect(body.paymentOption).toBe('charge');
  });

  it('credit-only: bookUnpaid stays false because credit IS payment (the widget’s !useCredit rule)', () => {
    const body = buildRecurringBookingBody({
      ...base,
      payment: { type: 'credit', useCredit: 262.19 },
    }) as Record<string, unknown>;

    expect(body.payment).toMatchObject({
      paymentMethodId: null,
      useCredits: true,
      creditAmount: 262.19,
      chargeCardIfNeeded: false,
      bookUnpaid: false,
    });
    expect(body.paymentOption).toBe('unpaid');
    expect((body.pricingBreakdown as { amount_to_charge: number }).amount_to_charge).toBe(0);
  });

  it('caps pass assignments at the payNow list however many uses the pass holds', () => {
    const body = buildRecurringBookingBody({
      ...base,
      pricing: { subtotal: 0, tax: 0, total: 0 },
      payment: { type: 'pass', passId: 9001, passName: 'Pack', useCredit: 0 },
      passCoveredSessions: 99,
    }) as Record<string, unknown>;

    expect(body.perOccurrenceAssignments).toHaveLength(2);
  });
});
