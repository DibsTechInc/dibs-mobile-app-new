# Finish the app for the App Store update — build plan v2

Supersedes `credit-and-membership-plan.md` (v1, approved 2026-08-14). Written 2026-08-14 after
reading the dibs-api source on branch `staging`; every file path and line number below was
verified, not remembered.

**v1 is not wrong — it is incomplete.** Its research on credit and enrolment stands and is
carried forward verbatim in §6 and §7. What changed is scope and order: v1 planned two features,
and the ship list has seven. Four of the seven (billing, membership cancellation, the app version
gate, the virtual-class gate) appear nowhere in v1, and one (dropping a class) was an unapproved
appendix.

**Decisions added 2026-08-14 (Alicia), after v2's first draft:**

- The Cancel button is **hidden** during a commitment period, not merely refused — §2.3.
- The app needs a **force-update** capability, not just a recommendation — §4.
- **Virtual classes must be removable from the app** ahead of store review, via a new
  `events.is_virtual` (built by another workstream) and a new `dibs_configs.show_virtuals_on_app`
  — §5. Apple approved the 2021 builds on the grounds that every class was in person; a listing
  named "VIRTUAL ballet" puts that exemption at risk.
- **§5.5 RULED 2026-08-14:** a virtual class booked on the *web* **does** still show in My
  Calendar, and stays droppable. The gate is on browsing and buying, never on what the client
  already owns. §5 is unblocked on this question; `events.is_virtual` landing is still a
  prerequisite.

---

## 0. Ship target

An update to the two live iOS listings (`com.ondibs.everydayballetapp`,
`com.ondibs.carlsbadvillageyogaapp`). Classes only — appointments are the next milestone, not this
one. A client must be able to:

| | Capability | State |
|---|---|---|
| 1 | Book a class with a card | ✅ shipped |
| 2 | Book a class with a pass | ✅ shipped |
| 3 | Buy a package | ✅ shipped |
| 4 | Update their profile / change password | ✅ shipped |
| 5 | See passes, credit and cards | ✅ shipped (`useWallet`) |
| 6 | **Drop a class they booked** | ❌ **§1 — not built** |
| 7 | **Cancel a membership, respecting commitment** | ❌ **§2 — not built** |
| 8 | **See past and upcoming payments** | ❌ **§3 — not built** |
| 9 | **Be told to update the app (soft and hard)** | ❌ **§4 — not built** |
| 10 | **Never see a VIRTUAL class in the app** | ❌ **§5 — not built** |
| 11 | Enrol in a membership | ❌ §6 — not built |
| 12 | Pay with studio credit | ⚠️ §7 — backend built, app side not started |

Items 6–10 are the difference between "an app" and "a complete app". Item 6 in particular: the app
currently takes money for a class and offers no way out of it. Item 10 is a **store-review
gate** — see §5.

### 0.1 Order of work

Build in this order and commit each separately. Items 1, 2, 3 and 5 have dibs-api prerequisites
that must land and deploy before the app screen is worth writing.

| # | Work | Repo | Blocking? |
|---|---|---|---|
| 1 | Drop a class | dibs-api + app | **Ship-blocking** |
| 2 | Membership cancellation | dibs-api + app | **Ship-blocking** |
| 3 | Billing — past + upcoming | dibs-api + app | **Ship-blocking** |
| 4 | App version gate (force / recommend update) | dibs-api + app | **Ship-blocking** — cannot be retrofitted into a build already in the wild |
| 5 | Virtual-class gate | dibs-api + app | **Ship-blocking — store review** |
| 6 | Membership enrolment | dibs-api + app | Not blocking — can follow the update |
| 7 | Credit, app side | app only | Not blocking — pure upside |

Item 4 is ship-blocking for a reason that is easy to miss: **a version gate only protects builds
that already contain it.** Whatever ships in this update is the oldest build that can ever be
told to update itself. Leaving it out means the next forced migration has no lever.

### 0.2 Rules that apply to every endpoint in this plan

These are already established by `class-card` / `class-pass`. Copy them; do not re-derive.

1. **Identity comes from the verified token, never the body.** `requireWidgetAuth`, and the
   handler reads the id the middleware resolved. If the id the handler consumes is nested
   anywhere other than top-level `req.body.userid`, hoist it first — `isRequestingOwnData` reads
   `req.body.userid`, so mounting the middleware over a nested id authenticates the caller and
   then skips the ownership check entirely, on a route that now *looks* gated. That is the
   `hoistProfileUserId` lesson from 2026-08-07.
