# Time semantics — which fields are wall-clock and which are real instants

The deliverable MOBILE_MASTER_PLAN §3.7 asks for: "a table classifying every timestamp field the
app consumes." **Classify a new field before you use it.** Getting this wrong does not throw —
it silently produces a number that is off by the studio's UTC offset, which is 3–8 hours for our
studios and enough to turn an early cancel into a late one and charge somebody.

## The two frames

**Wall-clock, a.k.a. "fake UTC".** The studio's own clock reading, stored with a `Z` on the end.
A 6:00pm New York class is `2026-08-05T18:00:00.000Z`, which is *not* 18:00 UTC. This is the
platform Timezone Rule (shared `CLAUDE.md`), and it is deliberate.

**Real instant.** An actual moment on the world's timeline — what `new Date()` and Stripe
produce. Comparable with `Date.now()` and nothing else.

They look identical on the wire. Only this table tells them apart.

## How to handle each

| You have | Do this |
|---|---|
| Wall-clock, displaying it | `formatStoredTime()` — prints the stored reading verbatim, on every device |
| Wall-clock, doing arithmetic | `hoursUntilStoredTime()` / `isEarlyCancel()` / `isStoredTimeInPast()` — compares against `studioNow(tz)` |
| Wall-clock → device calendar | `toRealInstant()` — **the only sanctioned conversion**, P3 only |
| Real instant, displaying it | Ordinary `Intl.DateTimeFormat` with the device timezone. This is correct here. |
| Real instant, doing arithmetic | Ordinary `Date.now()` arithmetic. Do **not** route it through `studioNow()`. |

All of the above live in `src/domain/time/studio-now.ts`. Never hand-roll the comparison.

## Classification

### Wall-clock (fake UTC) — compare only against `studioNow(tz)`

| Field | Source | Notes |
|---|---|---|
| `events.start_date` | schedule, roster, bookings | The class time. Drives every cancel-window decision. |
| `events.end_date` | schedule | Used with `start_date` for calendar inserts. |
| `attendees.visitDate` | account, history, stats | Also the visit definition for milestones. |
| `passes.expiresAt` | wallet, pass eligibility | "Expires Aug 30" is a studio-calendar date. |
| `subscriptions.next_billing_date` | upcoming payments | The 20th/25th cycle is studio-calendar. |
| `availability` slot times | appointments (post-v1) | Same frame as events. |

### Real instants — ordinary date maths, never `studioNow()`

| Field | Source | Notes |
|---|---|---|
| `flash_credit_issuance.expires_at` | `GET /widget/active-flash-credits` | **Verified 2026-08-04 against the backend writer** — see below. |
| `flash_credit_issuance.issued_at` | same | Written as `new Date()`. |
| `createdAt` / `updatedAt` | every Sequelize model | Standard ORM timestamps. |
| `deletedAt` / `canceledAt` / `redeemed_at` | various | Lifecycle markers, written with `new Date()`. |
| Stripe `created`, `arrival_date`, `current_period_end`, `trial_end` | Stripe payloads | Unix epoch **seconds** — multiply by 1000. |
| `dibs_transactions.createdAt` | payment history | Ordering the history list is real-instant ordering. |

### Verified: flash-credit expiry is a REAL INSTANT

§3.7 and P6 both flagged this as must-classify-before-building, because a frame error here
shows a countdown that is hours wrong. Traced through dibs-api on 2026-08-04:

- `services/shared/opportunities/flash-credits/issue-flash-credit.js:169-170`
  `const issuedAt = new Date(); const expiresAt = new Date(issuedAt.getTime() + expiryDays * 86400000);`
- `services/shared/opportunities/flash-credits/sweep-expirations.js:91-95` expires a credit when
  `expires_at < now`, where `now = new Date()`.

Both ends are real instants, so **the P6 countdown uses `Date.now()`, not `studioNow()`**. Using
the studio helper here would be the same bug in the opposite direction.

Caveat worth knowing: the client-facing email formats the same value *in the studio's timezone*
(`lib/emails/flash-credits/send-flash-credit-received.js:146` passes `studio.mainTZ`). So the
email says "expires Friday" in studio time. For a countdown that hardly matters, but if the app
ever prints an expiry **date**, format it in the studio's zone to match what the client was
emailed — otherwise a late-evening expiry reads as a different day in the app than in the inbox.

### Unclassified — classify before first use

| Field | Why it is open |
|---|---|
| `invoices.*` dates | Not yet consumed; the 20th/25th cycle mixes both frames and needs its own trace. |
| `membership_pause_history` dates | Post-v1 surface. |
| `user_milestone_events.achieved_at` | The milestones backend could not be located (plan item 7.6). Classify when it exists. |

## Why `toRealInstant` searches instead of applying an offset

A timezone offset is itself a function of the instant, so "look up the offset and add it" is
circular across a DST boundary — it can land you an hour off on exactly the two days a year that
generate support tickets. `toRealInstant` instead probes: guess, read the guess back through the
studio clock, correct by the drift. It converges in two iterations for every real zone, including
the half-hour ones, and there are round-trip tests over both US DST transition days.
