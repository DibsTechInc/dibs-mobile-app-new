# dibs-mobile-app

Dibs mobile app (Expo/React Native, TypeScript). legacy-reference/ is read-only history; active code is src/.

## eas.json notes (comments not allowed by the CLI schema)

eas-cli 16.32+ rejects `"//"` comment keys in eas.json, so the profile documentation lives here:

- Which STUDIO a build targets is set by `STUDIO_SLUG`; app.config.ts resolves everything from `whitelabel/studios/<slug>/studio.json`. Example: `STUDIO_SLUG=carlsbad-village-yoga eas build --profile production --platform ios`.
- `development` — the everyday dev loop. Includes the dev client so Metro can attach (replaces Expo Go now that the app has native modules). Points at local dibs-api.
- `preview` — release-configuration build that installs outside the store; TestFlight rehearsals and studio-staff testing. Points at production because that is what a tester should see.
- `production` — store submissions. app.config.ts calls `validateStudioForRelease` under this profile, so a studio missing its bundle id, Apple team, merchant id, or privacy policy URL fails here rather than at App Store Connect. `autoIncrement` was REMOVED 2026-08-17: eas-cli 16.32+ hard-errors on it with a dynamic config ("autoIncrement option is not supported when using app.config.js") — and it never worked anyway (nowhere to write the increment back). Bump `store.buildNumber` in studio.json by hand for every upload; do not re-add autoIncrement.
- `submit.production` — Apple credentials are configured PER PROJECT via `eas credentials`, not in this file and not at the account level. That is what lets one Expo organization submit to several different Apple Developer teams (Dibs's own team for the two rescue apps, each studio's own team for future studio-owned listings — Apple Guideline 4.2.6).
- **Every EAS project carries a `STUDIO_SLUG` project-level env var, and app.config.ts REFUSES to default inside EAS Build.** The cloud container gets neither shell env nor .env, so before 2026-08-17 every cloud build silently evaluated as DEFAULT_STUDIO_SLUG — Carlsbad's five builds were right only because the default matched; Everyday Ballet's first build failed on an extra.eas.projectId mismatch, which is the only reason it was caught. Both live projects have the var set (all three environments). Onboarding a NEW studio includes: `STUDIO_SLUG=<slug> eas env:create --name STUDIO_SLUG --value <slug> --visibility plaintext --scope project --environment production --environment preview --environment development --non-interactive`.
- **An interrupted prebuild leaves a half-scaffolded `ios/` with the template id `org.name.<AppName>`, and a later `expo run:ios` will REUSE it silently** (the identity guard tolerates the placeholder so run:ios's own scaffold-then-configure can finish — it can't tell the two apart). Symptom: correct JS inside a wrong shell — template bundle id, no iPad device family, phone-shaped un-expandable window on an iPadOS-26 iPad (2026-08-18, first Everyday Ballet iPad screenshot run). Fix is always `npx expo prebuild --clean`. The guard now warns when it sees the placeholder.
- **EAS cloud builds never see `.env` (gitignored — uploads respect .gitignore), so nothing required at startup may live ONLY there.** This is how Carlsbad 2.0.0 (4) crashed instantly on TestFlight (2026-08-17): the Firebase config was env-only, every cloud build inlined `undefined`, and firebase.ts's fail-loudly throw is a SIGABRT in a release binary — while every dev build worked because the laptop has the .env. The Firebase values are now baked into `src/lib/firebase.ts` as defaults (public identifiers, not secrets; env vars still override). Any NEW `EXPO_PUBLIC_*` read must either have an in-code default or be set in eas.json profile `env`. Proof method that caught it: rename .env away, `expo run:ios --configuration Release`, app must still boot.
- `ios.supportsTablet` in app.config.ts is TRUE and must stay true for the rescue apps: the 2021 listings were universal (iPhone + iPad), and Apple rejects any update that drops a previously supported device family — error 90101 at binary processing, AFTER upload succeeds (Carlsbad builds 1 and 2 died this way, 2026-08-17). Consequence: ASC listings need iPad screenshots too.

## Orchestration

The user-level /orchestrate skill runs batches here. Project facts it needs:

- Ask-first zones: payment/booking flows, app.json + native config (store-release impact), anything under legacy-reference/ (read-only — never modify).
- Hot-spot files (reviewer pass): src/domain/pricing (the pricing waterfall) and src/domain/appointments (the monthly-commitment bill — the recurring endpoint charges whatever the client computes).
- Canary gate: the src/domain/pricing golden-master tests are the canary precedent — run them on every branch (`npx jest src/domain/pricing src/domain/appointments`); extend the same golden-master style for new domains.
- Test gate: `npm run typecheck && npx jest`.
- Branch naming: `feature/<short-description>` or `bugfix/<short-description>`.
- Commit format: imperative subject under 72 chars, 2-5 plain sentences, no em dashes.
- Push policy: commit locally, never push; operator reviews in GitKraken and pushes.
- Batch files live in: `batches/` (create as needed).
