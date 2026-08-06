import type { ApiClient } from '../client';
import { ApiError } from '../errors';
import { scheduleResponseSchema, type ScheduleEvent } from '../schemas/schedule';

export interface FetchScheduleArgs {
  dibsStudioId: number;
  /** The studio's IANA zone — the backend computes its day window in it. */
  timeZone: string;
}

/**
 * The studio's upcoming public sessions, from now to the end of its configured window
 * (`dibs_config.interval_end` days — 30 for studio 210, 60 for 88).
 *
 * Unauthenticated: a guest browsing the app sees the same schedule a signed-in client does.
 * What differs is the price line, which needs passes and therefore a session.
 */
export async function fetchSchedule(
  client: ApiClient,
  { dibsStudioId, timeZone }: FetchScheduleArgs,
  signal?: AbortSignal,
): Promise<ScheduleEvent[]> {
  const events = await client.post(
    'widget/get-schedule',
    {
      dibsStudioId,
      timeZone,
      // 'mobileApp' is already a recognised value in services/shared/get-schedule.js and gets
      // the studio's own day window. Anything unrecognised silently falls through to the
      // dashboard's 90 days, which is a different product.
      calledFrom: 'mobileApp',
    },
    scheduleResponseSchema,
    { signal },
  );

  // The service's own catch does `return err`, and the controller `res.json`s it — so a failed
  // query arrives as HTTP 200 with `{}`. In development the schema throws first and this is
  // unreachable; in production the client passes the raw body through by design, and without
  // this an outage would render as "nothing on the schedule."
  if (!Array.isArray(events)) {
    throw new ApiError({
      status: 200,
      code: 'server',
      message: 'The schedule came back in a shape we could not read.',
      retriable: true,
      body: events,
    });
  }

  return events;
}
