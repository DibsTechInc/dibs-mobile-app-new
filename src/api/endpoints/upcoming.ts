import type { ApiClient } from '../client';
import { ApiError } from '../errors';
import { upcomingBookingsResponseSchema, type UpcomingBookingRow } from '../schemas/upcoming';

export interface FetchUpcomingBookingsArgs {
  userid: number;
  dibsStudioId: number;
}

export interface ClientBookings {
  /**
   * NOT "what is still to come" — the endpoint returns from the start of the studio's TODAY, so
   * this morning's class is in here all evening. Splitting it properly is
   * `domain/bookings/group-bookings.ts`'s job, against the studio's clock.
   */
  upcoming: UpcomingBookingRow[];
  previous: UpcomingBookingRow[];
}

/**
 * Both halves of the client's booking record at this studio, in one request.
 *
 * Named for what it returns. It used to be `fetchUpcomingBookings` and discarded `previousAppts`
 * on the grounds that history should be asked for deliberately — but the two arrive in the SAME
 * response, so a second deliberate fetch would be a second identical round trip and a second
 * cache entry that could disagree with the first. Both are returned as named fields instead,
 * which is the deliberate part; a caller that only wants one destructures one.
 */
export async function fetchClientBookings(
  client: ApiClient,
  { userid, dibsStudioId }: FetchUpcomingBookingsArgs,
  signal?: AbortSignal,
): Promise<ClientBookings> {
  const response = await client.post(
    'get-upcoming-appts',
    { userid, dibsStudioId },
    upcomingBookingsResponseSchema,
    { authenticated: true, signal },
  );

  // The handler's catch does `return err` without ever calling res.json, so a failure normally
  // hangs rather than answering — but any 200 that is not this shape is a failure, not an empty
  // list, and "you have nothing booked" is a bad thing to tell someone who does.
  if (!response || !Array.isArray(response.upcomingAppts)) {
    throw new ApiError({
      status: 200,
      code: 'server',
      message: 'We could not load your bookings.',
      retriable: true,
      body: response,
    });
  }

  // Only `upcomingAppts` proves the response is real. A studio can legitimately return no history
  // at all for a new client, so an absent `previousAppts` is an empty list, not a failure.
  return {
    upcoming: response.upcomingAppts,
    previous: Array.isArray(response.previousAppts) ? response.previousAppts : [],
  };
}