2. **Money is computed server-side and verified against what the app displayed.** The app sends
   what it showed; the server recomputes; disagreement is a `409` with the fresh figures so the
   app re-renders. Never a silent charge at a different number.
3. **A decision the client could lie about is read from the DB.** Timing, entitlement, coverage,
   eligibility — all of it. The request body supplies lookup keys only.
4. **A failed upstream read is not an empty result.** "Could not ask Stripe" and "you have
   nothing" are different states and must render differently.

---

## 1. Drop a class  ⟵ build this first

### 1.1 What exists, and why neither existing route is callable from the app

There are three drop paths in dibs-api. All three take the early/late decision from the request
body, and none of them authenticates.

| Route | Service | Problem |
|---|---|---|
| `POST /drop-event` (`routers.js:556`) | `drop-event-service.js` | `earlyDrop` from the body at line 110 decides whether the pass use is returned. No auth. |
| `POST /studio/drop-event-new` (`routers.js:755`) | `drop-event-service-new.js` | Return *mode* is correctly resolved from the DB via `resolveReturnMode` — but `earlyDrop`, `overrideLateCancel` and `overrideReturnMode` are all still destructured off `req.body`. No auth. Admin surface. |
| `POST /api/v2/studio-admin/drop-client-from-event` | `drop-client-from-event.js` | Correct, but studio-admin-authenticated and carries admin overrides. |

> **Correction to v1 §3.** v1 said "the newer siblings do it correctly … the mobile endpoint
> delegates to the existing drop machinery." Half true. `resolveReturnMode` genuinely is the
> single owner of pass-OR-credit-OR-nothing and reads every input from the DB — reuse it
> unchanged. But the *timing* decision and two override flags still arrive in the body of
> `drop-event-service-new.js`. Pointing the app at that route would hand a client
> `overrideLateCancel: true`.

### 1.2 The shape to build

`POST /checkout/class/drop` — sibling of `book-with-pass`, in `services/shared/checkout/class-drop/`.

> **Collision check — verified 2026-08-14, nothing existing is touched.** `/checkout/class/*` is a
> namespace this mobile workstream created; every route in it is already `requireWidgetAuth`
> (`routers.js:522, 526, 531, 537`). There is no `/checkout/class/drop`. The widget drops via
> `POST /drop-event`; studio-admin drops via `POST /studio/drop-event-new` and
> `POST /api/v2/studio-admin/drop-client-from-event`. This adds a new file and one route line.
> The only shared code it reuses is `resolveReturnMode`, which both existing droppers already
> call and which is pure — **do not modify it.** If a change to `resolveReturnMode` ever looks
> necessary, stop: it is the single owner of the pass-OR-credit-OR-nothing rule for the widget
> and studio-admin too, and editing it changes what those two return on every drop.

1. `requireWidgetAuth`. Identity from the token. **No `userid` in the body.**
2. Body is `{ eventId, dibsTransactionId }` — lookup keys only. Reject any other field rather
   than ignoring it; an ignored `overrideLateCancel` in a payload is a trap for the next reader.
3. Verify the transaction belongs to the authenticated user and the studio. 404 on mismatch —
   same rule as `withStudioScopeFromResource`, don't disclose existence.
4. **Compute early/late server-side.** `getStudioWallClock(dibsStudioId)`
   (`services/shared/time/studio-wall-clock.js`) for `now`, the event's `start_date` as the
   deadline anchor, and `dibs_configs.default_cancel_time_group` for the notice hours (surfaced
   as `defaultCancelTimeGroup` by `get-studio-config.js:151`). Early ⇔ `now` is at least
   `noticeHours` before the start; exactly at the boundary counts as early.
   **Both sides of that comparison are studio wall-clock wearing a `Z`.** Diffing a stored
   `start_date` against real `now()` reads an East Coast class four hours early — that is the
   bug the roster's "Class ended" pill shipped on 2026-08-10.
5. Delegate the value return to `resolveReturnMode` unchanged. Pass **no** override — a client
   never gets `overrideLateCancel` or `overrideReturnMode`.
6. Write through the existing actions the new service already uses: `setAttendeeDropped`,
   `deleteDibsTransaction`, `refreshpasscount`, `returnCredit`, `updateEventCount`.
7. **Never cancel the event.** `cancelAppointmentForEvent` exists for the admin path and is
   gated on appt + `seats === 1` + no live attendees. A client dropping themselves must not be
   able to reach it. Omit the call entirely rather than relying on the guard.

Response carries what actually happened, because the app has to say it:
`{ dropped: true, returned: 'pass' | 'credit' | 'none', wasEarly, creditAmountCents? }`.

### 1.3 App side

