# Environments — where the app points, and what is actually alive

Verified empirically 2026-08-04. Supersedes guesses in `MOBILE_MASTER_PLAN.md` §0.5-B.
Re-verify before trusting: hosts move (the Railway/Crunchy cutover of 2026-07-21/22 invalidated
everything written before it).

## Probe results (2026-08-04)

| Host | `POST /api/v2/widget/get-basic-config {dibsStudioId:226}` | Verdict |
|---|---|---|
| `https://api.dibsonline.com` | **200**, real studio config | **LIVE — production** (Railway alias) |
| `http://localhost:3001` | **200**, real studio config | **LIVE — local dibs-api against local `dibs` Postgres** |
| `https://dibs-api-staging.herokuapp.com` | 503 Heroku "Application Error" | **DEAD** |
| `https://dibs-api-v2.herokuapp.com` | 503 Heroku "Offline for Maintenance" | **DEAD** (legacy prod, retired at cutover) |

**There is no remote staging backend today.** The Heroku staging app that §0.5-B assumed still
exists does not respond. Two consequences:

1. The mobile dev loop targets **local dibs-api** (`http://localhost:3001/api/v2`) — the same thing
   the widget's own dev `.env` does (`REACT_APP_BASE_URL='http://localhost:3001/api/v2'`).
2. Anything that needs a backend reachable from a device that is not this laptop (P7 push testing
   from a phone off the LAN, TestFlight betas in P10) needs a decision from Alicia: stand up a
   Railway staging service, or accept LAN-only device testing until launch.

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
