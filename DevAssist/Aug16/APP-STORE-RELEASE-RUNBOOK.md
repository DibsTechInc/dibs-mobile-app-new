# Everyday Ballet 2.0.0 — App Store Release Runbook

**Written 2026-08-16.** Self-contained: everything remaining between here and "Waiting for
Review," in order. Ships as an **update** to the existing listing under Dibs Technology Inc
(bundle `com.ondibs.everydayballetapp`, live 1.6 → this is 2.0.0, buildNumber 1).

## Status snapshot

| Item | State |
|---|---|
| Release validator (`validateStudioForRelease`) | ✅ **PASSES** — team id `R8RUP42952`, merchant id, privacy flag all set |
| Privacy policy | ✅ Live at `https://www.dibsonline.com/privacy-policy` (widget SPA route; renders in-browser) |
| Live `payment_intent.succeeded` webhook | ✅ Created (Alicia) — secret in `STRIPE_PAYMENT_INTENT_WEBHOOK_SECRET` on prod dibs-api |
| In-app account deletion (Apple 5.1.1(v)) | ✅ Built both sides — needs one staging test (see §3) |
| Apple Pay app wiring | ✅ Done — needs the merchant ID + certificate created (§2) |
| Clarity | ✅ Live for everyday-ballet (project `y3cpunfvqj`) |
| dibs-api prod deploy | ⬜ §1 — the critical path |
| Merchant ID + Apple Pay certificate | ⬜ §2 |
| Staging test of account deletion + cancel emails | ⬜ §3 |
| Prod smoke test | ⬜ §4 |
| App Store Connect housekeeping | ⬜ §5 |
| Build → TestFlight → submit | ⬜ §6 |
| Post-approval version gate | ⬜ §7 |

**Unpushed/undeployed work lives on:** `dibs-mobile-app` branch `feature/card-booking`
(all app work); `dibs-api` branch `feature/mobile-credit-and-membership` (drop notifications,
class_drop credit label, **account deletion endpoint**).

---

## §1 — dibs-api production deploy (critical path)

The store build points at `https://api.dibsonline.com/api/v2` (prod). Everything tested so far
rode staging.

1. Merge `feature/mobile-credit-and-membership` → `staging` → whatever prod deploys from, push.
2. **Deploys do NOT run migrations.** Against the Crunchy prod cluster check:
   ```sql
   SELECT max(name) FROM sequelize_migrations;
   ```
   and diff against `dibs-api/database/migrations/` at the deploy ref. Apply anything pending
   (your other workstreams may have some too). Specifically confirm:
   ```sql
   SELECT * FROM mobile_app_releases WHERE studio_slug = 'everyday-ballet';
   ```
   — the row should exist at latest_build 0 / minimum_build 0 (silent).
3. Route-existence spot check (401 = live, 404 = missing — no token needed):
   ```bash
   for p in checkout/class/book-with-pass checkout/class/drop widget/account-activity \
            widget/upcoming-payments widget/delete-account; do
     echo -n "$p -> "; curl -s -o /dev/null -w "%{http_code}\n" -X POST \
       https://api.dibsonline.com/api/v2/$p -H 'Content-Type: application/json' -d '{}'
   done
   ```

## §2 — Apple Pay merchant ID + certificate (~15 min)

1. developer.apple.com → Identifiers → **+** → **Merchant IDs** →
   identifier **`merchant.com.ondibs.everydayballetapp`** (exactly — it is already baked into
   the app entitlement), description "Everyday Ballet".
2. **Dibs platform Stripe account, live mode** → dashboard.stripe.com/settings/ios_certificates
   → **Add new application** → download **Stripe's CSR**.
3. Apple tab → your merchant ID → **Apple Pay Payment Processing Certificate** → Create →
   upload **Stripe's CSR** (never one you generate — Stripe's #1 troubleshooting item) →
   download the `.cer` → upload it back on the Stripe page.
4. Nothing app-side — EAS syncs the capability at build time. Testing note: Apple Pay cannot use
   Stripe test cards; test with a **real card in the Wallet** against the staging build (Stripe
   recognizes test keys and never charges it).

## §3 — Staging tests still owed

- **Account deletion end-to-end** (`DevAssist/Aug16/account-deletion-tests.md`): create a
  throwaway client in the app → delete it (type DELETE) → old login fails, lands home. Also try
  it as a client WITH a live membership → refusal routes to the wallet. This is the one test
  mocks can't cover (the wrong-Firebase-project trap).
- **Cancel confirmation email/SMS** (needs the staging redeploy): drop a class → email + text
  arrive naming what came back.

## §4 — Prod smoke test (after §1)

In the app pointed at prod: book a cheap real class with a real card → confirmation email/SMS →
cancel → cancellation email + credit. Verify the Stripe webhook delivery log shows the
`payment_intent.succeeded` event accepted (200).

## §5 — App Store Connect housekeeping

- **App Privacy answers** (now collecting via Clarity): Contact Info (name, email, phone) ·
  Identifiers (user ID) · Financial Info (purchase history; card handling is Stripe's) ·
  Usage Data (product interaction). All "linked to you"; **no tracking** (Clarity is
  first-party analytics — no ATT prompt).
- **Screenshots + description** — the 2021 listing looks nothing like 2.0.0.
- **Reviewer demo account**: a test client at studio 88 preloaded with a comp/pass, credentials
  in the review notes, plus a note that bookings are real in-person classes. Reviewers WILL
  sign in, book, and look for account deletion (it's in Account, below Sign out).

## §6 — Build → TestFlight → submit

```bash
STUDIO_SLUG=everyday-ballet eas build --profile production --platform ios
eas submit --platform ios
```

- First run: `eas credentials` walks through Apple auth for the Dibs team (per-project, by
  design — see eas.json comment).
- The production profile runs `validateStudioForRelease` — currently PASSING.
- **Bump `store.buildNumber` in studio.json by hand for EVERY upload** (EAS can't write it back
  through the dynamic config). It is 1 now — correct for the first upload.
- EAS cloud prebuilds fresh, so the local one-studio `ios/` hazard doesn't apply.
- TestFlight: you + Tiekka's staff, against prod. Then submit **with phased release ON**.

## §7 — After approval

```sql
UPDATE mobile_app_releases SET latest_build = 1 WHERE studio_slug = 'everyday-ballet' AND platform = 'ios';
```
Raise `minimum_build` only **days later**, never at release — phased rollout means not everyone
can download the new build on day one, and the gate must never demand a build people can't get
(`.claude/CLAUDE.md` § version gate; column names worth re-checking against the table before
running).

## Reference

- Release validator + config: `whitelabel/schema.ts`, `whitelabel/studios/everyday-ballet/studio.json`
- Store runbook context: `MOBILE_MASTER_PLAN.md` §0.1, §6.3
- Account deletion: `dibs-api/services/widget/delete-account.js` + `src/features/account/DeleteAccountSheet.tsx`
- Apple Pay wiring: `src/features/payments/stripeSession.ts#applePaySheetParams`
- Version gate: `dibs-api` `GET /api/v2/app-release/:studioSlug`, `src/domain/app-release/gate.ts`