`src/domain/cancellation/cancel-window.ts` already exists and already says the right thing in its
own header: *"This is display copy, not an authorisation. The backend decides what a cancel
actually costs."* Keep that boundary.

- The confirm sheet states the consequence in the studio's terms before the tap: "Free to cancel
  until 6:00 AM tomorrow" while early; "Cancelling now does not return your class" once late.
  `cancelWindowSentence` already produces the first half.
- **The server's answer wins over the app's prediction.** If the app predicted early and the
  server returns `wasEarly: false`, the app reports what the server did, not what it expected.
  A clock skew or a mid-session boundary crossing must not produce a screen that contradicts
  the client's pass balance.
- Invalidate the passes, credit and upcoming-bookings queries on success. A drop that returns a
  use and leaves the wallet showing the old count is the same class of bug as the widget's
  "Included" label disagreeing with the checkout bar.
- `MyCalendarScreen.tsx` already renders a `Cancelled` `StatusTag`; the row needs the action.

---

## 2. Membership cancellation

Two dibs-api prerequisites. **Neither is optional and both must deploy before the app screen.**

### 2.1 Prerequisite A — the cancel route is unauthenticated

```
routes/routers.js:600
router.post('/stripe/cancel-renewal', controller.cancelRenewal);
```

No middleware. The controller takes `userid`, `passid` and `packageid` off the body. Shipping an
App Store binary that calls this publishes a *cancel any client's membership* endpoint to anyone
who opens a network inspector — the same shape as the `update-profile` hole closed on 2026-08-07,
except the blast radius is somebody's recurring revenue.

Mount `requireWidgetAuth` and read the id from the verified token. The service already
distinguishes callers properly:

- `services/shared/stripe/cancel-renewal.js` takes `source` (`'widget'` | `'admin'`) and a
  normalized `actor`, and its own JSDoc anticipates this work: *"When mobile app supports
  membership cancel in the future, add 'mobile' here."* Add it, and write
  `cancellation_source = 'mobile_self_service'` with `canceled_by_userid` from the token.
  The actor-display table in the shared `CLAUDE.md` § *Cancel actor tracking* gains a row.
- The studio-admin path keeps `req.employee`. Do not disturb it.

Note the existing known gap this closes as a side effect: `canceled_by_employeeid` is currently
NULL on every studio-admin cancel because that route has no auth either. Fixing the mount fixes
both callers.

### 2.2 Prerequisite B — commitment periods are not enforced anywhere on the server

`cancel-renewal.js` imports `computeCommitmentRemaining` — but only to **snapshot**
`commitment_remaining_at_cancel_count` / `_unit` into the audit columns. It never refuses.
`grep commitment_period` across `services/` returns reads for display and writes for setup, and
nothing that blocks a cancel.

The only enforcement in the platform is the widget's `pass.jsx` gate, which decides whether
*Cancel Renewal* renders at all. That gate is display logic doing policy work, and it has already
failed once: fixing the renewal date on 2026-08-07 exposed a years-old string comparison in it
and briefly released a member from an unserved two-month commitment.

**So: do not implement the commitment check in the app.** A third copy of an unenforced rule,
living in a binary the client controls, is the easiest one to bypass and the hardest one to fix.

The endpoint refuses:

```
409 { error: 'commitment_not_met', eligibleOn, remainingCount, remainingUnit, packageName }
```

- `eligibleOn` is a date the app can render. The client should read "You can cancel from
  November 3" — a date they can plan around — not "2 months remaining", which invites arithmetic.
- Computed from the enrolment date on `dibs_user_autopay_packages` and
  `studio_packages.commitment_period` / `autopayIncrement`, both of which
  `computeCommitmentRemaining` already reads. Reuse it; do not re-derive the arithmetic.
- **The refusal is the server's, so the widget inherits it** the day it points at the same
  route. That is the whole reason to put it here: one owner, and `pass.jsx`'s gate degrades from
  policy to a hint.

### 2.3 The Cancel button is hidden during the commitment — but the commitment is not

**Decision (Alicia, 2026-08-14): a member inside their commitment period does not see a Cancel
button at all.** Not a disabled one, not one that opens an explanation — it is absent.

**With one addition, because "no button" and "no information" are different things.** The
membership card states the commitment in its place: *"Minimum commitment through November 3."*
Once that date passes, the card drops the line and the Cancel action appears.

The reason for the addition is on the record in the shared `CLAUDE.md`, describing the widget's
renewal-date bug: *"One undefined date silently removed the client's ability to cancel… Classic
'no dead ends' shape: nothing throws, the button simply is not there."* A member who sees no
cancel affordance and no explanation phones the studio, which is the support load this app exists
to reduce.

