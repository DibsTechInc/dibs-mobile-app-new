# src/domain — pure business logic

Rules for this directory:

1. **No React / React Native imports.** Pure TypeScript only. Everything here
   must run in plain Node (Jest) with no mocks.
2. **Money math uses decimal.js**, never floats.
3. Each module ports its legacy counterpart from `/legacy-reference/` and must
   pass golden-master tests (same inputs → same outputs as the legacy
   selectors) before any UI consumes it.

| Module | Ports from (legacy-reference/) |
|---|---|
| pricing/ | app/selectors/CartSelectors/PurchaseBreakdown/index.js + app/helpers/purchase-helper.js |
| passes/ | app/selectors/UserSelectors/Passes/index.js |
| promos/ | app/actions/PromoCodeActions/index.js + app/constants/PromoCodeConstants/index.js |
| spots/ | spot-grid logic from app/actions/CartActions + EventActions |
