/**
 * The first-class contract on the wire: schema declarations, the offer endpoint, and the
 * `first_class_not_eligible` refusal arriving as a BookingRefusedError with the breakdown.
 */
import { ApiClient } from '../client';
import { BookingRefusedError, createClassPaymentIntent, fetchFirstClassOffer } from '../endpoints';
import { basicConfigSchema } from '../schemas/basic-config';
import { classPriceBreakdownSchema } from '../schemas/class-booking';
import { scheduleEventSchema } from '../schemas/schedule';

function clientReturning(body: unknown, status = 200, seen: { body?: unknown } = {}) {
  return new ApiClient({
    baseUrl: 'https://api.test/api/v2',
    getIdToken: async () => 'token',
    strictSchemas: true,
    fetchImpl: (async (_url: string, init: RequestInit) => {
      seen.body = JSON.parse(String(init.body));
      return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as unknown as typeof fetch,
  });
}

describe('schema declarations', () => {
  it('schedule rows declare first_class_offer (null, present, absent)', () => {
    const base = { eventid: 1, start_date: '2026-09-15T18:00:00.000Z', name: 'Flow' };
    expect(scheduleEventSchema.parse(base).first_class_offer).toBeUndefined();
    expect(scheduleEventSchema.parse({ ...base, first_class_offer: null }).first_class_offer).toBeNull();
    const parsed = scheduleEventSchema.parse({
      ...base,
      first_class_offer: { priceCents: 1500, savingsCents: 700, listPriceCents: 2200, priceDollars: 15, insteadOfDollars: 22 },
    });
    expect(parsed.first_class_offer?.priceCents).toBe(1500);
  });

  it('basic config declares the optional first-class fields', () => {
    const base = { studioName: 'S', color: 'AABBCC', timezone: 'America/Los_Angeles' };
    expect(basicConfigSchema.parse(base).firstClassPriceActive).toBeUndefined();
    const parsed = basicConfigSchema.parse({ ...base, firstClassPrice: 15, firstClassPriceActive: true });
    expect(parsed.firstClassPrice).toBe(15);
    expect(parsed.firstClassPriceActive).toBe(true);
  });

  it('the breakdown declares the six first-class fields and tolerates their absence', () => {
    const base = { priceAvailable: true, isFree: false, listPriceCents: 2200, discountedPriceCents: null, subtotalCents: 1500, taxRatePercent: 8.25, taxCents: 124, totalCents: 1624 };
    expect(classPriceBreakdownSchema.parse(base).firstClassApplied).toBeUndefined();
    const parsed = classPriceBreakdownSchema.parse({
      ...base,
      firstClassPriceCents: 1500,
      firstClassAvailableOnThisClass: true,
      firstClassEligible: true,
      firstClassApplied: true,
      firstClassSavingsCents: 700,
      firstClassDescription: 'First class price — $15 instead of $22',
      firstClassReason: 'eligible',
    });
    expect(parsed.firstClassApplied).toBe(true);
    expect(parsed.firstClassSavingsCents).toBe(700);
  });
});

describe('fetchFirstClassOffer', () => {
  it('sends userid + dibsStudioId and returns the offer', async () => {
    const seen: { body?: unknown } = {};
    const client = clientReturning(
      { success: true, active: true, priceCents: 1500, eligible: true, reason: 'eligible', priorVisits: 0, upcomingBookings: 0, redeemedAt: null },
      200,
      seen,
    );
    const offer = await fetchFirstClassOffer(client, { userid: 42, dibsStudioId: 88 });
    expect(seen.body).toEqual({ userid: 42, dibsStudioId: 88 });
    expect(offer.eligible).toBe(true);
    expect(offer.priceCents).toBe(1500);
  });

  it('a failed read THROWS — it is never "not eligible"', async () => {
    const client = clientReturning({ success: false, error: 'Could not check the first-class price.' }, 500);
    await expect(fetchFirstClassOffer(client, { userid: 42, dibsStudioId: 88 })).rejects.toBeTruthy();
  });
});

describe('applyFirstClassPrice on the checkout request', () => {
  it('is sent as exact true and omitted otherwise, and never a userid', async () => {
    const seen: { body?: unknown } = {};
    const client = clientReturning({ ok: false, code: 'price_unavailable', message: 'x' }, 409, seen);
    await createClassPaymentIntent(client, { dibsStudioId: 88, eventId: 1, displayedTotalCents: 1624, applyFirstClassPrice: true }).catch(() => null);
    expect(seen.body).toMatchObject({ applyFirstClassPrice: true });
    expect(seen.body).not.toHaveProperty('userid');
    await createClassPaymentIntent(client, { dibsStudioId: 88, eventId: 1, displayedTotalCents: 2382 }).catch(() => null);
    expect(seen.body).not.toHaveProperty('applyFirstClassPrice');
  });

  it('first_class_not_eligible arrives as a refusal carrying the breakdown and the reason', async () => {
    const breakdown = { priceAvailable: true, isFree: false, listPriceCents: 2200, discountedPriceCents: null, subtotalCents: 2200, taxRatePercent: 8.25, taxCents: 182, totalCents: 2382, firstClassApplied: false, firstClassReason: 'has_visits' };
    const client = clientReturning(
      { ok: false, code: 'first_class_not_eligible', message: 'The first-class price no longer applies to this booking.', breakdown, firstClassReason: 'has_visits' },
      409,
    );
    const error = await createClassPaymentIntent(client, { dibsStudioId: 88, eventId: 1, displayedTotalCents: 1624, applyFirstClassPrice: true }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(BookingRefusedError);
    const refusal = error as BookingRefusedError;
    expect(refusal.refusalCode).toBe('first_class_not_eligible');
    expect(refusal.breakdown?.totalCents).toBe(2382);
    expect(refusal.firstClassReason).toBe('has_visits');
  });
});