**One server-computed value drives both the button and the refusal.** The membership row carries:

```
cancellation: { canCancel, eligibleOn, remainingCount, remainingUnit }
```

computed by `computeCommitmentRemaining` — the same function §2.2's refusal uses. The app renders
it and **never does the arithmetic**. That is the "a value that feeds both a sentence and a gate
must be resolved ONCE" rule; the widget's version of this bug came from a date resolved one way
for the copy and another way for the gate.

Hiding the button is UX. The endpoint refuses independently, always. Neither substitutes for the
other: an app build is client-controlled, and a server that only refuses leaves the client
tapping a button that never works.

### 2.4 App side

- Membership card gains a *Cancel membership* action, gated on `cancellation.canCancel`. Never a
  bare icon — labelled, per the foolproof-by-default rule.
- Confirm sheet states what actually happens: `cancel_at_period_end`, so **access continues to
  the end of the paid period**. Name the date. "Your membership ends November 30. You keep access
  until then." A client who thinks they lost access immediately will call the studio.
- The `commitment_not_met` refusal is **not an error toast.** It is the screen: the eligible date,
  the reason, and the studio's contact line. It should be unreachable in practice — the button is
  hidden — so if it ever fires, the client and the server disagreed and the client deserves the
  server's answer, legibly.
- Invalidate passes + upcoming payments on success.

---

## 3. Billing — past and upcoming payments

### 3.1 Past — the data exists and is already bundled correctly

`POST /transactions/:type` (`routers.js:736`) → `services/studio-admin/user/get-transactions.js`
→ `lib/users/transaction-history/index.js`. The section the app wants is `account-activity`,
which runs `lib/users/transaction-history/get-account-activity.js` and returns bundled rows plus
`totalCount` and `balance`, with `limit` / `offset` / `windowDays` already supported.

**The app must consume those bundled rows, not the raw transactions.** `get-account-activity.js`
implements two bundling rules the shared `CLAUDE.md` documents at length:

- a single-session card booking writes a pass-purchase row *and* a class-booking row in the same
  second; within ±60s on the same pass id they collapse into one event
- subscription rows within ±60s of `subscription.createdAt` roll into one `subscription_started`

Re-deriving that in TypeScript gives the client a history with twice as many entries as the web
shows for the same money. Same rule as `priceClassForClient` and `resolveReturnMode`: one owner.

Two things to do:

1. **Auth it.** `routers.js:736` has no middleware and takes `userid` from the body — anyone can
   read anyone's payment history. Same treatment as §2.1. Note the route is currently a
   studio-admin surface; the cleanest move is a thin `POST /widget/account-activity` mounted with
   `requireWidgetAuth` that calls the same lib with the token's userid, leaving the admin route
   alone.
2. **Clean the handler on the way past.** `get-transactions.js` carries four `console.log`s of
   client ids and a commented-out duplicate of its own body. If you touch the file, delete them.

Refunds are already hydrated (`hydrateRefundsForRows`) and a partially-refunded purchase stays a
purchase with a refund annotation — don't flip it to a refund row in the app.

### 3.2 Upcoming — the `current_period_end` minefield

Read the shared `CLAUDE.md` § *"when does this membership renew?"* before writing a line of this.
The short version:

- **Post-Basil, `current_period_end` is on `subscription.items.data[]`, not the Subscription.**
  dibs-api pins a post-Basil version, so a bare top-level read returns `undefined`. Six separate
  bare readers have shipped as production bugs, the most recent found 2026-08-13 — one of them
  made a studio's entire Upcoming Revenue section read "no scheduled charges" while $4,385 was
  actually due.
- **The single owner is `services/shared/stripe/subscription-period.js`** (`getCurrentPeriodEnd` /
  `getCurrentPeriodStart`): item first, legacy top-level second, `null` — never `undefined` or
  `NaN` — when neither resolves. Route through it.
- **The amount comes from the subscription's own `default_tax_rates`**, not the location tax rate.
  Membership prices are pre-tax (Option B, 2026-08-10) and existing members were deliberately not
  backfilled with a TaxRate, so applying the location rate in a display overstates the charge for
  every unbackfilled member. `get-client-available-passes.js` already returns
  `stripeInfo.chargeAmount` and `hasUnresolvedTax` for exactly this; the widget's resolver is
  `dibs-widget-new/src/utils/renewalAmount.js`. Mirror its rules, don't invent a second answer.
