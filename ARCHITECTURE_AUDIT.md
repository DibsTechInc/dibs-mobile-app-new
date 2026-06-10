# Dibs Mobile App — Architecture Audit & Rebuild Recommendation

**Date:** June 10, 2026
**Auditor role:** Senior mobile architect
**Scope:** Full audit of `dibs-mobile-app` (legacy client app) — structure, dependencies, build, auth, API, navigation, state, store readiness, security, maintainability.

---

## 1. Executive Summary

**Verdict: Rebuild. This is not a close call.**

The legacy codebase is a 2019-era Expo SDK 36 / React Native 0.61 / React 16 application. It cannot be submitted to either app store today, and the gap between its toolchain and the current ecosystem is so large that an incremental upgrade would mean traversing ~20 Expo SDK major versions, the React Navigation v4→v7 rewrite, the React 16→19 migration, the new RN architecture (Fabric/TurboModules), and a complete replacement of its build/publish pipeline (`expo publish` and `expo build:ios` no longer exist as services). Each of those steps alone is a breaking migration. Together they cost more than a rebuild and produce a worse result.

**Can it be modernized?** Technically anything can. Practically: the upgrade path requires touching every file anyway — components are all class-based with `connect()` HOCs, navigation APIs are gone, the styling and config systems are deprecated. You'd pay rebuild-level cost and still own untyped JavaScript with zero test coverage.

**What makes the decision easy:** the genuinely valuable part of this codebase is not its UI or its plumbing — it's the **domain logic** (purchase breakdown math, pass eligibility rules, promo handling, spot booking). That logic ports cleanly into a new TypeScript codebase as pure functions. Everything else is replaceable commodity.

A `PLAN.md` already exists in `.claude/` declaring a rebuild with "final" decisions. This audit **confirms the rebuild decision** but flags that the plan's version targets have gone stale (it pins Expo SDK 52; current is SDK 56, RN 0.85, React 19.2) and that its auth assumption needs verification — details in §5.

---

## 2. Current Architecture Assessment

### Strengths (worth acknowledging — and harvesting)

- **Financial math is done right.** `app/selectors/CartSelectors/PurchaseBreakdown/index.js` (479 lines) uses Decimal.js and implements the full pricing waterfall: subtotal → promo discount → tax → studio credits → RAF credits → total. This encodes years of business rules.
- **Pass eligibility logic is sophisticated.** `app/selectors/UserSelectors/Passes/index.js` (221 lines) handles expiry, daily usage limits on unlimited passes, autopay edge cases, and series-type restrictions.
- **Clean API wrapper.** `app/util/dibs-fetch.js` does auth-header injection, automatic token refresh, and network pre-checks. The pattern is sound.
- **Correct PCI posture.** Card data is tokenized client-side; only a token reaches the Dibs API. Frontend never creates PaymentIntents.
- **Real whitelabel mechanism.** Per-studio `app_json` / `app_config_json` columns in `dibs_studios` + S3 assets, injected at build time by `bin/publish.js`. The *concept* is exactly right; the implementation rides on a dead Expo classic-publish pipeline.
- **Domain-organized Redux** with `redux-actions` + `reselect` — disciplined for its era.

### Weaknesses

- **Untyped JavaScript everywhere.** 201 files, zero TypeScript. The most valuable logic (pricing) is also the most fragile to modify.
- **All class components** coupled to Redux via `connect()`. No hooks. UI cannot be salvaged incrementally.
- **Server state lives in Redux** with manual fetch/refresh logic — a whole category of caching/staleness bugs that TanStack Query eliminates.
- **One test.** A single snapshot test of `App.js`. Effectively zero coverage on financial logic.
- **No deep linking.** No push notifications. Both are table stakes for a loyalty/engagement app.
- **No CI.** `.github/` contains only a copilot-instructions file. Builds are a manual `node bin/publish.js -s <studio>` ritual.

### Risks (of keeping it alive)

