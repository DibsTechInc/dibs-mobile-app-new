/**
 * `POST /api/v2/get-credit` — the client's studio-credit balance, in dollars.
 *
 * Request: `{ dibsStudioId, userid }`. Response: **a bare JSON number.** Not an object, not a
 * wrapper — `res.json(900)`. Verified live 2026-08-06 against userid 10 at studio 210.
 *
 * That shape is the whole reason this file exists. The service's catch does `return err`, and the
 * controller `res.json`s whatever it got, so a failed query arrives as HTTP 200 carrying an ERROR
 * OBJECT where a number belongs. `z.number()` is what turns that into a thrown error instead of a
 * balance rendered as `$NaN` — or, worse, a falsy object quietly formatting as `$0.00` beside a
 * "you have no credit" empty state for someone holding $900.
 *
 * Credit is dollars as a float (`credits.credit` is `double precision`). It is a display value
 * here and nothing more: **the balance is re-fetched live before any checkout uses it** (P2 rule,
 * mirroring the widget). Never spend a cached number.
 */
import { z } from 'zod';

export const creditResponseSchema = z.number();

export type CreditResponse = z.infer<typeof creditResponseSchema>;