- **Never render a stranded "Renews on ."** No resolvable date → "Renews automatically." A
  sentence built around a hole reads as broken software next to a real dollar figure.
- Dates render abbreviated — "Sept 7, 2026". Note `toLocaleDateString({ month: 'short' })` gives
  "Sep"; the widget hand-rolls the table for this reason.

### 3.3 App side

One screen, two sections, reachable from the account tab. Upcoming above past — what is about to
leave your account matters more than what already did.

A failed Stripe read shows the past section and says the upcoming one could not be loaded, with a
retry. It does **not** render "no upcoming charges" — that is the `ok: false ≠ zero members` rule,
and telling a paying member they have no upcoming charges is the worst thing that screen can say.

---

## 4. App version gate — "you should update" and "you must update"

**Ship-blocking, and the reason is structural: a version gate only protects builds that already
contain it.** Whatever ships in this update becomes the oldest build that can ever be told to
update itself. Omitting it means the next time a backend contract has to change — a new required
field, a retired endpoint, a security fix — there is no lever, and the only option is breaking
old installs silently.

### 4.1 Where it lives

**Its own endpoint, not `get-basic-config`.** Three reasons: it must answer before any studio
context or session resolves (the gate runs before login), it must stay simple enough to be
cacheable, and coupling it to studio operational config means a config outage takes the gate with
it.

`GET /api/v2/app-release/:studioSlug` — unauthenticated, no body, cacheable.

```json
{
  "ios":     { "minimumBuild": 40, "latestBuild": 47, "storeUrl": "https://apps.apple.com/..." },
  "android": { "minimumBuild": 0,  "latestBuild": 0,  "storeUrl": null },
  "message": null
}
```

**The app does the comparison**, against `Constants.expoConfig` / `nativeBuildVersion`. Keeping
the endpoint a dumb document means it can be cached hard and can never brick a client through a
comparison bug on the server.

Storage: a small `mobile_app_releases` table keyed on `(studio_slug, platform)`. **Not
`dibs_configs`** — this is app-release metadata with a different lifecycle and a different owner
than studio operational settings, and mixing them invites someone to edit a build number from the
studio settings screen.

### 4.2 The five rules

1. **Fail OPEN.** Network error, non-200, malformed body, missing platform key, unparseable
   integer → **no gate, app proceeds**. Bricking a working app because a server hiccupped is
   strictly worse than one more session on an old build. This is the single most important rule
   here and it is the one that gets "optimised" away.
2. **Compare integer build numbers, never version strings.** `"1.10.0" < "1.9.0"` is true in a
   lexical comparison, which is how these ship inverted. `minimumBuild` and `latestBuild` are
   integers; a non-integer is a malformed body per rule 1.
3. **`minimumBuild` must LAG the live release by days, not track it.** Apple's phased rollout
   means a new build is not available to everyone on release day. Forcing an update to a build a
   client cannot yet download is a hard brick with no exit — the worst outcome this feature can
   produce. Set `latestBuild` at release; raise `minimumBuild` deliberately, later, once the
   release is fully rolled out.
4. **The blocking screen has the store link AND the studio's support email.** One action is not
   enough when the action can fail. A client whose update path is broken needs a human.
5. **The gate resolves before the router renders anything else** — never mid-checkout. It sits
   above the navigation tree, alongside the existing config/session bootstrap.

### 4.3 Soft vs hard

| | Trigger | Behaviour |
|---|---|---|
| **Must update** | `build < minimumBuild` | Full-screen, non-dismissible, no back gesture. Store link + support email. |
| **Should update** | `minimumBuild <= build < latestBuild` | Dismissible sheet. **Rate-limited: once per `latestBuild` per 7 days**, persisted locally. |

The rate limit is not a nicety. A prompt on every cold start reads as spam and gets the app
deleted, which is the opposite of what a soft prompt is for. Persist the last-prompted
`(latestBuild, timestamp)` and honour it.