- **It is unshippable.** Any store-policy nudge, OS deprecation, or critical dependency CVE has no remediation path — the toolchain to rebuild it no longer exists as a hosted service.
- **Key-person/process risk:** the publish flow depends on undocumented per-studio DB rows + S3 assets + a developer laptop.
- **Legacy data fingerprint:** the app writes `source='zf'` on attendees/transactions (per platform docs); the rebuild must write `'dibs'` — any analytics keyed on source will shift.

---

## 3. Dependency Analysis

### Headline versions (all end-of-life)

| Dependency | Pinned | Current (June 2026) | Gap |
|---|---|---|---|
| expo | ~36.0.2 (2019) | SDK 56 (May 2026) | ~20 major versions |
| react-native | SDK-36 tarball (≈0.61) | 0.85 | ~24 minor versions incl. New Architecture |
| react | 16.12 | 19.2 | 3 majors (hooks-era → concurrent → compiler) |
| react-navigation | v4 + 3 companion pkgs | v7 / Expo Router | Full API rewrite; v4 long dead |
| react-native-reanimated | 1.4 | 3.x+ | Complete rewrite (worklets) |
| styled-components | 4.4 | n/a in plan | Replaced by NativeWind |

### Unsupported / dead libraries

- `expo publish` + `sentry-expo` + classic release channels — **the entire OTA/publish mechanism was removed by Expo** (replaced by EAS Update). `bin/publish.js` is built on a service that no longer exists.
- `react-native-credit-card-input`, `react-native-gifted-form`, `react-native-swipeable`, `react-native-settings-list`, `rn-sliding-up-panel` — abandoned, incompatible with current RN.
- `stripe-client` (legacy tokens API) — superseded by `@stripe/stripe-react-native` and PaymentMethods.
- `react-native-tab-view` pinned to a **GitHub branch** of react-navigation's repo — unreproducible build input.
- `moment` — in maintenance mode; replace with `date-fns` or `dayjs` in the rebuild.
- Oddities: `aws-sdk`, `pg`, `sequelize` as devDependencies of a *mobile app* (the publish script queries the production DB directly from a laptop — a practice to retire).

### Breaking-upgrade concerns (why incremental is a trap)

An in-place upgrade would have to serially cross: SDK 36→44 (deprecated registry endpoints), 44→50 (config plugin overhaul, classic build removal), 50→52+ (New Architecture default), React 16→18→19 (rendering semantics), Navigation v4→v5 (declarative API rewrite — every screen touched) →v6→v7, Reanimated 1→2→3 (rewrite), and styled-components on old RN APIs. **Every screen, every action, every config file gets rewritten anyway.** That's a rebuild with extra steps, sequenced in the most painful order.

---

## 4. Store Readiness (both stores: hard fail)

| Check | Current value | 2026 requirement | Status |
|---|---|---|---|
| iOS deployment target | **8.0** | ≥ 12–15.1 (effectively; Xcode 16+ builds required) | ❌ |
| iOS bundle ID | `org.reactjs.native.example.*` template | Real ID per app | ❌ |
| tvOS targets in project | Present | Unnecessary clutter | ⚠️ |
| Android targetSdkVersion | **22** (Android 5.1, 2015) | **35** now; **36 from Aug 31, 2026** | ❌ |
| Android compileSdkVersion | 23 | 35+ | ❌ |
| 64-bit (arm64-v8a) | **Missing** (armeabi-v7a + x86 only) | Required since 2019 | ❌ |
| Gradle | 2.2.3 (2015) | 8.x | ❌ |
| Signing | Debug keystore + default passwords committed in `android/keystores/`; no release keystore in repo | EAS-managed credentials | ⚠️ |
| CI/CD | None | — | ❌ |

Note the August 31, 2026 deadline: anything shipped after that must target API 36. The rebuild should target API 36 from day one rather than 35.

---

## 5. Security Findings

