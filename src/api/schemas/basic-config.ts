/**
 * `POST /api/v2/widget/get-basic-config` — the studio's live operational config.
 *
 * ⚠️ Field names here are the API's camelCase keys, captured from a real response for studio
 * 210 on 2026-08-04. MOBILE_MASTER_PLAN §4's P1 table lists DATABASE column names
 * (`color_logo`, `hero_url`, `mainTZ`) which do NOT appear on the wire — do not code against
 * those. Re-capture with:
 *
 *   curl -s -X POST $API/widget/get-basic-config -H 'Content-Type: application/json' \
 *        -d '{"dibsStudioId":210}' | python3 -m json.tool
 *
 * Everything optional is optional on purpose: this endpoint is shared with the widget and
 * gains fields over time, and a shipped app cannot be patched for days.
 */
import { z } from 'zod';

export const basicConfigSchema = z
  .object({
    studioName: z.string(),
    /** Hex WITHOUT the leading '#'. Normalize before handing to the theme. */
    color: z.string(),
    colorLogo: z.string().nullable().optional(),
    heroUrl: z.string().nullable().optional(),
    /** IANA zone. The API calls it `timezone`; the DB column is `mainTZ`. */
    timezone: z.string(),

    /** Whether the studio is live. false → degraded mode: read + cancel, no new bookings. */
    studioIsLive: z.boolean().optional(),

    // Surfaces the studio offers. Navigation ANDs these with the build's own feature flags.
    showSchedule: z.boolean().optional(),
    showAppts: z.boolean().optional(),
    offersClasses: z.boolean().optional(),
    offersAppointments: z.boolean().optional(),
    showCreditLoad: z.boolean().optional(),
    showGiftCards: z.boolean().optional(),
    allowsPackages: z.boolean().optional(),
    locationDynamicPricing: z.boolean().optional(),

    // Cancellation windows, in HOURS of notice required.
    cancelTime: z.number().optional(),
    defaultCancelTimeGroup: z.number().optional(),
    defaultCancelTimePrivate: z.number().optional(),
    defaultCancelTimeSubscription: z.number().optional(),

    /** Replaces the word "Instructor" everywhere it appears. */
    instructorAltName: z.string().nullable().optional(),

    /** How many days ahead the studio publishes bookable time. Drives the day strips. */
    intervalEnd: z.number().nullable().optional(),

    // Money.
    taxRate: z.number().optional(),
    salesTaxRate: z.number().optional(),
    currency: z.string().optional(),
    country: z.string().optional(),
    /** The studio's connected account — StripeProvider needs it. */
    stripeAccountId: z.string().nullable().optional(),

    // Location.
    locationName: z.string().nullable().optional(),
    locationAddress: z.string().nullable().optional(),
    locationAddress2: z.string().nullable().optional(),
    locationCity: z.string().nullable().optional(),
    locationState: z.string().nullable().optional(),
    locationZipcode: z.string().nullable().optional(),
    locationPhone: z.string().nullable().optional(),
    locationIdShowing: z.number().nullable().optional(),
    locationIdsAll: z.array(z.number()).optional(),

    customerServiceEmail: z.string().nullable().optional(),
    customerServicePhone: z.string().nullable().optional(),
    terms: z.string().nullable().optional(),

    /**
     * Backend item 7.9 — NOT shipped yet, so this must stay optional. When present, a build
     * older than this shows an update banner. Never make it required.
     */
    minAppVersion: z.string().optional(),
  })
  // Additive backend fields must not fail validation.
  .passthrough();

export type BasicConfig = z.infer<typeof basicConfigSchema>;

/** Prefix the '#' the API omits, tolerating a value that already has one. */
export function normalizeAccentHex(color: string | null | undefined, fallback: string): string {
  if (!color) return fallback;
  const trimmed = color.trim();
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  return /^#[0-9a-fA-F]{6}$/.test(withHash) ? withHash.toUpperCase() : fallback;
}

/**
 * Is the studio accepting new bookings?
 *
 * `studioIsLive === false` means offboarded or in trial soft-lockout. The app keeps read access
 * and keeps cancellations working — mirroring the backend's own soft-lockout semantics — and
 * hides booking CTAs. A missing field means "assume live": an older backend that does not send
 * it must not lock every studio out.
 */
export function isAcceptingBookings(config: BasicConfig): boolean {
  return config.studioIsLive !== false;
}
