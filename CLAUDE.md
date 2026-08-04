# dibs-mobile-app

Dibs mobile app (Expo/React Native, TypeScript). legacy-reference/ is read-only history; active code is src/.

## Orchestration

The user-level /orchestrate skill runs batches here. Project facts it needs:

- Ask-first zones: payment/booking flows, app.json + native config (store-release impact), anything under legacy-reference/ (read-only — never modify).
- Hot-spot files (reviewer pass): src/domain/pricing (the pricing waterfall).
- Canary gate: the src/domain/pricing golden-master tests are the canary precedent — run them on every branch (`npx jest src/domain/pricing`); extend the same golden-master style for new domains.
- Test gate: `npm run typecheck && npx jest`.
- Branch naming: `feature/<short-description>` or `bugfix/<short-description>`.
- Commit format: imperative subject under 72 chars, 2-5 plain sentences, no em dashes.
- Push policy: commit locally, never push; operator reviews in GitKraken and pushes.
- Batch files live in: `batches/` (create as needed).
