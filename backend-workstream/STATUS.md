# Backend Workstream — Status

Coordination log for the dibs-api work that feeds the mobile app (`MOBILE_MASTER_PLAN.md` §7). Every completed backend branch appends an entry here per the dibs-api execution protocol (end of §7). Alicia reviews branches in GitKraken and merges; nothing in this log implies a branch is merged or deployed.

**Lane order (proposed 2026-07-21):**
1. Lane 1 — 7.7 in-app account deletion endpoint (smallest; hard App Store requirement)
2. Lane 2 — 7.1 + 7.2 push tokens table, register/unregister routes, send service, event hooks
3. Lane 3 — 7.6 Loyalty Milestones backend (build, unless located on another machine first)
4. Lane 4 — 7.3 widget-auth hardening (largest; own track — rollout coordinated with widget token changes; see `dibs-api/docs/WIDGET_AUTH_HARDENING.md`)
5. Lane 5 — 7.8 class-checkout endpoint + WIDGET migration (APPROVED + REORDERED 2026-07-21): 3DS-capable client-confirm flow writing the CHECKOUT.md Scenario 5 pass-based rows (paid pass + redemption + attendee); reuses `create-pass-after-charge` / `record-booking-with-pass` machinery. The widget migrates onto it now (ships before mobile); mobile P3 consumes the same endpoint later. Execution plan: `July21/widget-class-checkout-migration-plan.md`. Given the reorder, run this lane FIRST or SECOND.

## Entries

_(none yet)_

### Entry template

- **Date / Lane / Branch:**
- **Scope shipped:**
- **Files touched:**
- **Migration?** yes/no — if yes: **must be applied to prod manually at deploy**
- **Tests:** command + result summary
- **Needs Alicia:** manual verification items, open questions
- **Review status:** pending / reviewed / merged / deployed to staging
