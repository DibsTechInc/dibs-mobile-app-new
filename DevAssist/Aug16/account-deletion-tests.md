# In-App Account Deletion — Test Plan

Apple Guideline 5.1.1(v): an app offering account creation must offer account deletion in-app.
Backend: `POST /api/v2/widget/delete-account` (dibs-api, `services/widget/delete-account.js`).
App: Account → "Delete account" row → typed-DELETE sheet (`DeleteAccountSheet`).

## Scenarios

### 1. Happy path — a client with no live entitlements
**Steps:** Sign in as a throwaway test client (create one in the app first) with no membership and
no recurring subscription. Account → Delete account → type DELETE → Delete my account.
**Success criteria:**
- [ ] Lands on Home, signed out; drawer shows guest items
- [ ] Signing in again with the old email/password fails (login removed)
- [ ] `dibs_users` row: `deletedAt` set, email `deleted-<id>@deleted.invalid`, name "Deleted
      Account", phone/birthday/uid/password/emergency contacts null
- [ ] Transactions, passes, attendees rows for the user still exist untouched
- [ ] Ops email received; goodbye email received at the OLD address
- [ ] Studio-admin client profile still shows the financial history (money reads are
      `paranoid: false` by design), name shows as Deleted Account

### 2. Blocked — live membership
**Steps:** As a client with an active (un-cancelled) membership, attempt deletion.
**Success criteria:**
- [ ] Sheet shows the server's sentence about cancelling the membership first
- [ ] "See my passes" routes to the wallet; nothing was deleted (sign-in still works)
- [ ] After cancelling the membership (canceledAt set), deletion proceeds without waiting for
      period end

### 3. Blocked — live recurring subscription (active or paused)
- [ ] Same shape as scenario 2 with a `subscriptions.status` of `active` or `paused`

### 4. The typed confirmation
- [ ] Button disabled until DELETE typed (case-insensitive); backdrop dismiss disabled while working

### 5. Failure honesty
- [ ] With the API unreachable, the sheet shows a retriable error and the account is intact
- [ ] A retry after a partial failure (Firebase deleted, scrub failed) completes cleanly

## Automated
- `dibs-api/services/widget/__tests__/delete-account.test.js` — 13 tests: both gates (incl.
  canceledAt-null predicate and paused-counts), Firebase-before-scrub ordering, widget-project
  auth, user-not-found tolerated, email-desync double delete, real-failure abort with no scrub,
  full scrub field list, post-response email failures never colour the deletion, no double answer.

## Manual required (can't be automated here)
- Scenario 1 end-to-end on staging with a real throwaway account (verifies the real Firebase
  project — the mocked suite cannot catch a wrong-project `getAuth()`, per the two-projects trap)
- Apple reviewer path: create account → delete account, both purely in-app
