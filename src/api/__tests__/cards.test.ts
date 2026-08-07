/**
 * The card write paths, against a stubbed fetch.
 *
 * **Every fixture below is a real response**, captured from
 * `dibs-api-staging-production.up.railway.app` on 2026-08-06 by calling the endpoint with curl.
 * That matters: the last two bugs in this workstream were both cases where a fixture written from
 * a schema agreed with the schema and disagreed with the server.
 */
import { ApiClient } from '../client';
import { ApiError } from '../errors';
import {
  createSetupIntent,
  ensureConnectedCustomer,
  fetchPublishableKey,
  removeCard,
  setDefaultCard,
} from '../endpoints';

function clientReturning(body: unknown): ApiClient {
  return new ApiClient({
    baseUrl: 'https://api.example.test/api/v2',
    getIdToken: async () => null,
    strictSchemas: true,
    fetchImpl: (async () =>
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })) as typeof fetch,
  });
}

/** Captures the outgoing body so the request SHAPE can be asserted, not just the response. */
function clientCapturing(body: unknown) {
  const sent: { path: string; payload: Record<string, unknown> }[] = [];
  const client = new ApiClient({
    baseUrl: 'https://api.example.test/api/v2',
    getIdToken: async () => null,
    strictSchemas: true,
    fetchImpl: (async (url: string, init: RequestInit) => {
      sent.push({ path: String(url), payload: JSON.parse(String(init.body)) });
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as unknown as typeof fetch,
  });
  return { client, sent };
}

const SETUP_INTENT = {
  clientSecret: 'seti_1U1i283fZx2YZEAV9kBv4Li1_secret_xxx',
  setupIntentId: 'seti_1U1i283fZx2YZEAV9kBv4Li1',
};

describe('fetchPublishableKey', () => {
  it('returns the key', async () => {
    const client = clientReturning({ msg: 'success', stripePublishableKey: 'pk_test_51Rqmyf3fZ' });
    await expect(fetchPublishableKey(client)).resolves.toBe('pk_test_51Rqmyf3fZ');
  });

  it('raises when the env var is unset, rather than handing Stripe an empty key', async () => {
    // The service returns `{ msg: 'success' }` with no key when STRIPE_PUBLISHABLE_KEY is unset.
    // Initializing the SDK with '' fails much later, at the PaymentSheet, where the message
    // means nothing to anyone.
    const client = clientReturning({ msg: 'success' });
    await expect(fetchPublishableKey(client)).rejects.toBeInstanceOf(ApiError);
  });
});

describe('createSetupIntent', () => {
  it('always sends the existing platform customer id and onDibs', async () => {
    // THE point of this test. Called WITHOUT `customerid`, the service mints a new platform
    // customer and writes it to `dibs_users.stripeid` with no environment branch — a sandbox
    // cus_ in the column production charge paths read raw. Verified against staging 2026-08-06:
    // with the id passed, the stripeid columns were untouched.
    const { client, sent } = clientCapturing(SETUP_INTENT);

    await createSetupIntent(client, {
      userid: 2502,
      dibsStudioId: 88,
      email: 'client@example.com',
      name: 'Elan Marek',
      customerId: 'cus_UWmIHM8xRE3QZT',
    });

    expect(sent[0].payload).toMatchObject({
      userid: 2502,
      dibsStudioId: 88,
      customerid: 'cus_UWmIHM8xRE3QZT',
      // The SetupIntent belongs on the Dibs PLATFORM account, matching the widget.
      onDibs: true,
    });
  });

  it('returns the client secret', async () => {
    const client = clientReturning(SETUP_INTENT);
    await expect(
      createSetupIntent(client, {
        userid: 2502,
        dibsStudioId: 88,
        email: 'client@example.com',
        name: 'Elan Marek',
        customerId: 'cus_x',
      }),
    ).resolves.toMatchObject({ clientSecret: SETUP_INTENT.clientSecret });
  });

  it('raises on the logged-out refusal, which arrives as HTTP 200', async () => {
    const client = clientReturning({
      error: 'A logged-in user is required to add a payment method.',
    });
    await expect(
      createSetupIntent(client, {
        userid: 0,
        dibsStudioId: 88,
        email: '',
        name: '',
        customerId: null,
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('raises on any body that lacks a client secret, whatever else it contains', async () => {
    // The service's catch does `return err`, so a failure can arrive as literally any shape. The
    // only proof of success is the thing we came for.
    const client = clientReturning({ someUnexpectedShape: true });
    await expect(
      createSetupIntent(client, {
        userid: 2502,
        dibsStudioId: 88,
        email: 'a@b.com',
        name: 'A B',
        customerId: 'cus_x',
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });
});

describe('ensureConnectedCustomer', () => {
  it('returns the connected customer id', async () => {
    // Real staging response for userid 2502 @ studio 88.
    const client = clientReturning({
      msg: 'success',
      stripeConnectedId: 'cus_V1kCxhGwEmas6Q',
      environment: 'development',
    });
    await expect(ensureConnectedCustomer(client, { userid: 2502, dibsStudioId: 88 })).resolves.toBe(
      'cus_V1kCxhGwEmas6Q',
    );
  });

  it('sends dibsId, not dibsStudioId — this endpoint has its own parameter name', async () => {
    const { client, sent } = clientCapturing({ msg: 'success', stripeConnectedId: 'cus_x' });
    await ensureConnectedCustomer(client, { userid: 2502, dibsStudioId: 88 });
    expect(sent[0].payload).toEqual({ userid: 2502, dibsId: 88 });
  });

  it('returns null rather than raising when the id is missing', async () => {
    // Advisory by design: the card is already on the platform customer by the time this runs, and
    // the charge path creates the connected customer itself if it is still absent. Raising here
    // would tell a client their card was not saved when it was.
    const client = clientReturning({ msg: 'error' });
    await expect(ensureConnectedCustomer(client, { userid: 2502, dibsStudioId: 88 })).resolves.toBeNull();
  });
});

describe('removeCard', () => {
  const card = {
    platform: 'Studio' as const,
    card: { brand: 'visa', last4: '4242', exp_month: 2, exp_year: 2029 },
  };

  it('sends the card under cardInfo, with dibsId', async () => {
    // The endpoint matches by ATTRIBUTES, not by PaymentMethod id — which is what lets it detach
    // the platform copy and the connected copy of one card in a single call.
    const { client, sent } = clientCapturing({ success: true, message: 'Card removed successfully' });
    await removeCard(client, { userid: 2502, dibsStudioId: 88, card });
    expect(sent[0].payload).toEqual({ userid: 2502, dibsId: 88, cardInfo: card });
  });

  it('raises when the card could not be found', async () => {
    const client = clientReturning({
      success: false,
      message: 'Could not find the card to remove. It may have already been removed.',
    });
    await expect(removeCard(client, { userid: 2502, dibsStudioId: 88, card })).rejects.toThrow(
      /could not find the card/i,
    );
  });
});

describe('setDefaultCard', () => {
  it('resolves on the real success shape', async () => {
    // Captured live 2026-08-06.
    const client = clientReturning({
      success: true,
      defaultPaymentMethodId: 'pm_1U1gi8QTOTKua6cHX7jsiOJ4',
      fingerprint: '3gz2BIiOOYWUDI1d',
    });
    await expect(
      setDefaultCard(client, {
        userid: 2502,
        dibsStudioId: 88,
        paymentMethodId: 'pm_1U1gi8QTOTKua6cHX7jsiOJ4',
        platform: 'Studio',
      }),
    ).resolves.toBeUndefined();
  });

  it('never surfaces the machine-readable error code to the client', async () => {
    // Captured live by sending a deliberately invalid id. `invalid_payment_method_id` is a code
    // for us, not a sentence for a person.
    const client = clientReturning({ success: false, error: 'invalid_payment_method_id' });
    const attempt = setDefaultCard(client, {
      userid: 2502,
      dibsStudioId: 88,
      paymentMethodId: 'src_bogus',
      platform: 'Studio',
    });

    await expect(attempt).rejects.toBeInstanceOf(ApiError);
    await expect(attempt).rejects.not.toThrow(/invalid_payment_method_id/);
  });

  it('sends the platform label, which decides whether the card is cloned first', async () => {
    // A 'Dibs' card lives only on the platform customer and must be cloned onto the connected
    // one before it can be that account's default. The service does that — but only if told.
    const { client, sent } = clientCapturing({ success: true });
    await setDefaultCard(client, {
      userid: 2502,
      dibsStudioId: 88,
      paymentMethodId: 'pm_x',
      platform: 'Dibs',
    });
    expect(sent[0].payload).toMatchObject({ platform: 'Dibs' });
  });
});
