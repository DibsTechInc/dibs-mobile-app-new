/**
 * The two card-booking calls, against a stubbed fetch.
 *
 * What matters here is the REQUEST SHAPE (no `userid`, ever) and that a refusal arrives as
 * something the screen can branch on — "the price updated" and "that class just filled" are the
 * same HTTP status and need very different sentences.
 */
import { ApiClient } from '../client';
import { ApiError } from '../errors';
import { BookingRefusedError, confirmClassBooking, createClassPaymentIntent } from '../endpoints';

const BREAKDOWN = {
  priceAvailable: true,
  isFree: false,
  listPriceCents: 2200,
  pricingRuleId: null,
  pricingRuleName: null,
  pricingRuleDescription: null,
  discountedPriceCents: null,
  subtotalCents: 2200,
  taxRatePercent: 8.25,
  taxCents: 182,
  totalCents: 2382,
};

const INTENT_RESPONSE = {
  ok: true as const,
  paymentIntentId: 'pi_3Abc',
  paymentIntentClientSecret: 'pi_3Abc_secret_xyz',
  customerSessionClientSecret: 'cuss_1Abc_secret_xyz',
  customerId: 'cus_connected',
  stripeAccountId: 'acct_1U1fXzQTOTKua6cH',
  amountCents: 2382,
  currency: 'usd',
  breakdown: BREAKDOWN,
};

