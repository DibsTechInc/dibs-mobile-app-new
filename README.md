# Dibs Mobile App (v2 rebuild)

Consumer loyalty + booking app for Dibs studios. Fresh rebuild — the legacy
Expo SDK 36 app is preserved on the `legacy` git branch.

To build: STUDIO_SLUG=carlsbad-village-yoga eas build --profile production --platform ios
STUDIO_SLUG=everyday-ballet eas build --profile production --platform ios

Then submit ->
STUDIO_SLUG=everyday-ballet eas submit --platform ios --latest

## Stack

Expo SDK 56 · React Native 0.85 · TypeScript (strict) · Expo Router ·
TanStack Query v5 (server state) · Zustand (UI state) · NativeWind v4 ·
zod (API schemas) · decimal.js (money math)

## Layout

- `src/app/` — Expo Router routes only, no business logic
- `src/domain/` — pure TypeScript business logic (pricing, passes, promos, spots) — no RN imports, fully unit-tested
- `src/api/` — typed API client, zod schemas, TanStack Query hooks
- `src/stores/` — zustand stores (cart, session, theme)
- `src/theme/` — design tokens + per-studio dynamic theming
- `legacy-reference/` — read-only copies of the legacy domain logic being ported (delete when the port is complete)
- `config/studios/` — whitelabel build configs (consumed by app.config.ts later)

## Key docs

- `ARCHITECTURE_AUDIT.md` — the audit that led to this rebuild
- `.claude/PLAN.md` — modernization plan
- `.claude/CHECKOUT.md` / `CANCELLATION.md` / `SUBSCRIPTION_BILLING.md` — canonical business rules

## Commands

```
npm install
after you change a slug --> 
npx expo prebuild --clean
npx expo run:ios --device "iPhone 17 Pro"
npm run typecheck
npm test
```
