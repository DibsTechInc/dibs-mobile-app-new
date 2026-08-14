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

describe('past rows', () => {
  const row = (over = {}) =>
    buildBillingData(
      input({ history: { data: { rows: [{ id: 1, ...over }] }, isPending: false, error: null } }),
    ).past.items[0];

  it('renders a purchase amount', () => {
    expect(row({ amount: 45.98, itemName: '10-Class Pass' })).toMatchObject({
      title: '10-Class Pass',
      amountLabel: '$45.98',
      isRefund: false,
    });
  });

  it('keeps a PARTIALLY refunded purchase a purchase', () => {
    // The server hydrates refunds onto the row rather than emitting a separate one. Flipping it
    // to a refund here would double-count the same money.
    expect(row({ amount: 45.98, amountRefunded: 10 })).toMatchObject({
      isRefund: false,
      amountLabel: '$45.98',
    });
  });

  it('marks a FULLY refunded purchase as a refund', () => {
    expect(row({ amount: 45.98, amountRefunded: 45.98 })).toMatchObject({
      isRefund: true,
      amountLabel: '−$45.98',
    });
  });

  it('renders no amount for a row that moved no money', () => {
    // A pass redemption. "$0.00" beside it reads as a charge that happened.
    expect(row({ amount: 0, itemName: 'Beginner Ballet' }).amountLabel).toBeNull();
  });

  it('never titles a row "undefined"', () => {
    expect(row({ type: 'subscription_started' }).title).toBe('subscription started');
    expect(row({}).title).toBe('Activity');
  });

  it('tolerates a missing date rather than rendering Invalid Date', () => {
    expect(row({ amount: 10 }).dateLabel).toBeNull();
  });
});
