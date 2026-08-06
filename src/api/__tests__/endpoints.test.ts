/**
 * The endpoint functions, against a stubbed fetch.
 *
 * The cases worth having are the failure ones. dibs-api answers **HTTP 200 with an error body**
 * on several routes — `get-schedule`'s own service does `return err` in its catch and the
 * controller `res.json`s it, so a failed query arrives as `200 {}`. A caller that trusts the
 * status code renders "no classes today" during an outage, and nobody finds out.
 */
import { ApiClient } from '../client';
import { ApiError, ApiSchemaError } from '../errors';
import { fetchBasicConfig, fetchSchedule } from '../endpoints';

function clientReturning(body: unknown, { strict = false } = {}): ApiClient {
  return new ApiClient({
    baseUrl: 'https://api.example.test/api/v2',
    getIdToken: async () => null,
    strictSchemas: strict,
    fetchImpl: (async () =>
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })) as typeof fetch,
  });
}

const REAL_CONFIG = {
  studioName: 'Carlsbad Village Yoga',
  color: '356280',
  timezone: 'America/Los_Angeles',
  heroUrl: 'https://example.test/hero.png',
  studioIsLive: true,
};

const REAL_EVENT = {
  eventid: 180392617,
  start_date: '2026-08-05T18:00:00.000Z',
  end_date: '2026-08-05T19:00:00.000Z',
  name: 'Flow ',
  seats: 16,
  spots_booked: 1,
  price_dibs: 22,
  has_waitlist: null,
  isFull: null,
  eventtype: 'class',
  instructor: { firstname: 'Marta', lastname: ' Estellés', image_url: null },
  location: { name: 'Carlsbad Village Yoga Co-op', address: '390 Oak Ave A & B', tax_rate: 0 },
  appointment_type: { default_manual_track_id: null },
};

describe('fetchBasicConfig', () => {
  it('returns the studio config', async () => {
    const config = await fetchBasicConfig(clientReturning(REAL_CONFIG), 210);
    expect(config.studioName).toBe('Carlsbad Village Yoga');
    expect(config.timezone).toBe('America/Los_Angeles');
  });

  it('raises rather than returning a config with no timezone', async () => {
    // The timezone is the frame every time comparison happens in. A config without one is a
    // failure body that survived a permissive schema, not a studio.
    await expect(fetchBasicConfig(clientReturning({ msg: 'boom' }), 210)).rejects.toBeInstanceOf(
      ApiError,
    );
  });

  it('is retriable — a config outage is usually transient', async () => {
    await expect(fetchBasicConfig(clientReturning({}), 210)).rejects.toMatchObject({
      retriable: true,
    });
  });
});

describe('fetchSchedule', () => {
  const args = { dibsStudioId: 210, timeZone: 'America/Los_Angeles' };

  it('returns the events', async () => {
    const events = await fetchSchedule(clientReturning([REAL_EVENT]), args);
    expect(events).toHaveLength(1);
    expect(events[0].eventid).toBe(180392617);
  });

  it('sends calledFrom so the backend uses the studio window, not the 90-day dashboard one', async () => {
    const seen: { body?: string } = {};
    const client = new ApiClient({
      baseUrl: 'https://api.example.test/api/v2',
      getIdToken: async () => null,
      fetchImpl: (async (_url: string, init: RequestInit) => {
        seen.body = init.body as string;
        return new Response('[]', { status: 200 });
      }) as unknown as typeof fetch,
    });
    await fetchSchedule(client, args);
    expect(JSON.parse(seen.body!)).toEqual({
      dibsStudioId: 210,
      timeZone: 'America/Los_Angeles',
      calledFrom: 'mobileApp',
    });
  });

  it('treats a 200 error body as a failure, not an empty schedule', async () => {
    // `{}` is what a serialized Error looks like coming back through res.json.
    await expect(fetchSchedule(clientReturning({}), args)).rejects.toBeInstanceOf(ApiError);
    await expect(
      fetchSchedule(clientReturning({ msg: 'Could not retrieve upcoming events.' }), args),
    ).rejects.toMatchObject({ retriable: true });
  });

  it('an empty array IS an empty schedule and must not raise', async () => {
    await expect(fetchSchedule(clientReturning([]), args)).resolves.toEqual([]);
  });

  it('throws loudly in development when the shape drifts', async () => {
    await expect(
      fetchSchedule(clientReturning({}, { strict: true }), args),
    ).rejects.toBeInstanceOf(ApiSchemaError);
  });

  it('tolerates fields the app has never seen', async () => {
    // An additive backend change must never brick a build that cannot be updated for days.
    const events = await fetchSchedule(
      clientReturning([{ ...REAL_EVENT, some_new_column: 'hello' }], { strict: true }),
      args,
    );
    expect(events[0].name).toBe('Flow ');
  });
});
