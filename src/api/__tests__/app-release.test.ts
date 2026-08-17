/**
 * The wire half of the fail-open rule.
 *
 * `decideReleaseGate` cannot block on a null body — that is proved next door. This proves the
 * thing that HANDS it null: `fetchAppRelease` must never reject, for any failure, ever. A version
 * gate that throws on launch is a version gate that can take the app down with it.
 */
import { ApiClient } from '../client';
import { fetchAppRelease } from '../endpoints/app-release';

function makeClient(responder: () => Promise<Response> | Response) {
  const calls: string[] = [];
  const client = new ApiClient({
    baseUrl: 'https://example.test/api/v2',
    getIdToken: async () => null,
    // Strict, as development is. The schema must be permissive enough that a garbage body still
    // resolves rather than raising ApiSchemaError.
    strictSchemas: true,
    fetchImpl: (async (url: string) => {
      calls.push(url);
      return responder();
    }) as unknown as typeof fetch,
  });
  return { client, calls };
}

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('fetchAppRelease', () => {
  it('returns the document on a well-formed response', async () => {
    const { client, calls } = makeClient(() =>
      json({ ios: { minimumBuild: 40, latestBuild: 47, storeUrl: 'https://x' }, message: null }),
    );

    const result = await fetchAppRelease(client, 'everyday-ballet');

    expect(calls[0]).toBe('https://example.test/api/v2/app-release/everyday-ballet');
    expect(result).toMatchObject({ ios: { minimumBuild: 40, latestBuild: 47 } });
  });

  it('escapes the slug rather than pasting it into the path', async () => {
    const { client, calls } = makeClient(() => json({}));
    await fetchAppRelease(client, 'a/../b');
    expect(calls[0]).toBe('https://example.test/api/v2/app-release/a%2F..%2Fb');
  });

  describe('resolves null instead of rejecting when', () => {
    const failures: Array<[string, () => Promise<Response> | Response]> = [
      ['the server 500s', () => json({ error: 'boom' }, 500)],
      ['the server 503s (a maintenance window)', () => json({}, 503)],
      ['the server 404s', () => json({}, 404)],
      [
        'the host is unreachable',
        () => Promise.reject(new TypeError('Network request failed')),
      ],
      [
        'DNS fails',
        () => Promise.reject(new TypeError('getaddrinfo ENOTFOUND api.dibsonline.com')),
      ],
      [
        'the body is not JSON at all',
        () => new Response('<html>502 Bad Gateway</html>', { status: 200 }),
      ],
      ['the body is a bare string', () => json('nope')],
      ['the body is an array', () => json([])],
      ['the body is null', () => json(null)],
    ];

    it.each(failures)('%s', async (_label, responder) => {
      const { client } = makeClient(responder);
      await expect(fetchAppRelease(client, 'everyday-ballet')).resolves.toBeNull();
    });
  });

  it('does not raise a schema error on a body with the wrong field TYPES', async () => {
    // The schema is deliberately the loosest in the app: a malformed row has to mean "no gate",
    // never "the app crashed on launch because somebody typo'd a build number". The real
    // validation is decideReleaseGate's, where every rejected shape has a named outcome.
    const { client } = makeClient(() =>
      json({ ios: { minimumBuild: '40', latestBuild: null, storeUrl: 7 }, message: 12 }),
    );
    await expect(fetchAppRelease(client, 'everyday-ballet')).resolves.not.toBeNull();
  });
});