`message` is an optional server-supplied line for the rare case where the reason matters ("This
update is required to keep booking with card"). Null renders default copy — never render an empty
string as a headline.

---

## 5. Virtual classes must not appear in the app  ⟵ store-review gate

### 5.1 Why this exists

Apple exempts real-world services consumed outside the app from IAP, and that is the exemption
the 2021 builds were approved under: *these are all in-person classes.* A class visibly named
"VIRTUAL Ballet" invites a reviewer to conclude the app sells digital content outside IAP, which
is a rejection and a revenue-share conversation. Studio 88 sells a handful of virtual spots a
week — not worth the exposure. Those spots keep selling on the **web widget**, which has no such
constraint.

### 5.2 Dependency — `events.is_virtual` is being built by another workstream

**This plan CONSUMES the column; it does not create it.** Verified 2026-08-14: `is_virtual`
appears nowhere in dibs-api services, models, migrations or routes. Confirm it has landed before
starting §5, and confirm its actual name and type rather than assuming this document's.

New in this plan: **`dibs_configs.show_virtuals_on_app`** (boolean, nullable).

### 5.3 Two NULL traps, both of which silently do the wrong thing

**`show_virtuals_on_app` defaults to HIDE, which is backwards from the other config flags — on
purpose.** `show_unpaid_visits_on_profile` uses NULL/true = show, so its readers test `!== false`.
This one is the inverse: **readers test `=== true`**, so a studio that has never touched the
setting shows no virtual classes in the app. This flag guards a store-rejection risk, so it fails
**closed**. Leave a comment in the migration saying so, or the inconsistency gets "fixed" later
by someone being helpful.

**`is_virtual` is NULL on every existing event row, and `is_virtual = false` does not match
NULL.** In Postgres that comparison evaluates to NULL, not true — so a naive predicate hides
*every legacy class in the system*. The predicate is:

```sql
is_virtual IS NOT TRUE
```

This is the same trap as `passes.totalUses`, which has now bitten twelve separate read surfaces
in this platform. It will not throw. It will simply return an empty schedule.

### 5.4 The gate is two-sided — display and enforcement are different problems

**Display — the schedule feed.** `getSchedule(dibsStudioId, tz, calledFrom)` already branches on
`calledFrom === 'mobileApp'` vs `'widget'` (`services/shared/get-schedule.js:26`), and the app
already sends `mobileApp`. Attach the filter there:

> when `calledFrom === 'mobileApp'` **and** `show_virtuals_on_app !== true`, add
> `is_virtual IS NOT TRUE` to the event query.

**The widget path is untouched by construction.** That is the whole reason to use this seam
rather than a global filter — studio 88 keeps selling virtual spots on the web the entire time.

**Enforcement — the booking endpoints.** `calledFrom` arrives in the request body, so a filter
keyed on it is a display convenience, not a guarantee. `create-payment-intent`, `confirm-booking`,
`book-with-pass` and `book-with-credit` must each independently refuse a virtual class by reading
`events.is_virtual` and the studio config **from the DB, with zero client input**, returning
`409 class_unavailable_in_app`. That is where Apple's actual concern lives: the sale, not the
listing. It also covers the two cases the feed filter cannot:

- a **deep link** to `/class/[eventId]` — a push notification or a shared URL landing straight on
  a virtual class detail screen. The detail endpoint gets the same filter.
- a **persisted cart** holding a class booked before the flag flipped. The refusal must re-render
  the cart with the item removed and say why — the `price_changed` pattern, applied to
  availability.

### 5.5 RULED (Alicia, 2026-08-14) — a virtual class booked on the web DOES still show in My Calendar

**The gate is on BROWSING and BUYING, never on what the client already owns.**

`get-upcoming-appts` does **not** get the virtual predicate. A client who booked a virtual class on
the web sees it in the app's calendar and can drop it there like any other booking. Hiding a class
someone paid for would leave them unable to see it or cancel it — a dead end and a support call,
to protect against a risk that is already controlled another way: the App Store reviewer uses a
test account Dibs creates, and that account will have no virtual bookings.

Consequences to hold onto:

- **§1's drop endpoint must not inherit the virtual refusal.** Dropping is not buying. A client
  who cannot cancel the class they are looking at is the exact dead end the gate was supposed to
  avoid creating.
- The class detail screen reached **from My Calendar** renders for a virtual class. Only the
  *booking* affordance is gated — and by then the client has already booked it, so there is
  nothing to offer.
- A deep link to `/class/[eventId]` for a virtual class the client has **not** booked still
  refuses, per §5.4. "Already mine" and "reachable by URL" are different questions.

---

## 6. Membership enrolment

Carried forward from v1 §2 unchanged; it was correct.

`services/shared/checkout/enroll-membership.js` already exists and already handles enrolment with
credit (studio-admin, shipped — "Phase 1 of credit-on-memberships, cycle 1 only"). Read it first:
the mobile endpoint is a thin authenticated wrapper over the same service, not a second enrolment
brain.

Rules that must hold, all from the shared `CLAUDE.md` § Memberships:

- **`dibs_user_autopay_packages.dibs_studio_id` MUST be set.** NULL rows are invisible to
  `list-client-stripe-subs.js` and surface as phantom "Stripe-only" memberships. Three writers
  have already leaked this; a fourth would be the fourth.
- **Attach the studio's TaxRate** as `default_tax_rates` via `get-or-create-tax-rate.js`. Fail
  soft — a sub without tax plus an ops alert, never a blocked enrolment.
- **Price resolution is `stripe_price_id_recurring || stripe_plan_id`.** On prod `stripe_plan_id`
  is the only populated column on every real membership.
- **Block duplicate active enrolments** at the entry point.
- Honour `front_desk_only` — that flag decides whether the membership appears in the app at all.
- Commitment terms belong on the card **before** enrolling, not after. `build-packages.ts`
  already computes `commitmentLabel` and currently renders it and then refuses to sell; that
  refusal becomes conditional on `front_desk_only`.

App change is small once the endpoint exists: `build-packages.ts` sets `isPurchasable: false` for
every membership with the copy "Memberships are set up with the studio directly." Make it
conditional.

**Submission note.** Auto-renewing subscriptions are what Apple scrutinises hardest. Real-world
services consumed outside the app are exempt from IAP and the 2021 builds already sold packages
this way, but a *subscription* draws more attention than a one-off. Make it unmistakable on the
card that this buys in-person classes at a physical studio. Confirm the current guideline text
before submitting rather than trusting this paragraph.

---

## 7. Studio credit — app side only

Backend is **built and tested**. Do not rebuild any of it.

| File | What it owns |
|---|---|
| `class-credit/resolve-credit-split.js` | the single owner of the split (10 tests) |
| `class-credit/claim-credit.js` | the atomic balance claim (10 tests) |
| `class-credit/read-credit-balance.js` | the live balance read |
| `class-credit/book-with-credit.js` | credit-only endpoint, `POST /checkout/class/book-with-credit` |
| `class-card/create-payment-intent.js` | sizes the PI to the remainder, writes `creditAppliedCents` to metadata |
| `class-card/confirm-booking.js` | claims credit after the seat, before capture; releases on every failure |
| `class-card/record-class-card-booking.js` | writes the split onto the rows and the ledger |
| `class-card/booking-contract.js` | carries `creditAppliedCents`; reads pre-credit PIs as 0 |
| `passes/create-pass-after-charge.js` | new `creditAlreadyClaimed` opt-out |

### 7.1 Remaining work

1. **The app side, all of it.** A credit toggle (default ON), the "$12.50 credit · $28.26 card"
   line in the checkout summary, routing the credit-covers-everything case to
   `book-with-credit`, and treating a `credit_changed` refusal as a re-render rather than an
   error. `src/domain/payments/checkout-method.ts` has the slot — it says nothing about credit
   today because there was no credit path to describe. Add a `kind: 'credit'` branch.
2. **Endpoint tests for `book-with-credit`.** The pure helpers under it are covered; the
   orchestration — seat-then-credit ordering, both release paths — is not.

### 7.2 Design facts worth keeping (why the pieces are shaped this way)

- **The claim happens at CONFIRM, never at PI creation.** Claiming when the PI is created takes
  the money before the client has finished the sheet, and there is no reliable moment to give it
  back if they dismiss it, background the app, or lose signal. The split is *decided* at
  endpoint 1 and *taken* at endpoint 2 — the same shape the seat claim already uses.
- **Nothing is captured before the credit is secured**, so a client can never be charged the
  discounted remainder without actually receiving the discount.
- **The app never names the split.** It sends `displayedTotalCents` and `displayedCreditCents`;
  the server recomputes both from the live balance and refuses `409 credit_changed` with fresh
  figures. A balance spent on another device between screens re-renders rather than silently
  charging a different number.
- **Two paths because Stripe rejects a $0 PaymentIntent:** credit covering the whole total goes
  to `book-with-credit` (one call, no sheet); partial credit goes through the existing two-call
  card flow with the sheet charging the remainder.
- **`createPassAfterCharge` would otherwise deduct the credit twice.** It calls
  `services/actions/deduct-credit.js` whenever `studio_credits_spent > 0`, and that helper
  decrements the balance itself, read-then-write. The `creditAlreadyClaimed: true` opt-out skips
  the internal deduction while still writing the transaction columns; the caller writes the
  ledger row via `deduct-credit-new.js` using the before/after figures the atomic claim returned.
- **Row shapes.** `passes.passValue` stays the FULL pre-tax subtotal — the client paid full value,
  it merely came from two sources, and an early drop returns a class, not part of one. The
  PURCHASE transaction carries `amount` = full total, `studio_credits_spent` = credit applied,
  `amount_charged` = **the card portion only**. The credit half contributes $0 to lifetime volume
  because that dollar was counted when the credit was bought.
- **A ledger write that fails after a successful claim logs loudly and ops-alerts, and never
  unwinds the booking.** The class is paid for and on the roster.

### 7.3 Why `services/shared/checkout-credit-only.js` was not reused

Recorded so nobody proposes it again. Two problems the mobile path exists to avoid:

1. **It takes the price from the request body** — `const { amountToCharge } = howtopay`. The
   client tells the server what the class costs and the server deducts that much credit. Same
   hole as `charge-card.js:218` billing `req.body.total`. It does guard the balance, so it cannot
   overspend, but a client could under-report the price and book a $40 class for $5 of credit.
2. **The balance decrement is read-then-write.** It reads `credit.credit`, computes the
   difference in JS, and writes it back. Two devices booking at once both read $40 and both
   write $0, so $40 of credit buys $80 of classes. `claim-credit.js` uses a conditional UPDATE —
   `SET credit = credit - :amount WHERE id = :id AND credit >= :amount` — because the UPDATE is
   the lock and a JS comparison is not.

Also note `services/actions/deduct-credit-new.js` does **not** decrement the balance at all — it
writes the ledger row and flips the transaction status, taking before/after as arguments. The
caller owns the decrement. Do not assume that helper protects anything.

`deduct-credit.js`'s read-then-write race is live on every existing credit path (widget class
checkout, package purchases). Routing around it is in scope; changing it is not — that alters
widget behaviour and belongs in its own pass.

