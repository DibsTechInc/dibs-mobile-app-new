/**
 * The studio's price list.
 *
 * `POST /widget/get-packages` is one of the routes that answers **HTTP 200 with an error body**:
 * `controllers/shared/get-packages-controller.js` catches its own failure and returns
 * `apiFailureWrapper({ id: 0 }, '...')` — an OBJECT — with a 200 status. A caller that trusts the
 * status code renders "this studio sells nothing", which for a storefront is the worst possible
 * lie: it tells a client who wants to give the studio money that there is no way to.
 *
 * So the array is the contract. Anything else is an outage, and it is raised as one.
 */
import type { ApiClient } from '../client';
import { ApiError } from '../errors';
import { packagesResponseSchema, type StudioPackage } from '../schemas/packages';

export async function fetchPackages(
  client: ApiClient,
  { dibsStudioId }: { dibsStudioId: number },
  signal?: AbortSignal,
): Promise<StudioPackage[]> {
  const response = await client.post(
    'widget/get-packages',
    { dibsStudioId },
    packagesResponseSchema,
    { signal },
  );

  // In development the schema throws before this. In production the client passes the raw body
  // through by design, so the failure object would arrive here and `.map` over it would crash the
  // screen rather than showing a retry.
  if (!Array.isArray(response)) {
    throw new ApiError({
      status: 200,
      code: 'server',
      message: 'We could not load the studio’s packages just now.',
      retriable: true,
      body: response,
    });
  }

  return response;
}
