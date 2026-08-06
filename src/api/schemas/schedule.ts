/**
 * `POST /api/v2/widget/get-schedule` — the studio's upcoming public sessions.
 *
 * ⚠️ Unlike `get-basic-config`, this endpoint returns **raw Sequelize rows**: snake_case DB
 * column names, plus nested `location` / `instructor` / `appointment_type` includes. There is no
 * camelCase serializer in front of it. Captured from live responses for studios 210 (146 rows)
 * and 88 (66 rows) on 2026-08-06; re-capture with:
 *
 *   curl -s -X POST $API/widget/get-schedule -H 'Content-Type: application/json' \
 *     -d '{"dibsStudioId":210,"timeZone":"America/Los_Angeles","calledFrom":"mobileApp"}' \
 *     | python3 -m json.tool
 *
 * Request contract (`services/shared/get-schedule.js`):
 *   • `dibsStudioId`
 *   • `timeZone` — the studio's IANA zone; the window is computed in it
 *   • `calledFrom` — `'widget' | 'mobileApp'` use the studio's own `interval_end` day window;
 *     anything else silently gets the dashboard's 90 days. Always send `'mobileApp'`.
 *
 * Every field but `eventid`, `start_date` and `name` is optional-and-nullable on purpose. The
 * live data already disagrees with the column types: `isFull` and `has_waitlist` are `null` on
 * most rows, `popular` is null everywhere, and `location`/`instructor` are LEFT JOINs that can
 * legitimately produce nothing. A shipped app cannot be patched for days — it must render what
 * arrives.
 */
import { z } from 'zod';

const locationSchema = z
  .object({
    name: z.string().nullable().optional(),
    short_name: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    tax_rate: z.number().nullable().optional(),
  })
  .passthrough();

const instructorSchema = z
  .object({
    firstname: z.string().nullable().optional(),
    lastname: z.string().nullable().optional(),
    image_url: z.string().nullable().optional(),
  })
  .passthrough();

/**
 * An off-peak / dynamic-pricing discount the backend already applied arithmetic to.
 *
 * Present only when the studio runs pricing rules AND one matched this session's day + time.
 * `discounted_price` is the number to show; `original_price` is what it would otherwise cost.
 * Both are DOLLARS, matching `price_dibs`.
 */
const pricingRuleSchema = z
  .object({
    original_price: z.number(),
    discounted_price: z.number(),
    rule_name: z.string().nullable().optional(),
    discount_description: z.string().nullable().optional(),
  })
  .passthrough();

export const scheduleEventSchema = z
  .object({
    eventid: z.number(),
    /** Stored wall-clock, labelled Z. Never a real instant — see docs/time-semantics.md. */
    start_date: z.string(),
    end_date: z.string().nullable().optional(),
    name: z.string(),

    locationid: z.number().nullable().optional(),
    trainerid: z.number().nullable().optional(),
    description: z.string().nullable().optional(),
    address: z.string().nullable().optional(),

    /** Total capacity. */
    seats: z.number().nullable().optional(),
    spots_booked: z.number().nullable().optional(),
    /** Nullable in practice: most rows carry null and the count has to be derived. */
    isFull: z.boolean().nullable().optional(),
    has_waitlist: z.boolean().nullable().optional(),

    /** Dollars, not cents. */
    price_dibs: z.number().nullable().optional(),
    free_class: z.boolean().nullable().optional(),
    can_apply_pass: z.boolean().nullable().optional(),
    pricing_rule: pricingRuleSchema.nullable().optional(),

    /** `'class'` | `'appt'`. A classes-only build renders only the former. */
    eventtype: z.string().nullable().optional(),
    private: z.boolean().nullable().optional(),
    on_demand: z.boolean().nullable().optional(),
    popular: z.boolean().nullable().optional(),

    /** Resolved virtual-class link (per-event override, else the type default). */
    manual_track_id: z.string().nullable().optional(),

    subscription_id: z.number().nullable().optional(),
    subscription_ids: z.array(z.number()).nullable().optional(),

    location: locationSchema.nullable().optional(),
    instructor: instructorSchema.nullable().optional(),
    appointment_type: z
      .object({ default_manual_track_id: z.string().nullable().optional() })
      .passthrough()
      .nullable()
      .optional(),
  })
  .passthrough();

export type ScheduleEvent = z.infer<typeof scheduleEventSchema>;

export const scheduleResponseSchema = z.array(scheduleEventSchema);
