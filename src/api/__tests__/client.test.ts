import { z } from 'zod';

import { ApiClient } from '../client';
import { ApiError, ApiSchemaError, describeApiError, extractServerMessage } from '../errors';
import { isPersistableQueryKey, queryKeys } from '../keys';
import { basicConfigSchema, isAcceptingBookings, normalizeAccentHex } from '../schemas/basic-config';

const schema = z.object({ ok: z.boolean() });

/** Build a client whose fetch is fully under test control. */
function makeClient(
  responder: (url: string, init: RequestInit) => Promise<Response> | Response,
  overrides: Partial<ConstructorParameters<typeof ApiClient>[0]> = {},
) {
  const calls: { url: string; init: RequestInit }[] = [];
  const client = new ApiClient({
    baseUrl: 'https://example.test/api/v2',
    getIdToken: async () => null,
    strictSchemas: true,
    fetchImpl: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return responder(url, init);
    }) as unknown as typeof fetch,
    ...overrides,
  });
  return { client, calls };
}

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('ApiClient — requests', () => {
  it('posts JSON to the joined URL without doubling slashes', async () => {
    const { client, calls } = makeClient(() => json({ ok: true }));
    await client.post('/get-thing', { a: 1 }, schema);

    expect(calls[0].url).toBe('https://example.test/api/v2/get-thing');
    expect(calls[0].init.method).toBe('POST');
    expect(calls[0].init.body).toBe('{"a":1}');
  });

  it('builds a query string for GET and drops undefined params', async () => {
    const { client, calls } = makeClient(() => json({ ok: true }));
    await client.get('/active-flash-credits', { userid: 5, dibsId: undefined }, schema);

    expect(calls[0].url).toBe('https://example.test/api/v2/active-flash-credits?userid=5');
    expect(calls[0].init.method).toBe('GET');
  });

  it('attaches the Firebase token when one is available', async () => {
    const { client, calls } = makeClient(() => json({ ok: true }), {
      getIdToken: async () => 'token-abc',
    });
    await client.post('/x', {}, schema);

    expect((calls[0].init.headers as Record<string, string>).Authorization).toBe('Bearer token-abc');
  });

  it('sends no Authorization header when signed out', async () => {
    const { client, calls } = makeClient(() => json({ ok: true }));
    await client.post('/x', {}, schema);

    expect((calls[0].init.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it('proceeds unauthenticated when minting a token throws', async () => {
    // Plenty of routes are public. A token failure must not take down a browse screen.
    const { client, calls } = makeClient(() => json({ ok: true }), {
      getIdToken: async () => {
        throw new Error('firebase is having a day');
      },
    });

    await expect(client.post('/get-schedule', {}, schema)).resolves.toEqual({ ok: true });
    expect((calls[0].init.headers as Record<string, string>).Authorization).toBeUndefined();
  });
});

describe('ApiClient — error normalization', () => {
  it.each([
    [401, 'unauthorized', false],
    [403, 'forbidden', false],
    [404, 'not_found', false],
    [429, 'rate_limited', true],
    [500, 'server', true],
    [503, 'server', true],
    [422, 'bad_request', false],
  ])('maps HTTP %s to %s (retriable=%s)', async (status, code, retriable) => {
    const { client } = makeClient(() => json({ msg: 'nope' }, status as number));

    await expect(client.post('/x', {}, schema)).rejects.toMatchObject({
      status,
      code,
      retriable,
    });
  });

  it('surfaces the server message when dibs-api provides one', async () => {
    const { client } = makeClient(() => json({ msg: 'That class is full.' }, 400));
    await expect(client.post('/x', {}, schema)).rejects.toThrow('That class is full.');
  });

  it('calls onUnauthorized exactly once for a 401', async () => {
    const onUnauthorized = jest.fn();
    const { client } = makeClient(() => json({}, 401), { onUnauthorized });

    await expect(client.post('/x', {}, schema)).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('does not call onUnauthorized for other failures', async () => {
    const onUnauthorized = jest.fn();
    const { client } = makeClient(() => json({}, 500), { onUnauthorized });

    await expect(client.post('/x', {}, schema)).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('classifies an unreachable server as a retriable network error', async () => {
    const { client } = makeClient(() => {
      throw new TypeError('Network request failed');
    });

    await expect(client.post('/x', {}, schema)).rejects.toMatchObject({
      code: 'network',
      status: null,
      retriable: true,
    });
  });

  it('does not treat a caller-cancelled request as retriable', async () => {
    // TanStack Query aborts superseded requests constantly. Reporting those as network
    // failures would retry work nobody asked for and could show a spurious error.
    const controller = new AbortController();
    const { client } = makeClient(() => {
      throw new DOMException('Aborted', 'AbortError');
    });
    controller.abort();

    await expect(client.post('/x', {}, schema, { signal: controller.signal })).rejects.toMatchObject(
      { retriable: false },
    );
  });

  it('survives an HTML error page instead of JSON', async () => {
    // Heroku and Railway both answer with HTML when an app is down.
    const { client } = makeClient(
      () => new Response('<html><body>Application Error</body></html>', { status: 503 }),
    );

    await expect(client.post('/x', {}, schema)).rejects.toMatchObject({
      status: 503,
      code: 'server',
    });
  });

  it('handles a completely empty body', async () => {
    const { client } = makeClient(() => new Response('', { status: 200 }));
    // null fails the schema, which is the correct signal — not a crash on JSON.parse.
    await expect(client.post('/x', {}, schema)).rejects.toBeInstanceOf(ApiSchemaError);
  });
});

describe('ApiClient — schema handling', () => {
  it('throws ApiSchemaError in strict (development) mode', async () => {
    const { client } = makeClient(() => json({ ok: 'not-a-boolean' }));

    await expect(client.post('/get-thing', {}, schema)).rejects.toBeInstanceOf(ApiSchemaError);
  });

  it('passes the raw body through in production rather than bricking the screen', async () => {
    // A shipped app cannot be patched for days. An additive or renamed backend field must
    // degrade, not crash.
    const onSchemaMismatch = jest.fn();
    const { client } = makeClient(() => json({ ok: 'not-a-boolean' }), {
      strictSchemas: false,
      onSchemaMismatch,
    });

    await expect(client.post('/get-thing', {}, schema)).resolves.toEqual({ ok: 'not-a-boolean' });
    expect(onSchemaMismatch).toHaveBeenCalledWith('/get-thing', expect.arrayContaining([expect.any(String)]));
  });

  it('reports the offending field path so a mismatch is diagnosable', async () => {
    const onSchemaMismatch = jest.fn();
    const nested = z.object({ user: z.object({ id: z.number() }) });
    const { client } = makeClient(() => json({ user: { id: 'seven' } }), {
      strictSchemas: false,
      onSchemaMismatch,
    });

    await client.post('/x', {}, nested);
    expect(onSchemaMismatch.mock.calls[0][1][0]).toContain('user.id');
  });
});

describe('extractServerMessage', () => {
  it.each([
    [{ msg: 'a' }, 'a'],
    [{ message: 'b' }, 'b'],
    [{ error: 'c' }, 'c'],
    [{ err: { message: 'd' } }, 'd'],
    ['plain string', 'plain string'],
  ])('pulls a message out of %j', (body, expected) => {
    expect(extractServerMessage(body)).toBe(expected);
  });

  it('returns null when there is nothing message-shaped', () => {
    expect(extractServerMessage({ data: [1, 2] })).toBeNull();
    expect(extractServerMessage(null)).toBeNull();
    expect(extractServerMessage(42)).toBeNull();
  });

  it('never returns a whole nested object, only its message', () => {
    // A raw Stripe error carries the entire PaymentIntent plus request headers.
    const stripeish = { err: { type: 'StripeCardError', message: 'Card declined', payment_intent: { id: 'pi_1' } } };
    expect(extractServerMessage(stripeish)).toBe('Card declined');
  });
});

describe('describeApiError', () => {
  it('gives client-safe copy for every code', () => {
    for (const code of ['network', 'timeout', 'unauthorized', 'forbidden', 'not_found', 'rate_limited', 'server'] as const) {
      const text = describeApiError(new ApiError({ status: null, code, message: 'internal detail', retriable: false }));
      expect(text.length).toBeGreaterThan(0);
      expect(text).not.toContain('internal detail');
    }
  });

  it('falls back to generic copy for a non-ApiError', () => {
    expect(describeApiError(new Error('kaboom'))).not.toContain('kaboom');
  });
});

describe('query key registry', () => {
  it('scopes studio-specific data by studio so the aggregator mode cannot collide', () => {
    expect(queryKeys.credit(1, 210)).not.toEqual(queryKeys.credit(1, 88));
  });

  it('persists only public studio data', () => {
    expect(isPersistableQueryKey(queryKeys.config(210))).toBe(true);
    expect(isPersistableQueryKey(queryKeys.schedule(210, 'week'))).toBe(true);
    // AsyncStorage is unencrypted. These must never touch it.
    expect(isPersistableQueryKey(queryKeys.paymentMethods(1))).toBe(false);
    expect(isPersistableQueryKey(queryKeys.account(1))).toBe(false);
    expect(isPersistableQueryKey(queryKeys.credit(1, 210))).toBe(false);
    expect(isPersistableQueryKey(queryKeys.history(1))).toBe(false);
  });
});

describe('basic-config schema', () => {
  /** Trimmed from a real studio-210 response captured 2026-08-04. */
  const realResponse = {
    studioName: 'Carlsbad Village Yoga',
    color: '356280',
    colorLogo: 'https://dibs-email-assets.s3.amazonaws.com/images/studio-logos/cvyoga.png',
    heroUrl: 'https://dibs-email-assets.s3.amazonaws.com/images/studio-images/cvyoga_hero.png',
    timezone: 'America/Los_Angeles',
    studioIsLive: true,
    showSchedule: true,
    showAppts: false,
    offersClasses: true,
    offersAppointments: false,
    cancelTime: 12,
    defaultCancelTimeGroup: 12,
    instructorAltName: 'Instructor',
    taxRate: 0,
    stripeAccountId: 'acct_1HZjapCAxCZsWLvc',
    terms: null,
    locationIdsAll: [1226575],
  };

  it('accepts a real response', () => {
    expect(basicConfigSchema.safeParse(realResponse).success).toBe(true);
  });

  it('tolerates fields the backend adds later', () => {
    const parsed = basicConfigSchema.parse({ ...realResponse, somethingBrandNew: 42 });
    expect((parsed as Record<string, unknown>).somethingBrandNew).toBe(42);
  });

  it('does not require minAppVersion, which the backend has not shipped', () => {
    expect(basicConfigSchema.safeParse(realResponse).success).toBe(true);
    expect(basicConfigSchema.parse({ ...realResponse, minAppVersion: '2.1.0' }).minAppVersion).toBe('2.1.0');
  });

  it('rejects a response missing the fields the app genuinely cannot work without', () => {
    const { timezone, ...noTimezone } = realResponse;
    expect(basicConfigSchema.safeParse(noTimezone).success).toBe(false);
  });

  it('adds the # the API omits from the accent colour', () => {
    expect(normalizeAccentHex('356280', '#000000')).toBe('#356280');
    expect(normalizeAccentHex('#f986a5', '#000000')).toBe('#F986A5');
  });

  it('falls back rather than producing an invalid colour', () => {
    for (const bad of [null, undefined, '', 'blue', '#12345']) {
      expect(normalizeAccentHex(bad, '#356280')).toBe('#356280');
    }
  });

  it('treats a studio as accepting bookings unless explicitly told otherwise', () => {
    // An older backend that omits the flag must not lock every studio out of booking.
    expect(isAcceptingBookings(basicConfigSchema.parse(realResponse))).toBe(true);
    expect(
      isAcceptingBookings(basicConfigSchema.parse({ ...realResponse, studioIsLive: undefined })),
    ).toBe(true);
    expect(
      isAcceptingBookings(basicConfigSchema.parse({ ...realResponse, studioIsLive: false })),
    ).toBe(false);
  });
});