1. **Auth tokens in plain AsyncStorage** (unencrypted). New app: `expo-secure-store` (Keychain/Keystore). *Medium severity.*
2. **Auth architecture mismatch to resolve before building:** the legacy app uses a **custom JWT** flow (`/api/user/login` + `/api/user/refresh-token`), while `PLAN.md` and the platform docs assume **Firebase Auth** (which the widget and admin use). These are different identity systems against the same backend. Decision needed: the rebuild should standardize on Firebase Auth to match the rest of the platform — but verify which dibs-api customer-facing routes accept Firebase tokens vs. legacy JWTs before Phase 1. This is the single biggest unverified assumption in the existing plan.
3. **Debug keystore with default credentials committed.** Low risk (debug-only), but delete it; Gradle generates one.
4. **Live Stripe publishable key in `README.install.md`.** Publishable keys are public by design, but a setup doc shouldn't normalize pasting live keys. Scrub it.
5. **Publish scripts hold prod DB + AWS credentials on dev machines** via `.env`. The EAS-based replacement eliminates this pattern.
6. No hardcoded secrets in app source. PCI posture is correct.

---

## 6. Rebuild: What to Keep, What to Discard

### Keep (port as typed, pure, tested modules)

| Asset | Source | Why |
|---|---|---|
| Purchase breakdown waterfall | `selectors/CartSelectors/PurchaseBreakdown/index.js` | Years of pricing rules; port to pure TS functions with golden-master tests **first** |
| Pass eligibility rules | `selectors/UserSelectors/Passes/index.js` | Complex entitlement logic (daily limits, autopay edge cases) |
| Promo code semantics | `actions/PromoCodeActions/`, `constants/PromoCodeConstants/` | FREE_CLASS / PERCENT_OFF / CASH_OFF / GIFT_CARD / ADD_CREDITS / FIXED_PRICE behaviors |
| Cart action semantics | `actions/CartActions/index.js` | Quantity caps, expired-event pruning, pass re-evaluation on user change |
| Spot booking model | `SpotBookingPage` actions/selectors | Room/spot grid domain model |
| RAF flow | `actions/FriendReferralsActions/` | Simple, working API contract |
| API contract knowledge | `util/dibs-fetch.js` + all action files | The de-facto documentation of every customer-facing endpoint |
| Whitelabel **concept** | `bin/` + DB columns | Per-studio config from DB/S3 → reimplement as `app.config.ts` + EAS build profiles |

### Discard

- All of `app/components/`, `app/router/`, `app/theme/`, `App.js` — UI, navigation, styling rebuilt from scratch.
- All Redux wiring (reducers/store/connect) — replaced by Zustand + TanStack Query.
- `ios/` and `android/` directories entirely (including tvOS targets) — Expo prebuild regenerates native projects.
- `bin/publish.js`, `bin/download-assets.js`, classic release channels, sentry-expo — replaced by EAS Build/Submit/Update.
- The `dibs_mobile_app_new` partial rewrite (referenced in PLAN.md, not in this repo): treat as reference only unless audited separately; do not inherit its scaffold without inspection.

---

## 7. Proposed Modern Architecture

The existing `PLAN.md` got the shape right. Updated and confirmed targets:

| Layer | Choice | Notes vs. PLAN.md |
|---|---|---|
| Framework | **Expo SDK 56** (RN 0.85, React 19.2), New Architecture | PLAN.md pinned SDK 52 — stale by 4 majors. Pin 56 now; adopt each SDK within a quarter of release thereafter. |
| Language | TypeScript, strict | Unchanged |
| Navigation | **Expo Router** (version bundled with SDK 56) | File-based routing, deep linking built-in — deep links matter for loyalty pushes ("you unlocked a reward → tap → reward screen") |
| Server state | **TanStack Query v5** | All API data: schedules, passes, bookings, credits |
| UI state | **Zustand** | Cart, auth session, theme only. Keep it small. |
| Styling | **NativeWind v4** + design-token layer | Tokens must support per-studio theming (whitelabel) — studio color is data, not constant |
| Auth | **Firebase Auth** + `expo-secure-store`; biometric unlock via `expo-local-authentication` | Resolve §5.2 mismatch first |
| Payments | `@stripe/stripe-react-native` | PaymentSheet; backend creates PaymentIntents on connected accounts (unchanged platform rule); app writes `source='dibs'` |
| Push | `expo-notifications` (FCM/APNs) | Core loyalty channel, not an add-on — milestone/reward notifications are the product |
| Errors/analytics | Sentry (`@sentry/react-native`) + Firebase Analytics | |
| API layer | Typed client: thin fetch wrapper (port dibs-fetch semantics) + zod-validated response schemas per endpoint | Schemas double as living API documentation |

