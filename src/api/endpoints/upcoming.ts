import type { ApiClient } from '../client';
import { ApiError } from '../errors';
import { upcomingBookingsResponseSchema, type UpcomingBookingRow } from '../schemas/upcoming';

export interface FetchUpcomingBookingsArgs {
  userid: number;
  dibsStudioId: number;
}

/**
 * The client's own upcoming bookings at this studio.
 *
 * Returns the rows only. `previousAppts` comes back in the same response and is dropped here —
 * a screen that wants booking history should ask for it deliberately rather than inherit it as
 * a side effect of asking what is coming up.
 */
export async function fetchUpcomingBookings(
  client: ApiClient,
  { userid, dibsStudioId }: FetchUpcomingBookingsArgs,
  signal?: AbortSignal,
): Promise<UpcomingBookingRow[]> {
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

  return response.upcomingAppts;
}
