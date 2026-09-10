import type { ApiClient } from '../client';
import { ApiError } from '../errors';
import {
  firstClassOfferResponseSchema,
  type FirstClassOfferResponse,
} from '../schemas/first-class-offer';

export interface FetchFirstClassOfferArgs {
  /** The signed-in client. Feeds the route's ownership check; the server answers for the token. */
  userid: number;
  dibsStudioId: number;
}

/**
 * The client's first-class eligibility at this studio. Authenticated — never called for a guest.
 *
 * A failed read is "unknown", never "not eligible": the server answers 500 with `success: false`
 * when it could not check, and that arrives here as an ApiError the query keeps as an error state.
 * No screen may render "no offer" from an error.
 */
export async function fetchFirstClassOffer(
  client: ApiClient,
  { userid, dibsStudioId }: FetchFirstClassOfferArgs,
  signal?: AbortSignal,
): Promise<FirstClassOfferResponse> {
  const response = await client.post(
    'widget/first-class-offer',
    { userid, dibsStudioId },
    firstClassOfferResponseSchema,
    { authenticated: true, signal },
  );
  if (!response || response.success !== true || typeof response.eligible !== 'boolean') {
    throw new ApiError({
      status: 200,
      code: 'server',
      message: 'Could not check the first-class price.',
      retriable: true,
      body: response,
    });
  }
  return response;
}