function clientReturning(body: unknown, status = 200) {
  const sent: { path: string; payload: Record<string, unknown> }[] = [];
  const client = new ApiClient({
    baseUrl: 'https://api.example.test/api/v2',
    getIdToken: async () => 'token-123',
    strictSchemas: true,
    fetchImpl: (async (url: string, init: RequestInit) => {
      sent.push({ path: String(url), payload: JSON.parse(String(init.body)) });
      return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as unknown as typeof fetch,
  });
  return { client, sent };
}

describe('createClassPaymentIntent', () => {
  it('returns both client secrets, the connected account and the breakdown', async () => {
    const { client } = clientReturning(INTENT_RESPONSE);

    await expect(
      createClassPaymentIntent(client, {
        dibsStudioId: 88,
        eventId: 180384062,
        displayedTotalCents: 2382,
      }),
    ).resolves.toMatchObject({
      paymentIntentClientSecret: 'pi_3Abc_secret_xyz',
      customerSessionClientSecret: 'cuss_1Abc_secret_xyz',
      // Without this the SDK cannot be pointed at the account the PaymentIntent lives on.
      stripeAccountId: 'acct_1U1fXzQTOTKua6cH',
      breakdown: BREAKDOWN,
    });
  });

  it('sends NO userid — that would change the server-side auth gate', async () => {
    const { client, sent } = clientReturning(INTENT_RESPONSE);

    await createClassPaymentIntent(client, {
      dibsStudioId: 88,
      eventId: 180384062,
      displayedTotalCents: 2382,
    });

    // requireWidgetAuth's ownership check only compares when req.body.userid is defined. The
    // handler reads the id from the verified token; a userid here would silently change what the
    // gate does. Same warning sits on the route mount.
    expect(sent[0].payload).toEqual({
      dibsStudioId: 88,
      eventId: 180384062,
      displayedTotalCents: 2382,
    });
    expect(sent[0].payload).not.toHaveProperty('userid');
    expect(sent[0].path).toContain('checkout/class/create-payment-intent');
  });

  it('lifts a price_changed 409 into a refusal carrying the server breakdown', async () => {
    const { client } = clientReturning(
      {
        ok: false,
        code: 'price_changed',
        message: 'The price for this class has changed.',
        breakdown: { ...BREAKDOWN, subtotalCents: 1650, taxCents: 136, totalCents: 1786 },
      },
      409,
    );

    const error = await createClassPaymentIntent(client, {
      dibsStudioId: 88,
      eventId: 1,
      displayedTotalCents: 2382,
    }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(BookingRefusedError);
    const refusal = error as BookingRefusedError;
    expect(refusal.refusalCode).toBe('price_changed');
    // The screen re-renders from this and asks the client to confirm the true figure.
    expect(refusal.breakdown?.totalCents).toBe(1786);
    // Not retriable: hammering the endpoint with the same stale number refuses identically.
    expect(refusal.retriable).toBe(false);
  });

  it('keeps the server sentence rather than a generic one', async () => {
    const { client } = clientReturning(
      {
        ok: false,
        code: 'studio_not_collecting_fees',
        message: 'This studio takes payment in person. Book with them directly.',
      },
      409,
    );

    const error = (await createClassPaymentIntent(client, {
      dibsStudioId: 226,
      eventId: 1,
      displayedTotalCents: 2382,
    }).catch((e: unknown) => e)) as BookingRefusedError;

    // A refusal is a decision, not a fault — describeApiError must not overwrite it with "the
    // studio's system is having trouble".
    expect(error.message).toBe('This studio takes payment in person. Book with them directly.');
    expect(error.code).toBe('bad_request');
  });

  it('lifts covered_by_pass so the screen can style it as good news', async () => {
    // A member on an unlimited membership must never be able to pay by card for a class their
    // membership covers, and the sentence that says so is not an error message.
    const { client } = clientReturning(
      {
        ok: false,
        code: 'covered_by_pass',
        message:
          'Your Month Unlimited covers this class. Booking with a pass is coming to the app shortly — ask the studio to book you in for now.',
        coveringPassCount: 1,
      },
      409,
    );

    const error = (await createClassPaymentIntent(client, {
      dibsStudioId: 88,
      eventId: 1,
      displayedTotalCents: 2382,
    }).catch((e: unknown) => e)) as BookingRefusedError;

    expect(error.refusalCode).toBe('covered_by_pass');
    expect(error.message).toContain('Month Unlimited');
  });

  it('leaves a genuine failure as an ordinary ApiError', async () => {
    const { client } = clientReturning({ error: 'upstream exploded' }, 500);

    const error = await createClassPaymentIntent(client, {
      dibsStudioId: 88,
      eventId: 1,
      displayedTotalCents: 2382,
    }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).not.toBeInstanceOf(BookingRefusedError);
    expect((error as ApiError).retriable).toBe(true);
  });
});

describe('confirmClassBooking', () => {
  it('sends only the studio id and the PaymentIntent id', async () => {
    const { client, sent } = clientReturning({
      ok: true,
      passId: 900,
      redemptionTransactionId: 5002,
      amountChargedCents: 2382,
    });

    await confirmClassBooking(client, { dibsStudioId: 88, paymentIntentId: 'pi_3Abc' });

    // Every booking fact comes from metadata the server wrote. Sending an eventId here is the
    // cheap-authorization attack: authorize $12 on the 7am class, confirm against the $45 one.
    expect(sent[0].payload).toEqual({ dibsStudioId: 88, paymentIntentId: 'pi_3Abc' });
  });

  it('reports a lost race as a refusal that knows nothing was charged', async () => {
    const { client } = clientReturning(
      {
        ok: false,
        code: 'class_full',
        message: 'That class just filled up. Your card was not charged.',
        nothingCharged: true,
      },
      409,
    );

    const error = (await confirmClassBooking(client, {
      dibsStudioId: 88,
      paymentIntentId: 'pi_3Abc',
    }).catch((e: unknown) => e)) as BookingRefusedError;

    expect(error.refusalCode).toBe('class_full');
    // Only ever true because the SERVER said so — the screen must not guess about somebody's money.
    expect(error.nothingCharged).toBe(true);
  });

  it('surfaces a decline with the described card message', async () => {
    const { client } = clientReturning(
      {
        ok: false,
        code: 'capture_failed',
        message: 'The Discover card ending in 9804 was declined — insufficient funds.',
        isCardError: true,
      },
      402,
    );

    const error = (await confirmClassBooking(client, {
      dibsStudioId: 88,
      paymentIntentId: 'pi_3Abc',
    }).catch((e: unknown) => e)) as BookingRefusedError;

    expect(error.message).toBe(
      'The Discover card ending in 9804 was declined — insufficient funds.',
    );
    // A raw Stripe error would carry the whole failed PaymentIntent plus request headers.
    expect(JSON.stringify(error.body)).not.toContain('StripeCardError');
  });

  it('accepts a replayed booking as success', async () => {
    // A retry after a dropped response returns the existing booking rather than making a second.
    const { client } = clientReturning({
      ok: true,
      alreadyRecorded: true,
      passId: 900,
      attendeeId: 77,
    });

    await expect(
      confirmClassBooking(client, { dibsStudioId: 88, paymentIntentId: 'pi_3Abc' }),
    ).resolves.toMatchObject({ ok: true, alreadyRecorded: true, attendeeId: 77 });
  });
});
