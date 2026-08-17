/**
 * The appointment endpoints' wire shapes, captured from `dibs-api` source (2026-08-16 trace:
 * `services/shared/get-appt-types.js`, `services/shared/appointments/get-available-appts-new.js`
 * + `…-custom-263.js`, `get-service-providers.js`, `confirm-no-conflict-before-booking.js`,
 * `services/shared/checkout/complete-appointment-booking.js`,
 * `services/shared/appointments/create-recurring-appointment-enhanced.js`) and from the widget's
 * live consumption of them. Everything optional is optional because these are shared legacy
 * endpoints that grow fields; `.passthrough()` everywhere for the same reason.
 */
import { z } from 'zod';

/**
 * One row of `POST /get-appt-types`. The naming is the API's, not ours: the display name is
 * `appointment_type`, the price is `default_price` (dollars), the duration `length_minutes`.
 */
export const appointmentTypeSchema = z
  .object({
    id: z.number(),
    appointment_type: z.string().nullable().optional(),
    default_price: z.number().nullable().optional(),
    length_minutes: z.number().nullable().optional(),
    description: z.string().nullable().optional(),
    /** Groups the services list. Null lands in a catch-all group. */
    service_category: z.string().nullable().optional(),
    /**
     * 'appt' | 'class'. The server only narrows by it when a studio runs BOTH surfaces —
     * 226's rows all carry 'class' (a legacy column default) and still come back.
     */
    event_type: z.string().nullable().optional(),
    show_on_widget: z.boolean().nullable().optional(),
    sort_order: z.number().nullable().optional(),
    promo_codes_apply: z.boolean().nullable().optional(),
  })
  .passthrough();

export type AppointmentType = z.infer<typeof appointmentTypeSchema>;

/** The response is a bare array — no wrapper object. */
export const appointmentTypesResponseSchema = z.array(appointmentTypeSchema);

/** One provider row of `POST /appts/get-service-providers` (a flat studio-wide roster). */
export const providerSchema = z
  .object({
    id: z.number(),
    firstname: z.string().nullable().optional(),
    lastname: z.string().nullable().optional(),
    staff_title: z.string().nullable().optional(),
    staff_description: z.string().nullable().optional(),
    image_url: z.string().nullable().optional(),
  })
  .passthrough();

export type Provider = z.infer<typeof providerSchema>;
export const providersResponseSchema = z.array(providerSchema);

/**
 * A 263 slot's pricing-rule enrichment. When present, the slot's `priceAppt` has ALREADY been
 * mutated to the discounted figure server-side — `original_price` exists for the strikethrough.
 */
export const slotPricingRuleSchema = z
  .object({
    original_price: z.number().nullable().optional(),
    discounted_price: z.number().nullable().optional(),
    rule_name: z.string().nullable().optional(),
    discount_description: z.string().nullable().optional(),
  })
  .passthrough();

/**
 * One availability slot. `start_time`/`end_time` are studio wall-clock worn as UTC — print them
 * verbatim via `formatStoredTime`, never device-convert, and slice the booking's `date`/`time`
 * out of them with the UTC accessors.
 *
 * The `apptIdForType` / `apptLocationId` / `lengthInMinutes` trio exists only on the custom-263
 * variant's slots; the standard endpoint's slots carry the type id nowhere, so callers fall back
 * to the draft's own service id.
 */
export const availabilitySlotSchema = z
  .object({
    apptType: z.string().nullable().optional(),
    start_time: z.string(),
    end_time: z.string().nullable().optional(),
    /** Echo of the REQUESTED provider id (1000 = "any") — NOT a resolved instructor. */
    instructorid: z.number().nullable().optional(),
    available: z.boolean().nullable().optional(),
    /** Dollars. On 263 slots this is already the pricing-rule-discounted figure. */
    priceAppt: z.number().nullable().optional(),
    pricing_rule: slotPricingRuleSchema.nullable().optional(),
    apptIdForType: z.number().nullable().optional(),
    apptLocationId: z.number().nullable().optional(),
    lengthInMinutes: z.number().nullable().optional(),
  })
  .passthrough();

export type AvailabilitySlot = z.infer<typeof availabilitySlotSchema>;

/**
 * `POST /appts/confirm-no-conflict`. `msg !== 'success'` OR `preventBooking` truthy blocks the
 * session — the widget treats both as "conflicted" and so do we.
 */
export const conflictCheckResponseSchema = z
  .object({
    msg: z.string().nullable().optional(),
    preventBooking: z.boolean().nullable().optional(),
    reasonForPreventing: z.string().nullable().optional(),
  })
  .passthrough();

export type ConflictCheckResponse = z.infer<typeof conflictCheckResponseSchema>;

/** `POST /checkout/complete-appointment-booking` — the success body. */
export const completeAppointmentResponseSchema = z
  .object({
    success: z.boolean(),
    appointmentId: z.number().nullable().optional(),
    eventId: z.number().nullable().optional(),
    passId: z.number().nullable().optional(),
    transactionIds: z
      .object({
        purchase: z.number().nullable().optional(),
        redemption: z.number().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    confirmationEmailSent: z.boolean().nullable().optional(),
    error: z.string().nullable().optional(),
  })
  .passthrough();

export type CompleteAppointmentResponse = z.infer<typeof completeAppointmentResponseSchema>;

/** `POST /appointments/recurring/enhanced` — the success body (fields the app consumes). */
export const recurringAppointmentResponseSchema = z
  .object({
    success: z.boolean(),
    subscriptionId: z.number().nullable().optional(),
    appointments: z
      .array(
        z
          .object({
            appointmentId: z.number().nullable().optional(),
            eventId: z.number().nullable().optional(),
            status: z.string().nullable().optional(),
            start_date: z.string().nullable().optional(),
          })
          .passthrough(),
      )
      .nullable()
      .optional(),
    summary: z
      .object({
        totalSessions: z.number().nullable().optional(),
        paidSessions: z.number().nullable().optional(),
        holdSessions: z.number().nullable().optional(),
        totalCharged: z.number().nullable().optional(),
        creditApplied: z.number().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    /** true = the server's 60-second idempotency guard caught a duplicate submit. Still a booking. */
    duplicate: z.boolean().nullable().optional(),
    error: z.string().nullable().optional(),
  })
  .passthrough();

export type RecurringAppointmentResponse = z.infer<typeof recurringAppointmentResponseSchema>;

/** The refusal body both booking endpoints send on 4xx: `{ success: false, error, code? }`. */
export const appointmentRefusalSchema = z
  .object({
    success: z.literal(false).optional(),
    error: z.string(),
    code: z.string().optional(),
  })
  .passthrough();