---

## 8. Definition of done

Before this branch is offered for merge to staging:

- [ ] `npm run typecheck` clean, `npx jest` green (baseline: 28 suites, 787 tests).
- [ ] Every new dibs-api endpoint has tests for the refusal paths, not just the happy path —
      `commitment_not_met`, `credit_changed`, `price_changed`, `class_unavailable_in_app`, late
      drop, cross-user 404.
- [ ] Each of the seven items is its own commit, revertable independently.
- [ ] Walked once on a device, for real, per §0.2: book → drop → see the pass come back → see the
      drop in past payments. Mocked tests validate the functions you point them at; they cannot
      discover the one you didn't.
- [ ] **Version gate proved in BOTH directions on a device**: a build below `minimumBuild` is
      blocked, and a **deliberately broken endpoint** (500 / unreachable / garbage body) lets the
      app straight through. The fail-open half is the one that matters and it is the one no test
      run in CI will notice.
- [ ] **Virtual gate proved from the widget's side too** — the same class still lists and still
      books on the web with `show_virtuals_on_app` false. A gate that quietly took the widget with
      it would cost studio 88 real bookings.
- [ ] **A legacy class (`is_virtual` NULL) still appears in the app.** This is the `IS NOT TRUE`
      check from §5.3, and getting it wrong returns an empty schedule with no error anywhere.