### Testing strategy

1. **Golden-master unit tests on ported domain logic first.** Run legacy PurchaseBreakdown selectors against fixture carts, snapshot outputs, assert the TS port matches — *before* building any UI on top.
2. Jest + React Native Testing Library for hooks/components.
3. Maestro for E2E happy paths (login → book → cancel; buy package; redeem pass).
4. CI gate: typecheck + lint + unit tests on every PR.

### CI/CD & store deployment

- **EAS Build** with build profiles: `development`, `preview`, `production-dibs`, `production-<studio>` per whitelabel. Per-studio branding via dynamic `app.config.ts` reading a studio config (the legacy DB-driven concept, modernized).
- **EAS Submit** for both stores; **EAS Update** for OTA JS fixes (respecting store policies).
- GitHub Actions: PR checks always; EAS build on tags; internal distribution (TestFlight / Play internal track) per merge to main.
- Credentials managed by EAS — no keystores in git, no prod DB access from laptops.
- Android: target API 36 from day one (Aug 31, 2026 requirement lands mid-build otherwise). iOS: build with current Xcode via EAS.

---

## 8. Proposed Project Structure

```
dibs-mobile-app/
├── app/                        # Expo Router routes only — no logic
│   ├── (auth)/                 # welcome, login, signup, reset
│   ├── (app)/
│   │   ├── (tabs)/             # home (dashboard), schedule, activity, profile
│   │   ├── studio/[id]/        # studio profile, schedule, packages
│   │   ├── class/[id].tsx      # detail + booking
│   │   ├── checkout.tsx
│   │   └── rewards/            # milestones, credits, RAF
│   └── _layout.tsx
├── src/
│   ├── domain/                 # ⭐ ported business logic — pure TS, zero RN imports
│   │   ├── pricing/            # purchase breakdown waterfall + tests
│   │   ├── passes/             # eligibility engine + tests
│   │   ├── promos/
│   │   └── spots/
│   ├── api/                    # typed client, zod schemas, TanStack Query hooks
│   ├── stores/                 # zustand: cart, session, theme
│   ├── components/             # ui/ (primitives) + feature components
│   ├── theme/                  # design tokens, per-studio theming
│   └── lib/                    # firebase, stripe, notifications, analytics
├── config/studios/             # whitelabel configs consumed by app.config.ts
├── e2e/                        # maestro flows
└── app.config.ts               # dynamic config (branding per build profile)
```

The `src/domain/` layer is the heart of the rebuild: pure, typed, fully tested, importable by anything (including a future web client).

---

## 9. MVP Scope

Guided by the product thesis — *loyalty platform that includes booking, not a booking app with loyalty* — but honest about sequencing: **booking is the infrastructure loyalty rides on**, and the backend's loyalty surface area (milestones, streaks, cross-business rewards) doesn't exist yet. The MVP is the smallest app a studio would proudly hand to clients, instrumented so loyalty features land on a live audience.

**In scope (MVP):**

