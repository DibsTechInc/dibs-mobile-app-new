/**
 * Turning a Firebase session into a Dibs identity, and creating one.
 *
 * The cases that matter are the ones where the backend answers HTTP 200 and means "no".
 */
import { ApiClient } from '../client';
import { ApiError } from '../errors';
import { createDibsUser, fetchUserAccount } from '../endpoints';
import { toAccountIdentity } from '../schemas/user-account';

function clientReturning(body: unknown, status = 200): ApiClient {
  return new ApiClient({
    baseUrl: 'https://api.example.test/api/v2',
    getIdToken: async () => 'token-123',
    fetchImpl: (async () =>
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      })) as typeof fetch,
  });
}

const REAL_ACCOUNT = {
  hasAccount: true,
  info: {
    id: 2502,
    email: 'Client@Example.com',
    firstName: 'Elan',
    lastName: 'Marsh',
    mobilephone: '3104037905',
    firebase_auth_pwd: true,
  },
  stripeIdAtThisStudio: 'cus_studio123',
  stripeIdAtDibs: 'cus_dibs456',
};

describe('toAccountIdentity', () => {
  it('keeps only what a session needs', () => {
    const identity = toAccountIdentity(REAL_ACCOUNT);
    // Deliberately narrow: the response carries Stripe ids, a referral code and emergency
    // contacts, and what a session does not hold cannot leak out of it. The phone number is in
    // because the profile form edits it and needs the current value to compare against.
    expect(identity).toEqual({
      userid: 2502,
      email: 'Client@Example.com',
      firstName: 'Elan',
      lastName: 'Marsh',
      phone: '3104037905',
    });
  });

  it('carries no phone rather than an empty string when the client has none', () => {
    // `''` would make the profile form look dirty the moment it seeded itself.
    const identity = toAccountIdentity({
      ...REAL_ACCOUNT,
      info: { ...REAL_ACCOUNT.info, mobilephone: '  ' },
    });
    expect(identity?.phone).toBeNull();
  });

  it('is null when there is no account', () => {
    expect(toAccountIdentity({ hasAccount: false, info: {} })).toBeNull();
  });

  it('is null when hasAccount is true but no id came back', () => {
    // Never fabricate an identity out of a half-populated body — a userid is what every
    // authenticated read is scoped by.
    expect(toAccountIdentity({ hasAccount: true, info: { email: 'a@b.com' } })).toBeNull();
  });
});

describe('fetchUserAccount', () => {
  it('sends the email verbatim and names the studio param dibsId', async () => {
    const seen: { body?: string; auth?: string } = {};
    const client = new ApiClient({
      baseUrl: 'https://api.example.test/api/v2',
      getIdToken: async () => 'token-123',
      fetchImpl: (async (_url: string, init: RequestInit) => {
        seen.body = init.body as string;
        seen.auth = (init.headers as Record<string, string>).Authorization;
        return new Response(JSON.stringify(REAL_ACCOUNT), { status: 200 });
      }) as unknown as typeof fetch,
    });

    await fetchUserAccount(client, { email: 'Client@Example.com', dibsStudioId: 210 });

    // Lowercasing would break the lookup: get-user-has-account.js matches `where: { email }`
    // with no normalization, unlike the auth middleware.
    expect(JSON.parse(seen.body!)).toEqual({ email: 'Client@Example.com', dibsId: 210 });
    expect(seen.auth).toBe('Bearer token-123');
  });

  it('returns null — not an error — for a session with no Dibs row', async () => {
    const identity = await fetchUserAccount(clientReturning({ hasAccount: false, info: {} }), {
      email: 'nobody@example.com',
      dibsStudioId: 210,
    });
    expect(identity).toBeNull();
  });

  it('surfaces a rejected token as an unauthorized ApiError', async () => {
    await expect(
      fetchUserAccount(clientReturning({ error: 'Invalid or expired token.' }, 401), {
        email: 'a@b.com',
        dibsStudioId: 210,
      }),
    ).rejects.toMatchObject({ code: 'unauthorized', retriable: false });
  });
});

describe('createDibsUser', () => {
  const args = {
    email: 'new@example.com',
    firstName: ' Elan ',
    lastName: 'Marsh',
    phone: '3104037905',
    dibsStudioId: 210,
  };

  it('sends the backend field names and never the password', async () => {
    const seen: { body?: string } = {};
    const client = new ApiClient({
      baseUrl: 'https://api.example.test/api/v2',
      getIdToken: async () => null,
      fetchImpl: (async (_url: string, init: RequestInit) => {
        seen.body = init.body as string;
        return new Response(JSON.stringify({ code: 1, userid: 99001 }), { status: 200 });
      }) as unknown as typeof fetch,
    });

    await createDibsUser(client, args);
    const body = JSON.parse(seen.body!);

    // Lowercase `firstname`/`lastname` — the service reads data.firstname, not data.firstName.
    expect(body.thisdata).toEqual({
      email: 'new@example.com',
      firstname: 'Elan',
      lastname: 'Marsh',
      phone: '3104037905',
      birthday: null,
      dibsStudioId: 210,
      fromWhere: 'mobileApp',
    });
    // The widget sends `newpwd` and the backend never reads it. Firebase owns the credential.
    expect(JSON.stringify(body)).not.toContain('newpwd');
    expect(JSON.stringify(body)).not.toContain('password');
  });

  it('accepts an existing Dibs identity as success', async () => {
    // code 18: this email already booked at another Dibs studio. One identity spans every
    // studio, so this is a normal signup, not a failure.
    const client = clientReturning({ code: 18, userid: 2502, alreadyExisted: true });
    await expect(createDibsUser(client, args)).resolves.toBe(2502);
  });

  it('refuses a 200 that carries no userid', async () => {
    // Treating a userid-less body as success is how the widget used to bounce a brand-new
    // client straight back to the login screen.
    await expect(createDibsUser(clientReturning({ code: 1, msg: 'ok' }), args)).rejects.toBeInstanceOf(
      ApiError,
    );
    await expect(createDibsUser(clientReturning({ userid: null }), args)).rejects.toBeInstanceOf(
      ApiError,
    );
  });

  it("shows the backend's own message when it explains the failure", async () => {
    await expect(
      createDibsUser(clientReturning({ code: 0, userid: null, msg: 'We could not create your account.' }), args),
    ).rejects.toMatchObject({ message: 'We could not create your account.' });
  });
});
