/**
 * `POST /api/v2/widget/get-packages` — the class packs and memberships a studio sells.
 *
 * ⚠️ Like `get-schedule`, this returns **raw Sequelize rows** from `studio_packages` — camelCase
 * column names exactly as the table declares them, with `taxrate` bolted on per row by
 * `services/shared/get-packages.js`. There is no serializer in front of it.
 *
 * The service already filters to `available: true`, `front_desk_only: false`,
 * `is_placeholder: false` and orders by `sortIndex` then price. `is_placeholder` matters: a
 * placeholder package is the studio's spot-hold mechanism, never something a client can buy
 * (platform invariant — see `passes.is_placeholder` in the shared CLAUDE.md). We filter again on
 * our side anyway; a defence that costs one predicate is not removed on the strength of one
 * endpoint being correct today.
 *
 * Request contract: `{ dibsStudioId }`. Unauthenticated — this is a public price list.
 *
 * Every field but `id`, `name` and `price` is optional-and-nullable on purpose. A shipped app
 * cannot be patched for days; it must render what arrives.
 */
import { z } from 'zod';

/**
 * `autopay` is an ENUM on the package, not a boolean.
 *
 *   `'NONE'`  — a one-off purchase. A pack of classes.
 *   `'ALLOW'` — the client may choose to have it renew.
 *   `'FORCE'` — a membership. It renews, and that is not optional.
 *
 * It describes what the PACKAGE permits, never what any particular pass is. The pass row's own
 * `autopay` boolean is the answer to "is this client on a membership" — the two disagree in both
 * directions in live data (see `domain/wallet/build-wallet`).
 */
export const packageAutopaySchema = z.enum(['NONE', 'ALLOW', 'FORCE']);
export type PackageAutopay = z.infer<typeof packageAutopaySchema>;

export const studioPackageSchema = z
  .object({
    id: z.number(),
    name: z.string(),

    /** One-off price, in DOLLARS. Like `price_dibs`, not cents. */
    price: z.number().nullable().optional(),
    /** The recurring price when the package renews, in DOLLARS. */
    priceAutopay: z.number().nullable().optional(),

    /**
     * How many sessions the pack is worth.
     *
     * NOT the same question as `unlimited`. Live data carries `classAmount` on unlimited packages
     * too (a sentinel, usually 1 or 999), so the count is only meaningful once `unlimited` has
     * been ruled out. Never render this figure without checking that flag first — inventing a
     * number for an unlimited membership is the single most-repeated bug on this platform.
     */
    classAmount: z.number().nullable().optional(),
    unlimited: z.boolean().nullable().optional(),

    /** `'NONE' | 'ALLOW' | 'FORCE'`. Anything unrecognised is treated as `'NONE'`. */
    autopay: z.string().nullable().optional(),

    /** How long the pass lives once bought: `passesValidFor` of `validForInterval`. */
    passesValidFor: z.number().nullable().optional(),
    /** `'month' | 'week' | 'day' | 'year'` in practice — rendered, never branched on. */
    validForInterval: z.string().nullable().optional(),

    /** Months a membership must be held before it can be cancelled. 0/1/null = none. */
    commitment_period: z.number().nullable().optional(),

    /** The studio's own copy for this package. Shown verbatim when present. */
    customDescription: z.string().nullable().optional(),
    /** When false the studio does not want the package's NAME shown. Rare, and honoured. */
    should_display_name: z.boolean().nullable().optional(),

    /** Not offered publicly. Filtered out — it is a front-desk or admin-only product. */
    private: z.boolean().nullable().optional(),
    /** Belt and braces over the endpoint's own filter. See the note at the top. */
    is_placeholder: z.boolean().nullable().optional(),

    /** Only sellable as somebody's FIRST purchase — an intro offer. */
    onlyFirstPurchase: z.boolean().nullable().optional(),

    show_price_per_class: z.boolean().nullable().optional(),
    /** A per-class figure the studio wants shown instead of price ÷ classAmount. Dollars. */
    price_per_class_override: z.number().nullable().optional(),

    sortIndex: z.number().nullable().optional(),

    /** A PERCENTAGE (8.25 means 8.25%), added per row by the service from the studio location. */
    taxrate: z.number().nullable().optional(),
  })
  .passthrough();

export type StudioPackage = z.infer<typeof studioPackageSchema>;

/**
 * The success shape is an ARRAY.
 *
 * The controller answers HTTP 200 with an `apiFailureWrapper` OBJECT when the service throws, so
 * the array check is the whole defence — see `endpoints/packages.ts`.
 */
export const packagesResponseSchema = z.array(studioPackageSchema);