1. Auth — Firebase login/signup, biometric unlock, secure token storage
2. Home dashboard — *the customer's* view: next upcoming booking, pass/credit balances, class-count progress ("Class 47 — 3 to your 50th 🎉" — derivable from existing attendee data, no new backend)
3. Schedule browsing + class detail (single studio for whitelabel; favorites for the Dibs app)
4. Booking + checkout — pay with pass / credits / card (PaymentSheet), promo codes
5. My bookings — upcoming + past, cancel within policy
6. Packages/passes — browse, purchase, view entitlements
7. Push notifications — booking confirmations/reminders + the **first surprise-and-delight moment: milestone celebration push**. One genuinely delightful moment in V1 beats five mediocre features.
8. Profile — payment methods, account, settings

**Explicitly out of MVP:** cross-business loyalty network, partner offers, community features, challenges, recurring-appointment subscription management (web widget already handles it), tablet/watch, spot booking (V1.1 unless an anchor studio requires it — it's ported logic, low risk to add).

The class-count milestone + celebration push is the loyalty wedge: cheap to build, uses existing data, and it's the moment that makes a customer say "Dibs noticed."

---

## 10. Implementation Plan

| Phase | Scope | Complexity | Risk | Notes |
|---|---|---|---|---|
| **0. Foundations** (~1–2 wks) | Resolve auth question (§5.2); Expo SDK 56 scaffold; CI; EAS profiles; design tokens; typed API client skeleton | Low | Low | Auth verification is the gating item |
| **1. Domain port** (~2–3 wks) | Port pricing/passes/promos to `src/domain/` with golden-master tests against legacy outputs | Medium | **High value, contained risk** | No UI. Correctness locked here protects everything above it |
| **2. Auth + shell** (~2 wks) | Auth flow, secure storage, biometrics, tab shell, theming, whitelabel config plumbing | Medium | Medium | First EAS builds on real devices both platforms |
| **3. Browse + book** (~3–4 wks) | Schedule, class detail, cart, checkout (pass/credit/card), PaymentSheet, receipts | High | **Highest risk phase** — Stripe integration + money paths | Maestro E2E on booking; sandbox connected accounts |
| **4. Account + loyalty wedge** (~2–3 wks) | My bookings, cancel, packages purchase, dashboard with milestone progress, push + celebration moment | Medium | Low–Medium | Cancellation must respect CANCELLATION.md rules incl. never returning placeholder passes |
| **5. Hardening + submission** (~2–3 wks) | E2E pass, perf, accessibility, store assets, TestFlight/Play internal, phased rollout of Dibs app, then first whitelabel build | Medium | Medium | Old app stays live until parity confirmed |
| **6. Post-launch** | Whitelabel rollout per studio; spot booking; RAF surface; deeper loyalty (streaks, anniversaries, perks) as backend grows | — | — | Each whitelabel app ≈ config + assets + EAS profile, days not weeks |

Roughly **12–17 engineering weeks** to first store submission. The two checkpoints that matter: end of Phase 1 (does ported pricing match legacy to the penny?) and end of Phase 3 (does a real card booking work end-to-end on a sandbox connected account?).

### Risks register

- **Auth mismatch** (custom JWT vs Firebase) — resolve in Phase 0; could add backend work if customer routes don't accept Firebase tokens.
- **API contract drift** — legacy action files are the only endpoint documentation; zod schemas will surface mismatches early (good) but noisily (plan for it).
- **Aug 31, 2026 Play deadline** — target API 36 from scaffold.
- **`source` migration** — new app writes `'dibs'` not `'zf'`; flag to anyone reading source-keyed analytics.
- **Whitelabel review risk** — Apple's 4.3 spam rule can flag templated apps; per-studio apps need distinct branding/content (they have it) and ideally each studio's own developer account for the strongest position. Decide account strategy before the first whitelabel submission.

---

*Sources for current-world facts: [Expo SDK 56 changelog](https://expo.dev/changelog/sdk-56), [expo on npm](https://www.npmjs.com/package/expo?activeTab=versions), [Google Play target API requirements](https://developer.android.com/google/play/requirements/target-sdk), [Play Console target API policy](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en).*
