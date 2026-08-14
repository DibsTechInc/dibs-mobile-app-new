/**
 * The billing view model.
 *
 * Weighted toward the difference between "you have nothing" and "we could not ask" — on this
 * screen that distinction is the message, not a nicety.
 */
import { buildBillingData, type BuildBillingInput } from '../build-billing';

const TZ = 'America/New_York';

function input(over: Partial<BuildBillingInput> = {}): BuildBillingInput {
  return {
    history: { data: { rows: [] }, isPending: false, error: null },
    upcoming: { data: { renewals: [], lookupFailed: false }, isPending: false, error: null },
    timeZone: TZ,
    ...over,
  };
}

describe('a failed read is never emptiness', () => {
  it('reports error on the section that failed and leaves the other alone', () => {
    const data = buildBillingData(
      input({
        upcoming: { data: undefined, isPending: false, error: new Error('stripe down') },
        history: { data: { rows: [{ id: 1, amount: 45.98 }] }, isPending: false, error: null },
      }),
    );

    expect(data.upcoming.status).toBe('error');
    // The past section still renders. A Stripe outage must not take payment history with it.
    expect(data.past.status).toBe('ready');
    expect(data.past.items).toHaveLength(1);
  });

  it('marks a PARTIAL upcoming read rather than calling it ready', () => {
    // `ready` would license "No scheduled payments" — the worst sentence this screen can show a
    // paying member.
    const data = buildBillingData(
      input({
        upcoming: {
          data: { renewals: [{ passId: 9, chargeAmount: 234 }], lookupFailed: true },
          isPending: false,
          error: null,
        },
      }),
    );

    expect(data.upcoming.status).toBe('partial');
    expect(data.upcoming.mayBeIncomplete).toBe(true);
    expect(data.upcoming.items).toHaveLength(1);
  });

  it('a genuinely empty upcoming list IS ready', () => {
    const data = buildBillingData(input());
    expect(data.upcoming.status).toBe('ready');
    expect(data.upcoming.mayBeIncomplete).toBe(false);
  });
});

describe('upcoming renewals', () => {
  const renewal = (over = {}) =>
    buildBillingData(
      input({
        upcoming: {
          data: {
            renewals: [{ passId: 9, name: 'Month Unlimited', renewsAtEpochSeconds: 1788350400, chargeAmount: 234, ...over }],
            lookupFailed: false,
          },
          isPending: false,
          error: null,
        },
      }),
    ).upcoming.items[0];

  it('states the date and the amount', () => {
    const item = renewal();
    expect(item.whenLabel).toMatch(/^Renews /);
    expect(item.amountLabel).toBe('$234.00');
  });

  it('never renders a stranded "Renews on ." when no date resolved', () => {
    // The widget shipped exactly that beside a live $234 charge. A sentence built around a hole
    // reads as broken software next to a real dollar figure.
    const item = renewal({ renewsAtEpochSeconds: null });
    expect(item.whenLabel).toBe('Renews automatically');
    expect(item.whenLabel).not.toContain('.');
  });

  it('says "plus tax" rather than quoting a total it cannot compute', () => {
    const item = renewal({ hasUnresolvedTax: true });
    expect(item.amountLabel).toBe('$234.00 plus tax');
  });

  it('states that tax applies even with no amount at all', () => {
    const item = renewal({ chargeAmount: null, hasUnresolvedTax: true });
    expect(item.amountLabel).toBe('Amount includes tax');
  });

  it('renders no amount rather than $0.00 when there is none', () => {
    expect(renewal({ chargeAmount: null }).amountLabel).toBeNull();
  });

  it('falls back to "Membership" rather than a blank title', () => {
    expect(renewal({ name: null }).title).toBe('Membership');
  });
});

describe('past rows — shapes captured from a real staging response, not guessed', () => {
  const row = (over = {}) =>
    buildBillingData(
      input({ history: { data: { rows: [{ id: 'txn_1', ...over }] }, isPending: false, error: null } }),
    ).past.items[0];

  it('titles a class booking from primary.eventName', () => {
    expect(row({ activityType: 'class_booked', primary: { eventName: 'STUDIO Mixed Intermediate' } }).title)
      .toBe('STUDIO Mixed Intermediate');
  });

  it('titles a pass purchase from primary.packageName', () => {
    expect(row({ activityType: 'pass_purchased', amount: 303.05, primary: { packageName: '10-class Package' } }))
      .toMatchObject({ title: '10-class Package', amountLabel: '$303.05' });
  });

  it('titles a credit movement from primary.itemName', () => {
    expect(row({ activityType: 'credit_used', primary: { itemName: 'Credit applied to 10-class Package' } }).title)
      .toBe('Credit applied to 10-class Package');
  });

  it('renders credit ADDED as money in, from amountSign', () => {
    // Direction is amountSign, never the sign of `amount` — every amount arrives positive.
    expect(row({ activityType: 'comp_credit_added', amount: 100, amountSign: 'credit',
      primary: { itemName: 'Comp credit added' } }))
      .toMatchObject({ amountLabel: '+$100.00', isCredit: true });
  });

  it('shows no amount for a NEUTRAL row', () => {
    // A $0 comped session collected nothing. "$0.00" would read as a charge that happened.
    expect(row({ activityType: 'session_payment_collected', amount: 0, amountSign: 'neutral',
      primary: { eventName: 'STUDIO Advanced BEGINNER Ballet' } }).amountLabel).toBeNull();
  });

  it('shows no amount for a pass redemption', () => {
    expect(row({ activityType: 'class_booked', amount: 0, amountSign: 'debit',
      primary: { eventName: 'Ballet' } }).amountLabel).toBeNull();
  });

  it('states a partial refund ALONGSIDE the amount rather than netting it', () => {
    // "$45.98" with "$10.00 refunded" under it is the truth; "−$35.98" is a number that appears
    // on no statement, and the server hydrates refunds onto the same row.
    expect(row({ amount: 45.98, refundedAmount: 10, amountSign: 'debit' })).toMatchObject({
      amountLabel: '$45.98',
      refundLabel: '$10.00 refunded',
      isRefund: false,
    });
  });

  it('marks a FULLY refunded purchase', () => {
    expect(row({ amount: 45.98, refundedAmount: 45.98, amountSign: 'debit' })).toMatchObject({
      isRefund: true,
      refundLabel: '$45.98 refunded',
    });
  });

  it('reads the date from occurredAt', () => {
    expect(row({ amount: 10, occurredAt: '2026-08-14T20:48:22.671Z' }).dateLabel).not.toBeNull();
  });

  it('never titles a row "undefined", even for an activityType we have never seen', () => {
    expect(row({ activityType: 'some_new_thing' }).title).toBe('some new thing');
    expect(row({}).title).toBe('Activity');
  });

  it('tolerates a missing date rather than rendering Invalid Date', () => {
    expect(row({ amount: 10 }).dateLabel).toBeNull();
  });
});
