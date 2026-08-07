# Environments — where the app points, and what is actually alive

Verified empirically 2026-08-04, **amended 2026-08-06 — a remote staging backend DOES exist.**
Supersedes guesses in `MOBILE_MASTER_PLAN.md` §0.5-B. Re-verify before trusting: hosts move (the
Railway/Crunchy cutover of 2026-07-21/22 invalidated everything written before it).

## ✅ Remote staging — `https://dibs-api-staging-production.up.railway.app` (added 2026-08-06)

Named by Alicia; probed the same day. **This is the dev target from now on**, and it closes
§0.5-B. The 2026-08-04 conclusion below ("there is no remote staging backend today") was wrong —
the Heroku staging app is dead, but dibs-api staging moved to Railway with the rest of the stack.

| Probe | Result |
|---|---|
| `GET /api/v2/widget/is-live/210` | `{"live":true,"widgetOpenStyle":"full-page"}` |
| `POST /api/v2/widget/get-basic-config {88}` | real config, `America/New_York`, USD |
| `POST /api/v2/get-stripe-publishable-key` | `pk_test_51Rqmyf…` — **SANDBOX** ✅ |
| `POST /api/v2/get-passes {88, 2502}` | **two real passes**, `is_placeholder` present |
| `POST /api/v2/stripe/get-all-payments {210, 2502}` | 5 cards, `livemode: false`, `lookupFailed: false` |

**Why this matters more than "a URL that works":**

- **It has the data the local restore does not.** Staging DB (`STAGING_DATABASE_URL` in dibs-api's
  `.env`, Crunchy `p.ojgirkbmfnchhlgw24wwbhuxae…`) holds **87,222 `passes` and 594,231
  `dibs_transactions`**, against **0 and 0** locally. The pass list and everything downstream of it
  are exercisable here and nowhere else.
- **It is a DIFFERENT database from the local restore.** Same user, different numbers — userid 2502
  has $862 credit at studio 210 on staging and $786 locally. Never reason across the two.
- **It runs in dev mode.** `isDevelopment` is true there (it resolved `stripeid_test`, not
  `stripeid_prod`), so it reads the `*_test` Stripe columns AND uses a sandbox key — the pair is
  consistent, which is what makes card work safe. Do not assume; re-check after any redeploy, since
  a test key with prod account ids is the exact trap in `.claude/CLAUDE.md` § "Stripe IDs — Dev vs
  Prod".
- **The deployed build carries the `get-passes` fix** (`is_placeholder` is in the response).

**Test client:** `alicia.ulin@gmail.com` = **userid 2502**. Best studio to point at is **88
(everyday-ballet)** — she holds two live passes there (a 1-use `[Admin] Comp Session` and a
10-class package with 9 left) and none at 210.

```bash
# Point the app at staging
EXPO_PUBLIC_API_URL=https://dibs-api-staging-production.up.railway.app/api/v2 \
  STUDIO_SLUG=everyday-ballet npx expo start
```

`EXPO_PUBLIC_API_URL` wins over `studio.json`'s `api.url` in development (`app.config.ts:209`), and
being HTTPS it needs no ATS exception — so unlike the local API it is reachable from a physical
device off the LAN. That also answers open question 9 (off-laptop backend for device testing).

## Probe results (2026-08-04) — the local/production half still holds

| Host | `POST /api/v2/widget/get-basic-config {dibsStudioId:226}` | Verdict |
|---|---|---|
| `https://api.dibsonline.com` | **200**, real studio config | **LIVE — production** (Railway alias) |
| `http://localhost:3001` | **200**, real studio config | **LIVE — local dibs-api against local `dibs` Postgres** |
| `https://dibs-api-staging.herokuapp.com` | 503 Heroku "Application Error" | **DEAD** |
| `https://dibs-api-v2.herokuapp.com` | 503 Heroku "Offline for Maintenance" | **DEAD** (legacy prod, retired at cutover) |

~~**There is no remote staging backend today.**~~ **Wrong — corrected 2026-08-06, see above.** The
*Heroku* staging app is dead, but dibs-api staging exists on Railway. The lesson worth keeping:
probing the hosts named in an old doc and concluding "none of these answer" is not the same as
establishing that a thing does not exist. Ask.

Local dibs-api (`http://localhost:3001/api/v2`) remains a valid target — it is what the widget's
own dev `.env` uses — but it is now the *second* choice, because its database has no passes and no
transactions.

## Stripe key environment — verified, works as the plan assumed

| API host | `POST /api/v2/get-stripe-publishable-key` returns |
|---|---|
| localhost:3001 | `pk_test_51Rqmyf…` — **sandbox** ✅ |
| api.dibsonline.com | `pk_live_A88bTo…` — live |

§0.5-E is satisfied: the app never hardcodes a key, and pointing `EXPO_PUBLIC_API_URL` at the local
API yields the sandbox key automatically. All four pilot/reference studios (88, 210, 226, 263) have
`stripe_account_id_test` populated in the local DB, so connected-account checkout is exercisable in
sandbox.

## Reaching the local API from a simulator / emulator / device

`EXPO_PUBLIC_API_URL` differs by target — this is why it is an env var and not a constant:

| Target | Value |
|---|---|
| iOS simulator | `http://localhost:3001/api/v2` |
| Android emulator | `http://10.0.2.2:3001/api/v2` (the emulator's alias for the host loopback) |
| Physical device on the same Wi-Fi | `http://<laptop-LAN-IP>:3001/api/v2` |
| Production white-label build | `https://api.dibsonline.com/api/v2` (from `studio.json` `api.url`) |

iOS blocks cleartext HTTP by default. `app.config.ts` adds an ATS localhost exception in dev builds
only; production builds are HTTPS-only and carry no exception.

## Local backend caveats an executor must know

- The local `dibs` Postgres is a **restore of production**. Real client rows, real emails. Writes are
  local-only and harmless, but do not treat the data as synthetic — do not mass-mutate it, and never
  point a local job at a remote DB.
- The local API is a *separate process Alicia may or may not have running.* Before blaming the app
  for a network error, check `lsof -nP -iTCP:3001 -sTCP:LISTEN`.
- Auth is NOT local: Firebase is the shared hosted `dibs-studio-clients` project (§0.5-C). Signing in
  against a local API still authenticates against real Firebase, and dibs-api resolves the user by
  `du_firebase_uid` with email fallback. So a test login is a **real** Firebase credential.

## Firebase client config (§0.5-C — RESOLVED)

Project `dibs-studio-clients` — the same project the widget uses, per the plan's §3.3 decision.
Values lifted from `dibs-widget-new/.env` (`REACT_APP_FIREBASE_*`) into this repo's `.env`
(gitignored); `.env.example` documents the variable names. These are client-side identifiers that
already ship in the public widget bundle — they are not secrets — but they stay out of git anyway so
there is exactly one place to change them.

⚠️ Two Firebase projects exist and share nothing (`dibs-admin-users` for studio employees,
`dibs-studio-clients` for clients). The mobile app is a **client** surface: `dibs-studio-clients`
only. See shared `CLAUDE.md` § "There are TWO Firebase projects."
