/**
 * `POST /api/v2/get-upcoming-appts` — the client's own bookings at this studio.
 *
 * Despite the name it returns CLASSES as well as appointments: it reads `attendees`, which is
 * the record of every booking regardless of type. It is the endpoint the widget's "my classes"
 * surface uses (`dibs-widget-new/src/actions/getUpcomingClasses.js` posts to this same path).
 *
 * Request: `{ dibsStudioId, userid }`.
 * Response: `{ msg, upcomingAppts: [...], previousAppts: [...] }`.
 *
 * Rows are assembled by `services/shared/add-data-to-appts.js`, which is where the field names
 * below come from. Two of its behaviours are worth knowing about, because neither is visible
 * from the response:
 *
 *  • It returns `null` — silently dropping the booking — when `attendees.attendeeID` does not
 *    parse as an integer. Studios 263/218/88 carry rows with generated string ids, so a client's
 *    booking can be genuinely missing from this list. That is a backend bug (the same synthetic-
 *    attendeeID problem the Revenue by Class report had to bridge around), not something the app
 *    can detect.
 *  • It reads `classinfo.instructor.firstname` with no null guard, so an event whose instructor
 *    row is missing makes the whole request hang rather than fail. Also not fixable here.
 *
 * ⚠️ This route is UNAUTHENTICATED and takes `userid` from the body — anyone can read anyone's
 * bookings. It belongs on the backend 7.3 auth-hardening list. The app sends its token anyway,
 * so it keeps working the day that mount lands.
 */
import { z } from 'zod';

export const upcomingBookingSchema = z
  .object({
    eventid: z.number().nullable().optional(),
    /** Stored wall-clock, as always. */
    start_date: z.string().nullable().optional(),
    /** `classtitle` and `name` are the same value; either can be absent on an odd row. */
    name: z.string().nullable().optional(),
    classtitle: z.string().nullable().optional(),
    eventtype: z.string().nullable().optional(),
    private: z.boolean().nullable().optional(),

    dropped: z.boolean().nullable().optional(),
    checkedin: z.boolean().nullable().optional(),
    early_cancel: z.boolean().nullable().optional(),

    instructor: z
      .object({
        firstname: z.string().nullable().optional(),
        lastname: z.string().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    location: z
      .object({ locationName: z.string().nullable().optional() })
      .passthrough()
      .nullable()
      .optional(),

    /**
     * Set when the EVENT belongs to a recurring reservation (263 monthly and its kin).
     * `subscription_ids` is a comma-joined string on the event row; either being populated means
     * this session is one date of a commitment — cancellable only through the studio.
     */
    subscription_id: z.number().nullable().optional(),
    subscription_ids: z.string().nullable().optional(),

    /** The package this booking drew on, or 'Drop In'. */
    serviceName: z.string().nullable().optional(),
    /**
     * Server-derived "how was this paid" line — "Booked with studio credit", "Paid by card",
     * "$9.50 credit + $12.50 card". Present only when the server has something better than the
     * package name (booking-time payments); genuine packs keep `serviceName`.
     */
    paidWithLabel: z.string().nullable().optional(),
    dibsTransactionId: z.number().nullable().optional(),
    unpaid: z.boolean().nullable().optional(),
  })
  .passthrough();

export type UpcomingBookingRow = z.infer<typeof upcomingBookingSchema>;

export const upcomingBookingsResponseSchema = z
  .object({
    msg: z.string().optional(),
    upcomingAppts: z.array(upcomingBookingSchema).nullable().optional(),
    previousAppts: z.array(upcomingBookingSchema).nullable().optional(),
  })
  .passthrough();