- [ ] The shared `.claude/CLAUDE.md` updated in the same branch for: the new mobile drop endpoint,
      `cancellation_source = 'mobile_self_service'` in the actor-display table, the fact that
      commitment enforcement now lives on the server, the `show_virtuals_on_app` fail-closed
      inversion, and the `mobile_app_releases` table. Doc back-flow is blocking, and a plan file
      is not a substitute.

### 8.1 Known dibs-api gaps this plan closes as a side effect

Worth naming in the commit messages — they are pre-existing production holes, not new work:

| Route | Gap | Closed by |
|---|---|---|
| `POST /stripe/cancel-renewal` | unauthenticated; `userid` from body | §2.1 |
| `POST /transactions/:type` | unauthenticated payment history | §3.1 |
| `cancel-renewal.js` | commitment computed for audit, never enforced | §2.2 |

---

## 9. Working agreements

- **Comment the traps, not the code.** A comment earns its place when it stops someone
  re-tripping something ("`[Op.or]` must be an array — a duplicate key silently drops the
  branch"). The 10–20 line header essays restating doctrine that already lives in the shared
  `CLAUDE.md` cost more to maintain than they return. Target: a two-line file header, and inline
  comments only where correct code looks wrong.
- **No abstraction ahead of a second caller.** One hook, one owner, no factory until something
  else actually needs it.
- **Findings over prose in plan docs.** v1's `checkout-credit-only.js` analysis is the model —
  concrete, verifiable, actionable. Restating decisions already made is not.
- **Verify before claiming.** Split what you VERIFIED (file read, test run, flow executed) from
  what you INFERRED, and aim your own critique at the inferences.
- **After each item, answer both:** what did this make unreachable, and what did it make
  *reachable* — and what runs it now. The second question is the one that finds the bug in the
  file nobody edited.
